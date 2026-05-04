import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendAppointmentConfirmation } from "@/lib/email";
import { notifyNewAppointment } from "@/lib/notifications";

interface ConfirmPageProps {
  params: Promise<{ id: string; token: string }>;
}

export function generateMetadata() {
  return {
    title: "Confirmar Turno - MyStack",
    description: "Confirmá tu turno reservado",
  };
}

type ConfirmResult =
  | { code: "CONFIRMED" | "ALREADY_CONFIRMED"; appointment?: { businessName: string; dateFormatted: string; startTime: string; serviceName: string } }
  | { code: "TOKEN_EXPIRED" | "INVALID_TOKEN" | "NOT_FOUND" | "CANCELLED"; error: string };

async function confirmAppointment(id: string, token: string): Promise<ConfirmResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true, staff: true, business: true },
  });

  if (!appointment) return { code: "NOT_FOUND", error: "Turno no encontrado" };
  if (appointment.status === "CONFIRMED") {
    return {
      code: "ALREADY_CONFIRMED",
      appointment: {
        businessName: appointment.business.name,
        dateFormatted: format(
          new Date(appointment.date.getUTCFullYear(), appointment.date.getUTCMonth(), appointment.date.getUTCDate(), 12),
          "EEEE d 'de' MMMM 'de' yyyy",
          { locale: es }
        ),
        startTime: appointment.startTime,
        serviceName: appointment.service.name,
      },
    };
  }
  if (appointment.status === "CANCELLED") return { code: "CANCELLED", error: "Este turno fue cancelado" };
  if (appointment.confirmationToken !== token) return { code: "INVALID_TOKEN", error: "Enlace de confirmación inválido" };
  if (!appointment.tokenExpiresAt || appointment.tokenExpiresAt < new Date()) {
    return { code: "TOKEN_EXPIRED", error: "El enlace de confirmación expiró. El turno fue liberado." };
  }

  // Confirm the appointment
  await prisma.appointment.update({
    where: { id },
    data: { status: "CONFIRMED", confirmationToken: null, tokenExpiresAt: null },
  });

  const d = appointment.date;
  const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
  const formattedDate = format(localDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const shortDate = format(localDate, "d 'de' MMMM", { locale: es });

  sendAppointmentConfirmation({
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    businessName: appointment.business.name,
    serviceName: appointment.service.name,
    staffName: appointment.staff?.name,
    date: formattedDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    appointmentId: appointment.id,
    businessAddress: appointment.business.address || undefined,
    businessPhone: appointment.business.phone || undefined,
  }).catch(console.error);

  notifyNewAppointment(
    appointment.business.ownerId,
    appointment.customerName,
    appointment.service.name,
    shortDate,
    appointment.startTime
  ).catch(console.error);

  return {
    code: "CONFIRMED",
    appointment: {
      businessName: appointment.business.name,
      dateFormatted: formattedDate,
      startTime: appointment.startTime,
      serviceName: appointment.service.name,
    },
  };
}

export default async function ConfirmAppointmentPage({ params }: ConfirmPageProps) {
  const { id, token } = await params;

  if (!id || !token) {
    notFound();
  }

  const result = await confirmAppointment(id, token);

  if (result.code === "CONFIRMED" || result.code === "ALREADY_CONFIRMED") {
    const apt = "appointment" in result ? result.appointment : null;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
            <CheckCircle className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-2xl font-bold">¡Turno Confirmado!</h1>
            {result.code === "ALREADY_CONFIRMED" && (
              <p className="mt-2 text-green-100 text-sm">Este turno ya estaba confirmado</p>
            )}
          </div>

          <div className="p-6 space-y-4">
            {apt && (
              <div className="rounded-lg bg-gray-50 border p-4 space-y-2 text-sm">
                <p><span className="text-gray-500">Negocio:</span> <span className="font-medium">{apt.businessName}</span></p>
                <p><span className="text-gray-500">Servicio:</span> <span className="font-medium">{apt.serviceName}</span></p>
                <p><span className="text-gray-500">Fecha:</span> <span className="font-medium capitalize">{apt.dateFormatted}</span></p>
                <p><span className="text-gray-500">Horario:</span> <span className="font-medium">{apt.startTime} hs</span></p>
              </div>
            )}

            <p className="text-sm text-gray-600 text-center">
              Te enviamos un email con los detalles y los enlaces para cancelar o reprogramar si necesitás.
            </p>

            <div className="flex gap-3 pt-2">
              <Link
                href={`/appointments/${id}/reschedule`}
                className="flex-1 text-center border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reprogramar
              </Link>
              <Link
                href={`/appointments/${id}/cancel`}
                className="flex-1 text-center border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Cancelar turno
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.code === "TOKEN_EXPIRED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white">
            <Clock className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-2xl font-bold">Enlace expirado</h1>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-700 text-center">
              El tiempo para confirmar tu turno ha vencido y el horario fue liberado.
            </p>
            <p className="text-sm text-gray-500 text-center">
              Podés hacer una nueva reserva cuando quieras.
            </p>
            <Link
              href="/"
              className="block text-center bg-gradient-to-r from-[#12b5a2] to-[#0ea5e9] text-white rounded-lg py-3 font-medium mt-4 hover:opacity-90 transition-opacity"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result.code === "CANCELLED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-8 text-center text-white">
            <XCircle className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-2xl font-bold">Turno cancelado</h1>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-center">Este turno fue cancelado y ya no está activo.</p>
            <Link
              href="/"
              className="block text-center bg-gradient-to-r from-[#12b5a2] to-[#0ea5e9] text-white rounded-lg py-3 font-medium mt-6 hover:opacity-90 transition-opacity"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // INVALID_TOKEN, NOT_FOUND, SERVER_ERROR
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center text-white">
          <AlertTriangle className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-bold">Enlace inválido</h1>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-center">
            {"error" in result ? result.error : "No pudimos procesar tu solicitud."}
          </p>
          <Link
            href="/"
            className="block text-center bg-gradient-to-r from-[#12b5a2] to-[#0ea5e9] text-white rounded-lg py-3 font-medium mt-6 hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
