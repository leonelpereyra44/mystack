import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/lib/auth";
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
      rescheduleSourceId,
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
          // Exclude the appointment being rescheduled
          ...(rescheduleSourceId ? { NOT: { id: rescheduleSourceId } } : {}),
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
                // @db.Date llega como medianoche UTC — usar componentes UTC para evitar off-by-one
                date: format(
                  new Date(
                    existingCustomerAppointment.date.getUTCFullYear(),
                    existingCustomerAppointment.date.getUTCMonth(),
                    existingCustomerAppointment.date.getUTCDate(),
                    12, 0, 0
                  ),
                  "EEEE d 'de' MMMM",
                  { locale: es }
                ),
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
      include: { staff: { select: { id: true } } },
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

    // ── Auto-asignación de staff ────────────────────────────────────────────
    // Si el servicio tiene miembros asignados pero el turno llega sin staffId,
    // elegir automáticamente al miembro disponible con menos carga ese día,
    // respetando sus horarios, días laborables y bloqueos individuales.
    let effectiveStaffId: string | null = staffId || null;

    if (!effectiveStaffId && service.staff.length > 0) {
      const eligibleIds = service.staff.map((s) => s.id);
      const dayOfWeek = appointmentDate.getUTCDay();

      const [memberScheds, memberBlocks, slotConflicts, dayCounts] = await Promise.all([
        prisma.staffSchedule.findMany({
          where: { staffId: { in: eligibleIds }, dayOfWeek },
        }),
        prisma.blockedTime.findMany({
          where: {
            businessId,
            date: appointmentDate,
            OR: [{ staffId: { in: eligibleIds } }, { staffId: null }],
          },
        }),
        prisma.appointment.findMany({
          where: {
            businessId,
            date: appointmentDate,
            staffId: { in: eligibleIds },
            status: { notIn: ["CANCELLED", "RESCHEDULED"] },
            NOT: [
              { AND: [{ status: "PENDING" }, { tokenExpiresAt: { lt: new Date() } }] },
              ...(rescheduleSourceId ? [{ id: rescheduleSourceId }] : []),
            ],
            OR: [
              { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
              { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
              { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
            ],
          },
          select: { staffId: true },
        }),
        prisma.appointment.groupBy({
          by: ["staffId"],
          where: {
            businessId,
            date: appointmentDate,
            staffId: { in: eligibleIds },
            status: { notIn: ["CANCELLED", "RESCHEDULED"] },
          },
          _count: { id: true },
        }),
      ]);

      const conflictSet = new Set(slotConflicts.map((c) => c.staffId));
      const countMap: Record<string, number> = {};
      for (const row of dayCounts) {
        if (row.staffId) countMap[row.staffId] = row._count.id;
      }

      const slotStartMin = timeToMinutes(startTime);
      const slotEndMin = timeToMinutes(endTime);

      const freeStaff = eligibleIds.filter((id) => {
        const sched = memberScheds.find((s) => s.staffId === id);
        if (!sched || !sched.isWorking) return false;
        if (
          slotStartMin < timeToMinutes(sched.startTime) ||
          slotEndMin > timeToMinutes(sched.endTime)
        ) return false;
        const isBlocked = memberBlocks.some((b) => {
          if (b.staffId !== id && b.staffId !== null) return false;
          if (b.isAllDay) return true;
          if (!b.startTime || !b.endTime) return false;
          return slotStartMin < timeToMinutes(b.endTime) && slotEndMin > timeToMinutes(b.startTime);
        });
        if (isBlocked) return false;
        return !conflictSet.has(id);
      });

      if (freeStaff.length === 0) {
        return NextResponse.json(
          { error: "Este horario ya no está disponible", code: "SLOT_TAKEN" },
          { status: 409 }
        );
      }

      // Asignar al miembro con menos turnos ese día (least-busy)
      freeStaff.sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0));
      effectiveStaffId = freeStaff[0];
    }
    // ── Fin auto-asignación ─────────────────────────────────────────────────

    // Generar token antes de la transacción
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const isSameDay = isToday(appointmentDate);
    const expiresInMinutes = isSameDay ? 15 : 60;
    const tokenExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Crear el turno dentro de una transacción que re-valida la disponibilidad
    // de forma atómica para evitar double-booking por condición de carrera.
    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        // Re-verificar solapamientos dentro de la transacción
        // (excluye PENDING expirados igual que el endpoint de slots)
        const conflictingCount = await tx.appointment.count({
          where: {
            businessId,
            date: appointmentDate,
            status: { notIn: ["CANCELLED", "RESCHEDULED"] },
            NOT: [
              // Exclude expired PENDING appointments
              { AND: [{ status: "PENDING" }, { tokenExpiresAt: { lt: new Date() } }] },
              // Exclude the appointment being rescheduled
              ...(rescheduleSourceId ? [{ id: rescheduleSourceId }] : []),
            ],
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
            ...(effectiveStaffId ? { staffId: effectiveStaffId } : {}),
          },
        });

        if (conflictingCount >= business.slotCapacity) {
          throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
        }

        return tx.appointment.create({
          data: {
            businessId,
            serviceId,
            staffId: effectiveStaffId,
            date: appointmentDate,
            startTime,
            endTime,
            customerName,
            customerEmail,
            customerPhone: customerPhone || null,
            notes: notes || null,
            extraData: extraData || null,
            rescheduledFromId: rescheduleSourceId || null,
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
      });
    } catch (txError) {
      if (
        txError instanceof Error &&
        (txError as Error & { code?: string }).code === "SLOT_TAKEN"
      ) {
        return NextResponse.json(
          { error: "Este horario ya no está disponible" },
          { status: 409 }
        );
      }
      throw txError;
    }

    // Upsert client record (background, fire-and-forget)
    // Mantiene el directorio de clientes actualizado sin bloquear la respuesta
    waitUntil(
      prisma.client
        .upsert({
          where: {
            businessId_email: {
              businessId,
              email: customerEmail.toLowerCase(),
            },
          },
          update: {
            name: customerName,
            phone: customerPhone || undefined,
          },
          create: {
            businessId,
            email: customerEmail.toLowerCase(),
            name: customerName,
            phone: customerPhone || null,
          },
        })
        .catch(console.error)
    );

    // Send pending confirmation email (background, kept alive via waitUntil)
    waitUntil(sendAppointmentPendingConfirmation({
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
    }).catch(console.error));

    // Notify business owner of pending reservation (background, kept alive via waitUntil)
    waitUntil(notifyNewAppointmentPending(
      appointment.business.ownerId,
      customerName,
      appointment.service.name,
      format(appointmentDate, "d 'de' MMMM", { locale: es }),
      startTime
    ).catch(console.error));

    // Check and notify if approaching reservation limit (background, kept alive via waitUntil)
    if (reservationCheck.usage) {
      waitUntil(checkAndNotifyReservationLimit(
        appointment.business.ownerId,
        businessId,
        reservationCheck.usage.current + 1, // +1 porque acabamos de crear una
        reservationCheck.usage.limit
      ).catch(console.error));
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
            timezone: appointment.business.timezone || null,
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

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID requerido" },
        { status: 400 }
      );
    }

    // Verify the authenticated user owns this business
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: { businessId: business.id },
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
