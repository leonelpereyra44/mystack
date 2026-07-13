import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  cancelOrphanPreapprovals,
  cancelSubscription,
} from "@/lib/mercadopago";
import { sendSubscriptionCancelled } from "@/lib/email";

// ============================================================
// CRON DE RECONCILIACIÓN DB ↔ MERCADO PAGO
//
// Se ejecuta diariamente (configurado en vercel.json).
// Para cada suscripción con estado activo/past_due/paused/trialing:
//   1. Consulta el estado real en MP (GET /preapproval/:id)
//   2. Si MP dice "cancelled" y la DB no → sincroniza a CANCELLED + email
//   3. Si MP dice "authorized" pero DB está CANCELLED → preapproval huérfano
//      reactivado por MP (bug histórico) → vuelve a cancelar en MP + alerta.
//   4. Lista todos los preapprovals activos del payer y cancela huérfanos.
//
// Protección: requiere header Authorization: Bearer $CRON_SECRET
// (Vercel Cron lo inyecta automáticamente).
// ============================================================

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contacto@mystack.com.ar";

type MPStatus = "authorized" | "pending" | "paused" | "cancelled" | "ended" | null | undefined;

interface ReconcileResult {
  businessId: string;
  action: "marked_cancelled" | "orphans_re_cancelled" | "no_change" | "skipped" | "error";
  details?: string;
}

async function getMPPreapproval(mpSubscriptionId: string) {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${mpSubscriptionId}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!res.ok) {
    return { ok: false as const, status: res.status, body: await res.text() };
  }
  const data = (await res.json()) as {
    id: string;
    status: MPStatus;
    next_payment_date: string | null;
    payer_id: number | null;
    external_reference: string | null;
  };
  return { ok: true as const, data };
}

async function notifyAdmin(subject: string, body: string) {
  // Reusamos Resend vía la infraestructura de email. Para no acoplar
  // un nuevo template, enviamos un email simple usando la API directa.
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "MyStack <contacto@mystack.com.ar>",
      to: ADMIN_EMAIL,
      subject,
      html: `<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap;">${body}</pre>`,
    });
  } catch (e) {
    console.error("notifyAdmin failed:", e);
  }
}

