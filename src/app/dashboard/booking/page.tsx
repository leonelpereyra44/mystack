import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookingSettingsForm } from "@/components/dashboard/booking-settings-form";

export default async function BookingSettingsPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
  });

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold">Configuración de Reservas</h1>
        <p className="text-muted-foreground">
          Controla cómo los clientes pueden hacer reservas en tu negocio
        </p>
      </div>

      <BookingSettingsForm business={business} />
    </div>
  );
}
