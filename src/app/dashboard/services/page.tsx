import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ServicesList } from "@/components/dashboard/services-list";
import { SuggestedServicesPanel } from "@/components/dashboard/suggested-services-panel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getBusinessTerminology } from "@/lib/business-types";

export default async function ServicesPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      services: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!business) {
    return null;
  }

  // Convertir Decimal a number para evitar error de serialización
  const services = business.services.map((service) => ({
    ...service,
    price: Number(service.price),
  }));

  const terminology = getBusinessTerminology(business.businessType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{terminology.services}</h1>
          <p className="text-muted-foreground">
            Gestioná los {terminology.services.toLowerCase()} que ofrecés a tus {terminology.clients.toLowerCase()}
          </p>
        </div>
        <Link href={`/dashboard/services/new?type=${business.businessType}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {terminology.newService}
          </Button>
        </Link>
      </div>

      <SuggestedServicesPanel
        businessType={business.businessType}
        defaultOpen={services.length === 0}
      />

      <ServicesList services={services} />
    </div>
  );
}
