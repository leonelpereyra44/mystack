import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, format } from "date-fns";
import { getLocalDateInTz } from "@/lib/utils";

// GET - Obtener disponibilidad de un rango de fechas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const days = parseInt(searchParams.get("days") || "60");

    if (!businessId || !serviceId) {
      return NextResponse.json(
        { error: "Parámetros requeridos: businessId, serviceId" },
        { status: 400 }
      );
    }

    // Obtener servicio para saber la duración + sus franjas horarias
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { schedules: true, staff: { select: { id: true } } },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // Obtener horarios del negocio
    const businessSchedules = await prisma.businessSchedule.findMany({
      where: { businessId },
    });

    // Obtener configuración del negocio
    const businessData = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        bookingInterval: true,
        slotCapacity: true,
        minBookingNotice: true,
        bufferTime: true,
        timezone: true,
      },
    });
    const bookingInterval = businessData?.bookingInterval ?? 30;
    const slotCapacity = businessData?.slotCapacity ?? 1;
    const minBookingNotice = businessData?.minBookingNotice ?? 0;
    const bufferTime = businessData?.bufferTime ?? 0;

    // Elegibility: staff assigned to the service (for auto-assign mode)
    const serviceStaffIds = service.staff.map((s) => s.id);
    const isAutoAssignMode = serviceStaffIds.length > 0 && !staffId;

    // Si hay staff seleccionado, obtener sus horarios
    let staffSchedules: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isWorking: boolean;
    }[] = [];
    if (staffId) {
      const staffScheduleData = await prisma.staffSchedule.findMany({
        where: { staffId },
      });
      staffSchedules = staffScheduleData;
    }

    // En modo auto-asignación, cargar horarios de todos los miembros elegibles
    const eligibleStaffScheds: Record<string, Record<number, { startTime: string; endTime: string; isWorking: boolean }>> = {};
    if (isAutoAssignMode) {
      const allScheds = await prisma.staffSchedule.findMany({
        where: { staffId: { in: serviceStaffIds } },
      });
      for (const s of allScheds) {
        if (!eligibleStaffScheds[s.staffId]) eligibleStaffScheds[s.staffId] = {};
        eligibleStaffScheds[s.staffId][s.dayOfWeek] = {
          startTime: s.startTime,
          endTime: s.endTime,
          isWorking: s.isWorking,
        };
      }
    }

    // =============================================
    // Timezone del negocio (con fallback a Argentina UTC-3)
    // =============================================
    const nowArg = getLocalDateInTz(businessData?.timezone ?? "America/Argentina/Buenos_Aires");
    const start = startDate
      ? new Date(startDate + "T12:00:00Z")
      : new Date(
          Date.UTC(
            nowArg.getUTCFullYear(),
            nowArg.getUTCMonth(),
            nowArg.getUTCDate(),
            12,
            0,
            0
          )
        );

    // =============================================
    // Obtener bloqueos de agenda para todo el rango
    // =============================================
    const endDate = addDays(start, days);
    const blockedTimesAll = await prisma.blockedTime.findMany({
      where: {
        businessId,
        date: { gte: start, lte: endDate },
        // Misma lógica que en /api/appointments/available:
        // Si hay staffId: bloqueos de ese staff + bloqueos del negocio
        // Si no hay staffId: solo bloqueos del negocio
        ...(staffId
          ? { OR: [{ staffId }, { staffId: null }] }
          : { staffId: null }
        ),
      },
      select: {
        date: true,
        isAllDay: true,
        startTime: true,
        endTime: true,
        staffId: true,
      },
    });

    // Agrupar bloqueos por fecha
    const blockedByDate: Record<
      string,
      { isAllDay: boolean; ranges: { start: number; end: number }[] }[]
    > = {};
    for (const bt of blockedTimesAll) {
      const dateKey = format(bt.date, "yyyy-MM-dd");
      if (!blockedByDate[dateKey]) blockedByDate[dateKey] = [];
      if (bt.isAllDay) {
        blockedByDate[dateKey].push({ isAllDay: true, ranges: [] });
      } else if (bt.startTime && bt.endTime) {
        blockedByDate[dateKey].push({
          isAllDay: false,
          ranges: [
            {
              start: timeToMinutes(bt.startTime),
              end: timeToMinutes(bt.endTime),
            },
          ],
        });
      }
    }

    // =============================================
    // Obtener citas existentes para el rango
    // Excluir PENDING con token expirado (misma lógica que /available)
    // =============================================
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: start, lte: endDate },
        status: { notIn: ["CANCELLED", "RESCHEDULED"] },
        NOT: {
          AND: [
            { status: "PENDING" },
            { tokenExpiresAt: { lt: new Date() } },
          ],
        },
        ...(staffId
          ? { staffId }
          : isAutoAssignMode
          ? { staffId: { in: serviceStaffIds } }
          : {}),
      },
      select: {
        date: true,
        startTime: true,
        endTime: true,
        staffId: true,
      },
    });

    // Agrupar citas por fecha
    const appointmentsByDate: Record<string, typeof existingAppointments> = {};
    for (const apt of existingAppointments) {
      const dateKey = format(apt.date, "yyyy-MM-dd");
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    }

    // ServiceSchedule: indexar por dayOfWeek para acceso rápido
    const serviceScheduleByDay: Record<
      number,
      { startTime: string; endTime: string }
    > = {};
    for (const ss of service.schedules) {
      serviceScheduleByDay[ss.dayOfWeek] = {
        startTime: ss.startTime,
        endTime: ss.endTime,
      };
    }
    const serviceHasCustomSchedule = service.schedules.length > 0;

    const availability: Record<
      string,
      { hasSlots: boolean; slotsCount: number }
    > = {};

    // =============================================
    // Procesar cada día del rango
    // =============================================
    for (let i = 0; i < days; i++) {
      const currentDate = addDays(start, i);
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const dayOfWeek = currentDate.getDay();

      // 1. Verificar si el negocio está abierto ese día
      const businessSchedule = businessSchedules.find(
        (s) => s.dayOfWeek === dayOfWeek
      );
      if (!businessSchedule || !businessSchedule.isOpen) {
        availability[dateKey] = { hasSlots: false, slotsCount: 0 };
        continue;
      }

      // 2. Verificar bloqueos de todo el día
      const dayBlocks = blockedByDate[dateKey] ?? [];
      const hasFullDayBlock = dayBlocks.some((b) => b.isAllDay);
      if (hasFullDayBlock) {
        availability[dateKey] = { hasSlots: false, slotsCount: 0 };
        continue;
      }

      // 3. Determinar horario efectivo (negocio ∩ staff)
      let effectiveOpenTime = businessSchedule.openTime;
      let effectiveCloseTime = businessSchedule.closeTime;
      let workingStaffCount = 0;

      if (staffId && staffSchedules.length > 0) {
        const staffSchedule = staffSchedules.find(
          (s) => s.dayOfWeek === dayOfWeek
        );
        if (!staffSchedule || !staffSchedule.isWorking) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        const staffStart = timeToMinutes(staffSchedule.startTime);
        const staffEnd = timeToMinutes(staffSchedule.endTime);
        const bizStart = timeToMinutes(businessSchedule.openTime);
        const bizEnd = timeToMinutes(businessSchedule.closeTime);

        const effStart = Math.max(staffStart, bizStart);
        const effEnd = Math.min(staffEnd, bizEnd);

        if (effStart >= effEnd) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        effectiveOpenTime = minutesToTime(effStart);
        effectiveCloseTime = minutesToTime(effEnd);
      } else if (isAutoAssignMode) {
        // Contar miembros elegibles que trabajan este día
        workingStaffCount = serviceStaffIds.filter(
          (id) => eligibleStaffScheds[id]?.[dayOfWeek]?.isWorking === true
        ).length;
        if (workingStaffCount === 0) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }
      }

      // 4. Aplicar ServiceSchedule (intersección)
      if (serviceHasCustomSchedule) {
        const svcSchedule = serviceScheduleByDay[dayOfWeek];
        if (!svcSchedule) {
          // El servicio no se ofrece este día
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        const svcStart = timeToMinutes(svcSchedule.startTime);
        const svcEnd = timeToMinutes(svcSchedule.endTime);
        const effStart = timeToMinutes(effectiveOpenTime);
        const effEnd = timeToMinutes(effectiveCloseTime);

        const intersectStart = Math.max(svcStart, effStart);
        const intersectEnd = Math.min(svcEnd, effEnd);

        if (intersectStart >= intersectEnd) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        effectiveOpenTime = minutesToTime(intersectStart);
        effectiveCloseTime = minutesToTime(intersectEnd);
      }

      // 5. Generar slots posibles
      const [openHour, openMin] = effectiveOpenTime.split(":").map(Number);
      const [closeHour, closeMin] = effectiveCloseTime.split(":").map(Number);

      const allSlots: string[] = [];
      let currentHour = openHour;
      let currentMin = openMin;

      while (
        currentHour * 60 + currentMin + service.duration <=
        closeHour * 60 + closeMin
      ) {
        const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
          .toString()
          .padStart(2, "0")}`;
        allSlots.push(timeStr);

        currentMin += bookingInterval;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }

      // 6. Filtrar slots bloqueados (bloqueos parciales)
      const partialBlocks = dayBlocks
        .filter((b) => !b.isAllDay)
        .flatMap((b) => b.ranges);

      // 7. Filtrar slots ocupados (respetando bufferTime)
      const dayAppointments = appointmentsByDate[dateKey] ?? [];

      const availableSlots = allSlots.filter((slot) => {
        const [slotH, slotM] = slot.split(":").map(Number);
        const slotStart = slotH * 60 + slotM;
        const slotEnd = slotStart + service.duration;

        // Verificar bloqueos parciales
        for (const block of partialBlocks) {
          if (slotStart < block.end && slotEnd > block.start) {
            return false;
          }
        }

        // Verificar ocupación (con bufferTime)
        const overlappingCount = dayAppointments.filter((apt) => {
          const [aptH, aptM] = apt.startTime.split(":").map(Number);
          const [aptEH, aptEM] = apt.endTime.split(":").map(Number);
          const aptStart = aptH * 60 + aptM;
          const aptEnd = aptEH * 60 + aptEM;
          return slotStart < aptEnd + bufferTime && slotEnd > aptStart;
        }).length;

        const effectiveCapacity = isAutoAssignMode
          ? workingStaffCount * slotCapacity
          : slotCapacity;
        return overlappingCount < effectiveCapacity;
      });

      // 8. Filtrar horarios pasados / minBookingNotice
      const nowArgLoop = getLocalDateInTz(businessData?.timezone ?? "America/Argentina/Buenos_Aires");
      const todayArgStr = `${nowArgLoop.getUTCFullYear()}-${String(
        nowArgLoop.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(nowArgLoop.getUTCDate()).padStart(2, "0")}`;
      const isToday = dateKey === todayArgStr;

      let finalSlots = availableSlots;

      if (isToday) {
        // Para hoy: usar max(30min, minBookingNotice) como margen
        const currentMinutes =
          nowArgLoop.getUTCHours() * 60 + nowArgLoop.getUTCMinutes();
        const marginMinutes = Math.max(30, minBookingNotice * 60);
        finalSlots = availableSlots.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return h * 60 + m > currentMinutes + marginMinutes;
        });
      } else if (minBookingNotice > 0) {
        // Para fechas futuras: verificar si algún slot cae dentro del periodo
        // de aviso mínimo (escenario cross-day: ej. aviso de 12h a las 8 PM)
        const limitMs = Date.now() + minBookingNotice * 60 * 60 * 1000;
        const limitArg = new Date(limitMs - 3 * 60 * 60 * 1000);
        const limitDateStr = `${limitArg.getUTCFullYear()}-${String(
          limitArg.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(limitArg.getUTCDate()).padStart(2, "0")}`;

        if (dateKey === limitDateStr) {
          const limitMinutes =
            limitArg.getUTCHours() * 60 + limitArg.getUTCMinutes();
          finalSlots = availableSlots.filter((slot) => {
            const [h, m] = slot.split(":").map(Number);
            return h * 60 + m > limitMinutes;
          });
        }
      }

      availability[dateKey] = {
        hasSlots: finalSlots.length > 0,
        slotsCount: finalSlots.length,
      };
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Error al obtener disponibilidad" },
      { status: 500 }
    );
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
