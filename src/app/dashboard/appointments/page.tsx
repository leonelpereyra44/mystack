import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsView } from "@/components/dashboard/appointments-view";
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal";
import { getBusinessTerminology } from "@/lib/business-types";

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

  const appointmentsRaw = await prisma.appointment.findMany({
    where: { businessId: business.id },
    include: { service: true, staff: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const appointments = appointmentsRaw.map((apt) => ({
    ...apt,
    service: { ...apt.service, price: Number(apt.service.price) },
  }));

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

      <AppointmentsView appointments={appointments} />
    </div>
  );
}
