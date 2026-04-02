import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription, PLANS } from "@/lib/mercadopago";

// POST - Cancelar suscripción
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "No se encontró el negocio" },
        { status: 404 }
      );
    }

    if (!business.subscription?.mpSubscriptionId) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa para cancelar" },
        { status: 400 }
      );
    }

    // Cancelar en Mercado Pago
    const result = await cancelSubscription(business.subscription.mpSubscriptionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Actualizar el registro de suscripción
    await prisma.subscription.update({
      where: { businessId: business.id },
      data: {
        status: "CANCELLED",
        plan: "FREE",
        cancelledAt: new Date(),
        mpSubscriptionId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada correctamente. Tu plan volverá a Gratuito.",
      newPlan: PLANS.FREE,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Error al cancelar la suscripción" },
      { status: 500 }
    );
  }
}
