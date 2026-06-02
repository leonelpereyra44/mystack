"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Check, CheckCircle2, ChevronDown, Clock, Info, Loader2, Mail, Phone, Plus, Search, Tag, User, X } from "lucide-react";

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
  description?: string | null;
}

interface Staff {
  id: string;
  name: string;
}

interface ClientOption {
  name: string;
  email: string;
  phone?: string | null;
}

interface NewAppointmentModalProps {
  businessId: string;
  services: Service[];
  staff: Staff[];
  terminology?: BusinessTerminology;
  recentClients?: ClientOption[];
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
  recentClients = [],
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
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

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

  const customerNameValue = watch("customerName");
  const customerEmailValue = watch("customerEmail");
  const isFormReady = !!(
    selectedServiceId &&
    selectedDate &&
    selectedTime &&
    (customerNameValue?.length ?? 0) >= 2 &&
    customerEmailValue
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return recentClients.slice(0, 5);
    const q = clientSearch.toLowerCase();
    return recentClients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [clientSearch, recentClients]);

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
      setClientSearch("");
      setShowClientDropdown(false);
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
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">{terminology.newAppointment}</DialogTitle>
              <DialogDescription className="text-xs">
                Agendá {terminology.appointment === "Clase" ? "una" : "un"} {terminology.appointment.toLowerCase()} manualmente para un {terminology.client.toLowerCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: form */}
          <div className="flex-1 overflow-y-auto">
            <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

              {/* ── Datos del turno ──────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Datos del turno</h3>
                </div>

                {/* Date + Service row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label>Fecha *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className={selectedDate ? "" : "text-muted-foreground"}>
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecciona"}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    {errors.date && (
                      <p className="text-xs text-destructive">{errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>{terminology.service} *</Label>
                    <Select onValueChange={(value) => setValue("serviceId", value as string)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona uno">
                          {selectedService ? selectedService.name : "Selecciona uno"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.serviceId && (
                      <p className="text-xs text-destructive">{errors.serviceId.message}</p>
                    )}
                  </div>
                </div>

                {/* Calendar popover */}
                {showCalendar && (
                  <div className="rounded-lg border p-3 mb-3">
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

                {/* Service info card */}
                {selectedService && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-3 mb-3">
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{selectedService.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="font-medium">${selectedService.price.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                    {selectedService.description && (
                      <p className="text-xs text-emerald-600 leading-relaxed">{selectedService.description}</p>
                    )}
                  </div>
                )}

                {/* Staff selector */}
                {staff.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <Label>Profesional (opcional)</Label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Select
                        onValueChange={(value) =>
                          setValue("staffId", value === "none" ? undefined : (value as string))
                        }
                      >
                        <SelectTrigger className="w-full pl-9">
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
                      {selectedStaffId && (
                        <button
                          type="button"
                          className="absolute right-8 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground z-10"
                          onClick={(e) => { e.stopPropagation(); setValue("staffId", undefined); }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Time slots */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label>Horarios disponibles</Label>
                  </div>
                  {!selectedServiceId ? (
                    <p className="text-sm text-muted-foreground py-1">
                      Selecciona un {terminology.service.toLowerCase()} primero
                    </p>
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando horarios...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setValue("startTime", time)}
                          className={`relative rounded-lg border px-2 py-2 text-sm font-medium transition-all ${
                            selectedTime === time
                              ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                              : "border-border bg-background hover:border-gray-300 hover:bg-muted/50"
                          }`}
                        >
                          {time}
                          {selectedTime === time && (
                            <Check className="absolute top-1 right-1 h-2.5 w-2.5 text-white/80" />
                          )}
                          {slotCapacity > 1 && slotCounts[time] !== undefined && (
                            <span
                              className={`block text-[10px] mt-0.5 ${
                                selectedTime === time ? "text-white/70" : "text-muted-foreground"
                              }`}
                            >
                              {slotCounts[time]} lugar{slotCounts[time] !== 1 ? "es" : ""}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.startTime && (
                    <p className="text-xs text-destructive">{errors.startTime.message}</p>
                  )}
                  {availableSlots.length > 0 && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 shrink-0" />
                      Los horarios mostrados ya consideran la duración del tratamiento.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Datos del cliente ──────────────────────────────── */}
              <div className="border-t pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Datos del {terminology.client.toLowerCase()}</h3>
                </div>

                {/* Client search */}
                {recentClients.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <Label>Buscar {terminology.client.toLowerCase()} (opcional)</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-9"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
                        autoComplete="off"
                      />
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-background shadow-lg">
                          {filteredClients.map((client, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setValue("customerName", client.name);
                                setValue("customerEmail", client.email);
                                setValue("customerPhone", client.phone ?? "");
                                setClientSearch(client.name);
                                setShowClientDropdown(false);
                              }}
                            >
                              <div className="text-sm font-medium">{client.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {client.email}{client.phone ? ` · ${client.phone}` : ""}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5 mb-3">
                  <Label htmlFor="customerName">Nombre *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="customerName"
                      className="pl-9"
                      placeholder={`Nombre del ${terminology.client.toLowerCase()}`}
                      {...register("customerName")}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="text-xs text-destructive">{errors.customerName.message}</p>
                  )}
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerEmail">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="customerEmail"
                        type="email"
                        className="pl-9"
                        placeholder="cliente@email.com"
                        {...register("customerEmail")}
                      />
                    </div>
                    {errors.customerEmail && (
                      <p className="text-xs text-destructive">{errors.customerEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="customerPhone"
                        type="tel"
                        className="pl-9"
                        placeholder="+54 11 1234-5678"
                        {...register("customerPhone")}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas adicionales sobre el turno o el cliente..."
                    {...register("notes")}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right: summary panel */}
          <div className="hidden sm:flex w-56 shrink-0 flex-col border-l bg-muted/30 px-5 py-5 overflow-y-auto">
            <div className="flex items-center gap-2 mb-5">
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold">Resumen del turno</h3>
            </div>
            <div className="space-y-4 flex-1">
              {[
                { icon: <Tag className="h-4 w-4" />, label: "Tratamiento", value: selectedService?.name },
                { icon: <User className="h-4 w-4" />, label: "Profesional", value: selectedStaff?.name },
                {
                  icon: <CalendarIcon className="h-4 w-4" />,
                  label: "Fecha",
                  value: selectedDate ? format(selectedDate, "dd/MM/yyyy") : undefined,
                },
                { icon: <Clock className="h-4 w-4" />, label: "Hora", value: selectedTime || undefined },
                {
                  icon: <Clock className="h-4 w-4" />,
                  label: "Duración",
                  value: selectedService ? `${selectedService.duration} min` : undefined,
                },
                {
                  icon: <Tag className="h-4 w-4" />,
                  label: "Precio",
                  value: selectedService
                    ? `$${selectedService.price.toLocaleString("es-AR")}`
                    : undefined,
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 text-muted-foreground">{item.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium truncate">{item.value ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              {isFormReady ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Todo listo</span>
                  </div>
                  <p className="text-xs text-emerald-600">El turno se creará con los datos ingresados.</p>
                </div>
              ) : (
                <div className="rounded-lg bg-muted px-3 py-3">
                  <p className="text-xs text-muted-foreground">Completá los campos requeridos para crear el turno.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" form="appointment-form" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            Crear {terminology.appointment.toLowerCase()}
          </Button>
        </div>
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
