import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays, format } from "date-fns";

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

    // Obtener servicio para saber la duración
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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

    // Si hay staff seleccionado, obtener sus horarios
    let staffSchedules: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }[] = [];
    if (staffId) {
      const staffScheduleData = await prisma.staffSchedule.findMany({
        where: { staffId },
      });
      staffSchedules = staffScheduleData;
    }

    // Calcular disponibilidad para cada día
    // Usar fecha de Argentina (UTC-3, sin DST) para el inicio
    const nowArg = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const start = startDate
      ? new Date(startDate + "T12:00:00Z")
      : new Date(Date.UTC(nowArg.getUTCFullYear(), nowArg.getUTCMonth(), nowArg.getUTCDate(), 12, 0, 0));
    
    const availability: Record<string, { hasSlots: boolean; slotsCount: number }> = {};

    // Obtener todas las citas del rango para optimizar
    const endDate = addDays(start, days);
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: {
          gte: start,
          lte: endDate,
        },
        status: { notIn: ["CANCELLED"] },
        ...(staffId && { staffId }),
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

    // Procesar cada día
    for (let i = 0; i < days; i++) {
      const currentDate = addDays(start, i);
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const dayOfWeek = currentDate.getDay();

      // Obtener horario del negocio para ese día
      const businessSchedule = businessSchedules.find(s => s.dayOfWeek === dayOfWeek);
      
      if (!businessSchedule || !businessSchedule.isOpen) {
        availability[dateKey] = { hasSlots: false, slotsCount: 0 };
        continue;
      }

      // Determinar horario efectivo
      let effectiveOpenTime = businessSchedule.openTime;
      let effectiveCloseTime = businessSchedule.closeTime;

      // Si hay staff seleccionado, usar intersección de horarios
      if (staffId && staffSchedules.length > 0) {
        const staffSchedule = staffSchedules.find(s => s.dayOfWeek === dayOfWeek);
        
        if (!staffSchedule || !staffSchedule.isWorking) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        const staffStartMinutes = timeToMinutes(staffSchedule.startTime);
        const staffEndMinutes = timeToMinutes(staffSchedule.endTime);
        const businessStartMinutes = timeToMinutes(businessSchedule.openTime);
        const businessEndMinutes = timeToMinutes(businessSchedule.closeTime);

        const effectiveStartMinutes = Math.max(staffStartMinutes, businessStartMinutes);
        const effectiveEndMinutes = Math.min(staffEndMinutes, businessEndMinutes);

        if (effectiveStartMinutes >= effectiveEndMinutes) {
          availability[dateKey] = { hasSlots: false, slotsCount: 0 };
          continue;
        }

        effectiveOpenTime = minutesToTime(effectiveStartMinutes);
        effectiveCloseTime = minutesToTime(effectiveEndMinutes);
      }

      // Generar slots posibles
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

        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }

      // Filtrar slots ocupados
      const dayAppointments = appointmentsByDate[dateKey] || [];
      const availableSlots = allSlots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(":").map(Number);
        const slotStart = slotHour * 60 + slotMin;
        const slotEnd = slotStart + service.duration;

        for (const apt of dayAppointments) {
          const [aptStartHour, aptStartMin] = apt.startTime.split(":").map(Number);
          const [aptEndHour, aptEndMin] = apt.endTime.split(":").map(Number);
          const aptStart = aptStartHour * 60 + aptStartMin;
          const aptEnd = aptEndHour * 60 + aptEndMin;

          if (slotStart < aptEnd && slotEnd > aptStart) {
            return false;
          }
        }
        return true;
      });

      // Si es hoy en Argentina (UTC-3), filtrar horarios pasados
      const nowArgLoop = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const todayArgLoopStr = `${nowArgLoop.getUTCFullYear()}-${String(nowArgLoop.getUTCMonth() + 1).padStart(2, "0")}-${String(nowArgLoop.getUTCDate()).padStart(2, "0")}`;
      const isToday = dateKey === todayArgLoopStr;

      let finalSlots = availableSlots;
      if (isToday) {
        const currentMinutes = nowArgLoop.getUTCHours() * 60 + nowArgLoop.getUTCMinutes();
        finalSlots = availableSlots.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return h * 60 + m > currentMinutes + 30;
        });
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
