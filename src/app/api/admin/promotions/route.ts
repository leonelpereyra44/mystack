import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json({ error: "Error al obtener promociones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

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
    } = body;

    if (!name || !discountValue || !startsAt || !appliesTo?.length) {
      return NextResponse.json(
        { error: "Nombre, descuento, fecha de inicio y planes son requeridos" },
        { status: 400 }
      );
    }

    if (discountType === "PERCENTAGE" && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: "El descuento en porcentaje debe estar entre 1 y 100" },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
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
        isActive: true,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating promotion:", error);
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
    return NextResponse.json({ error: "Error al crear promoción" }, { status: 500 });
  }
}
