import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener horarios del staff
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el staff pertenece al negocio
    const staff = await prisma.staff.findFirst({
      where: { id, businessId: business.id },
      include: {
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener también los horarios del negocio para referencia
    const businessSchedules = await prisma.businessSchedule.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({
      staffSchedules: staff.schedules,
      businessSchedules,
    });
  } catch (error) {
    console.error("Error fetching staff schedule:", error);
    return NextResponse.json(
      { error: "Error al obtener los horarios" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar horarios del staff
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el staff pertenece al negocio
    const staff = await prisma.staff.findFirst({
      where: { id, businessId: business.id },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { schedules } = body;

    if (!Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Formato de horarios inválido" },
        { status: 400 }
      );
    }

    // Validar que los horarios estén dentro del rango del negocio
    const businessSchedules = await prisma.businessSchedule.findMany({
      where: { businessId: business.id },
    });

    for (const schedule of schedules) {
      const businessSchedule = businessSchedules.find(
        (bs) => bs.dayOfWeek === schedule.dayOfWeek
      );

      if (!businessSchedule) continue;

      // Si el negocio está cerrado ese día, el staff también debe estar
      if (!businessSchedule.isOpen && schedule.isWorking) {
        return NextResponse.json(
          {
            error: `El negocio está cerrado el día ${getDayName(schedule.dayOfWeek)}. El staff no puede trabajar ese día.`,
          },
          { status: 400 }
        );
      }

      // Si el staff trabaja, validar que esté dentro del horario del negocio
      if (schedule.isWorking && businessSchedule.isOpen) {
        const staffStart = timeToMinutes(schedule.startTime);
        const staffEnd = timeToMinutes(schedule.endTime);
        const businessStart = timeToMinutes(businessSchedule.openTime);
        const businessEnd = timeToMinutes(businessSchedule.closeTime);

        if (staffStart < businessStart || staffEnd > businessEnd) {
          return NextResponse.json(
            {
              error: `El horario del ${getDayName(schedule.dayOfWeek)} debe estar dentro del horario del negocio (${businessSchedule.openTime} - ${businessSchedule.closeTime})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Actualizar horarios usando upsert
    await prisma.$transaction(
      schedules.map((schedule: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) =>
        prisma.staffSchedule.upsert({
          where: {
            staffId_dayOfWeek: {
              staffId: id,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isWorking: schedule.isWorking,
          },
          create: {
            staffId: id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isWorking: schedule.isWorking,
          },
        })
      )
    );

    return NextResponse.json({ message: "Horarios actualizados correctamente" });
  } catch (error) {
    console.error("Error updating staff schedule:", error);
    return NextResponse.json(
      { error: "Error al actualizar los horarios" },
      { status: 500 }
    );
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getDayName(dayOfWeek: number): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[dayOfWeek];
}
