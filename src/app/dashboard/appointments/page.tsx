import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal";
import { startOfDay, endOfDay, addDays, subDays } from "date-fns";

const ITEMS_PER_PAGE = 10;

interface AppointmentsPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: "upcoming" | "past" | "all";
  }>;
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
  
  // Build date filter
  let dateFilter = {};
  if (filter === "upcoming") {
    dateFilter = {
      date: {
        gte: startOfDay(today),
      },
    };
  } else if (filter === "past") {
    dateFilter = {
      date: {
        lt: startOfDay(today),
      },
    };
  }

  // Get total count for pagination
  const totalCount = await prisma.appointment.count({
    where: {
      businessId: business.id,
      ...dateFilter,
    },
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get appointments with pagination
  const rawAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      ...dateFilter,
    },
    include: {
      service: true,
      staff: true,
    },
    orderBy: filter === "past" 
      ? [{ date: "desc" }, { startTime: "desc" }]
      : [{ date: "asc" }, { startTime: "asc" }],
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  // Convertir Decimal a number para evitar error de serialización
  const appointments = rawAppointments.map((apt) => ({
    ...apt,
    service: {
      ...apt.service,
      price: Number(apt.service.price),
    },
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
