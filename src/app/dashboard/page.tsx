import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LimitWarningBanner } from "@/components/dashboard/limit-warning-banner";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
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

  const [business, user] = await Promise.all([
    prisma.business.findFirst({
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
    }),
    prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { emailVerified: true },
    }),
  ]);

  if (!business) {
    return null;
  }

  // Solo aplica el plan pago si la suscripción está ACTIVA
  const plan = business.subscription?.status === "ACTIVE" ? business.subscription.plan : "FREE";
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

  // Contar TODAS las reservas del mes (incluyendo canceladas/eliminadas).
  // El límite mensual representa reservas generadas, no reservas activas.
  // Esto es consistente con canCreateReservation() en plan-limits.ts.
  const monthReservations = business.appointments.length;

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

  // Actividad reciente: las últimas 4 reservas del mes ordenadas por fecha desc
  const recentActivity = [...business.appointments]
    .sort((a, b) => parseUTCDate(b.date).getTime() - parseUTCDate(a.date).getTime())
    .slice(0, 4)
    .map((apt) => ({
      id: apt.id,
      type: apt.status,
      customerName: apt.customerName,
      serviceName: apt.service.name,
      date: apt.date,
      startTime: apt.startTime,
    }));

  const sessionUser = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
  };

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">
          Bienvenido de vuelta, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Aquí tienes un resumen de lo que está sucediendo hoy en MyStack.
        </p>
      </div>

      {/* Email Verification Banner */}
      {!user?.emailVerified && <EmailVerificationBanner />}

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

      <DashboardInteractive
        stats={stats}
        upcomingAppointments={upcomingAppointments}
        recentActivity={recentActivity}
        terminology={terminology}
        user={sessionUser}
      />
    </div>
  );
}
