import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}
