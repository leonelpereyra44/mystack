import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentCancellation } from "@/lib/email";
import { notifyAppointmentCancelled } from "@/lib/notifications";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateValue: Date | string): Date {
  const d = new Date(dateValue);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        staff: true,
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
        { error: "Este turno ya fue cancelado" },
        { status: 400 }
      );
    }

    // Check if appointment is in the past
    const appointmentDate = parseUTCDate(appointment.date);
    const [hours, minutes] = appointment.startTime.split(":").map(Number);
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: "No es posible cancelar un turno pasado" },
        { status: 400 }
      );
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Send cancellation email (non-blocking)
    sendAppointmentCancellation({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      staffName: appointment.staff?.name,
      date: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      appointmentId: appointment.id,
    }).catch(console.error);

    // Send push notification to business owner (non-blocking)
    notifyAppointmentCancelled(
      appointment.business.ownerId,
      appointment.customerName,
      appointment.service.name,
      format(appointmentDate, "d 'de' MMMM", { locale: es })
    ).catch(console.error);

    return NextResponse.json({ message: "Turno cancelado exitosamente" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Error al cancelar el turno" },
      { status: 500 }
    );
  }
}
