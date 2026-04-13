import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verificar la firma del webhook de Mercado Pago
function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId) return false;

  // Parsear x-signature header
  const parts = xSignature.split(",");
  const values: Record<string, string> = {};
  
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      values[key.trim()] = value.trim();
    }
  });

  const ts = values["ts"];
  const hash = values["v1"];

  if (!ts || !hash) return false;

  // Crear el manifest string
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Calcular HMAC
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Mercado Pago Webhook received:", JSON.stringify(body, null, 2));

    // Headers de verificación
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // Verificar la firma (solo en producción)
    if (process.env.NODE_ENV === "production" && process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        xSignature,
        xRequestId,
        body.data?.id || "",
        process.env.MERCADOPAGO_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const { type, data, action } = body;

    // Manejar eventos de suscripción (preapproval)
    if (type === "subscription_preapproval") {
      const preapprovalId = data.id;

      // Obtener detalles de la suscripción desde MP
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Error fetching preapproval from MP:", await mpResponse.text());
        return NextResponse.json({ received: true });
      }

      const preapproval = await mpResponse.json();
      const businessId = preapproval.external_reference;

      console.log("Preapproval status:", preapproval.status, "for business:", businessId);

      if (!businessId) {
        console.error("No external_reference (businessId) in preapproval");
        return NextResponse.json({ received: true });
      }

      // Mapear estados de MP a nuestros estados
      let subscriptionStatus: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" = "TRIALING";
      let plan: "FREE" | "PRO" = "FREE";

      switch (preapproval.status) {
        case "authorized":
          subscriptionStatus = "ACTIVE";
          plan = "PRO";
          break;
        case "pending":
          subscriptionStatus = "TRIALING";
          plan = "FREE";
          break;
        case "paused":
        case "cancelled":
          subscriptionStatus = "CANCELLED";
          plan = "FREE";
          break;
        default:
          subscriptionStatus = "TRIALING";
      }

      // Actualizar la suscripción en la base de datos
      await prisma.subscription.upsert({
        where: { businessId },
        create: {
          businessId,
          plan,
          status: subscriptionStatus,
          mpSubscriptionId: preapprovalId,
          mpCustomerId: preapproval.payer_id?.toString(),
          currentPeriodStart: preapproval.date_created ? new Date(preapproval.date_created) : null,
          currentPeriodEnd: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null,
        },
        update: {
          plan,
          status: subscriptionStatus,
          mpCustomerId: preapproval.payer_id?.toString(),
          currentPeriodStart: preapproval.date_created ? new Date(preapproval.date_created) : undefined,
          currentPeriodEnd: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : undefined,
          cancelledAt: subscriptionStatus === "CANCELLED" ? new Date() : null,
        },
      });

      console.log(`Subscription updated: business=${businessId}, plan=${plan}, status=${subscriptionStatus}`);
    }

    // Manejar pagos de suscripción
    if (type === "payment" && action === "payment.created") {
      const paymentId = data.id;

      // Obtener detalles del pago desde MP
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (mpResponse.ok) {
        const payment = await mpResponse.json();
        console.log("Payment received:", payment.status, "amount:", payment.transaction_amount);
        
        // Si el pago está aprobado y tiene external_reference
        if (payment.status === "approved" && payment.external_reference) {
          await prisma.subscription.update({
            where: { businessId: payment.external_reference },
            data: {
              plan: "PRO",
              status: "ACTIVE",
              lastPaymentId: paymentId.toString(), // Guardar para posibles reembolsos
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Siempre devolver 200 para que MP no reintente
    return NextResponse.json({ received: true });
  }
}

// Mercado Pago también puede enviar GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    message: "Mercado Pago webhook endpoint is active" 
  });
}
