import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isReservedSlug, RESERVED_SLUG_ERROR } from "@/lib/reserved-slugs";

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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que el usuario realmente no tiene negocio (evitar duplicados)
  const existingBusiness = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  });

  if (existingBusiness) {
    return NextResponse.json(
      { error: "Ya tienes un negocio registrado" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { businessName, businessType = "salon" } = body;

  if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
    return NextResponse.json(
      { error: "El nombre del negocio debe tener al menos 2 caracteres" },
      { status: 400 }
    );
  }

  let slug = generateSlug(businessName.trim());

  if (isReservedSlug(slug)) {
    return NextResponse.json({ error: RESERVED_SLUG_ERROR }, { status: 400 });
  }

  let slugExists = await prisma.business.findUnique({ where: { slug } });
  let counter = 1;
  while (slugExists) {
    slug = `${generateSlug(businessName.trim())}-${counter}`;
    slugExists = await prisma.business.findUnique({ where: { slug } });
    counter++;
  }

  await prisma.business.create({
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

  return NextResponse.json({ success: true, slug });
}
