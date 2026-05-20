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
  PLANS: {
    FREE: { name: "Gratuito", price: 0 },
    PRO: { name: "Profesional", price: 15000 },
  },
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createSubscription, cancelSubscription } from "@/lib/mercadopago";
import { POST } from "@/app/api/subscription/change-plan/route";

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);
const mockCreateSubscription = vi.mocked(createSubscription);
const mockCancelSubscription = vi.mocked(cancelSubscription);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const ACTIVE_SUBSCRIPTION = {
  id: "sub-1",
  businessId: "business-1",
  plan: "BASIC" as const,
  status: "ACTIVE" as const,
  mpSubscriptionId: "mp_sub_old",
  cancelledAt: null,
  pausedAt: null,
  refundedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ACTIVE_BUSINESS = {
  id: "business-1",
  subscription: ACTIVE_SUBSCRIPTION,
};

const PRO_PLAN_CONFIG = {
  id: "plan-pro",
  plan: "PRO",
  name: "Profesional",
  price: "15000",
  isActive: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "owner@test.com" } } as never);
  (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(ACTIVE_BUSINESS);
  (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(PRO_PLAN_CONFIG);
  (mockPrisma.subscription.upsert as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  mockCancelSubscription.mockResolvedValue({ success: true });
  mockCreateSubscription.mockResolvedValue({
    success: true,
    subscriptionId: "mp_sub_new",
    initPoint: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=mp_sub_new",
  });
});

describe("POST /api/subscription/change-plan", () => {
  // ─── Auth & validaciones ───────────────────────────────────────────────────

  it("devuelve 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));
    expect(res.status).toBe(401);
  });

  it("devuelve 404 si no se encuentra el negocio", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));
    expect(res.status).toBe(404);
  });

  it("devuelve 400 si el plan es inválido", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "INVALID_PLAN" }) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/inválido/i);
  });

  it("devuelve 400 si el planConfig no está en la DB o no está activo", async () => {
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no encontrado/i);
  });

  it("devuelve 400 si intenta cambiar a un plan de precio 0 (FREE)", async () => {
    (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...PRO_PLAN_CONFIG,
      plan: "FREE",
      price: "0",
    });
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "FREE" }) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cancelar/i);
  });

  it("devuelve 400 si ya está en ese plan con status ACTIVE", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, plan: "PRO" },
    });
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/ya estás/i);
  });

  // ─── Flujo exitoso ─────────────────────────────────────────────────────────

  it("flujo completo: cancela suscripción anterior en MP y crea la nueva", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.initPoint).toBe(
      "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=mp_sub_new"
    );

    // 1. Canceló la suscripción anterior en MP
    expect(mockCancelSubscription).toHaveBeenCalledWith("mp_sub_old");

    // 2. Creó nueva suscripción con el plan correcto
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: "business-1:PRO",
        price: 15000,
      })
    );

    // 3. Actualizó la DB a TRIALING con el nuevo mpSubscriptionId
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "business-1" },
        update: expect.objectContaining({
          plan: "PRO",
          status: "TRIALING",
          mpSubscriptionId: "mp_sub_new",
          pausedAt: null,
          cancelledAt: null,
        }),
      })
    );
  });

  it("si no hay suscripción previa: NO llama a cancelSubscription", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: null,
    });

    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));

    expect(res.status).toBe(200);
    expect(mockCancelSubscription).not.toHaveBeenCalled();
    expect(mockCreateSubscription).toHaveBeenCalled();
  });

  it("si cancelSubscription falla: devuelve 500 y NO crea nueva suscripción", async () => {
    mockCancelSubscription.mockResolvedValue({ success: false, error: "MP timeout" });

    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));

    expect(res.status).toBe(500);
    expect(mockCreateSubscription).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("si createSubscription falla: devuelve 500 y NO actualiza la DB", async () => {
    mockCreateSubscription.mockResolvedValue({ success: false, error: "MP error" });

    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));

    expect(res.status).toBe(500);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("permite cambiar plan desde PAST_DUE (no solo desde ACTIVE)", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, status: "PAST_DUE" },
    });

    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ plan: "PRO" }) }));

    expect(res.status).toBe(200);
    expect(mockCancelSubscription).toHaveBeenCalled();
    expect(mockCreateSubscription).toHaveBeenCalled();
  });
});
