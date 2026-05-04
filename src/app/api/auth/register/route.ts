import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isReservedSlug, RESERVED_SLUG_ERROR } from "@/lib/reserved-slugs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .trim();
}

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 requests por minuto por IP
    const { limited, response } = await checkRateLimit(request);
    if (limited) return response;

    const body = await request.json();
    const { name, email, password, businessName, businessType = "salon" } = body;

    // Validate input
    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      );
    }

    // Generate unique slug for business
    let slug = generateSlug(businessName);

    // Block reserved slugs before attempting any DB lookup
    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { error: RESERVED_SLUG_ERROR },
        { status: 400 }
      );
    }

    let slugExists = await prisma.business.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${generateSlug(businessName)}-${counter}`;
      slugExists = await prisma.business.findUnique({ where: { slug } });
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and business in a transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "BUSINESS_OWNER",
        businesses: {
          create: {
            name: businessName,
            slug,
            businessType,
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
        },
      },
      include: {
        businesses: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          businessSlug: user.businesses[0]?.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Mostrar más detalles del error
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    const errorDetails = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
    
    // Errores comunes de Prisma
    if (errorDetails === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un usuario o negocio con esos datos" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Error al crear el usuario: ${errorMessage}` },
      { status: 500 }
    );
  }
}
