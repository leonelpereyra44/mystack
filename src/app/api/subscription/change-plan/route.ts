import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription, cancelSubscription } from "@/lib/mercadopago";
import { SubscriptionPlan } from "@prisma/client";

const VALID_PLANS = Object.values(SubscriptionPlan);

// POST - Cambiar de plan (upgrade o downgrade)
// Body: { plan: "PRO" | "BASIC" | ... }
//
// Flujo:
// 1. Cancela el preapproval actual en MP (si existe)
// 2. Crea un nuevo preapproval para el plan destino
// 3. Deja la suscripción en TRIALING hasta que el webhook confirme el pago
//
// Nota sobre prorrateo: MP no soporta prorrateo nativo en preapprovals.
// El usuario paga el nuevo plan completo desde el momento del cambio.
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const newPlanKey: string = body.plan ?? "";

    if (!VALID_PLANS.includes(newPlanKey as SubscriptionPlan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const planConfig = await prisma.planConfig.findFirst({
      where: { plan: newPlanKey as SubscriptionPlan, isActive: true },
    });

    if (!planConfig) {
      return NextResponse.json(
        { error: "Plan no encontrado o inactivo" },
        { status: 400 }
      );
    }

    if (Number(planConfig.price) === 0) {
      return NextResponse.json(
        {
          error:
            "Para cambiar al plan gratuito usa la opción de cancelar suscripción",
        },
        { status: 400 }
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

    const currentSub = business.subscription;

    // Impedir cambiar al mismo plan si ya está activo
    if (
      currentSub?.plan === (newPlanKey as SubscriptionPlan) &&
      currentSub?.status === "ACTIVE"
    ) {
      return NextResponse.json(
        { error: `Ya estás en el plan ${planConfig.name}` },
        { status: 400 }
      );
    }

    // Cancelar el preapproval actual en MP para evitar cobros del plan anterior
    if (currentSub?.mpSubscriptionId) {
      const cancelResult = await cancelSubscription(
        currentSub.mpSubscriptionId
      );
      if (!cancelResult.success) {
        return NextResponse.json(
          {
            error:
              "No se pudo cancelar la suscripción actual en el procesador de pagos. Intenta de nuevo.",
          },
          { status: 500 }
        );
      }
    }

    // Crear nuevo preapproval en MP para el plan destino
    const result = await createSubscription({
      payerEmail: session.user.email!,
      externalReference: `${business.id}:${newPlanKey}`,
      price: Number(planConfig.price),
      reason: `MyStack ${planConfig.name}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Actualizar DB: TRIALING hasta que el webhook confirme el pago
    await prisma.subscription.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        plan: newPlanKey as SubscriptionPlan,
        status: "TRIALING",
        mpSubscriptionId: result.subscriptionId,
      },
      update: {
        plan: newPlanKey as SubscriptionPlan,
        mpSubscriptionId: result.subscriptionId,
        status: "TRIALING",
        pausedAt: null,
        cancelledAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      initPoint: result.initPoint,
      message: `Cambio al plan ${planConfig.name} iniciado. Completa el pago para activarlo.`,
    });
  } catch (error) {
    console.error("Error changing plan:", error);
    return NextResponse.json(
      { error: "Error al cambiar el plan" },
      { status: 500 }
    );
  }
}
