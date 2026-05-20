import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmailVerification } from "@/lib/email";

export async function POST(request: Request) {
  const { limited, response } = await checkRateLimit(request);
  if (limited) return response;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "El email ya está verificado" }, { status: 400 });
  }

  // Delete existing verification tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: `verify:${user.email}` },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: `verify:${user.email}`,
      token,
      expires,
    },
  });

  await sendEmailVerification({
    email: user.email,
    name: user.name || "",
    token,
  });

  return NextResponse.json({ message: "Email de verificación enviado" });
}
