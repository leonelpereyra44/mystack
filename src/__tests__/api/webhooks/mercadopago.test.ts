import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { http, HttpResponse } from "msw";
import { mswServer } from "../../../../vitest.setup";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("@/test-utils/prisma-mock");
  return { prisma: prismaMock, default: prismaMock };
});
vi.mock("@/lib/email", () => ({
  sendSubscriptionActivated: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionPaymentFailed: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionCancelled: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/webhooks/mercadopago/route";

const mockPrisma = vi.mocked(prisma);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSignature(dataId: string, secret: string): { xSignature: string; xRequestId: string } {
  const ts = Date.now().toString();
  const xRequestId = "req-test-123";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return { xSignature: `ts=${ts},v1=${hash}`, xRequestId };
}

function makeWebhookRequest(body: object, headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  (mockPrisma.subscription.upsert as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (mockPrisma.subscription.update as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (mockPrisma.subscription.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
  (mockPrisma.subscription.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  // Mocks para los queries adicionales del handler de pago aprobado
  (mockPrisma.business.findUnique as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (mockPrisma.planConfig.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  // Mocks para PaymentEvent (tabla de auditoría)
  (mockPrisma.paymentEvent.create as never as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (mockPrisma.paymentEvent.updateMany as never as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });
});

// ─── Firma ────────────────────────────────────────────────────────────────────

describe("verificación de firma", () => {
  it("devuelve 401 en producción si la firma es inválida", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const req = makeWebhookRequest(
      { type: "subscription_preapproval", data: { id: "pa_123" }, action: "updated" },
      { "x-signature": "ts=1234,v1=invalidsignature", "x-request-id": "req-1" }
    );

    const res = await POST(req);
    expect(res.status).toBe(401);

    process.env.NODE_ENV = originalEnv;
  });

  it("acepta la request en producción si la firma es válida", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const dataId = "pa_valid_123";
    const { xSignature, xRequestId } = buildSignature(dataId, process.env.MERCADOPAGO_WEBHOOK_SECRET!);

    // MSW responde con el preapproval correcto
    mswServer.use(
      http.get(`https://api.mercadopago.com/preapproval/${dataId}`, () =>
        HttpResponse.json({
          id: dataId,
          status: "authorized",
          external_reference: "business-1:PRO",
          payer_id: 1,
          date_created: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      )
    );

    const req = makeWebhookRequest(
      { type: "subscription_preapproval", data: { id: dataId }, action: "updated" },
      { "x-signature": xSignature, "x-request-id": xRequestId }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    process.env.NODE_ENV = originalEnv;
  });

  it("no verifica la firma en entorno de test (NODE_ENV !== production)", async () => {
    const req = makeWebhookRequest(
      { type: "subscription_preapproval", data: { id: "pa_123" }, action: "updated" },
      { "x-signature": "invalid", "x-request-id": "req-1" }
    );
    const res = await POST(req);
    expect(res.status).toBe(200); // No rechaza por firma en test
  });
});

// ─── subscription_preapproval ─────────────────────────────────────────────────

describe("subscription_preapproval events", () => {
  it("status 'authorized' → upsert con status ACTIVE", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_authorized", () =>
        HttpResponse.json({
          id: "pa_authorized",
          status: "authorized",
          external_reference: "business-1:PRO",
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_authorized" },
      action: "updated",
    });
    await POST(req);

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "ACTIVE", plan: "PRO" }),
      })
    );
  });

  it("status 'pending' → upsert con status TRIALING", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_pending", () =>
        HttpResponse.json({
          id: "pa_pending",
          status: "pending",
          external_reference: "business-1:PRO",
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: null,
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_pending" },
      action: "created",
    });
    await POST(req);

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "TRIALING" }),
      })
    );
  });

  it("status 'cancelled' → upsert con status CANCELLED (sin bajar plan a FREE)", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_cancelled", () =>
        HttpResponse.json({
          id: "pa_cancelled",
          status: "cancelled",
          external_reference: "business-1:PRO",
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: null,
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_cancelled" },
      action: "updated",
    });
    await POST(req);

    // C5: el webhook NO baja el plan a FREE — solo marca CANCELLED.
    // plan-limits evalúa el acceso según currentPeriodEnd.
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "CANCELLED" }),
      })
    );
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.not.objectContaining({ plan: "FREE" }),
      })
    );
  });

  it("external_reference vacío → devuelve 200 sin tocar la DB", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_noref", () =>
        HttpResponse.json({
          id: "pa_noref",
          status: "authorized",
          external_reference: "",
          payer_id: 999,
          date_created: new Date().toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_noref" },
      action: "updated",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("formato legacy 'businessId' (sin :planKey) → consulta plan en DB como fallback", async () => {
    (mockPrisma.subscription.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      plan: "PRO",
    });

    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_legacy", () =>
        HttpResponse.json({
          id: "pa_legacy",
          status: "authorized",
          external_reference: "business-legacy", // formato viejo, sin ":"
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_legacy" },
      action: "updated",
    });
    await POST(req);

    // Consultó la DB para obtener el plan
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalled();
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "business-legacy" },
        update: expect.objectContaining({ plan: "PRO" }),
      })
    );
  });

  it("formato nuevo 'businessId:PRO' → usa plan del ref sin consultar DB", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_new_fmt", () =>
        HttpResponse.json({
          id: "pa_new_fmt",
          status: "authorized",
          external_reference: "biz-abc:PRO",
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_new_fmt" },
      action: "updated",
    });
    await POST(req);

    // NO consultó la DB para el plan (ya lo tiene del externalReference)
    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-abc" },
        update: expect.objectContaining({ plan: "PRO" }),
      })
    );
  });

  it("MP devuelve error 500 → responde 200 sin crash", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_error", () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_error" },
      action: "updated",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("status 'paused' → upsert con status PAUSED y plan SIN revertir a FREE", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/preapproval/pa_paused", () =>
        HttpResponse.json({
          id: "pa_paused",
          status: "paused",
          external_reference: "business-1:PRO",
          payer_id: 999,
          date_created: new Date().toISOString(),
          next_payment_date: null,
        })
      )
    );

    const req = makeWebhookRequest({
      type: "subscription_preapproval",
      data: { id: "pa_paused" },
      action: "updated",
    });
    await POST(req);

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: "PAUSED",
          plan: "PRO", // plan NO revierte a FREE (a diferencia de CANCELLED)
        }),
      })
    );
  });
});

