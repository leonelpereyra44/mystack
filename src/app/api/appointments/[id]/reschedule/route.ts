import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentConfirmation } from "@/lib/email";
import { parseDateString } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, startTime, staffId } = body;

    if (!date || !startTime) {
      return NextResponse.json(
        { error: "Fecha y horario son requeridos" },
        { status: 400 }
      );
    }

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        business: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede reprogramar un turno cancelado" },
        { status: 400 }
      );
    }

    // Calculate new end time
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, appointment.service.duration);
    const endTime = format(endDate, "HH:mm");

    // Parse date correctly
    const appointmentDate = parseDateString(date);

    // Check for conflicting appointments (excluding this one)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId: appointment.businessId,
        date: appointmentDate,
        status: { notIn: ["CANCELLED"] },
        id: { not: id }, // Exclude current appointment
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
        ...(staffId && { staffId }),
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible" },
        { status: 409 }
      );
    }

    // Get staff name if staffId changed
    let staffName: string | undefined;
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      staffName = staff?.name;
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: appointmentDate,
        startTime,
        endTime,
        staffId: staffId || null,
      },
      include: {
        service: true,
        staff: true,
        business: true,
      },
    });

    // Send confirmation email with new details
    sendAppointmentConfirmation({
      customerName: updatedAppointment.customerName,
      customerEmail: updatedAppointment.customerEmail,
      businessName: updatedAppointment.business.name,
      serviceName: updatedAppointment.service.name,
      staffName: updatedAppointment.staff?.name || staffName,
      date: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      startTime,
      endTime,
      appointmentId: updatedAppointment.id,
      businessAddress: updatedAppointment.business.address || undefined,
      businessPhone: updatedAppointment.business.phone || undefined,
    }).catch(console.error);

    return NextResponse.json({
      message: "Turno reprogramado exitosamente",
      appointment: {
        id: updatedAppointment.id,
        date: format(appointmentDate, "yyyy-MM-dd"),
        startTime,
        endTime,
      },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { error: "Error al reprogramar el turno" },
      { status: 500 }
    );
  }
}
