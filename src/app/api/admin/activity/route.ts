import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLocalDateInTz } from "@/lib/utils";

type EventType =
  | "user_registered"
  | "business_created"
  | "appointment_created"
  | "subscription_created"
  | "subscription_cancelled";

interface ActivityEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  meta?: Record<string, string>;
}

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "all";
    const period = searchParams.get("period") ?? "all";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE)), PAGE_SIZE),
      200
    );

    // Date ranges en timezone Argentina
    const nowLocal = getLocalDateInTz("America/Argentina/Buenos_Aires");
    const todayStart = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
    const weekStart  = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() - 7));
    const monthStart = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 1));

    const periodStart =
      period === "today" ? todayStart
      : period === "week" ? weekStart
      : period === "month" ? monthStart
      : undefined;

    const createdFilter = periodStart ? { gte: periodStart } : undefined;

    const fetchUsers = filter === "all" || filter === "users";
    const fetchBusinesses = filter === "all" || filter === "businesses";
    const fetchAppointments = filter === "all" || filter === "appointments";
    const fetchSubscriptions = filter === "all" || filter === "subscriptions";

    // Fetch sources + summary counts (today, always) in parallel
    const [users, businesses, appointments, activeSubs, cancelledSubs, summaryRaw] =
      await Promise.all([
        fetchUsers
          ? prisma.user.findMany({
              take: limit + 20,
              where: createdFilter ? { createdAt: createdFilter } : undefined,
              orderBy: { createdAt: "desc" },
              select: { id: true, name: true, email: true, createdAt: true },
            })
          : Promise.resolve([]),

        fetchBusinesses
          ? prisma.business.findMany({
              take: limit + 20,
              where: createdFilter ? { createdAt: createdFilter } : undefined,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                name: true,
                businessType: true,
                createdAt: true,
                owner: { select: { email: true } },
              },
            })
          : Promise.resolve([]),

        fetchAppointments
          ? prisma.appointment.findMany({
              take: limit + 20,
              where: createdFilter ? { createdAt: createdFilter } : undefined,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                customerName: true,
                status: true,
                createdAt: true,
                business: { select: { name: true } },
                service: { select: { name: true } },
              },
            })
          : Promise.resolve([]),

        // Active/non-cancelled subscriptions: filter by createdAt
        fetchSubscriptions
          ? prisma.subscription.findMany({
              take: limit + 20,
              where: {
                plan: { not: "FREE" },
                status: { not: "CANCELLED" },
                ...(createdFilter ? { createdAt: createdFilter } : {}),
              },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                plan: true,
                status: true,
                createdAt: true,
                cancelledAt: true,
                business: { select: { name: true } },
              },
            })
          : Promise.resolve([]),

        // Cancelled subscriptions: filter by cancelledAt (more relevant)
        fetchSubscriptions
          ? prisma.subscription.findMany({
              take: limit + 20,
              where: {
                status: "CANCELLED",
                cancelledAt: { not: null },
                ...(createdFilter ? { cancelledAt: createdFilter } : {}),
              },
              orderBy: { cancelledAt: "desc" },
              select: {
                id: true,
                plan: true,
                status: true,
                createdAt: true,
                cancelledAt: true,
                business: { select: { name: true } },
              },
            })
          : Promise.resolve([]),

        // Summary: always "today" regardless of filter/period
        Promise.all([
          prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.business.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.appointment.count({ where: { createdAt: { gte: todayStart } } }),
          prisma.subscription.count({
            where: { createdAt: { gte: todayStart }, plan: { not: "FREE" } },
          }),
        ]),
      ]);

    const [todayUsers, todayBusinesses, todayAppointments, todaySubscriptions] =
      summaryRaw;

    // Build unified event list
    const events: ActivityEvent[] = [];

    for (const u of users) {
      events.push({
        id: `user-${u.id}`,
        type: "user_registered",
        title: "Nuevo usuario registrado",
        description: u.name ? `${u.name} (${u.email})` : u.email,
        timestamp: u.createdAt.toISOString(),
      });
    }

    for (const b of businesses) {
      events.push({
        id: `biz-${b.id}`,
        type: "business_created",
        title: "Nuevo negocio creado",
        description: `${b.name} — ${b.owner.email}`,
        timestamp: b.createdAt.toISOString(),
        meta: { type: b.businessType },
      });
    }

    for (const a of appointments) {
      events.push({
        id: `apt-${a.id}`,
        type: "appointment_created",
        title: "Nueva reserva",
        description: `${a.customerName} en ${a.business.name} — ${a.service.name}`,
        timestamp: a.createdAt.toISOString(),
        meta: { status: a.status },
      });
    }

    for (const s of activeSubs) {
      events.push({
        id: `sub-${s.id}`,
        type: "subscription_created",
        title: "Nueva suscripción",
        description: `${s.business.name} activó el plan ${s.plan}`,
        timestamp: s.createdAt.toISOString(),
        meta: { plan: s.plan, status: s.status },
      });
    }

    for (const s of cancelledSubs) {
      events.push({
        id: `sub-cancel-${s.id}`,
        type: "subscription_cancelled",
        title: "Suscripción cancelada",
        description: `${s.business.name} canceló el plan ${s.plan}`,
        timestamp: s.cancelledAt!.toISOString(),
        meta: { plan: s.plan },
      });
    }

    events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const hasMore = events.length > limit;

    return NextResponse.json({
      events: events.slice(0, limit),
      hasMore,
      summary: {
        todayUsers,
        todayBusinesses,
        todayAppointments,
        todaySubscriptions,
        todayTotal: todayUsers + todayBusinesses + todayAppointments + todaySubscriptions,
      },
    });
  } catch (error) {
    console.error("[ADMIN/ACTIVITY]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
