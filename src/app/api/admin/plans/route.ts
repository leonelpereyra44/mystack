import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_PLANS = [
  {
    plan: "FREE" as const,
    name: "Gratuito",
    description: "Perfecto para empezar. Sin costo.",
    price: 0,
    maxReservationsPerMonth: 150,
    maxStaff: 1,
    features: [
      "150 reservas por mes",
      "1 miembro del staff",
      "Página de reservas propia",
      "Notificaciones por email",
      "Soporte básico",
    ],
    isActive: true,
    sortOrder: 0,
  },
  {
    plan: "PRO" as const,
    name: "Profesional",
    description: "Para negocios en crecimiento. Todo incluido.",
    price: 15000,
    maxReservationsPerMonth: null,
    maxStaff: null,
    features: [
      "Reservas ilimitadas",
      "Staff ilimitado",
      "Página de reservas propia",
      "Notificaciones por email y SMS",
      "Analytics avanzados",
      "Soporte prioritario",
      "Sin publicidad",
    ],
    isActive: true,
    sortOrder: 1,
  },
];

async function ensureDefaultPlans() {
  const count = await prisma.planConfig.count();
  if (count === 0) {
    await prisma.planConfig.createMany({ data: DEFAULT_PLANS });
  }
}

const VALID_PLANS = ["FREE", "BASIC", "PRO", "PREMIUM", "ENTERPRISE"] as const;
type ValidPlan = typeof VALID_PLANS[number];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await ensureDefaultPlans();

    const plans = await prisma.planConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { plan, name, description, price, maxReservationsPerMonth, maxStaff, features, isActive } = body;

    if (!plan || !name || price === undefined) {
      return NextResponse.json({ error: "Plan, nombre y precio son requeridos" }, { status: 400 });
    }

    if (!VALID_PLANS.includes(plan as ValidPlan)) {
      return NextResponse.json({ error: "Tipo de plan inválido" }, { status: 400 });
    }

    const existing = await prisma.planConfig.findUnique({ where: { plan } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una configuración para ese plan" }, { status: 409 });
    }

    const maxSortOrder = await prisma.planConfig.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;

    const created = await prisma.planConfig.create({
      data: {
        plan: plan as ValidPlan,
        name,
        description: description || null,
        price,
        maxReservationsPerMonth: maxReservationsPerMonth ?? null,
        maxStaff: maxStaff ?? null,
        features: features || [],
        isActive: isActive ?? true,
        sortOrder,
      },
    });

    return NextResponse.json({ plan: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}
