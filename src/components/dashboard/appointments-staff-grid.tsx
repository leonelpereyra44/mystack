"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, isToday as dateFnsIsToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseUTCDate(dateString: string | Date): Date {
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-pink-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    cardCls:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700",
    textCls: "text-amber-700 dark:text-amber-400",
    badgeCls:
      "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmado",
    cardCls:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700",
    textCls: "text-amber-700 dark:text-amber-400",
    badgeCls:
      "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completado",
    cardCls:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700",
    textCls: "text-emerald-700 dark:text-emerald-400",
    badgeCls:
      "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelado",
    cardCls:
      "bg-red-50 dark:bg-red-950/30 border-dashed border-red-300 dark:border-red-700 opacity-60",
    textCls: "text-red-600 dark:text-red-400",
    badgeCls:
      "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
  },
  NO_SHOW: {
    label: "No asistió",
    cardCls:
      "bg-gray-50 dark:bg-gray-800/40 border-dashed border-gray-300 dark:border-gray-600 opacity-60",
    textCls: "text-gray-500 dark:text-gray-400",
    badgeCls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  },
  RESCHEDULED: {
    label: "Reprogramado",
    cardCls:
      "bg-purple-50 dark:bg-purple-950/30 border-dashed border-purple-300 dark:border-purple-700 opacity-60",
    textCls: "text-purple-600 dark:text-purple-400",
    badgeCls:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
  },
  RESCHEDULED_PENDING: {
    label: "Reprogramado · Pendiente",
    cardCls:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700",
    textCls: "text-purple-700 dark:text-purple-400",
    badgeCls:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400",
  },
  RESCHEDULED_CONFIRMED: {
    label: "Reprogramado · Confirmado",
    cardCls:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700",
    textCls: "text-purple-700 dark:text-purple-400",
    badgeCls:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400",
  },
} as const;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  notes: string | null;
  rescheduledFromId: string | null;
  serviceId: string;
  staffId: string | null;
  service: { name: string; duration: number };
  staff: { name: string } | null;
}

interface StaffMember {
  id: string;
  name: string;
  color?: string;
}

interface BusinessSchedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface AppointmentsStaffGridProps {
  appointments: Appointment[];
  staff: StaffMember[];
  schedules: BusinessSchedule[];
  onDuplicate?: (apt: Appointment) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

// ── Status config for the modal badge ────────────────────────────────────────

const MODAL_STATUS_CONFIG = {
  PENDING:     { label: "Pendiente",     textColor: "text-amber-700 dark:text-amber-400",    icon: Clock },
  CONFIRMED:   { label: "Confirmado",   textColor: "text-amber-700 dark:text-amber-400",    icon: CheckCircle },
  COMPLETED:   { label: "Completado",   textColor: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
  CANCELLED:   { label: "Cancelado",    textColor: "text-red-600 dark:text-red-400",         icon: XCircle },
  NO_SHOW:     { label: "No asistió",   textColor: "text-gray-500 dark:text-gray-400",        icon: XCircle },
  RESCHEDULED: { label: "Reprogramado",             textColor: "text-purple-600 dark:text-purple-400",   icon: CalendarClock },
  RESCHEDULED_PENDING:  { label: "Reprogramado · Pendiente",  textColor: "text-purple-600 dark:text-purple-400",   icon: CalendarClock },
  RESCHEDULED_CONFIRMED: { label: "Reprogramado · Confirmado", textColor: "text-purple-700 dark:text-purple-400",   icon: CalendarClock },
};

function getGridStatusConfig(apt: Appointment) {
  if (apt.rescheduledFromId) {
    if (apt.status === "PENDING")   return STATUS_CONFIG.RESCHEDULED_PENDING;
    if (apt.status === "CONFIRMED") return STATUS_CONFIG.RESCHEDULED_CONFIRMED;
  }
  return STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
}

function getModalStatusConfig(apt: Appointment) {
  if (apt.rescheduledFromId) {
    if (apt.status === "PENDING")   return MODAL_STATUS_CONFIG.RESCHEDULED_PENDING;
    if (apt.status === "CONFIRMED") return MODAL_STATUS_CONFIG.RESCHEDULED_CONFIRMED;
  }
  return MODAL_STATUS_CONFIG[apt.status as keyof typeof MODAL_STATUS_CONFIG] ?? MODAL_STATUS_CONFIG.PENDING;
}

export function AppointmentsStaffGrid({
  appointments,
  staff,
  schedules,
  onDuplicate,
}: AppointmentsStaffGridProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isCurrentDay = dateFnsIsToday(selectedDate);

  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = {
        CONFIRMED: "Turno confirmado",
        COMPLETED: "Turno completado",
        CANCELLED: "Turno cancelado",
        NO_SHOW:   "Marcado como no asistió",
      };
      toast.success(labels[status] ?? "Estado actualizado");
      setSelectedAppointment(null);
      router.refresh();
    } catch {
      toast.error("Error al actualizar el turno");
    } finally {
      setIsUpdating(false);
      setCancelId(null);
    }
  };

