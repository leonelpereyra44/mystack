import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Verificar plan PRO
    const isPro = business.subscription?.plan === "PRO" && business.subscription?.status === "ACTIVE";
    if (!isPro) {
      return NextResponse.json({ 
        error: "Esta función requiere el plan PRO",
        requiresPro: true 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get("months") || "1");
    
    const now = new Date();
    const startDate = startOfMonth(subMonths(now, monthsBack - 1));
    const endDate = endOfMonth(now);

    // 1. Obtener todas las citas del período
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      include: {
        service: true,
        staff: true,
      },
      orderBy: { date: "asc" },
    });

    // 2. Calcular ingresos estimados por mes
    const revenueByMonth: Record<string, number> = {};
    appointments.forEach((apt) => {
      const monthKey = format(apt.date, "yyyy-MM");
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = 0;
      }
      revenueByMonth[monthKey] += Number(apt.service.price);
    });

    // Convertir a array ordenado
    const monthlyRevenue = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({
        month,
        monthLabel: format(new Date(month + "-01"), "MMM yyyy"),
        revenue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 3. Servicios más populares
    const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};
    appointments.forEach((apt) => {
      if (!serviceCount[apt.serviceId]) {
        serviceCount[apt.serviceId] = {
          name: apt.service.name,
          count: 0,
          revenue: 0,
        };
      }
      serviceCount[apt.serviceId].count++;
      serviceCount[apt.serviceId].revenue += Number(apt.service.price);
    });

    const popularServices = Object.values(serviceCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Horarios pico (distribución por hora)
    const hourlyDistribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }
    appointments.forEach((apt) => {
      const hour = parseInt(apt.startTime.split(":")[0]);
      hourlyDistribution[hour]++;
    });

    const peakHours = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        hourLabel: `${hour.padStart(2, "0")}:00`,
        count,
      }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count);

    // 5. Distribución por día de la semana
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dailyDistribution: Record<number, number> = {};
    for (let i = 0; i < 7; i++) {
      dailyDistribution[i] = 0;
    }
    appointments.forEach((apt) => {
      const day = apt.date.getDay();
      dailyDistribution[day]++;
    });

    const appointmentsByDay = Object.entries(dailyDistribution)
      .map(([day, count]) => ({
        day: parseInt(day),
        dayLabel: dayNames[parseInt(day)],
        count,
      }));

    // 6. Rendimiento por staff
    const staffPerformance: Record<string, { name: string; appointments: number; revenue: number }> = {};
    appointments.forEach((apt) => {
      if (apt.staffId && apt.staff) {
        if (!staffPerformance[apt.staffId]) {
          staffPerformance[apt.staffId] = {
            name: apt.staff.name,
            appointments: 0,
            revenue: 0,
          };
        }
        staffPerformance[apt.staffId].appointments++;
        staffPerformance[apt.staffId].revenue += Number(apt.service.price);
      }
    });

    const staffStats = Object.values(staffPerformance)
      .sort((a, b) => b.appointments - a.appointments);

    // 7. Estadísticas de estado de citas (incluyendo canceladas)
    const allAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { status: true },
    });

    const statusCounts = {
      total: allAppointments.length,
      confirmed: allAppointments.filter((a) => a.status === "CONFIRMED").length,
      completed: allAppointments.filter((a) => a.status === "COMPLETED").length,
      cancelled: allAppointments.filter((a) => a.status === "CANCELLED").length,
      noShow: allAppointments.filter((a) => a.status === "NO_SHOW").length,
      pending: allAppointments.filter((a) => a.status === "PENDING").length,
    };

    // 8. Tendencia (comparar con período anterior)
    const previousStart = startOfMonth(subMonths(startDate, monthsBack));
    const previousEnd = endOfMonth(subMonths(startDate, 1));
    
    const previousAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: previousStart,
          lte: previousEnd,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      include: { service: true },
    });

    const currentRevenue = appointments.reduce((sum, apt) => sum + Number(apt.service.price), 0);
    const previousRevenue = previousAppointments.reduce((sum, apt) => sum + Number(apt.service.price), 0);
    
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;

    const appointmentsChange = previousAppointments.length > 0
      ? ((appointments.length - previousAppointments.length) / previousAppointments.length) * 100
      : appointments.length > 0 ? 100 : 0;

    // 9. Tasa de cancelación
    const cancellationRate = statusCounts.total > 0
      ? (statusCounts.cancelled / statusCounts.total) * 100
      : 0;

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        months: monthsBack,
      },
      summary: {
        totalAppointments: appointments.length,
        totalRevenue: currentRevenue,
        averageTicket: appointments.length > 0 ? currentRevenue / appointments.length : 0,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
      },
      trends: {
        revenueChange: Math.round(revenueChange * 10) / 10,
        appointmentsChange: Math.round(appointmentsChange * 10) / 10,
      },
      monthlyRevenue,
      popularServices,
      peakHours: peakHours.slice(0, 5),
      appointmentsByDay,
      staffStats,
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
