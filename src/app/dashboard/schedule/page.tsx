import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ScheduleForm } from "@/components/dashboard/schedule-form";
import { BlockedTimesManager } from "@/components/dashboard/blocked-times-manager";

export default async function SchedulePage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
      staff: {
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Horarios</h1>
        <p className="text-muted-foreground">
          Configura los horarios de atención de tu negocio
        </p>
      </div>

      <ScheduleForm
        schedules={business.schedules}
        businessId={business.id}
        businessType={business.businessType}
      />
      
      <BlockedTimesManager staff={business.staff} />
    </div>
  );
}
