import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Called by Vercel Cron every day at midnight.
// 1. Deletes PENDING appointments where tokenExpiresAt has passed.
// 2. Resets stale TRIALING subscriptions (>48h without payment) back to FREE.

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

    // Reset TRIALING subscriptions stuck for more than 48h (abandoned MP checkout)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const resetSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: "TRIALING",
        updatedAt: { lt: cutoff },
      },
      data: {
        status: "CANCELLED",
        plan: "FREE",
      },
    });

    console.log(`Cleanup: reset ${resetSubscriptions.count} stale TRIALING subscriptions to FREE`);

    return NextResponse.json({
      deletedAppointments: deleted.count,
      resetTrialingSubscriptions: resetSubscriptions.count,
    });
  } catch (error) {
    console.error("Error in cleanup-pending cron:", error);
    return NextResponse.json({ error: "Error en limpieza" }, { status: 500 });
  }
}
