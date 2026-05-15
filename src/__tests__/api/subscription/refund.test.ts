import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mercadopago", () => ({
  refundPayment: vi.fn(),
  cancelSubscription: vi.fn(),
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
import {
  refundPayment,
  cancelSubscription,
  isEligibleForRefund,
  PLANS,
  REFUND_PERIOD_DAYS,
} from "@/lib/mercadopago";

import { POST, GET } from "@/app/api/subscription/refund/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRefundPayment = vi.mocked(refundPayment);
const mockCancelSubscription = vi.mocked(cancelSubscription);
const mockIsEligibleForRefund = vi.mocked(isEligibleForRefund);

function makeRequest() {
  return new NextRequest("http://localhost/api/subscription/refund", {
    method: "POST",
  });
}

const ACTIVE_SUBSCRIPTION = {
  id: "sub-1",
  businessId: "business-1",
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  lastPaymentId: "pay_abc",
  mpSubscriptionId: "mp_sub_123",
  currentPeriodStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
  currentPeriodEnd: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
  refundedAt: null,
  cancelledAt: null,
  mpCustomerId: "customer_1",
  mpPreapprovalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ACTIVE_BUSINESS = {
  id: "business-1",
  subscription: ACTIVE_SUBSCRIPTION,
};

beforeEach(() => {
  vi.resetAllMocks();
  // Defaults: sesión válida, business activo, elegible para refund
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "owner@test.com" } } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockPrisma.business.findFirst as any).mockResolvedValue(ACTIVE_BUSINESS);
  mockIsEligibleForRefund.mockReturnValue(true);
  mockRefundPayment.mockResolvedValue({ success: true, refundId: "refund_1", amount: 15000 });
  mockCancelSubscription.mockResolvedValue({ success: true });
  // Mock updateMany para el lock optimista
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockPrisma.subscription.updateMany as any).mockResolvedValue({ count: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockPrisma.subscription.update as any).mockResolvedValue({});
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/subscription/refund", () => {
  it("devuelve 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("devuelve 404 si no se encuentra el negocio", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("devuelve 400 si el plan no es PRO", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, plan: "FREE" },
    });
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/PRO activa/i);
  });

  it("devuelve 400 si el status no es ACTIVE", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, status: "CANCELLED" },
    });
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("devuelve 400 si ya fue reembolsado anteriormente", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, refundedAt: new Date() },
    });
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reembolso anteriormente/i);
  });

  it("devuelve 400 si está fuera del período de 10 días", async () => {
    mockIsEligibleForRefund.mockReturnValue(false);
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/arrepentimiento/i);
  });

  it("devuelve 400 si lastPaymentId es null", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, lastPaymentId: null },
    });
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/información del pago/i);
  });

  it("flujo exitoso: hace refund + cancel + actualiza DB", async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.refundId).toBe("refund_1");

    // Verificó el lock optimista antes de llamar a MP
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: "business-1", refundedAt: null }),
      })
    );

    // Llamó a refundPayment con el lastPaymentId
    expect(mockRefundPayment).toHaveBeenCalledWith("pay_abc");

    // Llamó a cancelSubscription con el mpSubscriptionId
    expect(mockCancelSubscription).toHaveBeenCalledWith("mp_sub_123");

    // Actualizó la DB a CANCELLED/FREE
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED", plan: "FREE" }),
      })
    );
  });

  it("devuelve 500 y revierte el lock si refundPayment falla en MP", async () => {
    mockRefundPayment.mockResolvedValue({ success: false, error: "Payment not found" });

    const res = await POST();
    expect(res.status).toBe(500);

    // Revirtió el lock (update con refundedAt: null)
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ refundedAt: null }),
      })
    );
    // NO llamó a cancelSubscription
    expect(mockCancelSubscription).not.toHaveBeenCalled();
  });

  it("idempotencia: el segundo request concurrente recibe 400", async () => {
    // El lock falla (ya fue marcado por el primer request)
    (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reembolso anteriormente/i);

    // No se llamó a MP
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });

  it("si cancelSubscription falla post-refund: conserva mpSubscriptionId en DB y responde 200", async () => {
    mockCancelSubscription.mockResolvedValue({ success: false, error: "MP cancel failed" });

    const res = await POST();
    expect(res.status).toBe(200);

    // El update final NO incluye mpSubscriptionId: null (para que admin pueda reintentarlo)
    const updateCall = vi.mocked(mockPrisma.subscription.update).mock.calls.find(
      ([args]) => args?.data?.status === "CANCELLED"
    );
    expect(updateCall).toBeDefined();
    expect(updateCall?.[0]?.data?.mpSubscriptionId).toBeUndefined();
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/subscription/refund", () => {
  it("devuelve 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("devuelve eligible: false si no hay suscripción", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "business-1", subscription: null }
    );
    const res = await GET();
    const body = await res.json();
    expect(body.eligible).toBe(false);
  });

  it("devuelve eligible: false si ya fue reembolsado", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, refundedAt: new Date() },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.eligible).toBe(false);
    expect(body.reason).toMatch(/reembolso/i);
  });

  it("devuelve eligible: true con daysLeft > 0 cuando está dentro del período", async () => {
    mockIsEligibleForRefund.mockReturnValue(true);
    const res = await GET();
    const body = await res.json();
    expect(body.eligible).toBe(true);
    expect(body.daysLeft).toBeGreaterThan(0);
  });

  it("devuelve eligible: false con daysLeft 0 cuando expiró el período", async () => {
    mockIsEligibleForRefund.mockReturnValue(false);
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: {
        ...ACTIVE_SUBSCRIPTION,
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.eligible).toBe(false);
    expect(body.daysLeft).toBe(0);
  });
});
