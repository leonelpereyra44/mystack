import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import prisma from "@/lib/prisma";
import { addMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentConfirmation } from "@/lib/email";
import { parseDateString } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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

    // Obtener el turno con todos sus datos
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

    // Calcular nueva hora de fin
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateObj = new Date();
    startDateObj.setHours(hours, minutes, 0, 0);
    const endDateObj = addMinutes(startDateObj, appointment.service.duration);
    const endTime = format(endDateObj, "HH:mm");

    // Parsear fecha correctamente
    const appointmentDate = parseDateString(date);
    const dayOfWeek = appointmentDate.getUTCDay();

    // ============================================
    // VALIDAR CONTRA HORARIO DEL NEGOCIO
    // ============================================
    const businessSchedule = await prisma.businessSchedule.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId: appointment.businessId,
          dayOfWeek,
        },
      },
    });

    if (!businessSchedule || !businessSchedule.isOpen) {
      return NextResponse.json(
        { error: "El negocio no atiende ese día" },
        { status: 400 }
      );
    }

    const slotStart = timeToMinutes(startTime);
    const slotEnd = timeToMinutes(endTime);
    const bizOpen = timeToMinutes(businessSchedule.openTime);
    const bizClose = timeToMinutes(businessSchedule.closeTime);

    if (slotStart < bizOpen || slotEnd > bizClose) {
      return NextResponse.json(
        {
          error: `El horario debe estar dentro del horario del negocio (${businessSchedule.openTime} - ${businessSchedule.closeTime})`,
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDAR CONTRA HORARIO DEL STAFF (si aplica)
    // ============================================
    const effectiveStaffId = staffId ?? appointment.staffId;
    if (effectiveStaffId) {
      const staffSchedule = await prisma.staffSchedule.findUnique({
        where: {
          staffId_dayOfWeek: {
            staffId: effectiveStaffId,
            dayOfWeek,
          },
        },
      });

      if (!staffSchedule || !staffSchedule.isWorking) {
        return NextResponse.json(
          { error: "El profesional no trabaja ese día" },
          { status: 400 }
        );
      }

      const staffOpen = timeToMinutes(staffSchedule.startTime);
      const staffClose = timeToMinutes(staffSchedule.endTime);

      if (slotStart < staffOpen || slotEnd > staffClose) {
        return NextResponse.json(
          {
            error: `El horario debe estar dentro del horario del profesional (${staffSchedule.startTime} - ${staffSchedule.endTime})`,
          },
          { status: 400 }
        );
      }
    }

    // ============================================
    // VALIDAR BLOQUEOS DE AGENDA
    // ============================================
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        businessId: appointment.businessId,
        date: appointmentDate,
        ...(effectiveStaffId
          ? { OR: [{ staffId: effectiveStaffId }, { staffId: null }] }
          : { staffId: null }
        ),
      },
    });

    // Bloqueo de todo el día
    const hasFullDayBlock = blockedTimes.some((bt) => bt.isAllDay);
    if (hasFullDayBlock) {
      return NextResponse.json(
        { error: "El negocio no está disponible ese día" },
        { status: 400 }
      );
    }

    // Bloqueos parciales
    for (const bt of blockedTimes) {
      if (!bt.isAllDay && bt.startTime && bt.endTime) {
        const blockStart = timeToMinutes(bt.startTime);
        const blockEnd = timeToMinutes(bt.endTime);
        if (slotStart < blockEnd && slotEnd > blockStart) {
          return NextResponse.json(
            { error: "El horario seleccionado está bloqueado" },
            { status: 400 }
          );
        }
      }
    }

    // ============================================
    // VALIDAR minBookingNotice
    // ============================================
    const minBookingNotice = appointment.business.minBookingNotice ?? 0;
    if (minBookingNotice > 0) {
      const nowArg = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const limitMs = Date.now() + minBookingNotice * 60 * 60 * 1000;
      const limitArg = new Date(limitMs - 3 * 60 * 60 * 1000);

      const selectedDateStr = `${appointmentDate.getUTCFullYear()}-${String(
        appointmentDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(appointmentDate.getUTCDate()).padStart(
        2,
        "0"
      )}`;
      const todayArgStr = `${nowArg.getUTCFullYear()}-${String(
        nowArg.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(nowArg.getUTCDate()).padStart(2, "0")}`;
      const limitDateStr = `${limitArg.getUTCFullYear()}-${String(
        limitArg.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(limitArg.getUTCDate()).padStart(2, "0")}`;

      if (selectedDateStr === todayArgStr) {
        const currentMinutes =
          nowArg.getUTCHours() * 60 + nowArg.getUTCMinutes();
        const marginMinutes = Math.max(30, minBookingNotice * 60);
        if (slotStart <= currentMinutes + marginMinutes) {
          return NextResponse.json(
            {
              error: `Se requiere al menos ${minBookingNotice}h de antelación para reservar`,
            },
            { status: 400 }
          );
        }
      } else if (selectedDateStr === limitDateStr) {
        const limitMinutes =
          limitArg.getUTCHours() * 60 + limitArg.getUTCMinutes();
        if (slotStart <= limitMinutes) {
          return NextResponse.json(
            {
              error: `Se requiere al menos ${minBookingNotice}h de antelación para reservar`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ============================================
    // ACTUALIZAR EN TRANSACCIÓN ATÓMICA (evitar race condition)
    // ============================================
    let updatedAppointment;
    try {
      updatedAppointment = await prisma.$transaction(async (tx) => {
        const conflictingCount = await tx.appointment.count({
          where: {
            businessId: appointment.businessId,
            date: appointmentDate,
            status: { notIn: ["CANCELLED"] },
            NOT: {
              AND: [
                { status: "PENDING" },
                { tokenExpiresAt: { lt: new Date() } },
              ],
            },
            id: { not: id },
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
            ...(effectiveStaffId && { staffId: effectiveStaffId }),
          },
        });

        if (conflictingCount >= appointment.business.slotCapacity) {
          throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
        }

        return tx.appointment.update({
          where: { id },
          data: {
            date: appointmentDate,
            startTime,
            endTime,
            staffId: staffId !== undefined ? staffId || null : appointment.staffId,
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

    // Enviar email de confirmación con los nuevos datos
    waitUntil(sendAppointmentConfirmation({
      customerName: updatedAppointment.customerName,
      customerEmail: updatedAppointment.customerEmail,
      businessName: updatedAppointment.business.name,
      serviceName: updatedAppointment.service.name,
      staffName: updatedAppointment.staff?.name,
      date: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      startTime,
      endTime,
      appointmentId: updatedAppointment.id,
      businessAddress: updatedAppointment.business.address || undefined,
      businessPhone: updatedAppointment.business.phone || undefined,
    }).catch(console.error));

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
