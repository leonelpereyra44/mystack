import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const plan = await prisma.planConfig.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    if (plan.plan === "FREE" || plan.plan === "PRO") {
      return NextResponse.json({ error: "No se pueden eliminar los planes predeterminados" }, { status: 400 });
    }

    await prisma.planConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, maxReservationsPerMonth, maxStaff, features, isActive } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Nombre y precio son requeridos" }, { status: 400 });
    }

    const plan = await prisma.planConfig.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        maxReservationsPerMonth: maxReservationsPerMonth ?? null,
        maxStaff: maxStaff ?? null,
        features: features || [],
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}
