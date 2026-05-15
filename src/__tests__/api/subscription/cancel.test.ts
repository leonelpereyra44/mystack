import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mercadopago", () => ({
  cancelSubscription: vi.fn(),
  createSubscription: vi.fn(),
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
import { cancelSubscription } from "@/lib/mercadopago";

import { POST } from "@/app/api/subscription/cancel/route";

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);
const mockCancelSubscription = vi.mocked(cancelSubscription);

const ACTIVE_SUBSCRIPTION = {
  id: "sub-1",
  businessId: "business-1",
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  mpSubscriptionId: "mp_sub_123",
  cancelledAt: null,
  refundedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ACTIVE_BUSINESS = {
  id: "business-1",
  subscription: ACTIVE_SUBSCRIPTION,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "owner@test.com" } } as never);
  (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(ACTIVE_BUSINESS);
  (mockPrisma.subscription.update as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  mockCancelSubscription.mockResolvedValue({ success: true });
});

describe("POST /api/subscription/cancel", () => {
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

  it("devuelve 400 si no hay suscripción activa (mpSubscriptionId null)", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: { ...ACTIVE_SUBSCRIPTION, mpSubscriptionId: null },
    });
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cancelar/i);
  });

  it("devuelve 400 si no hay suscripción en absoluto", async () => {
    (mockPrisma.business.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...ACTIVE_BUSINESS,
      subscription: null,
    });
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("flujo exitoso: cancela en MP y actualiza DB a CANCELLED/FREE", async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockCancelSubscription).toHaveBeenCalledWith("mp_sub_123");

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "business-1" },
        data: expect.objectContaining({
          status: "CANCELLED",
          plan: "FREE",
          cancelledAt: expect.any(Date),
          mpSubscriptionId: null,
        }),
      })
    );
  });

  it("devuelve 500 si cancelSubscription falla en MP y NO actualiza DB", async () => {
    mockCancelSubscription.mockResolvedValue({ success: false, error: "MP error" });
    const res = await POST();
    expect(res.status).toBe(500);
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });
});
