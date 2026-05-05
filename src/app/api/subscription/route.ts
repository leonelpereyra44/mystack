import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/mercadopago";
import { SubscriptionPlan } from "@prisma/client";

const VALID_PLANS = Object.values(SubscriptionPlan);

// POST - Crear suscripción a un plan de pago
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const planKey: string = body.plan ?? "PRO";

    if (!VALID_PLANS.includes(planKey as SubscriptionPlan)) {
      return NextResponse.json(
        { error: "Plan inválido" },
        { status: 400 }
      );
    }

    // Buscar el plan en la DB para obtener precio y nombre reales
    const planConfig = await prisma.planConfig.findFirst({
      where: { plan: planKey as SubscriptionPlan, isActive: true },
    });

    if (!planConfig) {
      return NextResponse.json(
        { error: "Plan no encontrado o inactivo" },
        { status: 400 }
      );
    }

    if (Number(planConfig.price) === 0) {
      return NextResponse.json(
        { error: "No es posible suscribirse a un plan gratuito por este medio" },
        { status: 400 }
      );
    }

    // Obtener el negocio del usuario
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

    // Verificar si ya tiene suscripción activa a ese plan
    if (business.subscription?.plan === (planKey as SubscriptionPlan) && business.subscription?.status === "ACTIVE") {
      return NextResponse.json(
        { error: `Ya tienes una suscripción activa al plan ${planConfig.name}` },
        { status: 400 }
      );
    }

    // Crear la suscripción en Mercado Pago con precio y nombre del plan
    const result = await createSubscription({
      payerEmail: session.user.email!,
      externalReference: business.id,
      price: Number(planConfig.price),
      reason: `MyStack ${planConfig.name}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Actualizar o crear el registro de suscripción con estado pendiente
    await prisma.subscription.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        plan: planKey as SubscriptionPlan,
        status: "TRIALING",
        mpSubscriptionId: result.subscriptionId,
      },
      update: {
        mpSubscriptionId: result.subscriptionId,
        status: "TRIALING",
      },
    });

    return NextResponse.json({
      success: true,
      initPoint: result.initPoint,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Error al crear la suscripción" },
      { status: 500 }
    );
  }
}

// GET - Obtener información de la suscripción actual
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

    if (!business) {
      return NextResponse.json(
        { error: "No se encontró el negocio" },
        { status: 404 }
      );
    }

    const plan = business.subscription?.plan || "FREE";

    // Obtener configuración real del plan desde la DB
    const planConfig = await prisma.planConfig.findFirst({
      where: { plan: plan as never },
    });

    const maxReservations = planConfig?.maxReservationsPerMonth ?? Infinity;
    const maxStaff = planConfig?.maxStaff ?? Infinity;

    // Contar reservas del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const reservationsThisMonth = await prisma.appointment.count({
      where: {
        businessId: business.id,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    });

    // Contar staff activo
    const staffCount = await prisma.staff.count({
      where: {
        businessId: business.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      subscription: {
        plan,
        status: business.subscription?.status || "ACTIVE",
        currentPeriodEnd: business.subscription?.currentPeriodEnd,
      },
      planInfo: {
        name: planConfig?.name ?? plan,
        price: Number(planConfig?.price ?? 0),
        features: (planConfig?.features as string[]) ?? [],
      },
      usage: {
        reservationsThisMonth,
        maxReservations: maxReservations,
        staffCount,
        maxStaff: maxStaff,
        reservationsPercentage: maxReservations === Infinity
          ? 0
          : Math.round((reservationsThisMonth / maxReservations) * 100),
      },
    });
  } catch (error) {
    console.error("Error getting subscription:", error);
    return NextResponse.json(
      { error: "Error al obtener la suscripción" },
      { status: 500 }
    );
  }
}