export async function GET(request: Request) {
  // Autenticación del cron (Vercel envía Authorization: Bearer $CRON_SECRET)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // En dev: permitimos sin auth pero logueamos.
    console.warn("[reconcile-subscriptions] running in dev without CRON_SECRET");
  }

  if (!MP_TOKEN) {
    console.error("[reconcile-subscriptions] MERCADOPAGO_ACCESS_TOKEN missing");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const startedAt = new Date();
  console.log(`[reconcile-subscriptions] start at ${startedAt.toISOString()}`);

  // Suscripciones que DEBERÍAN estar activas en MP
  const candidates = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE", "PAUSED", "TRIALING"] },
      mpSubscriptionId: { not: null },
    },
    include: { business: { include: { owner: { select: { email: true, name: true } } } } },
  });

  const results: ReconcileResult[] = [];
  const alerts: string[] = [];

  for (const sub of candidates) {
    const mpSubId = sub.mpSubscriptionId!;
    const result: ReconcileResult = { businessId: sub.businessId, action: "no_change" };

    // 1. Consultar estado real en MP
    const mp = await getMPPreapproval(mpSubId).catch((e: unknown) => ({
      ok: false as const,
      status: 0,
      body: e instanceof Error ? e.message : String(e),
    }));

    if (!mp.ok) {
      result.action = "error";
      result.details = `MP GET ${mp.status}: ${mp.body.slice(0, 200)}`;
      results.push(result);
      continue;
    }

    const mpStatus = mp.data.status;

    // 2. MP canceló pero DB no
    if (mpStatus === "cancelled" || mpStatus === "ended") {
      const currentPeriodEnd = mp.data.next_payment_date
        ? new Date(mp.data.next_payment_date)
        : sub.currentPeriodEnd ?? new Date();

      await prisma.subscription.update({
        where: { businessId: sub.businessId },
        data: {
          status: "CANCELLED",
          cancelledAt: sub.cancelledAt ?? new Date(),
          currentPeriodEnd,
        },
      });
      result.action = "marked_cancelled";
      result.details = `MP reported ${mpStatus}; DB synced to CANCELLED`;

      // Email al usuario (solo si no se le había avisado)
      if (sub.cancelledAt === null && sub.business.owner?.email) {
        try {
          await sendSubscriptionCancelled({
            email: sub.business.owner.email,
            name: sub.business.owner.name ?? "usuario",
            planName: sub.plan,
            accessUntil: currentPeriodEnd.toLocaleDateString("es-AR"),
          });
        } catch (e) {
          console.error("email failed:", e);
        }
      }

      const alertMsg = `[SYNC] business=${sub.businessId} mp=${mpSubId} ` +
        `estaba ${sub.status} en DB → MP reporta ${mpStatus}. Marcado CANCELLED. ` +
        `¿Por qué no llegó el webhook? Verificar logs de MP.`;
      alerts.push(alertMsg);
      console.warn(alertMsg);
    }

    // 3. MP dice "authorized" pero DB está CANCELLED (preapproval huérfano reactivado)
    //    Esto es justamente el bug histórico: un pago de un preapproval olvidado.
    if (mpStatus === "authorized" && sub.status === "CANCELLED") {
      const reCancel = await cancelSubscription(mpSubId);
      result.action = "orphans_re_cancelled";
      result.details = `MP ${mpStatus} pero DB CANCELLED → re-cancelado en MP: ${reCancel.success}`;

      const alertMsg = `[HUERFANO] business=${sub.businessId} mp=${mpSubId} ` +
        `DB=CANCELLED pero MP=authorized. Re-cancelado en MP: ${reCancel.success}. ` +
        `Posible pago no deseado del usuario.`;
      alerts.push(alertMsg);
      console.error(alertMsg);
    }

    // 4. Cancelar huérfanos del payer (preapprovals activos que no son el nuestro)
    const payerId = sub.mpCustomerId ?? (mp.data.payer_id?.toString() ?? null);
    if (payerId) {
      if (!sub.mpCustomerId && mp.data.payer_id) {
        // Rescatar mpCustomerId en DB si faltaba
        await prisma.subscription.update({
          where: { businessId: sub.businessId },
          data: { mpCustomerId: payerId },
        }).catch(() => {});
      }
      try {
        const orphanReport = await cancelOrphanPreapprovals(payerId, mpSubId);
        if (orphanReport.cancelled.length > 0) {
          const msg = `[HUERFANO] business=${sub.businessId} payer=${payerId} ` +
            `preapprovals huérfanos cancelados: ${orphanReport.cancelled.join(", ")}`;
          alerts.push(msg);
          console.warn(msg);
          if (result.action === "no_change") {
            result.action = "orphans_re_cancelled";
            result.details = `orphans: ${orphanReport.cancelled.join(",")}`;
          }
        }
        if (orphanReport.failed.length > 0) {
          console.error(`[HUERFANO] falló cancelar: ${orphanReport.failed.join(", ")}`);
        }
      } catch (e) {
        console.error("orphan cleanup error:", e);
      }
    }

    results.push(result);
  }

  // Resumen
  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    candidates: candidates.length,
    markedCancelled: results.filter((r) => r.action === "marked_cancelled").length,
    orphansReCancelled: results.filter((r) => r.action === "orphans_re_cancelled").length,
    errors: results.filter((r) => r.action === "error").length,
    alerts: alerts.length,
  };

  console.log("[reconcile-subscriptions] summary:", JSON.stringify(summary, null, 2));

  // Notificar al admin si hubo alertas
  if (alerts.length > 0) {
    await notifyAdmin(
      `[MyStack] Reconciliación MP: ${alerts.length} alerta(s)`,
      `Resumen:\n${JSON.stringify(summary, null, 2)}\n\nAlertas:\n${alerts.join("\n")}\n\nDetalles:\n${JSON.stringify(results, null, 2)}`
    );
  }

  return NextResponse.json({ summary, results });
}