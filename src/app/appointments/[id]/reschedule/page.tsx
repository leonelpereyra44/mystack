import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RescheduleForm } from "./reschedule-form";
import Link from "next/link";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateValue: Date | string): Date {
  const d = new Date(dateValue);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

interface ReschedulePageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata() {
  return {
    title: "Reprogramar Turno - MyStack",
    description: "Reprograma tu turno reservado",
  };
}

export default async function RescheduleAppointmentPage({ params }: ReschedulePageProps) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      staff: true,
      business: {
        include: {
          schedules: {
            orderBy: { dayOfWeek: "asc" },
          },
          staff: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      },
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
              Turno cancelado
            </h1>
            <p className="text-muted-foreground mb-4">
              Este turno fue cancelado y no puede ser reprogramado.
            </p>
            <Link 
              href={`/${appointment.business.slug}`}
              className="text-primary hover:underline"
            >
              Hacer una nueva reserva
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Past appointment
  const appointmentDate = parseUTCDate(appointment.date);
  const [hours, minutes] = appointment.startTime.split(":").map(Number);
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  if (appointmentDateTime < new Date()) {
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
            <p className="text-muted-foreground mb-4">
              No es posible reprogramar un turno que ya pasó.
            </p>
            <Link 
              href={`/${appointment.business.slug}`}
              className="text-primary hover:underline"
            >
              Hacer una nueva reserva
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const appointmentData = {
    id: appointment.id,
    businessId: appointment.businessId,
    businessName: appointment.business.name,
    businessSlug: appointment.business.slug,
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    serviceDuration: appointment.service.duration,
    staffId: appointment.staffId,
    staffName: appointment.staff?.name || null,
    currentDate: format(appointmentDate, "yyyy-MM-dd"),
    currentDateFormatted: format(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
    currentStartTime: appointment.startTime,
    currentEndTime: appointment.endTime,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    customerPhone: appointment.customerPhone,
  };

  const schedules = appointment.business.schedules.map(s => ({
    dayOfWeek: s.dayOfWeek,
    openTime: s.openTime,
    closeTime: s.closeTime,
    isOpen: s.isOpen,
  }));

  const staffList = appointment.business.staff.map(s => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="max-w-lg w-full">
        <RescheduleForm 
          appointment={appointmentData} 
          schedules={schedules}
          staff={staffList}
        />
      </div>
    </div>
  );
}
