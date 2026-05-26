import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { preApproval } from "@/lib/mercadopago";

// Pausa entre llamadas a MP para evitar rate limiting (ms)
const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/admin/subscriptions/sync-prices
 *
 * Itera sobre todas las suscripciones ACTIVE con mpSubscriptionId y
 * actualiza el transaction_amount en MercadoPago para que coincida con
 * el precio actual en PlanConfig.
 *
 * Solo actualiza las que tienen un precio diferente al actual en MP
 * para minimizar llamadas a la API.
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener todas las suscripciones activas con ID de MP
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "PAST_DUE"] },
        mpSubscriptionId: { not: null },
        plan: { not: "FREE" },
      },
      select: {
        id: true,
        plan: true,
        mpSubscriptionId: true,
        business: { select: { name: true, slug: true } },
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        updated: 0,
        skipped: 0,
        failed: 0,
        details: [],
        message: "No hay suscripciones activas para sincronizar.",
      });
    }

    // Obtener los precios actuales de PlanConfig por plan
    const planConfigs = await prisma.planConfig.findMany({
      select: { plan: true, price: true },
    });
    const priceByPlan: Record<string, number> = {};
    for (const pc of planConfigs) {
      priceByPlan[pc.plan] = Number(pc.price);
    }

    const details: Array<{
      business: string;
      plan: string;
      result: "updated" | "skipped" | "failed";
      oldPrice?: number;
      newPrice?: number;
      error?: string;
    }> = [];

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const targetPrice = priceByPlan[sub.plan];
      if (!targetPrice || targetPrice <= 0) {
        details.push({ business: sub.business.name, plan: sub.plan, result: "skipped" });
        skipped++;
        continue;
      }

      try {
        // Consultar el preapproval actual en MP para ver el precio vigente
        const current = await preApproval.get({ id: sub.mpSubscriptionId! });
        const currentPrice = current.auto_recurring?.transaction_amount ?? 0;

        if (currentPrice === targetPrice) {
          details.push({
            business: sub.business.name,
            plan: sub.plan,
            result: "skipped",
            oldPrice: currentPrice,
            newPrice: targetPrice,
          });
          skipped++;
        } else {
          await preApproval.update({
            id: sub.mpSubscriptionId!,
            body: {
              auto_recurring: {
                transaction_amount: targetPrice,
              } as never,
            },
          });

          details.push({
            business: sub.business.name,
            plan: sub.plan,
            result: "updated",
            oldPrice: currentPrice,
            newPrice: targetPrice,
          });
          updated++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error(`Error syncing price for ${sub.business.slug}:`, err);
        details.push({
          business: sub.business.name,
          plan: sub.plan,
          result: "failed",
          error: message,
        });
        failed++;
      }

      // Respetar rate limit de MP entre requests
      await sleep(DELAY_MS);
    }

    return NextResponse.json({ updated, skipped, failed, details });
  } catch (error) {
    console.error("Error in sync-prices:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
