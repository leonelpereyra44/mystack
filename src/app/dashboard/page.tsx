import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { LimitWarningBanner } from "@/components/dashboard/limit-warning-banner";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { GettingStartedCards } from "@/components/dashboard/getting-started-cards";
import { PLAN_LIMITS } from "@/lib/plan-limits";

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
      },
    },
  });

  if (!business) {
    return null;
  }

  // Obtener plan actual
  const plan = (business.subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

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
    .slice(0, 5);

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
        maxReservations={limits.maxReservationsPerMonth}
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
            <div className="text-xl lg:text-2xl font-bold">{stats.todayCount}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Este Mes</CardTitle>
            <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
            <div className="text-xl lg:text-2xl font-bold">{stats.monthCount}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Servicios</CardTitle>
            <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
            <div className="text-xl lg:text-2xl font-bold">{stats.servicesCount}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Empleados</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
            <div className="text-xl lg:text-2xl font-bold">{stats.staffCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay turnos próximos
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{apt.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.customerEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {format(parseUTCDate(apt.date), "d MMM", { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.startTime} - {apt.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
