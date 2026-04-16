import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  category: z.string().min(1),
  subject: z.string().min(5),
  message: z.string().min(20),
});

const categoryLabels: Record<string, string> = {
  general: "Consulta general",
  support: "Soporte técnico",
  billing: "Facturación y pagos",
  feature: "Sugerencia de funcionalidad",
  bug: "Reportar un problema",
  other: "Otro",
};

export async function POST(request: Request) {
  try {
    // Rate limiting: máximo 5 mensajes por hora por IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(`contact:${ip}`, 5, 60 * 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Demasiados mensajes. Por favor, espera un momento antes de enviar otro." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Enviar email de contacto
    const result = await sendContactEmail({
      name: validatedData.name,
      email: validatedData.email,
      category: categoryLabels[validatedData.category] || validatedData.category,
      subject: validatedData.subject,
      message: validatedData.message,
    });

    if (!result.success) {
      console.error("Error sending contact email:", result.error);
      return NextResponse.json(
        { error: "Error al enviar el mensaje. Por favor, intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Mensaje enviado correctamente" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
