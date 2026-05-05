import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET() {
  // Rate limiting por IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { success } = await rateLimit(`plans:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  try {
    const plans = await prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        plan: true,
        name: true,
        description: true,
        price: true,
        maxReservationsPerMonth: true,
        maxStaff: true,
        features: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ plans }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}
