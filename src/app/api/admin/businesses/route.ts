import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es admin por rol
    const isAdmin = session.user.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (plan === "PRO" || plan === "FREE") {
      where.subscription = { plan };
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          email: true,
          phone: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              staff: true,
              services: true,
            },
          },
        },
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Error al obtener negocios" },
      { status: 500 }
    );
  }
}
