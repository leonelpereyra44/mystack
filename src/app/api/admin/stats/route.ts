import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLocalDateInTz } from "@/lib/utils";

// Emails autorizados como admin
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es admin por rol
    const isAdmin = session.user.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Fechas para filtros en timezone Argentina
    const nowLocal = getLocalDateInTz("America/Argentina/Buenos_Aires");
    const todayStart = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
    const weekStart  = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() - 7));
    const monthStart = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 1));

    // Estadísticas de usuarios
    const [
      totalUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    // Estadísticas de negocios
    const [
      totalBusinesses,
      businessesToday,
      businessesByType,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.business.groupBy({
        by: ['businessType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Estadísticas de suscripciones
    const [
      proSubscriptions,
      freeSubscriptions,
      cancelledSubscriptions,
      activeByPlan,
      planPrices,
    ] = await Promise.all([
      prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
      prisma.subscription.count({ where: { plan: "FREE" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE" },
        _count: { id: true },
      }),
      prisma.planConfig.findMany({ select: { plan: true, price: true } }),
    ]);

    // MRR calculado con precios reales de PlanConfig
    const priceMap = Object.fromEntries(planPrices.map((p) => [p.plan, Number(p.price)]));
    const mrr = activeByPlan.reduce((sum, row) => {
      return sum + (priceMap[row.plan] ?? 0) * row._count.id;
    }, 0);

    // Estadísticas de reservas
    const [
      totalAppointments,
      appointmentsToday,
      appointmentsThisMonth,
      cancelledAppointments,
      completedAppointments,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.appointment.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
    ]);

    // Usuarios recientes
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        image: true,
      },
    });

    // Negocios recientes
    const recentBusinesses = await prisma.business.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        createdAt: true,
        subscription: {
          select: { plan: true },
        },
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
        recent: recentUsers,
      },
      businesses: {
        total: totalBusinesses,
        today: businessesToday,
        byType: businessesByType.map(b => ({
          type: b.businessType || "Sin categoría",
          count: b._count.id,
        })),
        recent: recentBusinesses,
      },
      subscriptions: {
        pro: proSubscriptions,
        free: freeSubscriptions,
        cancelled: cancelledSubscriptions,
        mrr,
      },
      appointments: {
        total: totalAppointments,
        today: appointmentsToday,
        thisMonth: appointmentsThisMonth,
        cancelled: cancelledAppointments,
        completed: completedAppointments,
        cancellationRate: totalAppointments > 0 
          ? ((cancelledAppointments / totalAppointments) * 100).toFixed(1)
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
