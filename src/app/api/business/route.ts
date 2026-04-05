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
    const { name, description, phone, email, address, allowMultipleBookings, businessType } = body;

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: name !== undefined ? name : business.name,
        description: description !== undefined ? description : business.description,
        phone: phone !== undefined ? phone : business.phone,
        email: email !== undefined ? email : business.email,
        address: address !== undefined ? address : business.address,
        allowMultipleBookings: allowMultipleBookings !== undefined ? allowMultipleBookings : business.allowMultipleBookings,
        businessType: businessType !== undefined ? businessType : business.businessType,
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

// DELETE - Eliminar negocio y cuenta de usuario
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { confirmation, password } = body;

    // Verificar que se escribió la confirmación correcta
    if (confirmation !== "ELIMINAR MI NEGOCIO") {
      return NextResponse.json(
        { error: "Confirmación incorrecta" },
        { status: 400 }
      );
    }

    // Obtener el usuario con su contraseña para verificar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar contraseña
    const bcrypt = await import("bcryptjs");
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Obtener el negocio
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar todo en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar notificaciones del usuario
      await tx.notification.deleteMany({
        where: { userId: session.user.id },
      });

      // 2. Eliminar citas del negocio
      await tx.appointment.deleteMany({
        where: { businessId: business.id },
      });

      // 3. Eliminar horarios del staff
      await tx.staffSchedule.deleteMany({
        where: { staff: { businessId: business.id } },
      });

      // 4. Eliminar staff
      await tx.staff.deleteMany({
        where: { businessId: business.id },
      });

      // 5. Eliminar servicios
      await tx.service.deleteMany({
        where: { businessId: business.id },
      });

      // 6. Eliminar horarios del negocio
      await tx.businessSchedule.deleteMany({
        where: { businessId: business.id },
      });

      // 7. Eliminar suscripción
      await tx.subscription.deleteMany({
        where: { businessId: business.id },
      });

      // 8. Eliminar el negocio
      await tx.business.delete({
        where: { id: business.id },
      });

      // 9. Eliminar sesiones del usuario
      await tx.session.deleteMany({
        where: { userId: session.user.id },
      });

      // 10. Eliminar cuentas vinculadas
      await tx.account.deleteMany({
        where: { userId: session.user.id },
      });

      // 11. Finalmente, eliminar el usuario
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Negocio y cuenta eliminados correctamente" 
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Error al eliminar el negocio" },
      { status: 500 }
    );
  }
}
