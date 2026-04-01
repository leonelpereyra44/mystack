import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

// Este endpoint es llamado por Vercel Cron cada día a las 9:00 AM
// Envía recordatorios para las citas del día siguiente

export async function GET(request: Request) {
  try {
    // Verificar que sea una llamada autorizada (Vercel Cron)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // En desarrollo, permitir sin auth
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    // Obtener citas de mañana
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: "CONFIRMED",
      },
      include: {
        business: true,
        service: true,
        staff: true,
      },
    });

    console.log(`Encontradas ${appointments.length} citas para mañana`);

    let sent = 0;
    let failed = 0;

    for (const appointment of appointments) {
      try {
        const formattedDate = format(new Date(appointment.date), "EEEE d 'de' MMMM", {
          locale: es,
        });

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "MyStack <onboarding@resend.dev>",
          to: appointment.customerEmail,
          subject: `Recordatorio: Tu cita mañana en ${appointment.business.name}`,
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
                  📅 Recordatorio de tu cita
                </h1>
                
                <p style="color: #666; font-size: 16px; line-height: 1.5;">
                  Hola <strong>${appointment.customerName}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.5;">
                  Te recordamos que tienes una cita programada para <strong>mañana</strong>.
                </p>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; color: #333;">
                    <strong>📍 ${appointment.business.name}</strong>
                  </p>
                  <p style="margin: 0 0 8px 0; color: #666;">
                    🗓️ ${formattedDate}
                  </p>
                  <p style="margin: 0 0 8px 0; color: #666;">
                    🕐 ${appointment.startTime} hs
                  </p>
                  <p style="margin: 0 0 8px 0; color: #666;">
                    ✂️ ${appointment.service.name}
                  </p>
                  ${appointment.staff ? `
                  <p style="margin: 0; color: #666;">
                    👤 ${appointment.staff.name}
                  </p>
                  ` : ''}
                </div>
                
                ${appointment.business.address ? `
                <p style="color: #666; font-size: 14px;">
                  📍 Dirección: ${appointment.business.address}
                </p>
                ` : ''}
                
                ${appointment.business.phone ? `
                <p style="color: #666; font-size: 14px;">
                  📞 Teléfono: ${appointment.business.phone}
                </p>
                ` : ''}
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  Si necesitas cancelar o reprogramar, por favor contacta al negocio.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        sent++;
        console.log(`Recordatorio enviado a ${appointment.customerEmail}`);
      } catch (error) {
        failed++;
        console.error(`Error enviando a ${appointment.customerEmail}:`, error);
      }
    }

    return NextResponse.json({
      message: "Recordatorios procesados",
      total: appointments.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Cron reminder error:", error);
    return NextResponse.json(
      { error: "Error al procesar recordatorios" },
      { status: 500 }
    );
  }
}
