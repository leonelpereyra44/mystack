"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, User, Scissors, Loader2, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AppointmentData {
  id: string;
  businessName: string;
  serviceName: string;
  staffName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
}

interface CancelAppointmentFormProps {
  appointment: AppointmentData;
}

export function CancelAppointmentForm({ appointment }: CancelAppointmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al cancelar el turno");
        return;
      }

      setIsCancelled(true);
    } catch {
      setError("Error al cancelar el turno. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <Card>
        <CardContent className="pt-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Turno Cancelado</h2>
          <p className="text-muted-foreground mb-6">
            Tu turno ha sido cancelado exitosamente. Te hemos enviado un email de confirmación.
          </p>
          <Button onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle>¿Cancelar turno?</CardTitle>
        <CardDescription>
          Estás a punto de cancelar tu turno. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium capitalize">{appointment.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Horario</p>
              <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Servicio</p>
              <p className="font-medium">{appointment.serviceName}</p>
            </div>
          </div>
          {appointment.staffName && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Profesional</p>
                <p className="font-medium">{appointment.staffName}</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Negocio: <span className="font-medium text-foreground">{appointment.businessName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{appointment.customerName}</span>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleCancel}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sí, cancelar turno
        </Button>
        <Link href={`/appointments/${appointment.id}/reschedule`} className="w-full">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
          >
            <CalendarDays className="h-4 w-4" />
            Prefiero reprogramar
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          No, mantener turno
        </Button>
      </CardFooter>
    </Card>
  );
}
