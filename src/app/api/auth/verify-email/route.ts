import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", request.url));
  }

  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: `verify:${email}`,
        token,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/verify-email?error=expired", request.url));
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `verify:${email}`,
            token,
          },
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/verify-email?success=true", request.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/verify-email?error=server", request.url));
  }
}
