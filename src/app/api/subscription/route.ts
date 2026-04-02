import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription, PLANS } from "@/lib/mercadopago";

// POST - Crear suscripción a Plan PRO
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
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

    // Verificar si ya tiene suscripción PRO activa
    if (business.subscription?.plan === "PRO" && business.subscription?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Ya tienes una suscripción activa al Plan Profesional" },
        { status: 400 }
      );
    }

    // Crear la suscripción en Mercado Pago
    const result = await createSubscription({
      payerEmail: session.user.email!,
      externalReference: business.id,
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
        plan: "FREE", // Se actualizará cuando MP confirme
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
      plan: PLANS.PRO,
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
    const planInfo = PLANS[plan as keyof typeof PLANS];

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
        name: planInfo.name,
        price: planInfo.price,
        features: planInfo.features,
      },
      usage: {
        reservationsThisMonth,
        maxReservations: planInfo.maxReservations,
        staffCount,
        maxStaff: planInfo.maxStaff,
        reservationsPercentage: planInfo.maxReservations === Infinity 
          ? 0 
          : Math.round((reservationsThisMonth / planInfo.maxReservations) * 100),
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
