import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal";
import { startOfDay, endOfDay, addDays } from "date-fns";

export default async function AppointmentsPage() {
  const session = await auth();

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

  // Get appointments for today and the next 7 days
  const today = new Date();
  const rawAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: {
        gte: startOfDay(today),
        lte: endOfDay(addDays(today, 7)),
      },
    },
    include: {
      service: true,
      staff: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
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

      <AppointmentsList appointments={appointments} />
    </div>
  );
}
