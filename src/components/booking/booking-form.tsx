"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | { toNumber: () => number };
}

interface Staff {
  id: string;
  name: string;
}

interface Schedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface BookingFormProps {
  businessId: string;
  services: Service[];
  staff: Staff[];
  schedules: Schedule[];
  timezone: string;
}

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  staffId: z.string().optional(),
  date: z.date({ message: "Selecciona una fecha" }),
  time: z.string().min(1, "Selecciona un horario"),
  customerName: z.string().min(2, "Ingresa tu nombre"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingForm({
  businessId,
  services,
  staff,
  schedules,
}: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("date");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const getDaySchedule = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const schedule = getDaySchedule(date);
    return !schedule?.isOpen;
  };

  const generateTimeSlots = (date: Date, duration: number) => {
    const schedule = getDaySchedule(date);
    if (!schedule || !schedule.isOpen) return [];

    const slots: string[] = [];
    const [openHour, openMin] = schedule.openTime.split(":").map(Number);
    const [closeHour, closeMin] = schedule.closeTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (
      currentHour * 60 + currentMin + duration <=
      closeHour * 60 + closeMin
    ) {
      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeStr);

      currentMin += 30; // 30 min intervals
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    return slots;
  };

  const loadAvailableSlots = async (date: Date) => {
    if (!selectedService) return;
    
    setLoadingSlots(true);
    
    // Generate all possible slots
    const allSlots = generateTimeSlots(date, selectedService.duration);
    
    // In a real app, you'd check against existing appointments
    // For now, we'll just show all slots
    try {
      const response = await fetch(
        `/api/appointments/available?businessId=${businessId}&date=${format(
          date,
          "yyyy-MM-dd"
        )}&serviceId=${selectedService.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || allSlots);
      } else {
        setAvailableSlots(allSlots);
      }
    } catch {
      setAvailableSlots(allSlots);
    }
    
    setLoadingSlots(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setValue("date", date);
      setValue("time", "");
      loadAvailableSlots(date);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId: data.serviceId,
          staffId: data.staffId || null,
          date: format(data.date, "yyyy-MM-dd"),
          startTime: data.time,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || null,
          notes: data.notes || null,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const error = await response.json();
        alert(error.message || "Error al crear la reserva");
      }
    } catch {
      alert("Error al crear la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-xl font-semibold">¡Reserva Confirmada!</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Te hemos enviado un email de confirmación con los detalles de tu turno.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Hacer otra reserva
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Step 1: Select Service */}
      {step >= 1 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                1
              </span>
              Selecciona un servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {services.map((service) => {
                const price = typeof service.price === 'object' && 'toNumber' in service.price 
                  ? service.price.toNumber() 
                  : Number(service.price);
                
                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedServiceId === service.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        value={service.id}
                        {...register("serviceId")}
                        className="h-4 w-4"
                        onChange={(e) => {
                          setValue("serviceId", e.target.value);
                          if (step === 1) setStep(2);
                        }}
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.duration} min
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">${price.toFixed(2)}</p>
                  </label>
                );
              })}
            </div>
            {errors.serviceId && (
              <p className="mt-2 text-sm text-destructive">
                {errors.serviceId.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Date & Time */}
      {step >= 2 && selectedService && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                2
              </span>
              Elige fecha y hora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                fromDate={new Date()}
                toDate={addDays(new Date(), 60)}
                locale={es}
                className="rounded-md border"
              />
              {errors.date && (
                <p className="mt-2 text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            {selectedDate && (
              <div>
                <Label>Horario disponible</Label>
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
                        variant={watch("time") === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setValue("time", slot);
                          if (step === 2) setStep(3);
                        }}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
                {errors.time && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.time.message}
                  </p>
                )}
              </div>
            )}

            {staff.length > 0 && (
              <div>
                <Label>Profesional (opcional)</Label>
                <Select onValueChange={(value) => setValue("staffId", value as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin preferencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Customer Info */}
      {step >= 3 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                3
              </span>
              Tus datos
            </CardTitle>
            <CardDescription>
              Te enviaremos la confirmación a tu email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Nombre completo *</Label>
              <Input
                id="customerName"
                {...register("customerName")}
                placeholder="Juan Pérez"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                placeholder="tu@email.com"
              />
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Algún comentario o solicitud especial..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Reserva
            </Button>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
