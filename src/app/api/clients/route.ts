import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PRO_PLANS = ["PRO", "PREMIUM", "ENTERPRISE"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Plan check: solo PRO, PREMIUM y ENTERPRISE activos
    const isProActive =
      business.subscription?.status === "ACTIVE" &&
      PRO_PLANS.includes(business.subscription.plan);

    if (!isProActive) {
      return NextResponse.json({ requiresPro: true }, { status: 403 });
    }

    // Traer clientes con stats agregados desde appointments (por email)
    // Se usa JOIN por customerEmail para funcionar antes y después del backfill
    const clients = await prisma.$queryRaw<
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

    const serialized = clients.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      phone: c.phone,
      createdAt: c.createdAt,
      totalAppointments: Number(c.totalAppointments),
      lastAppointmentDate: c.lastAppointmentDate,
      totalSpent: parseFloat(c.totalSpent),
    }));

    return NextResponse.json({
      clients: serialized,
      total: serialized.length,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}
