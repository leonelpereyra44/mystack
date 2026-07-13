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

      // Verificar estado actual antes de sobrescribir.
      // Si la suscripción local está CANCELLED y el evento entrante es "authorized"
      // (no "cancelled"), viene de un preapproval huérfano: NO reactivar.
      const currentSub = await prisma.subscription.findUnique({
        where: { businessId },
        select: { status: true, cancelledAt: true, mpSubscriptionId: true },
      });

      if (
        currentSub?.status === "CANCELLED" &&
        subscriptionStatus !== "CANCELLED"
      ) {
        console.warn(
          `[AUDIT] Preapproval ${preapprovalId} event ${preapproval.status} for CANCELLED business ${businessId}. ` +
          `localMpSubscriptionId=${currentSub.mpSubscriptionId ?? "none"}. NOT reactivating.`
        );
      } else {
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
    }

    // Manejar pagos de suscripción
    // MP envía type="payment" y action="created" o "updated"
    if (type === "payment" && (action === "created" || action === "updated")) {
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

        // external_reference (formato "businessId:planKey" o "businessId" legacy)
        const ref = (payment.external_reference as string) ?? "";
        let businessId: string;
        let planKeyFromRef: string | null = null;
        if (ref.includes(":")) {
          [businessId, planKeyFromRef] = ref.split(":", 2);
        } else {
          businessId = ref;
        }

        // IDEMPOTENCIA REAL: insertar PaymentEvent con unique[paymentId, action].
        // Si viola unique → duplicado, ignoramos el webhook.
        let alreadyProcessed = false;
        let ignoredReason: string | null = null;
        try {
          await prisma.paymentEvent.create({
            data: {
              businessId: businessId || "unknown",
              preapprovalId: payment.order?.id?.toString() ?? null,
              paymentId: paymentId.toString(),
              action: action ?? "unknown",
              status: payment.status ?? "unknown",
              amount: payment.transaction_amount ? Number(payment.transaction_amount) : null,
              currency: payment.currency_id ?? null,
              externalReference: ref || null,
              rawPayload: payment as object,
            },
          });
        } catch (e) {
          if ((e as { code?: string }).code === "P2002") {
            alreadyProcessed = true;
            ignoredReason = "duplicate";
          } else {
            console.error("Error creating PaymentEvent:", e);
          }
        }

        if (alreadyProcessed) {
          console.log(`Payment ${paymentId}/${action} already processed, skipping`);
        }
        // Si el pago está aprobado y tiene external_reference
        else if (payment.status === "approved" && payment.external_reference) {
          // Un solo fetch: plan fallback + verificación de cancelación
          const existingSub = await prisma.subscription.findFirst({
            where: { businessId },
            select: {
              lastPaymentId: true,
              plan: true,
              status: true,
              cancelledAt: true,
              mpSubscriptionId: true,
              currentPeriodEnd: true,
            },
          });

          if (existingSub?.status === "CANCELLED") {
            // CRÍTICO: no revivir una suscripción cancelada.
            // El pago proviene de un preapproval huérfano en MP o MP no procesó la cancelación.
            ignoredReason = "cancel_protected";
            console.warn(
              `[AUDIT] Payment ${paymentId} received for CANCELLED subscription business=${businessId}. ` +
              `possible orphan preapproval or MP didn't honour cancellation. ` +
              `localMpSubscriptionId=${existingSub.mpSubscriptionId ?? "none"}, ` +
              `cancelledAt=${existingSub.cancelledAt?.toISOString() ?? "none"}. ` +
              `NOT reactivating subscription.`
            );

            // Reembolso automático si está dentro del derecho de arrepentimiento (10 días desde el pago)
            try {
              const paymentDate = payment.date_last_updated
                ? new Date(payment.date_last_updated)
                : new Date();
              const hoursSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60);
              if (hoursSincePayment <= 240) {
                const refundRes = await fetch(
                  `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                  }
                );
                if (refundRes.ok) {
                  const refund = await refundRes.json();
                  ignoredReason = "auto_refunded";
                  console.warn(
                    `[AUDIT] Auto-refunded payment ${paymentId} for CANCELLED business ${businessId}. refundId=${refund.id}`
                  );
                } else {
                  console.error(
                    `[AUDIT] Failed to auto-refund payment ${paymentId}:`,
                    await refundRes.text()
                  );
                }
              }
            } catch (refundErr) {
              console.error(`[AUDIT] Error during auto-refund of payment ${paymentId}:`, refundErr);
            }

            // Marcar el paymentId como visto para no re-procesar (sin cambiar status)
            await prisma.subscription
              .update({
                where: { businessId },
                data: { lastPaymentId: paymentId.toString() },
              })
              .catch((e: unknown) => console.error("Error marking paymentId for cancelled sub:", e));
          } else {
            const planToActivate = planKeyFromRef ?? existingSub?.plan ?? "PRO";

            // Obtener next_payment_date del preapproval para calcular currentPeriodEnd correctamente
            const preapprovalIdOfPayment =
              payment.order?.id?.toString() ?? existingSub?.mpSubscriptionId ?? null;
            let nextPaymentDate: Date | null = null;
            if (preapprovalIdOfPayment) {
              try {
                const paRes = await fetch(
                  `https://api.mercadopago.com/preapproval/${preapprovalIdOfPayment}`,
                  { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
                );
                if (paRes.ok) {
                  const pa = await paRes.json();
                  if (pa.next_payment_date) {
                    nextPaymentDate = new Date(pa.next_payment_date);
                  }
                }
              } catch (paErr) {
                console.error("Error fetching preapproval for next_payment_date:", paErr);
              }
            }
            const fallbackEnd = new Date(
              (payment.date_last_updated ? new Date(payment.date_last_updated).getTime() : Date.now()) +
                30 * 24 * 60 * 60 * 1000
            );
            const currentPeriodEnd = nextPaymentDate ?? fallbackEnd;

            await prisma.subscription.upsert({
              where: { businessId },
              create: {
                businessId,
                plan: planToActivate as SubscriptionPlan,
                status: "ACTIVE",
                lastPaymentId: paymentId.toString(),
                mpSubscriptionId: preapprovalIdOfPayment,
                currentPeriodEnd,
              },
              update: {
                plan: planToActivate as SubscriptionPlan,
                status: "ACTIVE",
                lastPaymentId: paymentId.toString(),
                currentPeriodEnd,
                ...(preapprovalIdOfPayment && { mpSubscriptionId: preapprovalIdOfPayment }),
              },
            });

            console.log(
              `Payment processed: business=${businessId}, plan=${planToActivate}, paymentId=${paymentId}, ` +
              `currentPeriodEnd=${currentPeriodEnd.toISOString()} (source=${nextPaymentDate ? "next_payment_date" : "fallback+30d"})`
            );

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

        // Registrar el ignoredReason en PaymentEvent si corresponde
        if (ignoredReason) {
          await prisma.paymentEvent
            .updateMany({
              where: { paymentId: paymentId.toString(), action: action ?? "unknown" },
              data: { ignoredReason },
            })
            .catch((e: unknown) => console.error("Error updating ignoredReason:", e));
        }

        // Pago rechazado → marcar como PAST_DUE
        if (payment.status === "rejected" && payment.external_reference) {
          let bizId: string;
          const r = payment.external_reference as string;
          if (r.includes(":")) {
            [bizId] = r.split(":", 2);
          } else {
            bizId = r;
          }

          await prisma.subscription.updateMany({
            where: { businessId: bizId, status: { in: ["ACTIVE", "PAUSED"] } },
            data: { status: "PAST_DUE" },
          });

          console.log(`Payment rejected: business=${bizId}, paymentId=${paymentId}`);
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
