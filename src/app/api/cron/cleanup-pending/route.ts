import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cancelSubscription } from "@/lib/mercadopago";

// Called by Vercel Cron every day at midnight.
// 1. Deletes PENDING appointments where tokenExpiresAt has passed.
// 2. Resets stale TRIALING subscriptions (>48h without payment) back to FREE.
//    Also cancels the PreApproval in MP to evitar cobros tardíos inesperados.

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const deleted = await prisma.appointment.deleteMany({
      where: {
        status: "PENDING",
        tokenExpiresAt: { lt: new Date() },
      },
    });

    console.log(`Cleanup: deleted ${deleted.count} expired pending appointments`);

    // Buscar suscripciones TRIALING abandonadas (>48h sin pago)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const staleTrialing = await prisma.subscription.findMany({
      where: {
        status: "TRIALING",
        updatedAt: { lt: cutoff },
      },
      select: {
        id: true,
        businessId: true,
        mpSubscriptionId: true,
      },
    });

    // Cancelar cada PreApproval en MP para evitar que un pago tardío reactive la suscripción
    let mpCancelledCount = 0;
    let mpCancelFailedCount = 0;
    for (const sub of staleTrialing) {
      if (sub.mpSubscriptionId) {
        const result = await cancelSubscription(sub.mpSubscriptionId);
        if (result.success) {
          mpCancelledCount++;
        } else {
          mpCancelFailedCount++;
          console.error(
            `Cleanup: fallo al cancelar PreApproval en MP. businessId=${sub.businessId} mpSubscriptionId=${sub.mpSubscriptionId} error=${result.error}`
          );
        }
      }
    }

    // Resetear todas las TRIALING a CANCELLED/FREE en la DB
    const resetSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: "TRIALING",
        updatedAt: { lt: cutoff },
      },
      data: {
        status: "CANCELLED",
        plan: "FREE",
        cancelledAt: new Date(),
      },
    });

    console.log(
      `Cleanup: reset ${resetSubscriptions.count} stale TRIALING subscriptions to FREE. ` +
      `MP cancelados: ${mpCancelledCount}, MP fallos: ${mpCancelFailedCount}`
    );

    return NextResponse.json({
      deletedAppointments: deleted.count,
      resetTrialingSubscriptions: resetSubscriptions.count,
      mpCancelledCount,
      mpCancelFailedCount,
    });
  } catch (error) {
    console.error("Error in cleanup-pending cron:", error);
    return NextResponse.json({ error: "Error en limpieza" }, { status: 500 });
  }
}
