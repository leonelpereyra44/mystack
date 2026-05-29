"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Clock,
  MapPin,
  User,
  Mail,
  CalendarPlus,
  Phone,
  ChevronLeft,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { getBusinessTerminology } from "@/lib/business-types";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | { toNumber: () => number };
  description?: string | null;
  category?: string | null;
  staff?: { id: string }[];
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

interface AppointmentData {
  id: string;
  date: string;
  dateFormatted: string;
  startTime: string;
  endTime: string;
  service: { name: string; duration: number; price: number };
  staff: string | null;
  business: {
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    timezone?: string | null;
  };
  customer: { name: string; email: string };
}

interface ExistingAppointmentError {
  id: string;
  date: string;
  startTime: string;
  serviceName: string;
}

export interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the modal opens pre-selecting this service and skips to step 2. */
  initialServiceId?: string;
  businessId: string;
  businessSlug: string;
  services: Service[];
  staff: Staff[];
  schedules: Schedule[];
  timezone: string;
  businessType?: string;
  bookingInterval?: number;
  showPrices?: boolean;
  showDurations?: boolean;
  welcomeMessage?: string | null;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Seleccioná un servicio"),
  staffId: z.string().optional(),
  date: z.date({ message: "Seleccioná una fecha" }),
  time: z.string().min(1, "Seleccioná un horario"),
  customerName: z.string().min(2, "Ingresá tu nombre"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

// ─── Wizard steps config ─────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Fecha y hora" },
  { n: 3, label: "Tus datos" },
];

const EXTRA_FIELDS_BY_TYPE: Record<
  string,
  { key: string; label: string; placeholder: string; required?: boolean }[]
> = {
  sports: [
    { key: "skillLevel", label: "Nivel", placeholder: "Principiante / Intermedio / Avanzado" },
  ],
  photography: [
    { key: "sessionTheme", label: "Temática de la sesión", placeholder: "Ej: Embarazo, graduación, familia..." },
  ],
};

