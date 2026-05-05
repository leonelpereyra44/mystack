import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSystemConfigs, setSystemConfigs, CONFIG_KEYS } from "@/lib/system-config";

const ALL_KEYS = Object.values(CONFIG_KEYS);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const configs = await getSystemConfigs(ALL_KEYS);

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Sólo permitir keys conocidas
    const toSave: Partial<Record<(typeof ALL_KEYS)[number], string>> = {};
    for (const key of ALL_KEYS) {
      if (key in body) {
        toSave[key] = String(body[key]);
      }
    }

    await setSystemConfigs(toSave);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
