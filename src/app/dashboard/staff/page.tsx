import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { StaffList } from "@/components/dashboard/staff-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function StaffPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: {
      staff: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu equipo
          </p>
        </div>
        <Link href="/dashboard/staff/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Miembro
          </Button>
        </Link>
      </div>

      <StaffList staff={business.staff} />
    </div>
  );
}
