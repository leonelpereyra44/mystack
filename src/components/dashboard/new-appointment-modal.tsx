"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { type BusinessTerminology, getBusinessTerminology } from "@/lib/business-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
}

interface NewAppointmentModalProps {
  businessId: string;
  services: Service[];
  staff: Staff[];
  terminology?: BusinessTerminology;
  /** Pre-fill the form (used for "Duplicate" flow). Triggers the modal to open. */
  initialValues?: {
    serviceId?: string;
    staffId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  };
  /** Called immediately after consuming initialValues so the parent can clear them. */
  onInitialValuesConsumed?: () => void;
  /** If set, this appointment will be cancelled after the new one is successfully created. */
  rescheduleSourceId?: string;
}

const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  staffId: z.string().optional(),
  date: z.date({ message: "Selecciona una fecha" }),
  startTime: z.string().min(1, "Selecciona un horario"),
  customerName: z.string().min(2, "Ingresa el nombre del cliente"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function NewAppointmentModal({
  businessId,
  services,
  staff,
  terminology: terminologyProp,
  initialValues,
  onInitialValuesConsumed,
  rescheduleSourceId,
}: NewAppointmentModalProps) {
  const router = useRouter();
  const terminology = terminologyProp ?? getBusinessTerminology("salon");
  const [open, setOpen] = useState(false);

  // ── Duplicate / pre-fill support ───────────────────────────────────────────
  const prevInitialValuesRef = useRef<typeof initialValues | undefined>(undefined);
  const onConsumedRef = useRef(onInitialValuesConsumed);
  useEffect(() => { onConsumedRef.current = onInitialValuesConsumed; });

  // Captured at effect time so the ID survives after onConsumed clears the parent state
  const capturedRescheduleIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!initialValues) return;
    if (initialValues === prevInitialValuesRef.current) return;
    prevInitialValuesRef.current = initialValues;
    capturedRescheduleIdRef.current = rescheduleSourceId;
    reset({
      serviceId: initialValues.serviceId ?? "",
      staffId: initialValues.staffId,
      customerName: initialValues.customerName ?? "",
      customerEmail: initialValues.customerEmail ?? "",
      customerPhone: initialValues.customerPhone ?? "",
      notes: initialValues.notes ?? "",
      date: new Date(),
      startTime: "",
    });
    setOpen(true);
    onConsumedRef.current?.();
  // reset is stable; initialValues identity change is the real trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);
  // ──────────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    description: string;
    detail?: string;
  } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [daysAvailability, setDaysAvailability] = useState<Record<string, { hasSlots: boolean; slotsCount: number }>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const selectedDate = watch("date");
  const selectedServiceId = watch("serviceId");
  const selectedStaffId = watch("staffId");
  const selectedTime = watch("startTime");

  // Obtener el servicio seleccionado para mostrar su nombre
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  // Cargar disponibilidad mensual cuando cambia servicio o staff
  const loadMonthAvailability = useCallback(async () => {
    if (!selectedServiceId) {
      setDaysAvailability({});
      return;
    }
    setLoadingAvailability(true);
    try {
      const params = new URLSearchParams({
        businessId,
        serviceId: selectedServiceId,
        days: "90",
      });
      if (selectedStaffId) params.append("staffId", selectedStaffId);
      const response = await fetch(`/api/appointments/availability?${params}`);
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

  useEffect(() => {
    if (open && selectedServiceId) {
      loadMonthAvailability();
    }
  }, [open, selectedServiceId, selectedStaffId, loadMonthAvailability]);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const dateKey = format(date, "yyyy-MM-dd");
    if (daysAvailability[dateKey] !== undefined) {
      return !daysAvailability[dateKey].hasSlots;
    }
    return false;
  };

  const daysWithAvailability = useMemo(
    () =>
      Object.entries(daysAvailability)
        .filter(([, info]) => info.hasSlots)
        .map(([dateStr]) => new Date(dateStr + "T12:00:00")),
    [daysAvailability]
  );

  // Cargar horarios disponibles cuando cambia fecha, servicio o staff
  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !selectedServiceId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setValue("startTime", ""); // Reset selected time

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        businessId,
        date: dateStr,
        serviceId: selectedServiceId,
      });
      
      if (selectedStaffId) {
        params.append("staffId", selectedStaffId);
      }

      const response = await fetch(`/api/appointments/available?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
        setSlotCounts(data.slotCounts || {});
        setSlotCapacity(data.slotCapacity ?? 1);
      } else {
        setAvailableSlots([]);
        setSlotCounts({});
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedServiceId, selectedStaffId, businessId, setValue]);

  // Cargar slots cuando cambian las dependencias
  useEffect(() => {
    if (open && selectedServiceId && selectedDate) {
      loadAvailableSlots();
    }
  }, [open, selectedServiceId, selectedDate, selectedStaffId, loadAvailableSlots]);

  const onSubmit = async (data: AppointmentFormData) => {
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
          startTime: data.startTime,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || null,
          notes: data.notes || null,
          rescheduleSourceId: capturedRescheduleIdRef.current || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const code = errorData.code as string | undefined;

        if (code === "EXISTING_APPOINTMENT" && errorData.existingAppointment) {
          const apt = errorData.existingAppointment as { date: string; startTime: string; serviceName: string };
          throw Object.assign(new Error("EXISTING_APPOINTMENT"), {
            modalTitle: "Ya tiene un turno activo",
            modalDesc: `El cliente ya tiene un ${terminology.appointment.toLowerCase()} para el ${apt.date} a las ${apt.startTime} (${apt.serviceName}).`,
            modalDetail: `No se pueden crear dos ${terminology.appointment.toLowerCase()}s activos para el mismo cliente cuando la configuración del negocio no lo permite.`,
          });
        }

        if (code === "SLOT_TAKEN" || errorData.error === "Este horario ya no está disponible") {
          throw Object.assign(new Error("SLOT_TAKEN"), {
            modalTitle: "Horario no disponible",
            modalDesc: "El horario seleccionado ya fue ocupado mientras completabas el formulario.",
            modalDetail: "Por favor, volvé a verificar los horarios disponibles y elegí otro.",
          });
        }

        if (code === "PLAN_LIMIT_REACHED") {
          throw Object.assign(new Error("PLAN_LIMIT_REACHED"), {
            modalTitle: "Límite del plan alcanzado",
            modalDesc: errorData.error || "Alcanzaste el límite de reservas de tu plan actual.",
            modalDetail: "Para seguir aceptando reservas, actualizá tu plan desde la configuración.",
          });
        }

        throw Object.assign(new Error(errorData.error || "Error al crear el turno"), {
          modalTitle: "No se pudo crear el turno",
          modalDesc: errorData.error || "Ocurrió un error inesperado al intentar crear el turno.",
          modalDetail: "Por favor, intentá nuevamente. Si el problema persiste, contactá al soporte.",
        });
      }

      toast.success(`${terminology.appointment} creado correctamente`);
      setOpen(false);
      reset();

      // Cancel the original appointment if this was a reschedule
      const sourceId = capturedRescheduleIdRef.current;
      capturedRescheduleIdRef.current = undefined;
      if (sourceId) {
        await fetch(`/api/appointments/${sourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESCHEDULED" }),
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Error creating appointment:", error);
      const typedError = error as Error & { modalTitle?: string; modalDesc?: string; modalDetail?: string };
      if (typedError.modalTitle) {
        setErrorModal({
          title: typedError.modalTitle,
          description: typedError.modalDesc ?? "",
          detail: typedError.modalDetail,
        });
      } else {
        toast.error(error instanceof Error ? error.message : `Error al crear el ${terminology.appointment.toLowerCase()}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setShowCalendar(false);
      capturedRescheduleIdRef.current = undefined;
    }
  }, [open, reset]);

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar {terminology.appointment.toLowerCase()}
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{terminology.newAppointment}</DialogTitle>
          <DialogDescription>
            Agendá {terminology.appointment === "Clase" ? "una" : "un"} {terminology.appointment.toLowerCase()} manualmente para {terminology.appointment === "Clase" ? "un" : "un"} {terminology.client.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Servicio */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">{terminology.service} *</Label>
            <Select
              onValueChange={(value) => setValue("serviceId", value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Selecciona ${terminology.service === "Clase" ? "una" : "un"} ${terminology.service.toLowerCase()}`}>
                  {selectedService 
                    ? `${selectedService.name} - ${selectedService.duration} min - $${selectedService.price}`
                    : `Selecciona ${terminology.service === "Clase" ? "una" : "un"} ${terminology.service.toLowerCase()}`
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.duration} min - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          {/* Profesional (opcional) */}
          {staff.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="staffId">Profesional (opcional)</Label>
              <Select
                onValueChange={(value) => setValue("staffId", value === "none" ? undefined : (value as string))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar">
                    {selectedStaff ? selectedStaff.name : "Sin asignar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(selectedDate, "PPP", { locale: es })
                : "Selecciona una fecha"}
            </Button>
            {showCalendar && (
              <div className="rounded-md border p-3">
                {loadingAvailability && (
                  <div className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando disponibilidad...
                  </div>
                )}
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("date", date);
                      setShowCalendar(false);
                    }
                  }}
                  locale={es}
                  disabled={isDateDisabled}
                  modifiers={{ available: daysWithAvailability }}
                  modifiersClassNames={{
                    available: "bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 border border-emerald-200",
                  }}
                />
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Días con disponibilidad
                </p>
              </div>
            )}
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora *</Label>
            {!selectedServiceId ? (
              <p className="text-sm text-muted-foreground py-2">
                Selecciona un servicio primero
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando horarios...
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay horarios disponibles para esta fecha
              </p>
            ) : (
              <Select onValueChange={(value) => setValue("startTime", value as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un horario">
                    {selectedTime || "Selecciona un horario"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                      {slotCapacity > 1 && slotCounts[time] !== undefined && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {slotCounts[time]} {slotCounts[time] === 1 ? "lugar" : "lugares"}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Datos del {terminology.client.toLowerCase()}
            </p>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre *</Label>
              <Input
                id="customerName"
                placeholder={`Nombre del ${terminology.client.toLowerCase()}`}
                {...register("customerName")}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="cliente@email.com"
                {...register("customerEmail")}
              />
              {errors.customerEmail && (
                <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+54 11 1234-5678"
                {...register("customerPhone")}
              />
            </div>

            {/* Notas */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales..."
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear {terminology.appointment.toLowerCase()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* ── Error explanation modal ───────────────────────────────── */}
    <Dialog open={!!errorModal} onOpenChange={() => setErrorModal(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{errorModal?.title}</DialogTitle>
          <DialogDescription>{errorModal?.description}</DialogDescription>
        </DialogHeader>
        {errorModal?.detail && (
          <p className="text-sm text-muted-foreground border-t pt-3 mt-1">{errorModal.detail}</p>
        )}
        <DialogFooter>
          <Button onClick={() => setErrorModal(null)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
