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
  (mockPrisma.subscription.findFirst as never as ReturnType<typeof vi.fn>).mockResolvedValue(null);
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

  it("status 'cancelled' → upsert con status CANCELLED y plan FREE", async () => {
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

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "CANCELLED", plan: "FREE" }),
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

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "business-1" },
        data: expect.objectContaining({
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

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-new" },
        data: expect.objectContaining({ plan: "PRO", status: "ACTIVE" }),
      })
    );
    // No consultó la DB para el plan
    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
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
});
