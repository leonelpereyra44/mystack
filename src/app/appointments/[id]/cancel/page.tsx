import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CancelAppointmentForm } from "./cancel-form";

interface CancelPageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata() {
  return {
    title: "Cancelar Turno - MyStack",
    description: "Cancela tu turno reservado",
  };
}

export default async function CancelAppointmentPage({ params }: CancelPageProps) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      staff: true,
      business: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  // Already cancelled
  if (appointment.status === "CANCELLED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Turno ya cancelado
            </h1>
            <p className="text-muted-foreground">
              Este turno ya fue cancelado anteriormente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Past appointment
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.startTime.split(":").map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);

  if (appointmentDate < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Turno pasado
            </h1>
            <p className="text-muted-foreground">
              No es posible cancelar un turno que ya pasó.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const appointmentData = {
    id: appointment.id,
    businessName: appointment.business.name,
    serviceName: appointment.service.name,
    staffName: appointment.staff?.name || null,
    date: format(new Date(appointment.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    customerName: appointment.customerName,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="max-w-md w-full">
        <CancelAppointmentForm appointment={appointmentData} />
      </div>
    </div>
  );
}
