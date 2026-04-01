"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, Scissors, Loader2, CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Schedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface Staff {
  id: string;
  name: string;
}

interface AppointmentData {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  staffId: string | null;
  staffName: string | null;
  currentDate: string;
  currentDateFormatted: string;
  currentStartTime: string;
  currentEndTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
}

interface RescheduleFormProps {
  appointment: AppointmentData;
  schedules: Schedule[];
  staff: Staff[];
}

export function RescheduleForm({ appointment, schedules, staff }: RescheduleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(appointment.staffId || undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  const getDaySchedule = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const schedule = getDaySchedule(date);
    return !schedule?.isOpen;
  };

  const loadAvailableSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    
    try {
      const params = new URLSearchParams({
        businessId: appointment.businessId,
        date: format(date, "yyyy-MM-dd"),
        serviceId: appointment.serviceId,
      });
      
      if (selectedStaffId) {
        params.append("staffId", selectedStaffId);
      }
      
      // Exclude current appointment from conflict check
      params.append("excludeAppointmentId", appointment.id);
      
      const response = await fetch(`/api/appointments/available?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch {
      console.error("Error loading slots");
    } finally {
      setLoadingSlots(false);
    }
  }, [appointment.businessId, appointment.serviceId, appointment.id, selectedStaffId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
      setSelectedTime("");
    }
  }, [selectedDate, selectedStaffId, loadAvailableSlots]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Selecciona fecha y horario");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: selectedTime,
          staffId: selectedStaffId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al reprogramar el turno");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Error al reprogramar el turno. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="pt-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">¡Turno Reprogramado!</h2>
          <p className="text-muted-foreground mb-2">
            Tu turno ha sido reprogramado exitosamente.
          </p>
          <div className="bg-muted rounded-lg p-4 my-4 text-left">
            <p className="text-sm">
              <strong>Nueva fecha:</strong>{" "}
              <span className="capitalize">
                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </p>
            <p className="text-sm">
              <strong>Nuevo horario:</strong> {selectedTime}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Te hemos enviado un email con los nuevos detalles.
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
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Reprogramar turno</CardTitle>
        <CardDescription>
          Selecciona una nueva fecha y horario para tu turno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current appointment info */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Turno actual:</p>
          <div className="flex items-center gap-2 text-sm">
            <Scissors className="h-4 w-4" />
            <span>{appointment.serviceName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{appointment.currentDateFormatted}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{appointment.currentStartTime} - {appointment.currentEndTime}</span>
          </div>
          {appointment.staffName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{appointment.staffName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* New date selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Nueva fecha</Label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
              locale={es}
              className="rounded-md border mt-2"
            />
          </div>

          {selectedDate && (
            <div>
              <Label className="text-base font-semibold">Nuevo horario</Label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTime === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {staff.length > 0 && (
            <div>
              <Label className="text-base font-semibold">Profesional (opcional)</Label>
              <Select 
                value={selectedStaffId} 
                onValueChange={(value) => setSelectedStaffId(value || undefined)}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Sin preferencia">
                    {selectedStaff ? selectedStaff.name : "Sin preferencia"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin preferencia</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handleReschedule}
          disabled={isLoading || !selectedDate || !selectedTime}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar nuevo horario
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}
