import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { businessName, businessType = "salon" } = await request.json();

    if (!businessName?.trim()) {
      return NextResponse.json(
        { error: "El nombre del negocio es requerido" },
        { status: 400 }
      );
    }

    // Idempotency: if user already has a business, return it
    const existing = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ business: existing });
    }

    // Generate unique slug
    let slug = generateSlug(businessName.trim());

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { error: "Ese nombre no está disponible, elegí otro" },
        { status: 400 }
      );
    }

    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${generateSlug(businessName.trim())}-${counter}`;
      counter++;
    }

    const business = await prisma.business.create({
      data: {
        name: businessName.trim(),
        slug,
        businessType,
        ownerId: session.user.id,
        schedules: {
          createMany: {
            data: [
              { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isOpen: true },
              { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00", isOpen: true },
              { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00", isOpen: true },
              { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00", isOpen: true },
              { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00", isOpen: true },
              { dayOfWeek: 6, openTime: "09:00", closeTime: "14:00", isOpen: true },
              { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isOpen: false },
            ],
          },
        },
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error("setup-business error:", error);
    return NextResponse.json(
      { error: "Error al crear el negocio" },
      { status: 500 }
    );
  }
}
