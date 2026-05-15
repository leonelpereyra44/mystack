import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Variables de entorno para tests
process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST_ACCESS_TOKEN";
process.env.MERCADOPAGO_WEBHOOK_SECRET = "TEST_WEBHOOK_SECRET";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.CRON_SECRET = "TEST_CRON_SECRET";

// MSW server para interceptar fetch() al API de MercadoPago
export const mswServer = setupServer(
  // Handler por defecto: preapproval
  http.get("https://api.mercadopago.com/preapproval/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "authorized",
      external_reference: "business-123:PRO",
      payer_id: 99999,
      date_created: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }),
  // Handler por defecto: payment
  http.get("https://api.mercadopago.com/v1/payments/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "approved",
      transaction_amount: 15000,
      external_reference: "business-123:PRO",
      date_last_updated: new Date().toISOString(),
    });
  })
);

beforeAll(() => mswServer.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
