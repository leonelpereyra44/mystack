import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE - Eliminar un bloqueo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el bloqueo pertenezca al negocio
    const blockedTime = await prisma.blockedTime.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    });

    if (!blockedTime) {
      return NextResponse.json(
        { error: "Bloqueo no encontrado" },
        { status: 404 }
      );
    }

    await prisma.blockedTime.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked time:", error);
    return NextResponse.json(
      { error: "Error al eliminar bloqueo" },
      { status: 500 }
    );
  }
}
