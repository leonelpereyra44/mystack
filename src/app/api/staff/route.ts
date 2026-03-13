import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
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
    const { name, email, phone } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        businessId: business.id,
        name,
        email: email || null,
        phone: phone || null,
        isActive: true,
      },
    });

    // Create default schedule for staff
    const defaultSchedules = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
      { dayOfWeek: 6, startTime: "09:00", endTime: "14:00", isWorking: true },
      { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorking: false },
    ];

    await prisma.staffSchedule.createMany({
      data: defaultSchedules.map((s) => ({ ...s, staffId: staff.id })),
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Error al crear el miembro" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: {
        staff: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(business.staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Error al obtener el equipo" },
      { status: 500 }
    );
  }
}
