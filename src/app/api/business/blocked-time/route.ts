import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener todos los bloqueos del negocio
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        businessId: business.id,
        ...(staffId && { staffId }),
        ...(fromDate && toDate && {
          date: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }),
      },
      include: {
        staff: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(blockedTimes);
  } catch (error) {
    console.error("Error fetching blocked times:", error);
    return NextResponse.json(
      { error: "Error al obtener bloqueos" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo bloqueo
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { staffId, date, dateEnd, startTime, endTime, reason, isAllDay } = body;

    if (!date) {
      return NextResponse.json(
        { error: "La fecha es requerida" },
        { status: 400 }
      );
    }

    // Si hay fecha de fin, crear múltiples bloqueos (uno por día) con un groupId
    if (dateEnd && dateEnd !== date) {
      const startDate = new Date(date);
      const endDate = new Date(dateEnd);
      
      if (endDate < startDate) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la de inicio" },
          { status: 400 }
        );
      }

      // Validar staff si se proporciona
      if (staffId) {
        const staffMember = await prisma.staff.findFirst({
          where: { id: staffId, businessId: business.id },
        });
        if (!staffMember) {
          return NextResponse.json(
            { error: "Profesional no encontrado" },
            { status: 404 }
          );
        }
      }

      // Generar un groupId único para este rango
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Crear un bloqueo por cada día en el rango
      const blockedTimes = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const blocked = await prisma.blockedTime.create({
          data: {
            businessId: business.id,
            staffId: staffId || null,
            groupId,
            date: new Date(currentDate),
            startTime: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime,
            reason: reason || null,
            isAllDay: isAllDay || false,
          },
          include: {
            staff: {
              select: { id: true, name: true },
            },
          },
        });
        blockedTimes.push(blocked);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Devolver un objeto agrupado para mostrar en UI
      return NextResponse.json({
        isGroup: true,
        groupId,
        startDate: date,
        endDate: dateEnd,
        reason: reason || null,
        staffId: staffId || null,
        staff: blockedTimes[0]?.staff || null,
        isAllDay: isAllDay || false,
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
        count: blockedTimes.length,
        items: blockedTimes,
      }, { status: 201 });
    }

    // Validar que si no es todo el día, tenga horarios
    if (!isAllDay && (!startTime || !endTime)) {
      return NextResponse.json(
        { error: "Se requieren horarios de inicio y fin" },
        { status: 400 }
      );
    }

    // Validar que el staff pertenezca al negocio
    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, businessId: business.id },
      });
      if (!staff) {
        return NextResponse.json(
          { error: "Profesional no encontrado" },
          { status: 404 }
        );
      }
    }

    const blockedTime = await prisma.blockedTime.create({
      data: {
        businessId: business.id,
        staffId: staffId || null,
        date: new Date(date),
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
        reason: reason || null,
        isAllDay: isAllDay || false,
      },
      include: {
        staff: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error("Error creating blocked time:", error);
    return NextResponse.json(
      { error: "Error al crear bloqueo" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar bloqueos por groupId
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "Se requiere groupId" },
        { status: 400 }
      );
    }

    // Eliminar todos los bloqueos del grupo
    const result = await prisma.blockedTime.deleteMany({
      where: {
        businessId: business.id,
        groupId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error("Error deleting blocked times:", error);
    return NextResponse.json(
      { error: "Error al eliminar bloqueos" },
      { status: 500 }
    );
  }
}
