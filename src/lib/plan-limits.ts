import prisma from "@/lib/prisma";

// Límites por plan
export const PLAN_LIMITS = {
  FREE: {
    maxReservationsPerMonth: 150,
    maxStaff: 1,
  },
  PRO: {
    maxReservationsPerMonth: Infinity,
    maxStaff: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Verifica si el negocio puede crear más reservas según su plan
 */
export async function canCreateReservation(businessId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: {
    current: number;
    limit: number;
  };
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { subscription: true },
  });

  if (!business) {
    return { allowed: false, reason: "Negocio no encontrado" };
  }

  const plan = (business.subscription?.plan || "FREE") as PlanType;
  const limits = PLAN_LIMITS[plan];

  // Si es PRO, siempre permitir
  if (plan === "PRO") {
    return { allowed: true };
  }

  // Contar reservas del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const reservationsThisMonth = await prisma.appointment.count({
    where: {
      businessId,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  if (reservationsThisMonth >= limits.maxReservationsPerMonth) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxReservationsPerMonth} reservas mensuales del plan gratuito. Mejora a Plan Profesional para reservas ilimitadas.`,
      usage: {
        current: reservationsThisMonth,
        limit: limits.maxReservationsPerMonth,
      },
    };
  }

  return {
    allowed: true,
    usage: {
      current: reservationsThisMonth,
      limit: limits.maxReservationsPerMonth,
    },
  };
}

/**
 * Verifica si el negocio puede crear más staff según su plan
 */
export async function canCreateStaff(businessId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: {
    current: number;
    limit: number;
  };
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { subscription: true },
  });

  if (!business) {
    return { allowed: false, reason: "Negocio no encontrado" };
  }

  const plan = (business.subscription?.plan || "FREE") as PlanType;
  const limits = PLAN_LIMITS[plan];

  // Si es PRO, siempre permitir
  if (plan === "PRO") {
    return { allowed: true };
  }

  // Contar staff activo
  const staffCount = await prisma.staff.count({
    where: {
      businessId,
      isActive: true,
    },
  });

  if (staffCount >= limits.maxStaff) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxStaff} profesional(es) del plan gratuito. Mejora a Plan Profesional para staff ilimitado.`,
      usage: {
        current: staffCount,
        limit: limits.maxStaff,
      },
    };
  }

  return {
    allowed: true,
    usage: {
      current: staffCount,
      limit: limits.maxStaff,
    },
  };
}

/**
 * Obtiene el uso actual del plan
 */
export async function getPlanUsage(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { subscription: true },
  });

  if (!business) {
    return null;
  }

  const plan = (business.subscription?.plan || "FREE") as PlanType;
  const limits = PLAN_LIMITS[plan];

  // Contar reservas del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const [reservationsThisMonth, staffCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        businessId,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    }),
    prisma.staff.count({
      where: {
        businessId,
        isActive: true,
      },
    }),
  ]);

  return {
    plan,
    reservations: {
      current: reservationsThisMonth,
      limit: limits.maxReservationsPerMonth,
      percentage: limits.maxReservationsPerMonth === Infinity 
        ? 0 
        : Math.round((reservationsThisMonth / limits.maxReservationsPerMonth) * 100),
    },
    staff: {
      current: staffCount,
      limit: limits.maxStaff,
    },
  };
}
