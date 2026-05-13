import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/services/[id]/schedule
export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify the service belongs to a business owned by this user
  const service = await prisma.service.findFirst({
    where: {
      id,
      business: { ownerId: session.user.id },
    },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ schedules: service.schedules });
}

// PUT /api/services/[id]/schedule
// Body: { schedules: [{ dayOfWeek: number, startTime: string, endTime: string }] }
export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify the service belongs to a business owned by this user
  const service = await prisma.service.findFirst({
    where: {
      id,
      business: { ownerId: session.user.id },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const { schedules } = body as {
    schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
  };

  if (!Array.isArray(schedules)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  // Validate each entry
  for (const s of schedules) {
    if (
      typeof s.dayOfWeek !== "number" ||
      s.dayOfWeek < 0 ||
      s.dayOfWeek > 6 ||
      typeof s.startTime !== "string" ||
      typeof s.endTime !== "string"
    ) {
      return NextResponse.json({ error: "Datos de franja inválidos" }, { status: 400 });
    }

    // Validar formato HH:MM
    if (!TIME_RE.test(s.startTime) || !TIME_RE.test(s.endTime)) {
      return NextResponse.json(
        { error: `Formato de hora inválido en el día ${s.dayOfWeek}. Usá HH:MM (ej: 09:00)` },
        { status: 400 }
      );
    }

    // Validar que inicio < fin
    if (timeToMinutes(s.startTime) >= timeToMinutes(s.endTime)) {
      return NextResponse.json(
        { error: `La hora de inicio debe ser anterior a la de fin en el día ${s.dayOfWeek}` },
        { status: 400 }
      );
    }
  }

  // Validar que cada franja esté dentro del horario del negocio
  const businessSchedules = await prisma.businessSchedule.findMany({
    where: { businessId: service.businessId },
  });

  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  for (const s of schedules) {
    const bizSchedule = businessSchedules.find((bs) => bs.dayOfWeek === s.dayOfWeek);

    if (!bizSchedule) continue;

    if (!bizSchedule.isOpen) {
      return NextResponse.json(
        { error: `El negocio está cerrado el ${days[s.dayOfWeek]}` },
        { status: 400 }
      );
    }

    const svcStart = timeToMinutes(s.startTime);
    const svcEnd = timeToMinutes(s.endTime);
    const bizStart = timeToMinutes(bizSchedule.openTime);
    const bizEnd = timeToMinutes(bizSchedule.closeTime);

    if (svcStart < bizStart || svcEnd > bizEnd) {
      return NextResponse.json(
        {
          error: `El horario del ${days[s.dayOfWeek]} debe estar dentro del horario del negocio (${bizSchedule.openTime} - ${bizSchedule.closeTime})`,
        },
        { status: 400 }
      );
    }
  }

  // Replace all schedules atomically
  await prisma.$transaction([
    prisma.serviceSchedule.deleteMany({ where: { serviceId: id } }),
    ...(schedules.length > 0
      ? [
          prisma.serviceSchedule.createMany({
            data: schedules.map((s) => ({
              serviceId: id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }),
        ]
      : []),
  ]);

  const updated = await prisma.serviceSchedule.findMany({
    where: { serviceId: id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ schedules: updated });
}