  const deleteAppointment = async (id: string) => {
    setIsUpdating(true);
    setDeleteId(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Turno eliminado");
      setSelectedAppointment(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar el turno");
    } finally {
      setIsUpdating(false);
    }
  };

  const assignStaff = async (aptId: string, newStaffId: string | null) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: newStaffId }),
      });
      if (!res.ok) throw new Error();
      toast.success(newStaffId ? "Personal asignado" : "Personal desasignado");
      setSelectedAppointment(null);
      router.refresh();
    } catch {
      toast.error("Error al asignar el personal");
    } finally {
      setIsUpdating(false);
    }
  };

  // Appointments for the selected day
  const dayAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) => format(parseUTCDate(apt.date), "yyyy-MM-dd") === dateKey
      ),
    [appointments, dateKey]
  );

  // Determine hourly range: prefer configured business schedule for the day,
  // fall back to appointment times, then 8–20 default.
  const timeRange = useMemo(() => {
    const dow = selectedDate.getDay(); // 0=Sun … 6=Sat
    const schedule = schedules.find((s) => s.dayOfWeek === dow && s.isOpen);
    if (schedule) {
      const start = parseInt(schedule.openTime.split(":")[0]);
      const closeHour = parseInt(schedule.closeTime.split(":")[0]);
      const closeMin = parseInt(schedule.closeTime.split(":")[1]);
      // If closeTime has minutes (e.g. "18:30"), include that partial hour
      const end = closeMin > 0 ? closeHour + 1 : closeHour;
      return { start, end };
    }
    // Fallback: derive from existing appointments
    if (dayAppointments.length === 0) return { start: 8, end: 20 };
    const startHours = dayAppointments.map((apt) =>
      parseInt(apt.startTime.split(":")[0])
    );
    const endHours = dayAppointments.map((apt) => {
      const [h, m] = apt.endTime.split(":").map(Number);
      return h + (m > 0 ? 1 : 0);
    });
    return {
      start: Math.max(0, Math.min(...startHours)),
      end: Math.min(23, Math.max(...endHours)),
    };
  }, [selectedDate, schedules, dayAppointments]);

  const timeSlots = Array.from(
    { length: Math.max(0, timeRange.end - timeRange.start) },
    (_, i) => timeRange.start + i
  );

  // Show "Sin asignar" column whenever there are unassigned appointments.
  const hasUnassigned = dayAppointments.some((apt) => !apt.staffId);
  type UnassignedCol = { id: "__none__"; name: "Sin asignar" };
  const staffColumns: (StaffMember | UnassignedCol)[] = [
    ...staff,
    ...(hasUnassigned
      ? ([{ id: "__none__", name: "Sin asignar" }] as UnassignedCol[])
      : []),
  ];

  // Index: `${staffId}_${hour}` → Appointment[]
  const appointmentIndex = useMemo(() => {
    const idx: Record<string, Appointment[]> = {};
    dayAppointments.forEach((apt) => {
      const staffKey = apt.staffId ?? "__none__";
      const hour = parseInt(apt.startTime.split(":")[0]);
      const key = `${staffKey}_${hour}`;
      if (!idx[key]) idx[key] = [];
      idx[key].push(apt);
    });
    return idx;
  }, [dayAppointments]);

  const colWidth = 200;
  const timeColWidth = 72;
  const containerMinWidth = timeColWidth + staffColumns.length * colWidth;

  return (
    <div className="space-y-4">
      {/* ── Date navigator ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={isCurrentDay ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDate(new Date())}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold capitalize ml-1">
          {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </h2>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {staffColumns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-lg border border-dashed">
          <Clock className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">
            No hay personal configurado para mostrar el grid.
          </p>
        </div>
      ) : (
        /* ── Grid ──────────────────────────────────────────── */
        <div className="overflow-x-auto rounded-lg border">
          <div style={{ minWidth: `${containerMinWidth}px` }}>
            {/* ── Staff header ─── */}
            <div
              className="grid sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b"
              style={{
                gridTemplateColumns: `${timeColWidth}px repeat(${staffColumns.length}, 1fr)`,
              }}
            >
              {/* Clock icon in corner — sticky on both axes */}
              <div className="p-2 flex items-center justify-center border-r sticky left-0 z-20 bg-muted/95 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              {staffColumns.map((member) => (
                <div
                  key={member.id}
                  className="p-3 flex flex-col items-center gap-1.5 border-l"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                      member.id === "__none__"
                        ? "bg-gray-400 dark:bg-gray-600"
                        : getAvatarColor(member.name)
                    )}
                  >
                    {getInitials(member.name)}
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Personal
                  </span>
                </div>
              ))}
            </div>

            {/* ── No appointments message ─── */}
            {timeSlots.length === 0 && (
              <div className="py-14 text-center text-sm text-muted-foreground">
                Sin turnos programados para este día
              </div>
            )}

            {/* ── Time slot rows ─── */}
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="grid border-b last:border-b-0 hover:bg-muted/10 transition-colors"
                style={{
                  gridTemplateColumns: `${timeColWidth}px repeat(${staffColumns.length}, 1fr)`,
                }}
              >
                {/* Time label — sticky left so it stays visible on horizontal scroll */}
                <div className="px-3 py-2.5 flex items-start justify-end border-r sticky left-0 z-[5] bg-background">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>

                {/* Staff cells */}
                {staffColumns.map((member, colIdx) => {
                  const cellApts = (
                    appointmentIndex[`${member.id}_${hour}`] ?? []
                  ).filter((a) => a.status !== "RESCHEDULED");
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "min-h-[80px] p-1.5 border-l space-y-1 transition-colors",
                        colIdx % 2 === 1 ? "bg-muted/5" : "",
                        dropTarget === member.id && "bg-blue-50 dark:bg-blue-950/30 ring-2 ring-inset ring-blue-300"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDropTarget(member.id); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTarget(null);
                        if (draggedAptId) {
                          assignStaff(draggedAptId, member.id === "__none__" ? null : member.id);
                          setDraggedAptId(null);
                        }
                      }}
                    >
                      {cellApts.length > 0 ? (
                        cellApts.map((apt) => {
                          const cfg = getGridStatusConfig(apt);
                          return (
                            <button
                              key={apt.id}
                              draggable
                              onDragStart={() => setDraggedAptId(apt.id)}
                              onDragEnd={() => { setDraggedAptId(null); setDropTarget(null); }}
                              onClick={() => setSelectedAppointment(apt)}
                              className={cn(
                                "w-full text-left rounded-md border px-2 py-1.5 text-xs",
                                "hover:brightness-95 dark:hover:brightness-110 transition-[filter] cursor-pointer",
                                draggedAptId === apt.id && "opacity-50",
                                cfg.cardCls
                              )}
                            >
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <span className="font-semibold truncate leading-tight">
                                  {apt.customerName}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-semibold leading-tight whitespace-nowrap",
                                    cfg.badgeCls
                                  )}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "truncate text-[11px]",
                                  cfg.textCls
                                )}
                              >
                                {apt.service.name}
                              </div>
                              <div className="text-muted-foreground text-[10px] mt-0.5">
                                {apt.startTime} – {apt.endTime}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="h-full min-h-[60px] rounded border border-dashed border-muted-foreground/15 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground/40 select-none">
                            libre
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Appointment detail dialog ───────────────────────── */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedAppointment && (() => {
            const statusCfg = getModalStatusConfig(selectedAppointment);
            const StatusIcon = statusCfg.icon;
            const isPending =
              selectedAppointment.status === "PENDING" ||
              selectedAppointment.status === "CONFIRMED";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Detalle del turno
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Fecha y hora */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {format(parseUTCDate(selectedAppointment.date), "d")}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(parseUTCDate(selectedAppointment.date), "MMM", { locale: es })}
                      </div>
                    </div>
                    <div className="border-l pl-3">
                      <div className="font-medium capitalize">
                        {format(parseUTCDate(selectedAppointment.date), "EEEE", { locale: es })}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {selectedAppointment.startTime} – {selectedAppointment.endTime}
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedAppointment.customerName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground pl-6">
                      {selectedAppointment.customerEmail}
                      {selectedAppointment.customerPhone && (
                        <span className="block">{selectedAppointment.customerPhone}</span>
                      )}
                    </div>
                  </div>

                  {/* Servicio */}
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">{selectedAppointment.service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Duración: {selectedAppointment.service.duration} min
                    </div>
                  </div>

                  {/* Personal */}
                  {staff.length > 0 && (
                    ["PENDING", "CONFIRMED"].includes(selectedAppointment.status) ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground shrink-0">Personal:</span>
                        <Select
                          value={selectedAppointment.staffId ?? "__none__"}
                          onValueChange={(val) =>
                            assignStaff(selectedAppointment.id, val === "__none__" ? null : val)
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="flex-1 h-8 text-sm">
                            <SelectValue>
                              {selectedAppointment.staffId
                                ? (staff.find((s) => s.id === selectedAppointment.staffId)?.name ?? selectedAppointment.staffId)
                                : "Sin asignar"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin asignar</SelectItem>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : selectedAppointment.staff ? (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedAppointment.staff.name}</span>
                      </div>
                    ) : null
                  )}

                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className={statusCfg.textColor}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Notas */}
                  {selectedAppointment.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <DialogFooter className="flex-col sm:flex-row gap-2 flex-wrap">
                  {selectedAppointment.status === "PENDING" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selectedAppointment.id, "CONFIRMED")}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  {isPending && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => updateStatus(selectedAppointment.id, "COMPLETED")}
                        disabled={isUpdating}
                      >
                        Completado
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateStatus(selectedAppointment.id, "NO_SHOW")}
                        disabled={isUpdating}
                      >
                        No asistió
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setCancelId(selectedAppointment.id)}
                        disabled={isUpdating}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === "COMPLETED" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selectedAppointment.id, "CONFIRMED")}
                      disabled={isUpdating}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reabrir turno
                    </Button>
                  )}
                  {(selectedAppointment.status === "CANCELLED" || selectedAppointment.status === "NO_SHOW" || selectedAppointment.status === "RESCHEDULED") && (
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteId(selectedAppointment.id)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar turno
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      onDuplicate?.(selectedAppointment);
                      setSelectedAppointment(null);
                    }}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reprogramar
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Cancel confirmation ──────────────────────────────── */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar turno?</DialogTitle>
            <DialogDescription>
              Se notificará al cliente por email sobre la cancelación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelId && updateStatus(cancelId, "CANCELLED")}
              disabled={isUpdating}
            >
              {isUpdating ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar turno?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El turno será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteAppointment(deleteId)}
              disabled={isUpdating}
            >
              {isUpdating ? "Eliminando..." : "Eliminar turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Status legend ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Estado:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-6 rounded border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" />
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-6 rounded border bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700" />
          <span>Pendiente / Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-6 rounded border border-dashed border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 opacity-60" />
          <span>Cancelado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-6 rounded border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 opacity-60" />
          <span>Reprogramado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-6 rounded border border-dashed border-muted-foreground/30" />
          <span>Libre</span>
        </div>
      </div>
    </div>
  );
}
