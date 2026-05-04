import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentConfirmation } from "@/lib/email";
import { notifyNewAppointment } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string; token: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, token } = await params;

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
        { error: "Turno no encontrado", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (appointment.status === "CONFIRMED") {
      return NextResponse.json({ message: "El turno ya fue confirmado", code: "ALREADY_CONFIRMED" });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Este turno fue cancelado", code: "CANCELLED" },
        { status: 410 }
      );
    }

    // Verify token
    if (appointment.confirmationToken !== token) {
      return NextResponse.json(
        { error: "Enlace de confirmación inválido", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    // Check expiry
    if (!appointment.tokenExpiresAt || appointment.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace de confirmación expiró. El turno fue liberado.", code: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    // Confirm the appointment
    const confirmed = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmationToken: null,
        tokenExpiresAt: null,
      },
    });

    const appointmentDate = new Date(confirmed.date);
    const formattedDate = format(
      new Date(
        appointmentDate.getUTCFullYear(),
        appointmentDate.getUTCMonth(),
        appointmentDate.getUTCDate(),
        12, 0, 0
      ),
      "EEEE d 'de' MMMM 'de' yyyy",
      { locale: es }
    );

    // Send final confirmation email (non-blocking)
    sendAppointmentConfirmation({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      staffName: appointment.staff?.name,
      date: formattedDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      appointmentId: appointment.id,
      businessAddress: appointment.business.address || undefined,
      businessPhone: appointment.business.phone || undefined,
    }).catch(console.error);

    // Notify business owner of confirmation (non-blocking)
    const shortDate = format(
      new Date(
        appointmentDate.getUTCFullYear(),
        appointmentDate.getUTCMonth(),
        appointmentDate.getUTCDate(),
        12, 0, 0
      ),
      "d 'de' MMMM",
      { locale: es }
    );
    notifyNewAppointment(
      appointment.business.ownerId,
      appointment.customerName,
      appointment.service.name,
      shortDate,
      appointment.startTime
    ).catch(console.error);

    return NextResponse.json({
      message: "¡Turno confirmado exitosamente!",
      code: "CONFIRMED",
      appointment: {
        id: appointment.id,
        dateFormatted: formattedDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: appointment.service.name,
        businessName: appointment.business.name,
        businessAddress: appointment.business.address || null,
        customerName: appointment.customerName,
      },
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    return NextResponse.json(
      { error: "Error al confirmar el turno", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
