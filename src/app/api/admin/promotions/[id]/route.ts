import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const {
      name,
      code,
      description,
      discountType,
      discountValue,
      appliesTo,
      startsAt,
      endsAt,
      maxUses,
      isActive,
    } = body;

    if (!name || !discountValue || !startsAt || !appliesTo?.length) {
      return NextResponse.json(
        { error: "Nombre, descuento, fecha de inicio y planes son requeridos" },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name,
        code: code?.trim() || null,
        description: description || null,
        discountType: discountType || "PERCENTAGE",
        discountValue,
        appliesTo: appliesTo || [],
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        maxUses: maxUses ?? null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ promotion });
  } catch (error: unknown) {
    console.error("Error updating promotion:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una promoción con ese código" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}

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

    await prisma.promotion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json({ error: "Error al eliminar promoción" }, { status: 500 });
  }
}
