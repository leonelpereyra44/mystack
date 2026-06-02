import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Crown, ContactRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientsList, type ClientData } from "@/components/dashboard/clients-list";
import Link from "next/link";

const PRO_PLANS = ["PRO", "PREMIUM", "ENTERPRISE"];

// Clientes de ejemplo para la preview borrosa (plan FREE)
const PREVIEW_CLIENTS: ClientData[] = [
  {
    id: "1",
    name: "María González",
    email: "maria@ejemplo.com",
    phone: "+54 911 1234 5678",
    createdAt: new Date().toISOString(),
    totalAppointments: 8,
    lastAppointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalSpent: 64000,
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    email: "carlos@ejemplo.com",
    phone: "+54 911 8765 4321",
    createdAt: new Date().toISOString(),
    totalAppointments: 5,
    lastAppointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalSpent: 37500,
  },
  {
    id: "3",
    name: "Lucía Fernández",
    email: "lucia@ejemplo.com",
    phone: null,
    createdAt: new Date().toISOString(),
    totalAppointments: 2,
    lastAppointmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    totalSpent: 15000,
  },
  {
    id: "4",
    name: "Andrés López",
    email: "andres@ejemplo.com",
    phone: "+54 911 5555 0000",
    createdAt: new Date().toISOString(),
    totalAppointments: 1,
    lastAppointmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalSpent: 8500,
  },
];

export default async function ClientsPage() {
  const session = await auth();

  const business = await prisma.business.findFirst({
    where: { ownerId: session?.user?.id },
    include: { subscription: true },
  });

  if (!business) return null;

  const isProActive =
    business.subscription?.status === "ACTIVE" &&
    PRO_PLANS.includes(business.subscription.plan ?? "");

  if (!isProActive) {
    return (
      <div className="space-y-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ContactRound className="h-7 w-7" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Directorio de todos tus clientes y su historial
          </p>
        </div>

        <div className="relative">
          {/* Preview borrosa */}
          <div className="pointer-events-none select-none blur-sm opacity-60">
            <ClientsList initialClients={PREVIEW_CLIENTS} total={PREVIEW_CLIENTS.length} />
          </div>

          {/* Card de upgrade */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="shadow-2xl max-w-sm w-full mx-4">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Crown className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Lista de Clientes</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Conocé quiénes son tus clientes, cuántas veces volvieron y cuánto
                    gastaron. Disponible en el Plan Profesional.
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <Button className="gap-2 w-full">
                    <Crown className="h-4 w-4" />
                    Actualizar a PRO
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Traer clientes con stats agregados
  const result = await prisma.$queryRaw<
    {
      id: string;
      email: string;
      name: string;
      phone: string | null;
      createdAt: Date;
      totalAppointments: bigint;
      lastAppointmentDate: Date | null;
      totalSpent: string;
    }[]
  >`
    SELECT
      c.id,
      c.email,
      c.name,
      c.phone,
      c."createdAt",
      COUNT(a.id) FILTER (
        WHERE a.status NOT IN ('CANCELLED', 'RESCHEDULED')
      ) AS "totalAppointments",
      MAX(a.date) FILTER (
        WHERE a.status NOT IN ('CANCELLED', 'RESCHEDULED')
      ) AS "lastAppointmentDate",
      COALESCE(
        SUM(s.price) FILTER (
          WHERE a.status NOT IN ('CANCELLED', 'RESCHEDULED')
        ),
        0
      )::text AS "totalSpent"
    FROM clients c
    LEFT JOIN appointments a
      ON a."customerEmail" = c.email
      AND a."businessId" = c."businessId"
    LEFT JOIN services s ON a."serviceId" = s.id
    WHERE c."businessId" = ${business.id}
    GROUP BY c.id, c.email, c.name, c.phone, c."createdAt"
    ORDER BY MAX(a.date) FILTER (
      WHERE a.status NOT IN ('CANCELLED', 'RESCHEDULED')
    ) DESC NULLS LAST, c."createdAt" DESC
  `;

  const clients: ClientData[] = result.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    createdAt: c.createdAt.toISOString(),
    totalAppointments: Number(c.totalAppointments),
    lastAppointmentDate: c.lastAppointmentDate
      ? c.lastAppointmentDate.toISOString()
      : null,
    totalSpent: parseFloat(c.totalSpent),
  }));

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ContactRound className="h-7 w-7" />
          Clientes
        </h1>
        <p className="text-muted-foreground">
          Directorio de todos tus clientes y su historial
        </p>
      </div>

      <ClientsList initialClients={clients} total={clients.length} />
    </div>
  );
}