// ─── payment events ───────────────────────────────────────────────────────────

describe("payment events (type=payment, action=created)", () => {
  it("pago aprobado → setea ACTIVE, lastPaymentId y currentPeriodEnd", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_ok", () =>
        HttpResponse.json({
          id: "pay_ok",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "business-1:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created", // ← el valor correcto (bug corregido)
      data: { id: "pay_ok" },
    });
    await POST(req);

    // C4: ahora usa upsert en lugar de update para evitar race condition
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "business-1" },
        update: expect.objectContaining({
          status: "ACTIVE",
          lastPaymentId: "pay_ok",
          currentPeriodEnd: expect.any(Date),
        }),
      })
    );
  });

  it("action='payment.created' (incorrecto) → NO actualiza la DB", async () => {
    const req = makeWebhookRequest({
      type: "payment",
      action: "payment.created", // ← el valor incorrecto previo al fix
      data: { id: "pay_old" },
    });
    await POST(req);

    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("pago con status 'pending' → NO actualiza la DB", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_pending", () =>
        HttpResponse.json({
          id: "pay_pending",
          status: "pending",
          transaction_amount: 15000,
          external_reference: "business-1:PRO",
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_pending" },
    });
    await POST(req);

    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("formato nuevo external_reference 'biz:PRO' → usa el plan correcto", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_newref", () =>
        HttpResponse.json({
          id: "pay_newref",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-new:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_newref" },
    });
    await POST(req);

    // C4: ahora usa upsert
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-new" },
        update: expect.objectContaining({ plan: "PRO", status: "ACTIVE" }),
      })
    );
    // findFirst se llama para idempotencia, pero el plan viene del external_reference (no de la DB)
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: "biz-new" } })
    );
  });

  it("tipo desconocido → devuelve 200 sin tocar la DB", async () => {
    const req = makeWebhookRequest({
      type: "unknown_event",
      action: "created",
      data: { id: "xyz" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("pago rechazado → updateMany con status PAST_DUE", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_rejected", () =>
        HttpResponse.json({
          id: "pay_rejected",
          status: "rejected",
          transaction_amount: 15000,
          external_reference: "business-1:PRO",
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_rejected" },
    });
    await POST(req);

    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: "business-1" }),
        data: expect.objectContaining({ status: "PAST_DUE" }),
      })
    );
    // NO activa la suscripción
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("pago rechazado sin external_reference → no toca la DB", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_rej_noref", () =>
        HttpResponse.json({
          id: "pay_rej_noref",
          status: "rejected",
          transaction_amount: 15000,
          external_reference: null,
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_rej_noref" },
    });
    await POST(req);

    expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  // ─── PaymentEvent: idempotencia real por (paymentId, action) ───────────────
  it("PaymentEvent.create marca el evento como recibido", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_audit", () =>
        HttpResponse.json({
          id: "pay_audit",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-audit:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_audit" },
    });
    await POST(req);

    expect(mockPrisma.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: "pay_audit",
          action: "created",
          status: "approved",
          amount: 15000,
          externalReference: "biz-audit:PRO",
        }),
      })
    );
  });

  it("PaymentEvent duplicado (unique violation P2002) → no re-procesa", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_dup", () =>
        HttpResponse.json({
          id: "pay_dup",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-dup:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );
    (mockPrisma.paymentEvent.create as never as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: "P2002",
    });

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_dup" },
    });
    await POST(req);

    // PaymentEvent.create falla por unique → ignoredReason="duplicate"
    expect(mockPrisma.paymentEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { paymentId: "pay_dup", action: "created" },
        data: { ignoredReason: "duplicate" },
      })
    );
    // No reactiva la suscripción
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });

  // ─── cancel_protected: NO reviva la suscripción cancelada ──────────────────
  it("pago aprobado para suscripción CANCELLED → marca ignoredReason='cancel_protected' y NO hace upsert", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_cancelled", () =>
        HttpResponse.json({
          id: "pay_cancelled",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-c:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );
    (mockPrisma.subscription.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue({
      lastPaymentId: null,
      plan: "PRO",
      status: "CANCELLED",
      cancelledAt: new Date(),
      mpSubscriptionId: "pa_old",
      currentPeriodEnd: null,
    });

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_cancelled" },
    });
    await POST(req);

    // NO revive la suscripción
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    // Marca lastPaymentId en la suscripción cancelada para no retratar
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-c" },
        data: { lastPaymentId: "pay_cancelled" },
      })
    );
    // PaymentEvent queda marcado como cancel_protected
    expect(mockPrisma.paymentEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { ignoredReason: "cancel_protected" },
      })
    );
  });

  // ─── next_payment_date del preapproval se usa para currentPeriodEnd ────────
  it("pago aprobado usa next_payment_date del preapproval (no +30d fallback)", async () => {
    const expectedDate = new Date(Date.now() + 27 * 86400000); // 27 días, distinto de +30
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_np", () =>
        HttpResponse.json({
          id: "pay_np",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-np:PRO",
          date_last_updated: new Date().toISOString(),
          order: { id: "pa_np_123" },
        })
      ),
      http.get("https://api.mercadopago.com/preapproval/pa_np_123", () =>
        HttpResponse.json({
          id: "pa_np_123",
          next_payment_date: expectedDate.toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_np" },
    });
    await POST(req);

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-np" },
        update: expect.objectContaining({
          currentPeriodEnd: expectedDate,
          mpSubscriptionId: "pa_np_123",
        }),
        create: expect.objectContaining({
          mpSubscriptionId: "pa_np_123",
          currentPeriodEnd: expectedDate,
        }),
      })
    );
  });

  it("pago aprobado sin order.id ni mpSubscriptionId → fallback +30d", async () => {
    mswServer.use(
      http.get("https://api.mercadopago.com/v1/payments/pay_nofk", () =>
        HttpResponse.json({
          id: "pay_nofk",
          status: "approved",
          transaction_amount: 15000,
          external_reference: "biz-nofk:PRO",
          date_last_updated: new Date().toISOString(),
        })
      )
    );

    const req = makeWebhookRequest({
      type: "payment",
      action: "created",
      data: { id: "pay_nofk" },
    });
    await POST(req);

    const call = (mockPrisma.subscription.upsert as never as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      update: { currentPeriodEnd: Date };
    };
    const expectedEnd = new Date(Date.now() + 30 * 86400000);
    // permitir margen de 5 segundos
    expect(call.update.currentPeriodEnd.getTime()).toBeGreaterThan(expectedEnd.getTime() - 5000);
    expect(call.update.currentPeriodEnd.getTime()).toBeLessThan(expectedEnd.getTime() + 5000);
  });
});
