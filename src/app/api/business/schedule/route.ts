import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const session = await auth();

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

    const body = await request.json();
    const { schedules } = body;

    // Update all schedules in a transaction
    await prisma.$transaction(
      schedules.map((schedule: { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }) =>
        prisma.businessSchedule.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId: business.id,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            openTime: schedule.openTime,
            closeTime: schedule.closeTime,
            isOpen: schedule.isOpen,
          },
          create: {
            businessId: business.id,
            dayOfWeek: schedule.dayOfWeek,
            openTime: schedule.openTime,
            closeTime: schedule.closeTime,
            isOpen: schedule.isOpen,
          },
        })
      )
    );

    return NextResponse.json({ message: "Horarios actualizados" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Error al actualizar los horarios" },
      { status: 500 }
    );
  }
}
