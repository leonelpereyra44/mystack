import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal";

const ITEMS_PER_PAGE = 10;

interface AppointmentsPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: "upcoming" | "past" | "all";
  }>;
}

// Helper para comparar fecha + hora del turno con el momento actual
function isAppointmentUpcoming(appointmentDate: Date, startTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  
  // Crear fecha del turno con la hora correcta
  const aptDateTime = new Date(appointmentDate);
  aptDateTime.setHours(hours, minutes, 0, 0);
  
  return aptDateTime > now;
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const filter = params?.filter || "upcoming";

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      staff: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!business) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Para "upcoming" y "past", primero obtenemos todos los turnos del día actual
  // y los de fechas anteriores/posteriores, luego filtramos en memoria por hora
  
  let rawAppointments;
  
  if (filter === "all") {
    // Sin filtro de fecha
    const totalCount = await prisma.appointment.count({
      where: { businessId: business.id },
    });
    
    rawAppointments = await prisma.appointment.findMany({
      where: { businessId: business.id },
      include: { service: true, staff: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });
    
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    const appointments = rawAppointments.map((apt) => ({
      ...apt,
      service: { ...apt.service, price: Number(apt.service.price) },
    }));
    
    const services = business.services.map((s) => ({
      ...s,
      price: Number(s.price),
    }));

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Turnos</h1>
          <NewAppointmentModal services={services} staff={business.staff} businessId={business.id} />
        </div>
        <AppointmentsList 
          appointments={appointments} 
          currentPage={currentPage}
          totalPages={totalPages}
          filter={filter}
        />
      </div>
    );
  }
  
  // Para "upcoming" o "past", obtenemos más datos y filtramos por fecha+hora
  // Obtenemos turnos desde ayer hasta mañana para capturar todos los casos del día actual
  const allRecentAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      // Rango amplio para incluir turno del día actual
      date: {
        gte: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000), // Ayer
      },
    },
    include: { service: true, staff: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  
  // También obtenemos turnos claramente pasados o futuros
  const clearPastAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: { lt: todayStart },
    },
    include: { service: true, staff: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });
  
  const clearFutureAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: { gt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }, // Pasado mañana
    },
    include: { service: true, staff: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  
  // Filtrar por fecha+hora
  let filteredAppointments;
  
  if (filter === "upcoming") {
    // Turnos futuros: los de días futuros + los de hoy que aún no pasaron
    const upcomingFromRecent = allRecentAppointments.filter(apt => 
      isAppointmentUpcoming(apt.date, apt.startTime)
    );
    filteredAppointments = [...upcomingFromRecent, ...clearFutureAppointments]
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  } else {
    // Turnos pasados: los de días pasados + los de hoy que ya pasaron
    const pastFromRecent = allRecentAppointments.filter(apt => 
      !isAppointmentUpcoming(apt.date, apt.startTime)
    );
    filteredAppointments = [...clearPastAppointments, ...pastFromRecent]
      .sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.startTime.localeCompare(a.startTime);
      });
  }
  
  // Aplicar paginación manualmente
  const totalCount = filteredAppointments.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const appointments = paginatedAppointments.map((apt) => ({
    ...apt,
    service: { ...apt.service, price: Number(apt.service.price) },
  }));

  const services = business.services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Turnos</h1>
          <p className="text-muted-foreground">
            Gestiona las reservas de tus clientes
          </p>
        </div>
        <NewAppointmentModal
          businessId={business.id}
          services={services}
          staff={business.staff}
        />
      </div>

      <AppointmentsList 
        appointments={appointments} 
        currentPage={currentPage}
        totalPages={totalPages}
        filter={filter}
      />
    </div>
  );
}
