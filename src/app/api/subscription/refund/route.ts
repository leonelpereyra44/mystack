import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  cancelSubscription, 
  refundPayment, 
  isEligibleForRefund,
  PLANS,
  REFUND_PERIOD_DAYS 
} from "@/lib/mercadopago";

// POST - Solicitar reembolso por derecho de arrepentimiento
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

    const subscription = business.subscription;

    // Verificar que tenga una suscripción activa PRO
    if (!subscription || subscription.plan !== "PRO" || subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "No tienes una suscripción PRO activa" },
        { status: 400 }
      );
    }

    // Verificar que no se haya reembolsado antes
    if (subscription.refundedAt) {
      return NextResponse.json(
        { error: "Ya has solicitado un reembolso anteriormente" },
        { status: 400 }
      );
    }

    // Verificar que esté dentro del período de arrepentimiento (10 días)
    if (!isEligibleForRefund(subscription.currentPeriodStart)) {
      return NextResponse.json(
        { error: `El período de arrepentimiento de ${REFUND_PERIOD_DAYS} días ha expirado. Conforme a la Ley 24.240, solo puedes solicitar reembolso dentro de los primeros 10 días.` },
        { status: 400 }
      );
    }

    // Verificar que tengamos el ID del pago
    if (!subscription.lastPaymentId) {
      return NextResponse.json(
        { error: "No se encontró información del pago para reembolsar. Por favor, contacta a soporte." },
        { status: 400 }
      );
    }

    // Procesar el reembolso en Mercado Pago
    const refundResult = await refundPayment(subscription.lastPaymentId);

    if (!refundResult.success) {
      console.error("Refund failed:", refundResult.error);
      return NextResponse.json(
        { error: refundResult.error || "Error al procesar el reembolso. Por favor, contacta a soporte." },
        { status: 500 }
      );
    }

    // Cancelar la suscripción en Mercado Pago
    if (subscription.mpSubscriptionId) {
      const cancelResult = await cancelSubscription(subscription.mpSubscriptionId);
      if (!cancelResult.success) {
        console.error("Cancel subscription failed after refund:", cancelResult.error);
        // Continuamos aunque falle la cancelación, ya que el reembolso fue exitoso
      }
    }

    // Actualizar el registro de suscripción
    await prisma.subscription.update({
      where: { businessId: business.id },
      data: {
        status: "CANCELLED",
        plan: "FREE",
        refundedAt: new Date(),
        cancelledAt: new Date(),
        mpSubscriptionId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reembolso procesado correctamente. El dinero será acreditado en tu método de pago original en los próximos días hábiles.",
      refundId: refundResult.refundId,
      amount: refundResult.amount,
      newPlan: PLANS.FREE,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Error al procesar el reembolso. Por favor, intenta nuevamente o contacta a soporte." },
      { status: 500 }
    );
  }
}

// GET - Verificar elegibilidad para reembolso
export async function GET() {
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

    if (!business?.subscription) {
      return NextResponse.json({
        eligible: false,
        reason: "No hay suscripción",
      });
    }

    const subscription = business.subscription;

    // Verificar condiciones
    if (subscription.plan !== "PRO" || subscription.status !== "ACTIVE") {
      return NextResponse.json({
        eligible: false,
        reason: "No hay suscripción PRO activa",
      });
    }

    if (subscription.refundedAt) {
      return NextResponse.json({
        eligible: false,
        reason: "Ya se solicitó un reembolso",
      });
    }

    const eligible = isEligibleForRefund(subscription.currentPeriodStart);
    
    // Calcular días restantes
    let daysLeft = 0;
    if (subscription.currentPeriodStart) {
      const startDate = new Date(subscription.currentPeriodStart);
      const deadline = new Date(startDate.getTime() + REFUND_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      const now = new Date();
      daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      eligible,
      daysLeft,
      reason: eligible 
        ? `Puedes solicitar reembolso. Te quedan ${daysLeft} días.`
        : "El período de arrepentimiento ha expirado",
    });
  } catch (error) {
    console.error("Error checking refund eligibility:", error);
    return NextResponse.json(
      { error: "Error al verificar elegibilidad" },
      { status: 500 }
    );
  }
}
