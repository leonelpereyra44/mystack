import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateString, getLocalDateInTz } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const excludeAppointmentId = searchParams.get("excludeAppointmentId");

    if (!businessId || !date || !serviceId) {
      return NextResponse.json(
        { error: "Parámetros requeridos: businessId, date, serviceId" },
        { status: 400 }
      );
    }

    // Parse date correctly to avoid timezone issues
    const dateObj = parseDateString(date);
    const dayOfWeek = dateObj.getUTCDay();

    // ========================================
    // VERIFICAR BLOQUEOS DE AGENDA
    // ========================================
    
    // Buscar bloqueos para esta fecha
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        businessId,
        date: dateObj,
        // Si hay staffId, buscar bloqueos de ese staff O de todo el negocio
        // Si no hay staffId, buscar solo bloqueos de todo el negocio
        ...(staffId 
          ? { OR: [{ staffId }, { staffId: null }] }
          : { staffId: null }
        ),
      },
    });

    // Si hay un bloqueo de todo el día para todo el negocio, no hay slots
    const fullDayBusinessBlock = blockedTimes.find(
      (bt) => bt.isAllDay && bt.staffId === null
    );
    if (fullDayBusinessBlock) {
      return NextResponse.json({ slots: [] });
    }

    // Si hay un bloqueo de todo el día para el staff específico, no hay slots
    if (staffId) {
      const fullDayStaffBlock = blockedTimes.find(
        (bt) => bt.isAllDay && bt.staffId === staffId
      );
      if (fullDayStaffBlock) {
        return NextResponse.json({ slots: [] });
      }
    }

    // Get business schedule for that day
    const businessSchedule = await prisma.businessSchedule.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId,
          dayOfWeek,
        },
      },
    });

    if (!businessSchedule || !businessSchedule.isOpen) {
      return NextResponse.json({ slots: [] });
    }

    // Get business booking interval and slot capacity
    const businessData = await prisma.business.findUnique({
      where: { id: businessId },
      select: { bookingInterval: true, slotCapacity: true, minBookingNotice: true, bufferTime: true, timezone: true },
    });
    const bookingInterval = businessData?.bookingInterval ?? 30;
    const slotCapacity = businessData?.slotCapacity ?? 1;
    const minBookingNotice = businessData?.minBookingNotice ?? 0;
    const bufferTime = businessData?.bufferTime ?? 0;

    // Get service duration + staff assignments
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { staff: { select: { id: true } } },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const serviceStaffIds = service.staff.map((s) => s.id);

    // ── MODO AUTO-ASIGNACIÓN ────────────────────────────────────────────────
    // El servicio tiene staff asignado pero no se especificó uno:
    // calcular la unión de slots disponibles para CUALQUIER miembro elegible,
    // respetando sus horarios y días laborables individuales.
    if (serviceStaffIds.length > 0 && !staffId) {
      const [allMemberScheds, memberBlockedTimes, memberAppointments, serviceSchedules] =
        await Promise.all([
          prisma.staffSchedule.findMany({
            where: { staffId: { in: serviceStaffIds }, dayOfWeek },
          }),
          prisma.blockedTime.findMany({
            where: {
              businessId,
              date: dateObj,
              OR: [{ staffId: { in: serviceStaffIds } }, { staffId: null }],
            },
          }),
          prisma.appointment.findMany({
            where: {
              businessId,
              date: dateObj,
              staffId: { in: serviceStaffIds },
              status: { notIn: ["CANCELLED", "RESCHEDULED"] },
              NOT: {
                AND: [{ status: "PENDING" }, { tokenExpiresAt: { lt: new Date() } }],
              },
              ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
            },
            select: { staffId: true, startTime: true, endTime: true },
          }),
          prisma.serviceSchedule.findMany({ where: { serviceId } }),
        ]);

      const serviceDaySched = serviceSchedules.find((s) => s.dayOfWeek === dayOfWeek);
      if (serviceSchedules.length > 0 && !serviceDaySched) {
        return NextResponse.json({ slots: [], slotCounts: {}, slotCapacity });
      }

      // Acumular slots disponibles: slot → cantidad de cupos libres entre todos los miembros
      const slotStaffCount: Record<string, number> = {};

      for (const memberId of serviceStaffIds) {
        const memberSched = allMemberScheds.find((s) => s.staffId === memberId);
        if (!memberSched || !memberSched.isWorking) continue;

        // Ventana efectiva: business ∩ horario del miembro
        const bizStart = timeToMinutes(businessSchedule.openTime);
        const bizEnd = timeToMinutes(businessSchedule.closeTime);
        const memStart = timeToMinutes(memberSched.startTime);
        const memEnd = timeToMinutes(memberSched.endTime);
        let winStart = Math.max(bizStart, memStart);
        let winEnd = Math.min(bizEnd, memEnd);
        if (winStart >= winEnd) continue;

        // Intersección con franja del servicio (si la tiene)
        if (serviceDaySched) {
          winStart = Math.max(winStart, timeToMinutes(serviceDaySched.startTime));
          winEnd = Math.min(winEnd, timeToMinutes(serviceDaySched.endTime));
          if (winStart >= winEnd) continue;
        }

        // Generar slots posibles para este miembro
        const memberSlots: string[] = [];
        let cur = winStart;
        while (cur + service.duration <= winEnd) {
          memberSlots.push(minutesToTime(cur));
          cur += bookingInterval;
        }

        // Bloqueos propios del miembro + bloqueos de todo el negocio
        const myBlocks = memberBlockedTimes.filter(
          (bt) => bt.staffId === memberId || bt.staffId === null
        );
        if (myBlocks.some((bt) => bt.isAllDay)) continue;

        const myApts = memberAppointments.filter((a) => a.staffId === memberId);

        for (const slot of memberSlots) {
          const [sh, sm] = slot.split(":").map(Number);
          const slotStart = sh * 60 + sm;
          const slotEnd = slotStart + service.duration;

          // Verificar bloqueos parciales
          const partialBlocked = myBlocks.some((bt) => {
            if (bt.isAllDay || !bt.startTime || !bt.endTime) return false;
            const bs = timeToMinutes(bt.startTime);
            const be = timeToMinutes(bt.endTime);
            return slotStart < be && slotEnd > bs;
          });
          if (partialBlocked) continue;

          // Verificar conflictos de turnos (con bufferTime)
          const conflictCount = myApts.filter((apt) => {
            const [ah, am] = apt.startTime.split(":").map(Number);
            const [eh, em] = apt.endTime.split(":").map(Number);
            const aptStart = ah * 60 + am;
            const aptEnd = eh * 60 + em;
            return slotStart < aptEnd + bufferTime && slotEnd > aptStart;
          }).length;

          if (conflictCount < slotCapacity) {
            slotStaffCount[slot] = (slotStaffCount[slot] ?? 0) + (slotCapacity - conflictCount);
          }
        }
      }

      let availableSlots = Object.keys(slotStaffCount).sort();
      const slotCounts: Record<string, number> = { ...slotStaffCount };

      // Filtrar horarios pasados + minBookingNotice (usando timezone del negocio)
      const nowArg = getLocalDateInTz(businessData?.timezone ?? "America/Argentina/Buenos_Aires");
      const todayArgStr = `${nowArg.getUTCFullYear()}-${String(nowArg.getUTCMonth() + 1).padStart(2, "0")}-${String(nowArg.getUTCDate()).padStart(2, "0")}`;
      const selectedDateStr = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

      if (selectedDateStr === todayArgStr) {
        const currentMinutes = nowArg.getUTCHours() * 60 + nowArg.getUTCMinutes();
        const marginMinutes = minBookingNotice > 0 ? minBookingNotice * 60 : 0;
        availableSlots = availableSlots.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return h * 60 + m > currentMinutes + marginMinutes;
        });
      } else if (minBookingNotice > 0) {
        const limitMs = nowArg.getTime() + minBookingNotice * 60 * 60 * 1000;
        const limitArg = new Date(limitMs);
        const limitDateStr = `${limitArg.getUTCFullYear()}-${String(limitArg.getUTCMonth() + 1).padStart(2, "0")}-${String(limitArg.getUTCDate()).padStart(2, "0")}`;
        if (selectedDateStr === limitDateStr) {
          const limitMinutes = limitArg.getUTCHours() * 60 + limitArg.getUTCMinutes();
          availableSlots = availableSlots.filter((slot) => {
            const [h, m] = slot.split(":").map(Number);
            return h * 60 + m > limitMinutes;
          });
        }
      }

      return NextResponse.json({ slots: availableSlots, slotCounts, slotCapacity });
    }
    // ── FIN MODO AUTO-ASIGNACIÓN ────────────────────────────────────────────

    // Determinar el horario efectivo a usar
    let effectiveOpenTime = businessSchedule.openTime;
    let effectiveCloseTime = businessSchedule.closeTime;

    // Si se seleccionó un staff específico, usar sus horarios
    if (staffId) {
      const staffSchedule = await prisma.staffSchedule.findUnique({
        where: {
          staffId_dayOfWeek: {
            staffId,
            dayOfWeek,
          },
        },
      });

      // Si el staff no trabaja ese día, no hay slots disponibles
      if (!staffSchedule || !staffSchedule.isWorking) {
        return NextResponse.json({ slots: [] });
      }

      // Usar el horario del staff (intersección con el del negocio)
      const staffStartMinutes = timeToMinutes(staffSchedule.startTime);
      const staffEndMinutes = timeToMinutes(staffSchedule.endTime);
      const businessStartMinutes = timeToMinutes(businessSchedule.openTime);
      const businessEndMinutes = timeToMinutes(businessSchedule.closeTime);

      // La intersección es el máximo de los inicios y el mínimo de los cierres
      const effectiveStartMinutes = Math.max(staffStartMinutes, businessStartMinutes);
      const effectiveEndMinutes = Math.min(staffEndMinutes, businessEndMinutes);

      // Si no hay intersección válida, no hay slots
      if (effectiveStartMinutes >= effectiveEndMinutes) {
        return NextResponse.json({ slots: [] });
      }

      effectiveOpenTime = minutesToTime(effectiveStartMinutes);
      effectiveCloseTime = minutesToTime(effectiveEndMinutes);
    }

    // ========================================
    // APLICAR FRANJAS HORARIAS DEL SERVICIO
    // ========================================
    const serviceSchedules = await prisma.serviceSchedule.findMany({
      where: { serviceId },
    });

    if (serviceSchedules.length > 0) {
      // Service has custom schedules — find the one for today
      const daySchedule = serviceSchedules.find((s) => s.dayOfWeek === dayOfWeek);

      if (!daySchedule) {
        // Service not offered on this day of the week
        return NextResponse.json({ slots: [] });
      }

      // Intersect service window with effective (business ∩ staff) window
      const svcStart = timeToMinutes(daySchedule.startTime);
      const svcEnd = timeToMinutes(daySchedule.endTime);
      const effStart = timeToMinutes(effectiveOpenTime);
      const effEnd = timeToMinutes(effectiveCloseTime);

      const intersectStart = Math.max(svcStart, effStart);
      const intersectEnd = Math.min(svcEnd, effEnd);

      if (intersectStart >= intersectEnd) {
        return NextResponse.json({ slots: [] });
      }

      effectiveOpenTime = minutesToTime(intersectStart);
      effectiveCloseTime = minutesToTime(intersectEnd);
    }

    // Generate all possible slots based on effective schedule
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

      currentMin += bookingInterval; // configurable interval
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    // Get existing appointments for that day
    // Si hay staffId, filtrar solo por ese staff
    // Si no hay staffId (cualquiera), necesitamos verificar disponibilidad de ALGÚN staff
    // Excluir turnos PENDING con token expirado (el slot se libera automáticamente)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: dateObj,
        status: { notIn: ["CANCELLED"] },
        NOT: {
          AND: [
            { status: "PENDING" },
            { tokenExpiresAt: { lt: new Date() } },
          ],
        },
        ...(staffId && { staffId }),
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    // Filter out taken slots + compute remaining capacity per slot
    const slotCounts: Record<string, number> = {};
    const availableSlots = allSlots.filter((slot) => {
      const [slotHour, slotMin] = slot.split(":").map(Number);
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + service.duration;

      // ========================================
      // Verificar bloqueos parciales (no todo el día)
      // ========================================
      for (const blocked of blockedTimes) {
        if (blocked.isAllDay) continue; // Ya manejamos estos arriba
        if (!blocked.startTime || !blocked.endTime) continue;

        const [blockStartHour, blockStartMin] = blocked.startTime.split(":").map(Number);
        const [blockEndHour, blockEndMin] = blocked.endTime.split(":").map(Number);
        const blockStart = blockStartHour * 60 + blockStartMin;
        const blockEnd = blockEndHour * 60 + blockEndMin;

        // Si el slot se superpone con el bloqueo, no está disponible
        if (slotStart < blockEnd && slotEnd > blockStart) {
          return false;
        }
      }

      // Check if this slot conflicts with any existing appointment
      const overlappingCount = existingAppointments.filter((apt) => {
        const [aptStartHour, aptStartMin] = apt.startTime.split(":").map(Number);
        const [aptEndHour, aptEndMin] = apt.endTime.split(":").map(Number);
        const aptStart = aptStartHour * 60 + aptStartMin;
        const aptEnd = aptEndHour * 60 + aptEndMin;
        return slotStart < aptEnd + bufferTime && slotEnd > aptStart;
      }).length;

      if (overlappingCount >= slotCapacity) {
        return false;
      }

      slotCounts[slot] = slotCapacity - overlappingCount;
      return true;
    });

    // Filtrar horarios pasados si la fecha seleccionada es hoy (timezone del negocio)
    const nowArg = getLocalDateInTz(businessData?.timezone ?? "America/Argentina/Buenos_Aires");
    const todayArgStr = `${nowArg.getUTCFullYear()}-${String(nowArg.getUTCMonth() + 1).padStart(2, "0")}-${String(nowArg.getUTCDate()).padStart(2, "0")}`;
    const selectedDateStr = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

    let finalSlots = availableSlots;

    if (selectedDateStr === todayArgStr) {
      const currentMinutes = nowArg.getUTCHours() * 60 + nowArg.getUTCMinutes();
      // Si el dueño configuró minBookingNotice > 0, respetarlo.
      // Si es 0 (sin aviso mínimo), usar solo 0 min de margen para que los
      // slots del momento actual sean reservables (walk-in digital).
      const marginMinutes = minBookingNotice > 0 ? minBookingNotice * 60 : 0;
      finalSlots = availableSlots.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        return h * 60 + m > currentMinutes + marginMinutes;
      });
    } else if (minBookingNotice > 0) {
      // Para fechas futuras: filtrar slots dentro del periodo de aviso mínimo
      // (escenario cross-day: ej. aviso de 12h a las 8 PM, mañana por la mañana queda bloqueada)
      const limitMs = nowArg.getTime() + minBookingNotice * 60 * 60 * 1000;
      const limitArg = new Date(limitMs);
      const limitDateStr = `${limitArg.getUTCFullYear()}-${String(limitArg.getUTCMonth() + 1).padStart(2, "0")}-${String(limitArg.getUTCDate()).padStart(2, "0")}`;
      if (selectedDateStr === limitDateStr) {
        const limitMinutes = limitArg.getUTCHours() * 60 + limitArg.getUTCMinutes();
        finalSlots = availableSlots.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return h * 60 + m > limitMinutes;
        });
      }
    }

    return NextResponse.json({ slots: finalSlots, slotCounts, slotCapacity });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Error al obtener horarios disponibles" },
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
