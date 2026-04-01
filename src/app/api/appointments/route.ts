import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentConfirmation } from "@/lib/email";
import { notifyNewAppointment } from "@/lib/notifications";
import { parseDateString } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId,
      serviceId,
      staffId,
      date,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    // Validate required fields
    if (!businessId || !serviceId || !date || !startTime || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Get service to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, service.duration);
    const endTime = format(endDate, "HH:mm");

    // Parse date correctly to avoid timezone issues
    const appointmentDate = parseDateString(date);

    // Check for conflicting appointments
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId,
        date: appointmentDate,
        status: { notIn: ["CANCELLED"] },
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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        serviceId,
        staffId: staffId || null,
        date: appointmentDate,
        startTime,
        endTime,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        notes: notes || null,
        status: "CONFIRMED",
      },
      include: {
        service: true,
        staff: true,
        business: true,
      },
    });

    // Send confirmation email (non-blocking)
    sendAppointmentConfirmation({
      customerName,
      customerEmail,
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      staffName: appointment.staff?.name,
      date: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      startTime,
      endTime,
      appointmentId: appointment.id,
      businessAddress: appointment.business.address || undefined,
      businessPhone: appointment.business.phone || undefined,
    }).catch(console.error);

    // Send push notification to business owner (non-blocking)
    notifyNewAppointment(
      appointment.business.ownerId,
      customerName,
      appointment.service.name,
      format(appointmentDate, "d 'de' MMMM", { locale: es }),
      startTime
    ).catch(console.error);

    return NextResponse.json(
      {
        message: "Reserva creada exitosamente",
        appointment: {
          id: appointment.id,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          service: appointment.service.name,
          staff: appointment.staff?.name,
          business: appointment.business.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID requerido" },
        { status: 400 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: { businessId },
      include: {
        service: true,
        staff: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Error al obtener las reservas" },
      { status: 500 }
    );
  }
}
