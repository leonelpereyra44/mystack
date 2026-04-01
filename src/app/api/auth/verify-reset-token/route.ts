import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token y email son requeridos" },
        { status: 400 }
      );
    }

    // Buscar token válido
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: email,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "Error al verificar el token" },
      { status: 500 }
    );
  }
}
