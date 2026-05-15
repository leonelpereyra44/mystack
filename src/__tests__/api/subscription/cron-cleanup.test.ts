import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});
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

import prisma from "@/lib/prisma";
import { cancelSubscription } from "@/lib/mercadopago";

import { GET } from "@/app/api/cron/cleanup-pending/route";

const mockPrisma = vi.mocked(prisma);
const mockCancelSubscription = vi.mocked(cancelSubscription);

function makeRequest(authHeader?: string) {
  return new Request("http://localhost/api/cron/cleanup-pending", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

const STALE_SUBS = [
  { id: "sub-1", businessId: "biz-1", mpSubscriptionId: "mp_sub_A" },
  { id: "sub-2", businessId: "biz-2", mpSubscriptionId: "mp_sub_B" },
  { id: "sub-3", businessId: "biz-3", mpSubscriptionId: null }, // sin ID de MP
];

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NODE_ENV = "test";
  (mockPrisma.appointment.deleteMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });
  (mockPrisma.subscription.findMany as never as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });
  mockCancelSubscription.mockResolvedValue({ success: true });
});

describe("GET /api/cron/cleanup-pending", () => {
  it("devuelve 401 en producción si el auth header es incorrecto", async () => {
    process.env.NODE_ENV = "production";
    const res = await GET(makeRequest("Bearer WRONG_SECRET"));
    expect(res.status).toBe(401);
  });

  it("pasa sin auth header en entorno de test (no producción)", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it("elimina appointments expirados y devuelve el count", async () => {
    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(mockPrisma.appointment.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING" }),
      })
    );
    expect(body.deletedAppointments).toBe(5);
  });

  it("sin TRIALING stale: no llama a cancelSubscription y count es 0", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(mockCancelSubscription).not.toHaveBeenCalled();
    expect(body.resetTrialingSubscriptions).toBe(0);
    expect(body.mpCancelledCount).toBe(0);
  });

  it("cancela en MP cada sub TRIALING que tiene mpSubscriptionId", async () => {
    (mockPrisma.subscription.findMany as never as ReturnType<typeof vi.fn>).mockResolvedValue(STALE_SUBS);
    (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

    await GET(makeRequest());

    // Llama a cancelSubscription para las que tienen mpSubscriptionId (2 de 3)
    expect(mockCancelSubscription).toHaveBeenCalledTimes(2);
    expect(mockCancelSubscription).toHaveBeenCalledWith("mp_sub_A");
    expect(mockCancelSubscription).toHaveBeenCalledWith("mp_sub_B");
    // NO llama para la que tiene mpSubscriptionId null
  });

  it("si cancelSubscription falla en MP: continúa y resetea DB igual", async () => {
    (mockPrisma.subscription.findMany as never as ReturnType<typeof vi.fn>).mockResolvedValue([
      STALE_SUBS[0],
    ]);
    (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
    mockCancelSubscription.mockResolvedValue({ success: false, error: "MP timeout" });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.resetTrialingSubscriptions).toBe(1);
    expect(body.mpCancelFailedCount).toBe(1);
    // La DB se actualizó de todas formas
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalled();
  });

  it("el updateMany setea cancelledAt junto con status CANCELLED y plan FREE", async () => {
    (mockPrisma.subscription.findMany as never as ReturnType<typeof vi.fn>).mockResolvedValue([STALE_SUBS[0]]);
    (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    await GET(makeRequest());

    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED",
          plan: "FREE",
          cancelledAt: expect.any(Date),
        }),
      })
    );
  });

  it("devuelve counts correctos: mpCancelledCount y mpCancelFailedCount", async () => {
    const subsWithIds = [STALE_SUBS[0], STALE_SUBS[1]];
    (mockPrisma.subscription.findMany as never as ReturnType<typeof vi.fn>).mockResolvedValue(subsWithIds);
    (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });
    // Primera cancelación ok, segunda falla
    mockCancelSubscription
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "error" });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.mpCancelledCount).toBe(1);
    expect(body.mpCancelFailedCount).toBe(1);
  });
});
