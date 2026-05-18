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
    <div className="space-y-4">
      {/* Header: título + botón en la misma fila */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{terminology.appointments}</h1>
        <NewAppointmentModal
          businessId={business.id}
          services={services}
          staff={business.staff}
          terminology={terminology}
        />
      </div>

      <AppointmentsView
        appointments={appointments}
        slotCapacity={business.slotCapacity}
        services={services}
        staff={business.staff}
        businessName={business.name}
        businessAddress={business.address ?? null}
      />
    </div>
  );
}
