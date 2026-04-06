import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Obtener fechas bloqueadas públicamente (para mostrar en booking)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    const business = await prisma.business.findUnique({
      where: { slug, isActive: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Obtener bloqueos a partir de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        businessId: business.id,
        date: { gte: today },
        // Si se especifica staffId, incluir bloqueos del staff Y del negocio completo
        ...(staffId && {
          OR: [
            { staffId: staffId },
            { staffId: null }, // Bloqueos de todo el negocio
          ],
        }),
      },
      select: {
        date: true,
        startTime: true,
        endTime: true,
        isAllDay: true,
        staffId: true,
        reason: true,
      },
      orderBy: { date: "asc" },
    });

    // Agrupar por fecha para fácil consulta en el frontend
    const blockedDates: Record<string, {
      isFullDay: boolean;
      ranges: { startTime: string; endTime: string }[];
      reason?: string | null;
    }> = {};

    for (const block of blockedTimes) {
      const dateKey = block.date.toISOString().split("T")[0];
      
      if (!blockedDates[dateKey]) {
        blockedDates[dateKey] = {
          isFullDay: false,
          ranges: [],
          reason: block.reason,
        };
      }

      if (block.isAllDay) {
        blockedDates[dateKey].isFullDay = true;
        blockedDates[dateKey].reason = block.reason;
      } else if (block.startTime && block.endTime) {
        blockedDates[dateKey].ranges.push({
          startTime: block.startTime,
          endTime: block.endTime,
        });
      }
    }

    // Lista de fechas completamente bloqueadas (para deshabilitar en calendario)
    const fullyBlockedDates = Object.entries(blockedDates)
      .filter(([, info]) => info.isFullDay)
      .map(([date]) => date);

    return NextResponse.json({
      blockedDates,
      fullyBlockedDates,
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return NextResponse.json(
      { error: "Error al obtener fechas bloqueadas" },
      { status: 500 }
    );
  }
}
