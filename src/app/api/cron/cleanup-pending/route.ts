import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Called by Vercel Cron every 5 minutes.
// Deletes PENDING appointments where tokenExpiresAt has passed.

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

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Error in cleanup-pending cron:", error);
    return NextResponse.json({ error: "Error en limpieza" }, { status: 500 });
  }
}
