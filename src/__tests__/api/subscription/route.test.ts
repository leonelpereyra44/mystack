import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mercadopago", () => ({
  createSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  refundPayment: vi.fn(),
  isEligibleForRefund: vi.fn(),
  getDaysLeftForRefund: vi.fn(),
  PLANS: {
    FREE: { name: "Gratuito", price: 0 },
    PRO: { name: "Profesional", price: 15000 },
  },
  REFUND_PERIOD_DAYS: 10,
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createSubscription } from "@/lib/mercadopago";

import { POST, GET } from "@/app/api/subscription/route";

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);
const mockCreateSubscription = vi.mocked(createSubscription);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const FREE_PLAN_CONFIG = {
  id: "plan-free",
  plan: "FREE" as const,
  name: "Gratuito",
  price: "0",
  maxReservationsPerMonth: 150,
  maxStaff: 1,
  features: ["1 profesional"],
  isActive: true,
  sortOrder: 0,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PRO_PLAN_CONFIG = {
  ...FREE_PLAN_CONFIG,
  id: "plan-pro",
  plan: "PRO" as const,
  name: "Profesional",
  price: "15000",
  maxReservationsPerMonth: null,
  maxStaff: null,
};

const ACTIVE_BUSINESS = {
  id: "business-1",
  ownerId: "user-1",
  subscription: {
    plan: "PRO" as const,
    status: "ACTIVE" as const,
    currentPeriodEnd: new Date(Date.now() + 27 * 86400000),
    currentPeriodStart: new Date(),
    mpSubscriptionId: "mp_sub_1",
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "owner@test.com" } } as never);
  (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(ACTIVE_BUSINESS);
  (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(PRO_PLAN_CONFIG);
  (mockPrisma.subscription.upsert as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (mockPrisma.appointment.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(10);
  (mockPrisma.staff.count as never as ReturnType<typeof vi.fn>).mockResolvedValue(2);
  mockCreateSubscription.mockResolvedValue({
    success: true,
    subscriptionId: "mp_sub_new",
    initPoint: "https://www.mercadopago.com.ar/checkout/abc",
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/subscription", () => {
  function makePostRequest(body: object) {
    return new Request("http://localhost/api/subscription", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  it("devuelve 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST(makePostRequest({ plan: "PRO" }));
    expect(res.status).toBe(401);
  });

  it("devuelve 400 si el plan es inválido", async () => {
    const res = await POST(makePostRequest({ plan: "ULTRA_MEGA_PLAN" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/inválido/i);
  });

  it("devuelve 400 si el plan es FREE (precio 0)", async () => {
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(FREE_PLAN_CONFIG);
    const res = await POST(makePostRequest({ plan: "FREE" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/gratuito/i);
  });

  it("devuelve 400 si PlanConfig no existe en DB", async () => {
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(makePostRequest({ plan: "PRO" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no encontrado/i);
  });

  it("devuelve 404 si no se encuentra el negocio", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(makePostRequest({ plan: "PRO" }));
    expect(res.status).toBe(404);
  });

  it("devuelve 400 si ya tiene suscripción ACTIVE al mismo plan", async () => {
    const res = await POST(makePostRequest({ plan: "PRO" })); // ACTIVE_BUSINESS ya tiene PRO ACTIVE
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/ya tienes/i);
  });

  it("flujo exitoso: crea PreApproval, upsert TRIALING, devuelve initPoint", async () => {
    // Negocio sin suscripción activa
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: null,
    });

    const res = await POST(makePostRequest({ plan: "PRO" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.initPoint).toContain("mercadopago");

    // Verificó que el externalReference tiene el formato "businessId:planKey"
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: "business-1:PRO" })
    );

    // Hizo upsert a TRIALING (no ACTIVE — espera al webhook)
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "TRIALING" }),
      })
    );
  });

  it("devuelve 500 si createSubscription falla", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: null,
    });
    mockCreateSubscription.mockResolvedValue({ success: false, error: "MP unavailable" });

    const res = await POST(makePostRequest({ plan: "PRO" }));
    expect(res.status).toBe(500);
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/subscription", () => {
  it("devuelve 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("devuelve 404 si no se encuentra el negocio", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("con suscripción ACTIVE devuelve el plan real y el usage", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.subscription.plan).toBe("PRO");
    expect(body.subscription.status).toBe("ACTIVE");
    expect(body.usage.reservationsThisMonth).toBe(10);
    expect(body.usage.staffCount).toBe(2);
  });

  it("con suscripción TRIALING devuelve plan FREE (no el plan TRIALING)", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_BUSINESS.subscription, status: "TRIALING" },
    });
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(FREE_PLAN_CONFIG);

    const res = await GET();
    const body = await res.json();

    expect(body.subscription.plan).toBe("FREE");
  });

  it("sin suscripción devuelve status null (no 'ACTIVE')", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: null,
    });
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(FREE_PLAN_CONFIG);

    const res = await GET();
    const body = await res.json();

    expect(body.subscription.status).toBeNull();
  });
});