// ─── ServiceCard ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  price,
  isSelected,
  showPrices,
  showDurations,
  onSelect,
}: {
  service: Service;
  price: number;
  isSelected: boolean;
  showPrices: boolean;
  showDurations: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-start justify-between rounded-xl border p-4 text-left transition-all hover:shadow-sm overflow-hidden",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors",
            isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
          )}
        >
          {isSelected && (
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium line-clamp-2 break-words">{service.name}</p>
          {service.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 break-words mt-0.5">{service.description}</p>
          )}
          {showDurations && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {service.duration} min
            </p>
          )}
        </div>
      </div>
      {showPrices && (
        <p className="font-semibold text-sm ml-3 flex-shrink-0 whitespace-nowrap">
          ${price.toLocaleString("es-AR")}
        </p>
      )}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingModal({
  open,
  onOpenChange,
  initialServiceId,
  businessId,
  businessSlug,
  services,
  staff,
  schedules,
  businessType = "salon",
  bookingInterval = 30,
  showPrices = true,
  showDurations = true,
  welcomeMessage,
}: BookingModalProps) {
  const terminology = getBusinessTerminology(businessType);
  const currentExtraFields = EXTRA_FIELDS_BY_TYPE[businessType] ?? [];

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({ resolver: zodResolver(bookingSchema) });

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("date");
  const selectedStaffId = watch("staffId");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // ── Local state ───────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [existingAppointment, setExistingAppointment] = useState<ExistingAppointmentError | null>(null);
  const [daysAvailability, setDaysAvailability] = useState<Record<string, { hasSlots: boolean }>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  // Calculado solo en el cliente para evitar mismatch SSR (servidor usa UTC, cliente usa zona local)
  const [calendarToday, setCalendarToday] = useState<Date | null>(null);

  // ── Reset state when modal opens ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    reset();
    setAvailableSlots([]);
    setSlotsError(false);
    setIsSuccess(false);
    setAppointmentData(null);
    setExistingAppointment(null);
    setExtraFields({});
    setDaysAvailability({});

    if (initialServiceId) {
      setValue("serviceId", initialServiceId);
      setWizardStep(2);
    } else {
      setWizardStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── API: load monthly availability ───────────────────────────────────────
  const loadAvailability = useCallback(async () => {
    if (!selectedServiceId) return;
    setLoadingAvailability(true);
    try {
      let url = `/api/appointments/availability?businessId=${businessId}&serviceId=${selectedServiceId}&days=60`;
      if (selectedStaffId) url += `&staffId=${selectedStaffId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDaysAvailability(data.availability || {});
      }
    } catch {
      // silent
    } finally {
      setLoadingAvailability(false);
    }
  }, [businessId, selectedServiceId, selectedStaffId]);

  // ── API: load blocked dates ───────────────────────────────────────────────
  const loadBlockedDates = useCallback(async () => {
    try {
      let url = `/api/business/${businessSlug}/blocked-dates`;
      if (selectedStaffId) url += `?staffId=${selectedStaffId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBlockedDates(data.fullyBlockedDates || []);
      }
    } catch {
      // silent
    }
  }, [businessSlug, selectedStaffId]);

  // ── API: load available time slots for a date ─────────────────────────────
  const loadAvailableSlots = useCallback(
    async (date: Date, staffId?: string) => {
      if (!selectedServiceId) return;
      setLoadingSlots(true);
      setSlotsError(false);
      setAvailableSlots([]);
      try {
        let url = `/api/appointments/available?businessId=${businessId}&serviceId=${selectedServiceId}&date=${format(date, "yyyy-MM-dd")}`;
        if (staffId) url += `&staffId=${staffId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
        } else {
          setSlotsError(true);
        }
      } catch {
        setSlotsError(true);
      } finally {
        setLoadingSlots(false);
      }
    },
    [businessId, selectedServiceId],
  );

  useEffect(() => { loadBlockedDates(); }, [loadBlockedDates]);
  useEffect(() => { if (selectedServiceId) loadAvailability(); }, [selectedServiceId, selectedStaffId, loadAvailability]);
  // Inicializar "hoy" en el cliente para evitar que el SSR (UTC) marque como pasado
  // días que aún son hoy en la zona horaria local (ej: 21-23hs Argentina = siguiente día UTC)
  useEffect(() => { setCalendarToday(startOfDay(new Date())); }, []);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const isDateDisabled = (date: Date) => {
    if (calendarToday !== null && isBefore(date, calendarToday)) return true;
    const schedule = schedules.find((s) => s.dayOfWeek === date.getDay());
    if (!schedule?.isOpen) return true;
    const key = format(date, "yyyy-MM-dd");
    if (blockedDates.includes(key)) return true;
    if (daysAvailability[key] !== undefined) return !daysAvailability[key].hasSlots;
    return false;
  };

  const getDaysWithAvailability = () =>
    Object.entries(daysAvailability)
      .filter(([, info]) => info.hasSlots)
      .map(([d]) => new Date(d + "T12:00:00"));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setValue("date", date);
    setValue("time", "");
    loadAvailableSlots(date, selectedStaffId || undefined);
  };

  const handleStaffChange = (staffId: string | null) => {
    setValue("staffId", staffId || "");
    setValue("time", "");
    if (selectedDate) loadAvailableSlots(selectedDate, staffId || undefined);
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/appointments", {
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

      if (res.ok) {
        const json = await res.json();
        setAppointmentData(json.appointment);
        setExpiresInMinutes(json.expiresInMinutes ?? 60);
        setIsSuccess(true);
      } else {
        const err = await res.json();
        if (err.code === "EXISTING_APPOINTMENT" && err.existingAppointment) {
          setExistingAppointment(err.existingAppointment);
        } else {
          toast.error(err.error || "Error al crear la reserva");
        }
      }
    } catch {
      toast.error("Error al crear la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Calendar URL ───────────────────────────────────────────────────
  const generateGoogleCalendarUrl = () => {
    if (!appointmentData) return "";
    const { date, startTime, endTime, service, business, staff: apptStaff } = appointmentData;

    const toUTC = (dateStr: string, timeStr: string) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const [h, min] = timeStr.split(":").map(Number);
      if (business.timezone) {
        const isoLocal = `${dateStr}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
        const local = new Date(isoLocal);
        const utcStr = local.toLocaleString("en-US", { timeZone: "UTC" });
        const tzStr = local.toLocaleString("en-US", { timeZone: business.timezone });
        const offsetMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
        return new Date(local.getTime() - offsetMs).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      }
      return new Date(Date.UTC(y, m - 1, d, h, min)).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const title = encodeURIComponent(`${service.name} - ${business.name}`);
    const details = encodeURIComponent(
      `${terminology.appointment} reservado:\n` +
      `${terminology.service}: ${service.name}\n` +
      `Duración: ${service.duration} minutos\n` +
      (apptStaff ? `Profesional: ${apptStaff}\n` : "") +
      `Precio: $${service.price.toLocaleString("es-AR")}`,
    );
    const location = business.address ? encodeURIComponent(business.address) : "";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toUTC(date, startTime)}/${toUTC(date, endTime)}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  // ── Derived state for footer ──────────────────────────────────────────────
  const selectedTime = watch("time");
  const servicePrice = selectedService
    ? typeof selectedService.price === "object"
      ? selectedService.price.toNumber()
      : Number(selectedService.price)
    : 0;

  const availableStaff = (() => {
    const ids = selectedService?.staff?.map((s) => s.id) ?? [];
    return ids.length > 0 ? staff.filter((s) => ids.includes(s.id)) : staff;
  })();

  // ── Stepper progress ──────────────────────────────────────────────────────
  const showStepper = !isSuccess && !existingAppointment;
  const showFooter = !isSuccess && !existingAppointment;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg h-[92dvh] p-0 flex flex-col overflow-hidden gap-0"
      >
        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <div className="flex-none border-b bg-background px-6 pt-4 pb-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-base font-semibold">
              {isSuccess
                ? "¡Reserva enviada!"
                : existingAppointment
                  ? `Ya tenés un ${terminology.appointment.toLowerCase()} activo`
                  : `Reservar ${terminology.appointment.toLowerCase()}`}
            </DialogTitle>
            <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
          </div>

          {/* Stepper */}
          {showStepper && (
            <div className="flex items-start">
              {WIZARD_STEPS.map((step, i) => (
                <div key={step.n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors flex-shrink-0",
                        wizardStep > step.n
                          ? "bg-primary border-primary text-primary-foreground"
                          : wizardStep === step.n
                            ? "border-primary text-primary bg-primary/5"
                            : "border-muted-foreground/30 text-muted-foreground",
                      )}
                    >
                      {wizardStep > step.n ? <Check className="h-3.5 w-3.5" /> : step.n}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium whitespace-nowrap",
                        wizardStep === step.n ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 mb-4 transition-colors",
                        wizardStep > step.n ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Success state ── */}
          {isSuccess && appointmentData && (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <Mail className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                <p className="font-semibold text-emerald-900">¡Ya casi! Revisá tu email</p>
                <p className="text-sm text-emerald-700 mt-1">
                  Enviamos un link de confirmación a{" "}
                  <strong>{appointmentData.customer.email}</strong>
                </p>
              </div>

              <h3 className="font-semibold">Resumen de tu {terminology.appointment.toLowerCase()}</h3>

              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium capitalize">{appointmentData.dateFormatted}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointmentData.startTime} – {appointmentData.endTime}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{appointmentData.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointmentData.service.duration} min ·{" "}
                      ${appointmentData.service.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
                {appointmentData.staff && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary flex-shrink-0" />
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
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
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
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="font-medium">{appointmentData.business.phone}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Tenés{" "}
                  <strong>{expiresInMinutes} minutos</strong> para confirmar tu turno desde el
                  email. Si no confirmás a tiempo, el horario se libera automáticamente.
                </p>
              </div>

                <div className="flex flex-col gap-2 pt-2">
                <a
                  href={generateGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground w-full"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Agregar a Google Calendar
                </a>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* ── Existing appointment state ── */}
          {existingAppointment && (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                <CalendarIcon className="mx-auto h-10 w-10 text-amber-600 mb-2" />
                <p className="font-semibold text-amber-900">Solo podés tener un turno activo a la vez</p>
              </div>

              <h3 className="font-semibold">Tu {terminology.appointment.toLowerCase()} actual</h3>

              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium capitalize">{existingAppointment.date}</p>
                    <p className="text-sm text-muted-foreground">{existingAppointment.startTime} hs</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="font-medium">{existingAppointment.serviceName}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full gap-2"
                  onClick={() =>
                    (window.location.href = `/appointments/${existingAppointment.id}/reschedule`)
                  }
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

              <p className="text-sm text-muted-foreground text-center">
                Para cancelar tu turno actual, revisá el email de confirmación que te enviamos.
              </p>
            </div>
          )}

          {/* ── Wizard steps ── */}
          {!isSuccess && !existingAppointment && (
            <>
              {/* Step 1: Service selection */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  {welcomeMessage && (
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground break-words">
                      {welcomeMessage}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Selecioná{" "}
                    {terminology.service === "Clase" ? "una" : "un"}{" "}
                    {terminology.service.toLowerCase()} para continuar
                  </p>
                  {(() => {
                    const hasCategories = services.some((s) => s.category);

                    if (!hasCategories) {
                      return (
                        <div className="grid gap-3">
                          {services.map((service) => {
                            const price =
                              typeof service.price === "object"
                                ? service.price.toNumber()
                                : Number(service.price);
                            return (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                price={price}
                                isSelected={selectedServiceId === service.id}
                                showPrices={showPrices}
                                showDurations={showDurations}
                                onSelect={() => {
                                  setValue("serviceId", service.id);
                                  setWizardStep(2);
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    }

                    // Build ordered groups: named categories first, uncategorized last
                    const grouped: Record<string, typeof services> = {};
                    for (const s of services) {
                      const key = s.category || "__uncategorized__";
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(s);
                    }
                    const categoryKeys = Object.keys(grouped).filter(
                      (k) => k !== "__uncategorized__"
                    );
                    if (grouped["__uncategorized__"]) categoryKeys.push("__uncategorized__");

                    return (
                      <div className="space-y-5">
                        {categoryKeys.map((cat) => (
                          <div key={cat}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                              {cat === "__uncategorized__" ? "Otros" : cat}
                            </p>
                            <div className="grid gap-2">
                              {grouped[cat].map((service) => {
                                const price =
                                  typeof service.price === "object"
                                    ? service.price.toNumber()
                                    : Number(service.price);
                                return (
                                  <ServiceCard
                                    key={service.id}
                                    service={service}
                                    price={price}
                                    isSelected={selectedServiceId === service.id}
                                    showPrices={showPrices}
                                    showDurations={showDurations}
                                    onSelect={() => {
                                      setValue("serviceId", service.id);
                                      setWizardStep(2);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {errors.serviceId && (
                    <p className="text-sm text-destructive">{errors.serviceId.message}</p>
                  )}
                </div>
              )}

              {/* Step 2: Date, time & staff */}
              {wizardStep === 2 && selectedService && (
                <div className="space-y-5">
                  {/* Staff selector */}
                  {availableStaff.length > 0 && (
                    <div className="space-y-1.5">
                      <Label>Profesional <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                      <Select
                        onValueChange={handleStaffChange}
                        value={selectedStaffId || ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sin preferencia">
                            {staff.find((s) => s.id === selectedStaffId)?.name ?? "Sin preferencia"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin preferencia</SelectItem>
                          {availableStaff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Calendar */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      Fecha
                      <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        Disponible
                      </span>
                      {loadingAvailability && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </Label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        fromDate={calendarToday ?? undefined}
                        toDate={calendarToday ? addDays(calendarToday, 60) : undefined}
                        locale={es}
                        className="rounded-md border w-full [&_.rdp-month]:w-full"
                        modifiers={{ available: getDaysWithAvailability() }}
                        modifiersClassNames={{
                          available:
                            "bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 border border-emerald-200",
                        }}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <div className="space-y-1.5">
                      <Label>Horario disponible</Label>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : slotsError ? (
                        <div className="py-4 text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            No se pudieron cargar los horarios. Verificá tu conexión.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadAvailableSlots(selectedDate)}
                          >
                            Reintentar
                          </Button>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No hay horarios disponibles para esta fecha
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              variant={selectedTime === slot ? "default" : "outline"}
                              size="sm"
                              className="text-sm"
                              onClick={() => {
                                setValue("time", slot);
                                setWizardStep(3);
                              }}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      )}
                      {errors.time && (
                        <p className="text-sm text-destructive">{errors.time.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Customer data */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName">Nombre completo *</Label>
                    <Input
                      id="customerName"
                      {...register("customerName")}
                      placeholder="Juan Pérez"
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...register("customerEmail")}
                      placeholder="tu@email.com"
                    />
                    {errors.customerEmail && (
                      <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone">
                      Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="customerPhone"
                      {...register("customerPhone")}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  {currentExtraFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={`extra-${field.key}`}>
                        {field.label}{" "}
                        {field.required ? "*" : (
                          <span className="text-muted-foreground font-normal">(opcional)</span>
                        )}
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

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">
                      Notas <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Algún comentario o solicitud especial..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky Footer ───────────────────────────────────────────────── */}
        {showFooter && (
          <div className="flex-none border-t bg-background px-6 py-4 space-y-3">
            {/* Mini-summary */}
            {(selectedService || selectedDate || selectedTime) && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                {selectedService && (
                  <span className="font-medium text-foreground">{selectedService.name}</span>
                )}
                {showPrices && selectedService && (
                  <span className="text-muted-foreground">·</span>
                )}
                {showPrices && selectedService && (
                  <span className="text-muted-foreground">${servicePrice.toLocaleString("es-AR")}</span>
                )}
                {selectedDate && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {format(selectedDate, "d MMM", { locale: es })}
                    </span>
                  </>
                )}
                {selectedTime && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{selectedTime} hs</span>
                  </>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {wizardStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setWizardStep((w) => w - 1)}
                  className="flex-none gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </Button>
              )}

              {wizardStep < 3 ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (wizardStep === 1 && !selectedServiceId) {
                      toast.error("Seleccioná un servicio para continuar");
                      return;
                    }
                    if (wizardStep === 2) {
                      if (!selectedDate) {
                        toast.error("Seleccioná una fecha");
                        return;
                      }
                      if (!selectedTime) {
                        toast.error("Seleccioná un horario");
                        return;
                      }
                    }
                    setWizardStep((w) => w + 1);
                  }}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar {terminology.appointment.toLowerCase()}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
