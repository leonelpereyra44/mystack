import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Siempre responder con éxito para no revelar si el email existe
    if (!user) {
      return NextResponse.json({ message: "Si el email existe, recibirás un enlace" });
    }

    // Generar token único
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // Eliminar tokens anteriores del usuario
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Crear nuevo token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Enviar email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "MyStack <onboarding@resend.dev>",
      to: email,
      subject: "Restablecer contraseña - MyStack",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">
              Restablecer contraseña
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
              Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <a href="${resetUrl}" style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
              Restablecer contraseña
            </a>
            
            <p style="color: #999; font-size: 14px; margin-top: 24px;">
              Este enlace expirará en 1 hora.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 16px;">
              Si no solicitaste este cambio, puedes ignorar este email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} MyStack. Todos los derechos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ message: "Email enviado" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
