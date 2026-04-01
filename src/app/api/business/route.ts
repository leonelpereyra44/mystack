import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, phone, email, address, allowMultipleBookings } = body;

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: name !== undefined ? name : business.name,
        description: description !== undefined ? description : business.description,
        phone: phone !== undefined ? phone : business.phone,
        email: email !== undefined ? email : business.email,
        address: address !== undefined ? address : business.address,
        allowMultipleBookings: allowMultipleBookings !== undefined ? allowMultipleBookings : business.allowMultipleBookings,
      },
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Error al actualizar el negocio" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: {
        services: true,
        staff: true,
        schedules: true,
        subscription: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Error al obtener el negocio" },
      { status: 500 }
    );
  }
}
