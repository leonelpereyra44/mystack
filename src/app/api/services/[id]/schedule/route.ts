import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
