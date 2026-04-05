import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateString } from "@/lib/utils";

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

    // Get service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

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

      currentMin += 30; // 30 min intervals
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    // Get existing appointments for that day
    // Si hay staffId, filtrar solo por ese staff
    // Si no hay staffId (cualquiera), necesitamos verificar disponibilidad de ALGÚN staff
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: dateObj,
        status: { notIn: ["CANCELLED"] },
        ...(staffId && { staffId }),
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    // Filter out taken slots
    const availableSlots = allSlots.filter((slot) => {
      const [slotHour, slotMin] = slot.split(":").map(Number);
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + service.duration;

      // Check if this slot conflicts with any existing appointment
      for (const apt of existingAppointments) {
        const [aptStartHour, aptStartMin] = apt.startTime.split(":").map(Number);
        const [aptEndHour, aptEndMin] = apt.endTime.split(":").map(Number);
        const aptStart = aptStartHour * 60 + aptStartMin;
        const aptEnd = aptEndHour * 60 + aptEndMin;

        // Check for overlap
        if (slotStart < aptEnd && slotEnd > aptStart) {
          return false;
        }
      }

      return true;
    });

    // Filter out past times if the date is today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    let finalSlots = availableSlots;

    if (selectedDate.getTime() === today.getTime()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      finalSlots = availableSlots.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        return h * 60 + m > currentMinutes + 30; // At least 30 min buffer
      });
    }

    return NextResponse.json({ slots: finalSlots });
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
