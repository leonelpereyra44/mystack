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

    // Get business to check settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Check if customer already has an active appointment (if multiple not allowed)
    if (!business.allowMultipleBookings) {
      const existingCustomerAppointment = await prisma.appointment.findFirst({
        where: {
          businessId,
          customerEmail: customerEmail.toLowerCase(),
          status: { in: ["PENDING", "CONFIRMED"] },
          // Only future appointments
          OR: [
            { date: { gt: new Date() } },
            {
              date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
              // Today but future time - we'll filter this in the response
            },
          ],
        },
        include: {
          service: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      });

      if (existingCustomerAppointment) {
        // Check if it's actually in the future
        const aptDate = new Date(existingCustomerAppointment.date);
        const [aptHour, aptMin] = existingCustomerAppointment.startTime.split(":").map(Number);
        aptDate.setHours(aptHour, aptMin, 0, 0);

        if (aptDate > new Date()) {
          return NextResponse.json(
            { 
              error: "Ya tenés un turno activo",
              code: "EXISTING_APPOINTMENT",
              existingAppointment: {
                id: existingCustomerAppointment.id,
                date: format(new Date(existingCustomerAppointment.date), "EEEE d 'de' MMMM", { locale: es }),
                startTime: existingCustomerAppointment.startTime,
                serviceName: existingCustomerAppointment.service.name,
              }
            },
            { status: 409 }
          );
        }
      }
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
          date: format(appointmentDate, "yyyy-MM-dd"),
          dateFormatted: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          service: {
            name: appointment.service.name,
            duration: appointment.service.duration,
            price: Number(appointment.service.price),
          },
          staff: appointment.staff?.name || null,
          business: {
            name: appointment.business.name,
            slug: appointment.business.slug,
            address: appointment.business.address || null,
            phone: appointment.business.phone || null,
          },
          customer: {
            name: customerName,
            email: customerEmail,
          },
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
