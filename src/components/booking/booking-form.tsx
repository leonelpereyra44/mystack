"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle, Clock, MapPin, User, Mail, CalendarPlus, Phone } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { getBusinessTerminology } from "@/lib/business-types";

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
  businessSlug: string;
  services: Service[];
  staff: Staff[];
  schedules: Schedule[];
  timezone: string;
  businessType?: string;
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

interface AppointmentData {
  id: string;
  date: string;
  dateFormatted: string;
  startTime: string;
  endTime: string;
  service: {
    name: string;
    duration: number;
    price: number;
  };
  staff: string | null;
  business: {
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
  };
  customer: {
    name: string;
    email: string;
  };
}

interface ExistingAppointmentError {
  id: string;
  date: string;
  startTime: string;
  serviceName: string;
}

export function BookingForm({
  businessId,
  businessSlug,
  services,
  staff,
  schedules,
  businessType = "salon",
}: BookingFormProps) {
  const terminology = getBusinessTerminology(businessType);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [existingAppointment, setExistingAppointment] = useState<ExistingAppointmentError | null>(null);
  const [daysAvailability, setDaysAvailability] = useState<Record<string, { hasSlots: boolean; slotsCount: number }>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  const EXTRA_FIELDS_BY_TYPE: Record<string, { key: string; label: string; placeholder: string; required?: boolean }[]> = {
    sports: [
      { key: "skillLevel", label: "Nivel", placeholder: "Principiante / Intermedio / Avanzado" },
    ],
    photography: [
      { key: "sessionTheme", label: "Temática de la sesión", placeholder: "Ej: Embarazo, graduación, familia..." },
    ],
  };

  const currentExtraFields = EXTRA_FIELDS_BY_TYPE[businessType] ?? [];

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
  const selectedStaffId = watch("staffId");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Cargar disponibilidad cuando cambia el servicio o staff
  const loadAvailability = useCallback(async () => {
    if (!selectedServiceId) return;
    
    setLoadingAvailability(true);
    try {
      let url = `/api/appointments/availability?businessId=${businessId}&serviceId=${selectedServiceId}&days=60`;
      if (selectedStaffId) {
        url += `&staffId=${selectedStaffId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDaysAvailability(data.availability || {});
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    } finally {
      setLoadingAvailability(false);
    }
  }, [businessId, selectedServiceId, selectedStaffId]);

  // Cargar fechas bloqueadas
  const loadBlockedDates = useCallback(async () => {
    try {
      let url = `/api/business/${businessSlug}/blocked-dates`;
      if (selectedStaffId) {
        url += `?staffId=${selectedStaffId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.fullyBlockedDates || []);
      }
    } catch (error) {
      console.error("Error loading blocked dates:", error);
    }
  }, [businessSlug, selectedStaffId]);

  useEffect(() => {
    loadBlockedDates();
  }, [loadBlockedDates]);

  useEffect(() => {
    if (selectedServiceId) {
      loadAvailability();
    }
  }, [selectedServiceId, selectedStaffId, loadAvailability]);
  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const getDaySchedule = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const schedule = getDaySchedule(date);
    if (!schedule?.isOpen) return true;
    
    // Verificar si la fecha está bloqueada
    const dateKey = format(date, "yyyy-MM-dd");
    if (blockedDates.includes(dateKey)) return true;
    
    // Si tenemos info de disponibilidad, verificar si hay slots
    if (daysAvailability[dateKey] !== undefined) {
      return !daysAvailability[dateKey].hasSlots;
    }
    
    return false;
  };

  // Obtener días con disponibilidad para resaltar en el calendario
  const getDaysWithAvailability = () => {
    return Object.entries(daysAvailability)
      .filter(([_, info]) => info.hasSlots)
      .map(([dateStr]) => new Date(dateStr + "T12:00:00"));
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

  const loadAvailableSlots = async (date: Date, staffIdParam?: string) => {
    if (!selectedService) return;
    
    setLoadingSlots(true);
    
    // Generate all possible slots
    const allSlots = generateTimeSlots(date, selectedService.duration);
    
    try {
      // Construir URL con parámetros opcionales
      let url = `/api/appointments/available?businessId=${businessId}&date=${format(
        date,
        "yyyy-MM-dd"
      )}&serviceId=${selectedService.id}`;
      
      // Agregar staffId si se seleccionó un staff específico
      const staffToUse = staffIdParam || selectedStaffId;
      if (staffToUse) {
        url += `&staffId=${staffToUse}`;
      }
      
      const response = await fetch(url);
      
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

  // Recargar slots cuando cambia el staff seleccionado
  const handleStaffChange = (staffId: string | null) => {
    setValue("staffId", staffId || "");
    setValue("time", ""); // Reset time selection
    if (selectedDate) {
      loadAvailableSlots(selectedDate, staffId || undefined);
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
          extraData: Object.keys(extraFields).length > 0 ? extraFields : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppointmentData(data.appointment);
        setIsSuccess(true);
      } else {
        const errorData = await response.json();
        
        // Check if it's an existing appointment error
        if (errorData.code === "EXISTING_APPOINTMENT" && errorData.existingAppointment) {
          setExistingAppointment(errorData.existingAppointment);
        } else {
          alert(errorData.error || "Error al crear la reserva");
        }
      }
    } catch {
      alert("Error al crear la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = () => {
    if (!appointmentData) return "";
    
    const { date, startTime, endTime, service, business, staff } = appointmentData;
    
    // Convert date and times to Google Calendar format (YYYYMMDDTHHmmss)
    const startDateTime = `${date.replace(/-/g, "")}T${startTime.replace(":", "")}00`;
    const endDateTime = `${date.replace(/-/g, "")}T${endTime.replace(":", "")}00`;
    
    const title = encodeURIComponent(`${service.name} - ${business.name}`);
    const details = encodeURIComponent(
      `${terminology.appointment} reservado:\n` +
      `${terminology.service}: ${service.name}\n` +
      `Duración: ${service.duration} minutos\n` +
      (staff ? `Profesional: ${staff}\n` : "") +
      `Precio: $${service.price.toLocaleString("es-AR")}`
    );
    const location = business.address ? encodeURIComponent(business.address) : "";
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  // Show existing appointment message
  if (existingAppointment) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center text-white">
          <CalendarIcon className="mx-auto h-16 w-16" />
          <h2 className="mt-4 text-2xl font-bold">Ya tenés {terminology.appointment === "Clase" || terminology.appointment === "Reunión" || terminology.appointment === "Sesión" || terminology.appointment === "Consulta" ? "una" : "un"} {terminology.appointment.toLowerCase()} reservado</h2>
          <p className="mt-2 text-amber-100">
            Solo podés tener un turno activo a la vez
          </p>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Tu {terminology.appointment.toLowerCase()} actual</h3>
            
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{existingAppointment.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {existingAppointment.startTime} hs
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{existingAppointment.serviceName}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full gap-2"
                onClick={() => window.location.href = `/appointments/${existingAppointment.id}/reschedule`}
              >
                <CalendarPlus className="h-4 w-4" />
                Reprogramar mi turno
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setExistingAppointment(null)}
              >
                Volver
              </Button>
            </div>
            
            <div className="rounded-lg bg-muted/50 p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Si necesitas cancelar tu turno actual, revisá el email de confirmación que te enviamos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess && appointmentData) {
    return (
      <Card className="overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center text-white">
          <CheckCircle className="mx-auto h-16 w-16" />
          <h2 className="mt-4 text-2xl font-bold">¡{terminology.appointment} Confirmado!</h2>
          <p className="mt-2 text-green-100">
            Te enviamos un email de confirmación a {appointmentData.customer.email}
          </p>
        </div>
        
        <CardContent className="p-6">
          {/* Appointment Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resumen de tu {terminology.appointment.toLowerCase()}</h3>
            
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{appointmentData.dateFormatted}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointmentData.startTime} - {appointmentData.endTime}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{appointmentData.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointmentData.service.duration} minutos · ${appointmentData.service.price.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
              
              {appointmentData.staff && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{appointmentData.staff}</p>
                      <p className="text-sm text-muted-foreground">Profesional asignado</p>
                    </div>
                  </div>
                </>
              )}
              
              {appointmentData.business.address && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{appointmentData.business.name}</p>
                      <p className="text-sm text-muted-foreground">{appointmentData.business.address}</p>
                    </div>
                  </div>
                </>
              )}
              
              {appointmentData.business.phone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <p className="font-medium">{appointmentData.business.phone}</p>
                  </div>
                </>
              )}
            </div>
            
            {/* Customer Info */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmación enviada a</p>
                  <p className="font-medium">{appointmentData.customer.email}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full gap-2" 
                onClick={() => window.open(generateGoogleCalendarUrl(), "_blank")}
              >
                <CalendarPlus className="h-4 w-4" />
                Agregar a Google Calendar
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  setAppointmentData(null);
                  setStep(1);
                  setAvailableSlots([]);
                }}
              >
                Hacer otra reserva
              </Button>
            </div>
            
            {/* Important Notes */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mt-4">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Si necesitas cancelar o modificar tu turno, 
                utiliza el enlace que te enviamos por email.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              Selecioná {terminology.service === "Clase" ? "una" : "un"} {terminology.service.toLowerCase()}
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
            {loadingAvailability && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando disponibilidad...
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                Fecha
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  Disponible
                </span>
              </Label>
              <div className="flex justify-center lg:justify-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                  locale={es}
                  className="rounded-md border w-full max-w-[320px] lg:max-w-[280px] [&_.rdp-month]:w-full"
                  modifiers={{
                    available: getDaysWithAvailability(),
                  }}
                  modifiersClassNames={{
                    available: "bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 border border-emerald-200",
                  }}
                />
              </div>
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
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={watch("time") === slot ? "default" : "outline"}
                        size="sm"
                        className="text-sm"
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
                <Select onValueChange={handleStaffChange} value={selectedStaffId || ""}>
                  <SelectTrigger className="w-full">
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecciona un profesional para ver sus horarios disponibles
                </p>
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

            {currentExtraFields.map((field) => (
              <div key={field.key}>
                <Label htmlFor={`extra-${field.key}`}>
                  {field.label} {field.required ? "*" : "(opcional)"}
                </Label>
                <Input
                  id={`extra-${field.key}`}
                  value={extraFields[field.key] ?? ""}
                  onChange={(e) =>
                    setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}

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
              Confirmar {terminology.appointment}
            </Button>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
