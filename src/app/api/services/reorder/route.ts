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
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 });
    }

    // Verificar que todos los servicios pertenecen al negocio
    const services = await prisma.service.findMany({
      where: {
        id: { in: orderedIds },
        businessId: business.id,
      },
    });

    if (services.length !== orderedIds.length) {
      return NextResponse.json({ error: "IDs de servicios inválidos" }, { status: 400 });
    }

    // Actualizar el orden de cada servicio
    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        prisma.service.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering services:", error);
    return NextResponse.json(
      { error: "Error al reordenar servicios" },
      { status: 500 }
    );
  }
}
