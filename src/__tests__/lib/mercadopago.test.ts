import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks del SDK de MercadoPago ────────────────────────────────────────────
// vi.mock() is hoisted above const declarations, so we must also hoist the
// mock functions with vi.hoisted() to avoid temporal dead zone errors.
const { mockPreApprovalCreate, mockPreApprovalUpdate, mockPreApprovalGet, mockPaymentRefundCreate } =
  vi.hoisted(() => ({
    mockPreApprovalCreate: vi.fn(),
    mockPreApprovalUpdate: vi.fn(),
    mockPreApprovalGet: vi.fn(),
    mockPaymentRefundCreate: vi.fn(),
  }));

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(function () {}),
  PreApproval: vi.fn(function () {
    return {
      create: mockPreApprovalCreate,
      update: mockPreApprovalUpdate,
      get: mockPreApprovalGet,
    };
  }),
  PreApprovalPlan: vi.fn(function () { return {}; }),
  Payment: vi.fn(function () { return {}; }),
  PaymentRefund: vi.fn(function () {
    return { create: mockPaymentRefundCreate };
  }),
}));

import {
  isEligibleForRefund,
  getDaysLeftForRefund,
  createSubscription,
  cancelSubscription,
  refundPayment,
  REFUND_PERIOD_DAYS,
} from "@/lib/mercadopago";

// ─────────────────────────────────────────────────────────────────────────────

describe("isEligibleForRefund", () => {
  it("devuelve true si la fecha es 5 días atrás (dentro del período)", () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(isEligibleForRefund(date)).toBe(true);
  });

  it("devuelve true si la fecha es hoy (día 0)", () => {
    expect(isEligibleForRefund(new Date())).toBe(true);
  });

  it("devuelve true en el límite exacto (día 10)", () => {
    const date = new Date(Date.now() - REFUND_PERIOD_DAYS * 24 * 60 * 60 * 1000 + 60_000);
    expect(isEligibleForRefund(date)).toBe(true);
  });

  it("devuelve false si la fecha es 11 días atrás (fuera del período)", () => {
    const date = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
    expect(isEligibleForRefund(date)).toBe(false);
  });

  it("devuelve false si currentPeriodStart es null", () => {
    expect(isEligibleForRefund(null)).toBe(false);
  });

  it("devuelve false si currentPeriodStart es undefined", () => {
    expect(isEligibleForRefund(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("getDaysLeftForRefund", () => {
  it("devuelve ~2 días si se usaron 8 días del período", () => {
    const date = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const days = getDaysLeftForRefund(date);
    expect(days).toBeGreaterThanOrEqual(1);
    expect(days).toBeLessThanOrEqual(3);
  });

  it("devuelve 0 si el período expiró (11 días atrás)", () => {
    const date = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
    expect(getDaysLeftForRefund(date)).toBe(0);
  });

  it("devuelve 0 si currentPeriodStart es null", () => {
    expect(getDaysLeftForRefund(null)).toBe(0);
  });

  it("devuelve 0 si currentPeriodStart es undefined", () => {
    expect(getDaysLeftForRefund(undefined)).toBe(0);
  });

  it("devuelve ~10 si la suscripción es nueva (fecha de hoy)", () => {
    const days = getDaysLeftForRefund(new Date());
    expect(days).toBe(REFUND_PERIOD_DAYS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("createSubscription", () => {
  beforeEach(() => {
    mockPreApprovalCreate.mockReset();
  });

  it("devuelve { success: true, subscriptionId, initPoint } en éxito", async () => {
    mockPreApprovalCreate.mockResolvedValue({
      id: "sub_abc123",
      init_point: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=sub_abc123",
    });

    const result = await createSubscription({
      payerEmail: "user@example.com",
      externalReference: "business-1:PRO",
      price: 15000,
      reason: "MyStack Profesional",
    });

    expect(result.success).toBe(true);
    expect(result.subscriptionId).toBe("sub_abc123");
    expect(result.initPoint).toContain("sub_abc123");
    expect(mockPreApprovalCreate).toHaveBeenCalledOnce();

    // Verificar que el body enviado a MP es correcto
    const callBody = mockPreApprovalCreate.mock.calls[0][0].body;
    expect(callBody.payer_email).toBe("user@example.com");
    expect(callBody.external_reference).toBe("business-1:PRO");
    expect(callBody.auto_recurring.transaction_amount).toBe(15000);
    expect(callBody.auto_recurring.frequency_type).toBe("months");
    expect(callBody.auto_recurring.currency_id).toBe("ARS");
  });

  it("devuelve { success: false, error } si el SDK lanza un error", async () => {
    mockPreApprovalCreate.mockRejectedValue(new Error("MP API Error"));

    const result = await createSubscription({
      payerEmail: "user@example.com",
      externalReference: "business-1:PRO",
      price: 15000,
      reason: "MyStack Profesional",
    });

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toBe("MP API Error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("cancelSubscription", () => {
  beforeEach(() => {
    mockPreApprovalUpdate.mockReset();
  });

  it("devuelve { success: true } y envía status: cancelled al SDK", async () => {
    mockPreApprovalUpdate.mockResolvedValue({});

    const result = await cancelSubscription("sub_abc123");

    expect(result.success).toBe(true);
    expect(mockPreApprovalUpdate).toHaveBeenCalledWith({
      id: "sub_abc123",
      body: { status: "cancelled" },
    });
  });

  it("devuelve { success: false, error } si el SDK lanza un error", async () => {
    mockPreApprovalUpdate.mockRejectedValue(new Error("Unauthorized"));

    const result = await cancelSubscription("sub_abc123");

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toBe("Unauthorized");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("refundPayment", () => {
  beforeEach(() => {
    mockPaymentRefundCreate.mockReset();
  });

  it("devuelve { success: true, refundId, amount } en éxito", async () => {
    mockPaymentRefundCreate.mockResolvedValue({
      id: "refund_xyz",
      status: "approved",
      amount: 15000,
    });

    const result = await refundPayment("pay_123");

    expect(result.success).toBe(true);
    expect(result.refundId).toBe("refund_xyz");
    expect(result.amount).toBe(15000);
    expect(mockPaymentRefundCreate).toHaveBeenCalledWith({
      payment_id: "pay_123",
      body: {},
    });
  });

  it("devuelve { success: false } si el SDK lanza un error", async () => {
    mockPaymentRefundCreate.mockRejectedValue(new Error("Payment not found"));

    const result = await refundPayment("pay_123");

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toBeDefined();
  });
});
