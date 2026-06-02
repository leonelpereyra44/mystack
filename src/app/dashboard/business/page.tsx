import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BusinessForm } from "@/components/dashboard/business-form";

export default async function BusinessPage() {
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
        <h1 className="text-3xl font-bold">Mi Negocio</h1>
        <p className="text-muted-foreground">
          Información pública y perfil de tu negocio
        </p>
      </div>

      <BusinessForm business={business} />
    </div>
  );
}
