import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LimitWarningBanner } from "@/components/dashboard/limit-warning-banner";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { GettingStartedCards } from "@/components/dashboard/getting-started-cards";
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive";

import { getBusinessTerminology } from "@/lib/business-types";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateValue: Date | string): Date {
  const d = new Date(dateValue);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

export default async function DashboardPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      services: true,
      staff: true,
      subscription: true,
      schedules: true,
      appointments: {
        where: {
          date: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date()),
          },
        },
        include: { service: true, staff: true },
      },
    },
  });

  if (!business) {
    return null;
  }

  // Obtener plan actual y límites dinámicos de la BD
  const plan = business.subscription?.plan || "FREE";
  const planConfig = await prisma.planConfig.findUnique({ where: { plan: plan as "FREE" | "PRO" } });
  const limits = {
    maxReservationsPerMonth: planConfig?.maxReservationsPerMonth ?? (plan === "FREE" ? 150 : null),
    maxStaff: planConfig?.maxStaff ?? (plan === "FREE" ? 1 : null),
  };
  const terminology = getBusinessTerminology(business.businessType);

  const todayAppointments = business.appointments.filter((apt) => {
    const aptDate = parseUTCDate(apt.date);
    const today = new Date();
    return (
      aptDate >= startOfDay(today) &&
      aptDate <= endOfDay(today) &&
      apt.status !== "CANCELLED"
    );
  });

  const upcomingAppointments = business.appointments
    .filter((apt) => {
      const aptDate = parseUTCDate(apt.date);
      return aptDate >= startOfDay(new Date()) && apt.status !== "CANCELLED";
    })
    .sort((a, b) => parseUTCDate(a.date).getTime() - parseUTCDate(b.date).getTime())
    .slice(0, 5)
    .map((apt) => ({
      ...apt,
      service: { ...apt.service, price: Number(apt.service.price) },
    }));

  // Contar solo reservas no canceladas del mes
  const monthReservations = business.appointments.filter(
    (a) => a.status !== "CANCELLED"
  ).length;

  // Datos para onboarding
  const hasServices = business.services.length > 0;
  const hasStaff = business.staff.length > 0;
  const hasSchedule = business.schedules.some((s) => s.isOpen);
  const hasLogo = !!business.logo;
  const isNewBusiness = !hasServices || !hasStaff || !hasSchedule;

  const stats = {
    todayCount: todayAppointments.length,
    monthCount: monthReservations,
    servicesCount: business.services.length,
    staffCount: business.staff.length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta, {session?.user?.name}
        </p>
      </div>

      {/* Limit Warning Banner */}
      <LimitWarningBanner
        currentReservations={monthReservations}
        maxReservations={limits.maxReservationsPerMonth ?? Infinity}
        plan={plan}
      />

      {/* Onboarding Checklist - solo para negocios nuevos */}
      {isNewBusiness && (
        <OnboardingChecklist
          businessSlug={business.slug}
          hasServices={hasServices}
          hasStaff={hasStaff}
          hasSchedule={hasSchedule}
          hasLogo={hasLogo}
        />
      )}

      {/* Getting Started Cards */}
      <GettingStartedCards
        businessSlug={business.slug}
        hasServices={hasServices}
        hasStaff={hasStaff}
        hasSchedule={hasSchedule}
      />

      <DashboardInteractive
        stats={stats}
        upcomingAppointments={upcomingAppointments}
        terminology={terminology}
      />
    </div>
  );
}
