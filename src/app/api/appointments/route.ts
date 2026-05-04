import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addMinutes, format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentPendingConfirmation } from "@/lib/email";
import { notifyNewAppointmentPending, checkAndNotifyReservationLimit } from "@/lib/notifications";
import { parseDateString } from "@/lib/utils";
import { canCreateReservation } from "@/lib/plan-limits";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 requests por minuto por IP
    const { limited, response } = await checkRateLimit(request);
    if (limited) return response;
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
      extraData,
    } = body;

    // Validate required fields
    if (!businessId || !serviceId || !date || !startTime || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check plan limits for reservations
    const reservationCheck = await canCreateReservation(businessId);
    if (!reservationCheck.allowed) {
      return NextResponse.json(
        { 
          error: reservationCheck.reason,
          code: "PLAN_LIMIT_REACHED",
          usage: reservationCheck.usage,
        },
        { status: 403 }
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

    // Create appointment with PENDING status + confirmation token
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const isSameDay = isToday(appointmentDate);
    const expiresInMinutes = isSameDay ? 15 : 60;
    const tokenExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

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
        extraData: extraData || null,
        status: "PENDING",
        confirmationToken,
        tokenExpiresAt,
      },
      include: {
        service: true,
        staff: true,
        business: true,
      },
    });

    // Send pending confirmation email (non-blocking)
    sendAppointmentPendingConfirmation({
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
      confirmationToken,
      expiresInMinutes,
    }).catch(console.error);

    // Notify business owner of pending reservation (non-blocking)
    notifyNewAppointmentPending(
      appointment.business.ownerId,
      customerName,
      appointment.service.name,
      format(appointmentDate, "d 'de' MMMM", { locale: es }),
      startTime
    ).catch(console.error);

    // Check and notify if approaching reservation limit (non-blocking)
    if (reservationCheck.usage) {
      checkAndNotifyReservationLimit(
        appointment.business.ownerId,
        businessId,
        reservationCheck.usage.current + 1, // +1 porque acabamos de crear una
        reservationCheck.usage.limit
      ).catch(console.error);
    }

    return NextResponse.json(
      {
        message: "Solicitud de reserva creada. Revisá tu email para confirmar.",
        status: "PENDING",
        expiresInMinutes,
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
