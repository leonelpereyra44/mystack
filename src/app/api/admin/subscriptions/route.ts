import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
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

    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { plan: "PRO" },
          { status: "CANCELLED" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Error al obtener suscripciones" },
      { status: 500 }
    );
  }
}
