import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AppointmentsView } from "@/components/dashboard/appointments-view";
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
      schedules: true,
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
    <AppointmentsView
      appointments={appointments}
      slotCapacity={business.slotCapacity}
      services={services}
      staff={business.staff}
      businessName={business.name}
      businessAddress={business.address ?? null}
      businessId={business.id}
      terminology={terminology}
      schedules={business.schedules}
    />
  );
}
