import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/mercadopago";
import { sendSubscriptionCancelled } from "@/lib/email";

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

    // Actualizar el registro de suscripción:
    // NO se baja el plan a FREE de inmediato — el acceso se mantiene hasta que
    // currentPeriodEnd caduque. plan-limits.ts evalúa este caso en cada request.
    const sub = business.subscription;
    await prisma.subscription.update({
      where: { businessId: business.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        // Mantener el plan actual hasta fin del período facturado
      },
    });

    // Email de confirmación de cancelación
    try {
      const owner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      });
      const planConfig = await prisma.planConfig.findFirst({
        where: { plan: sub.plan },
        select: { name: true },
      });
      if (owner?.email) {
        const accessUntil = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toLocaleDateString("es-AR")
          : "el fin del período actual";
        await sendSubscriptionCancelled({
          email: owner.email,
          name: owner.name ?? "usuario",
          planName: planConfig?.name ?? sub.plan,
          accessUntil,
        });
      }
    } catch (emailErr) {
      console.error("Error sending cancellation email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada. Conservarás el acceso hasta el final del período ya abonado.",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Error al cancelar la suscripción" },
      { status: 500 }
    );
  }
}
