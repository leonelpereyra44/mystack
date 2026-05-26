import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";
import crypto from "crypto";
import {
  sendSubscriptionActivated,
  sendSubscriptionPaymentFailed,
} from "@/lib/email";

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

    // Verificar la firma (siempre en producción — rechazar si falta el secret)
    if (process.env.NODE_ENV === "production") {
      if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
        console.error("CRITICAL: MERCADOPAGO_WEBHOOK_SECRET not set in production. Rejecting webhook.");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
      }
      const isValid = verifyWebhookSignature(
        xSignature,
        xRequestId,
        body.data?.id || "",
        process.env.MERCADOPAGO_WEBHOOK_SECRET
      );
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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
      const externalReference = preapproval.external_reference as string | undefined;

      // externalReference tiene formato "businessId:planKey" (nuevo) o solo "businessId" (legacy)
      let businessId: string;
      let planKeyFromRef: string | null = null;
      if (externalReference?.includes(":")) {
        [businessId, planKeyFromRef] = externalReference.split(":", 2);
      } else {
        businessId = externalReference ?? "";
      }

      console.log("Preapproval status:", preapproval.status, "for business:", businessId, "plan:", planKeyFromRef);

      if (!businessId) {
        console.error("No external_reference (businessId) in preapproval");
        return NextResponse.json({ received: true });
      }

      // Mapear estados de MP a nuestros estados
      let subscriptionStatus: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" | "PAUSED" = "TRIALING";

      // Obtener el plan: primero del externalReference, luego de la DB como fallback
      let actualPlan: string;
      if (planKeyFromRef) {
        actualPlan = planKeyFromRef;
      } else {
        const existingSubscription = await prisma.subscription.findFirst({
          where: { businessId },
          select: { plan: true },
        });
        actualPlan = existingSubscription?.plan ?? "PRO";
      }

      switch (preapproval.status) {
        case "authorized":
          subscriptionStatus = "ACTIVE";
          break;
        case "pending":
          subscriptionStatus = "TRIALING";
          break;
        case "paused":
          subscriptionStatus = "PAUSED";
          break;
        case "cancelled":
          subscriptionStatus = "CANCELLED";
          break;
        default:
          subscriptionStatus = "TRIALING";
      }

      // Actualizar la suscripción en la base de datos
      // Si se cancela: mantener el plan hasta que currentPeriodEnd caduque (plan-limits lo evalúa).
      // Si NO hay currentPeriodEnd, bajar a FREE de inmediato.
      const planToSet = subscriptionStatus === "CANCELLED"
        ? (actualPlan as SubscriptionPlan) // plan-limits degradará cuando venza
        : (actualPlan as SubscriptionPlan);
      const pausedAt = subscriptionStatus === "PAUSED" ? new Date() : null;

      await prisma.subscription.upsert({
        where: { businessId },
        create: {
          businessId,
          plan: planToSet,
          status: subscriptionStatus,
          mpSubscriptionId: preapprovalId,
          mpCustomerId: preapproval.payer_id?.toString(),
          currentPeriodStart: preapproval.date_created ? new Date(preapproval.date_created) : null,
          currentPeriodEnd: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null,
        },
        update: {
          plan: planToSet,
          status: subscriptionStatus,
          mpCustomerId: preapproval.payer_id?.toString(),
          currentPeriodStart: preapproval.date_created ? new Date(preapproval.date_created) : undefined,
          currentPeriodEnd: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : undefined,
          cancelledAt: subscriptionStatus === "CANCELLED" ? new Date() : null,
          pausedAt,
        },
      });

      console.log(`Subscription updated: business=${businessId}, plan=${actualPlan}, status=${subscriptionStatus}`);
    }

    // Manejar pagos de suscripción
    // MP envía type="payment" y action="created" (no "payment.created")
    if (type === "payment" && action === "created") {
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
          // external_reference tiene formato "businessId:planKey" (nuevo) o solo "businessId" (legacy)
          let businessId: string;
          let planKeyFromRef: string | null = null;
          const ref = payment.external_reference as string;
          if (ref.includes(":")) {
            [businessId, planKeyFromRef] = ref.split(":", 2);
          } else {
            businessId = ref;
          }

          // Un solo fetch: plan fallback + idempotencia
          const existingSub = await prisma.subscription.findFirst({
            where: { businessId },
            select: { lastPaymentId: true, plan: true },
          });

          // Idempotencia: si este paymentId ya fue procesado, ignorar el webhook duplicado
          if (existingSub?.lastPaymentId === paymentId.toString()) {
            console.log(`Payment ${paymentId} already processed for business ${businessId}, skipping duplicate webhook`);
          } else {
            const planToActivate = planKeyFromRef ?? existingSub?.plan ?? "PRO";

            await prisma.subscription.upsert({
              where: { businessId },
              create: {
                businessId,
                plan: planToActivate as SubscriptionPlan,
                status: "ACTIVE",
                lastPaymentId: paymentId.toString(),
                currentPeriodEnd: payment.date_last_updated
                  ? new Date(new Date(payment.date_last_updated).getTime() + 30 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              update: {
                plan: planToActivate as SubscriptionPlan,
                status: "ACTIVE",
                lastPaymentId: paymentId.toString(),
                // Usar next_payment_date de MP si está disponible; fallback a +30 días
                currentPeriodEnd: payment.date_last_updated
                  ? new Date(new Date(payment.date_last_updated).getTime() + 30 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });

            console.log(`Payment processed: business=${businessId}, plan=${planToActivate}, paymentId=${paymentId}`);

            // Email de confirmación al dueño del negocio
            try {
              const business = await prisma.business.findUnique({
                where: { id: businessId },
                select: {
                  owner: { select: { email: true, name: true } },
                  subscription: { select: { currentPeriodEnd: true } },
                },
              });
              const planConfig = await prisma.planConfig.findFirst({
                where: { plan: planToActivate as SubscriptionPlan },
                select: { name: true },
              });
              if (business?.owner.email) {
                const nextDate = business.subscription?.currentPeriodEnd
                  ? new Date(business.subscription.currentPeriodEnd).toLocaleDateString("es-AR")
                  : "—";
                await sendSubscriptionActivated({
                  email: business.owner.email,
                  name: business.owner.name ?? "usuario",
                  planName: planConfig?.name ?? planToActivate,
                  nextBillingDate: nextDate,
                });
              }
            } catch (emailErr) {
              console.error("Error sending subscription activated email:", emailErr);
            }
          }
        }

        // Pago rechazado → marcar como PAST_DUE
        if (payment.status === "rejected" && payment.external_reference) {
          let businessId: string;
          const ref = payment.external_reference as string;
          if (ref.includes(":")) {
            [businessId] = ref.split(":", 2);
          } else {
            businessId = ref;
          }

          await prisma.subscription.updateMany({
            where: { businessId, status: { in: ["ACTIVE", "PAUSED"] } },
            data: { status: "PAST_DUE" },
          });

          console.log(`Payment rejected: business=${businessId}, paymentId=${paymentId}`);
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
