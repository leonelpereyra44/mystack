import prisma from "@/lib/prisma";

type NotificationType = 
  | "NEW_APPOINTMENT" 
  | "APPOINTMENT_CANCELLED" 
  | "APPOINTMENT_CONFIRMED"
  | "REMINDER"
  | "LIMIT_WARNING";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function notifyNewAppointment(
  userId: string,
  customerName: string,
  serviceName: string,
  date: string,
  time: string
) {
  await createNotification({
    userId,
    type: "NEW_APPOINTMENT",
    title: "Nueva reserva",
    message: `${customerName} reservó ${serviceName} para el ${date} a las ${time}`,
    link: "/dashboard/appointments",
  });
}

export async function notifyAppointmentCancelled(
  userId: string,
  customerName: string,
  serviceName: string,
  date: string
) {
  await createNotification({
    userId,
    type: "APPOINTMENT_CANCELLED",
    title: "Turno cancelado",
    message: `${customerName} canceló su turno de ${serviceName} del ${date}`,
    link: "/dashboard/appointments?filter=all",
  });
}

/**
 * Notifica al usuario cuando está cerca del límite de reservas (80%)
 * Solo envía una notificación por mes para no spamear
 */
export async function checkAndNotifyReservationLimit(
  userId: string,
  businessId: string,
  currentReservations: number,
  maxReservations: number
) {
  // Solo aplica para plan gratuito (límite finito)
  if (maxReservations === Infinity) return;

  const percentage = (currentReservations / maxReservations) * 100;
  
  // Avisar al 80% (120 de 150)
  if (percentage >= 80 && percentage < 100) {
    // Verificar si ya enviamos esta notificación este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: "LIMIT_WARNING",
        createdAt: { gte: startOfMonth },
      },
    });

    if (!existingNotification) {
      const remaining = maxReservations - currentReservations;
      await createNotification({
        userId,
        type: "LIMIT_WARNING",
        title: "⚠️ Cerca del límite de reservas",
        message: `Has usado ${currentReservations} de ${maxReservations} reservas este mes. Te quedan ${remaining} reservas. ¡Actualiza a Plan Profesional para reservas ilimitadas!`,
        link: "/dashboard/settings",
      });
    }
  }
}
