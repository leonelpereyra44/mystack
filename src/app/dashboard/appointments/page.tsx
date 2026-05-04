import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsView } from "@/components/dashboard/appointments-view";
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal";
import { getBusinessTerminology } from "@/lib/business-types";
import { startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

const ITEMS_PER_PAGE = 10;

interface AppointmentsPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: "upcoming" | "past" | "all";
  }>;
}

// Helper para comparar fecha + hora del turno con el momento actual.
// appointmentDate viene como UTC midnight desde Prisma (@db.Date),
// por eso usamos los componentes UTC para no perder un día en zonas UTC-.
function isAppointmentUpcoming(appointmentDate: Date, startTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);

  const aptDateTime = new Date(
    appointmentDate.getUTCFullYear(),
    appointmentDate.getUTCMonth(),
    appointmentDate.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );

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

  // Obtener TODAS las citas para el calendario (3 meses: anterior, actual, siguiente)
  const calendarStart = startOfMonth(subMonths(today, 1));
  const calendarEnd = endOfMonth(addMonths(today, 1));
  
  const allAppointmentsRaw = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: {
        gte: calendarStart,
        lte: calendarEnd,
      },
    },
    include: { service: true, staff: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const allAppointments = allAppointmentsRaw.map((apt) => ({
    ...apt,
    service: { ...apt.service, price: Number(apt.service.price) },
  }));

  // Para la lista, aplicamos filtros y paginación
  let listAppointments;
  let totalPages = 1;

  if (filter === "all") {
    const totalCount = await prisma.appointment.count({
      where: { businessId: business.id },
    });
    
    const rawAppointments = await prisma.appointment.findMany({
      where: { businessId: business.id },
      include: { service: true, staff: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });
    
    totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    listAppointments = rawAppointments.map((apt) => ({
      ...apt,
      service: { ...apt.service, price: Number(apt.service.price) },
    }));
  } else {
    // Obtener turnos para filtrar por fecha+hora
    const allRecentAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      include: { service: true, staff: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    
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
        date: { gt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
      },
      include: { service: true, staff: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    
    let filteredAppointments;
    
    if (filter === "upcoming") {
      const upcomingFromRecent = allRecentAppointments.filter(apt => 
        isAppointmentUpcoming(apt.date, apt.startTime)
      );
      // Combinar y eliminar duplicados por id
      const combined = [...upcomingFromRecent, ...clearFutureAppointments];
      const uniqueIds = new Set<string>();
      filteredAppointments = combined
        .filter(apt => {
          if (uniqueIds.has(apt.id)) return false;
          uniqueIds.add(apt.id);
          return true;
        })
        .sort((a, b) => {
          const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
    } else {
      const pastFromRecent = allRecentAppointments.filter(apt => 
        !isAppointmentUpcoming(apt.date, apt.startTime)
      );
      // Combinar y eliminar duplicados por id
      const combined = [...clearPastAppointments, ...pastFromRecent];
      const uniqueIds = new Set<string>();
      filteredAppointments = combined
        .filter(apt => {
          if (uniqueIds.has(apt.id)) return false;
          uniqueIds.add(apt.id);
          return true;
        })
        .sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.startTime.localeCompare(a.startTime);
        });
    }
    
    const totalCount = filteredAppointments.length;
    totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedAppointments = filteredAppointments.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    listAppointments = paginatedAppointments.map((apt) => ({
      ...apt,
      service: { ...apt.service, price: Number(apt.service.price) },
    }));
  }

  const services = business.services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  const terminology = getBusinessTerminology(business.businessType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{terminology.appointments}</h1>
          <p className="text-muted-foreground">
            Gestioná las {terminology.appointments.toLowerCase()} de tus {terminology.clients.toLowerCase()}
          </p>
        </div>
        <NewAppointmentModal
          businessId={business.id}
          services={services}
          staff={business.staff}
          terminology={terminology}
        />
      </div>

      <AppointmentsView
        appointments={listAppointments}
        allAppointments={allAppointments}
        currentPage={currentPage}
        totalPages={totalPages}
        filter={filter}
      />
    </div>
  );
}
