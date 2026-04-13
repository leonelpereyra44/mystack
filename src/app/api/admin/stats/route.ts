import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Fechas para filtros
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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
    ] = await Promise.all([
      prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
      prisma.subscription.count({ where: { plan: "FREE" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
    ]);

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

    // MRR (Monthly Recurring Revenue) - asumiendo $15,000 por PRO
    const mrr = proSubscriptions * 15000;

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
