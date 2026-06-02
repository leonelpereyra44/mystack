import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AccountForm } from "@/components/dashboard/account-form";
import { SubscriptionConversionTracker } from "@/components/analytics/subscription-conversion-tracker";

export default async function AccountPage() {
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
      {/* Tracker de conversión para suscripción PRO */}
      <SubscriptionConversionTracker businessId={business.id} />

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold">Cuenta</h1>
        <p className="text-muted-foreground">
          Seguridad, suscripción y opciones avanzadas de tu cuenta
        </p>
      </div>

      <AccountForm business={business} />
    </div>
  );
}
