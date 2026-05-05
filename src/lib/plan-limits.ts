import prisma from "@/lib/prisma";

// Fallback estático (usado solo si la BD no tiene configuración)
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
 * Obtiene los límites reales del plan desde la BD.
 * Cae al fallback estático si no hay configuración.
 */
async function getDynamicLimits(plan: PlanType) {
  try {
    const config = await prisma.planConfig.findUnique({
      where: { plan },
      select: { maxReservationsPerMonth: true, maxStaff: true },
    });
    if (config) {
      return {
        maxReservationsPerMonth: config.maxReservationsPerMonth ?? Infinity,
        maxStaff: config.maxStaff ?? Infinity,
      };
    }
  } catch {
    // Si falla, usar fallback
  }
  return PLAN_LIMITS[plan];
}

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
  const limits = await getDynamicLimits(plan);

  // Si no hay límite de reservas (PRO o configurado como ilimitado)
  if (limits.maxReservationsPerMonth === Infinity) {
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
      status: { not: "CANCELLED" },
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
  const limits = await getDynamicLimits(plan);

  // Si no hay límite de staff (ilimitado)
  if (limits.maxStaff === Infinity) {
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
  const limits = await getDynamicLimits(plan);

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
