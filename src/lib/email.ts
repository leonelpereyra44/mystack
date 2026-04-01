import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AppointmentEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  serviceName: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentId: string;
  businessAddress?: string;
  businessPhone?: string;
}

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const cancelUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"}/appointments/${data.appointmentId}/cancel`;
  const rescheduleUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"}/appointments/${data.appointmentId}/reschedule`;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "MyStack <noreply@mystack.app>",
      to: data.customerEmail,
      subject: `Turno confirmado en ${data.businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #12b5a2 0%, #0ea5e9 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Turno Confirmado!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hola <strong>${data.customerName}</strong>,</p>
              
              <p>Tu turno ha sido confirmado exitosamente. Aquí están los detalles:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #12b5a2;">
                <p style="margin: 8px 0;"><strong>📍 Negocio:</strong> ${data.businessName}</p>
                <p style="margin: 8px 0;"><strong>💈 Servicio:</strong> ${data.serviceName}</p>
                ${data.staffName ? `<p style="margin: 8px 0;"><strong>👤 Profesional:</strong> ${data.staffName}</p>` : ""}
                <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${data.date}</p>
                <p style="margin: 8px 0;"><strong>🕐 Horario:</strong> ${data.startTime} - ${data.endTime}</p>
                ${data.businessAddress ? `<p style="margin: 8px 0;"><strong>📍 Dirección:</strong> ${data.businessAddress}</p>` : ""}
                ${data.businessPhone ? `<p style="margin: 8px 0;"><strong>📞 Teléfono:</strong> ${data.businessPhone}</p>` : ""}
              </div>
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                ¿Necesitas hacer cambios?
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${rescheduleUrl}" style="display: inline-block; background: #12b5a2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
                  Reprogramar Turno
                </a>
                <a href="${cancelUrl}" style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Cancelar Turno
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                ¡Te esperamos! 😊
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>Powered by MyStack - Sistema de Reservas Online</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendAppointmentCancellation(data: AppointmentEmailData) {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "MyStack <noreply@mystack.app>",
      to: data.customerEmail,
      subject: `Turno cancelado - ${data.businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc3545; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Turno Cancelado</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hola <strong>${data.customerName}</strong>,</p>
              
              <p>Tu turno ha sido cancelado. Aquí están los detalles del turno cancelado:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 8px 0;"><strong>📍 Negocio:</strong> ${data.businessName}</p>
                <p style="margin: 8px 0;"><strong>💈 Servicio:</strong> ${data.serviceName}</p>
                <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${data.date}</p>
                <p style="margin: 8px 0;"><strong>🕐 Horario:</strong> ${data.startTime} - ${data.endTime}</p>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Si deseas agendar un nuevo turno, visita nuestra página de reservas.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>Powered by MyStack - Sistema de Reservas Online</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return { success: false, error };
  }
}
