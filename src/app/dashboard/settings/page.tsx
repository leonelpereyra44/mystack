import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      subscription: true,
    },
  });

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu negocio
        </p>
      </div>

      <SettingsForm business={business} />
    </div>
  );
}
