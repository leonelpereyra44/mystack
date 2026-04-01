import prisma from "@/lib/prisma";

type NotificationType = 
  | "NEW_APPOINTMENT" 
  | "APPOINTMENT_CANCELLED" 
  | "APPOINTMENT_CONFIRMED"
  | "REMINDER";

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
