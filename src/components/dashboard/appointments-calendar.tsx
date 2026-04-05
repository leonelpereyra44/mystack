"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateString: string | Date): Date {
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

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
  service: {
    name: string;
    duration: number;
  };
  staff: {
    name: string;
  } | null;
}

interface AppointmentsCalendarProps {
  appointments: Appointment[];
}

const statusConfig = {
  PENDING: { label: "Pendiente", color: "bg-yellow-500", textColor: "text-yellow-700", icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", color: "bg-green-500", textColor: "text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "bg-red-500", textColor: "text-red-700", icon: XCircle },
  COMPLETED: { label: "Completado", color: "bg-blue-500", textColor: "text-blue-700", icon: CheckCircle },
  NO_SHOW: { label: "No asistió", color: "bg-gray-500", textColor: "text-gray-700", icon: XCircle },
};

type ViewMode = "week" | "month";

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calcular días a mostrar según la vista
  const daysToShow = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { locale: es });
      const end = endOfWeek(currentDate, { locale: es });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Incluir días del mes anterior/siguiente para completar semanas
      const monthStart = startOfWeek(start, { locale: es });
      const monthEnd = endOfWeek(end, { locale: es });
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  }, [currentDate, viewMode]);

  // Agrupar citas por fecha
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      const dateKey = format(parseUTCDate(apt.date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    // Ordenar cada grupo por hora
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [appointments]);

  // Navegación
  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Actualizar estado de cita
  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const statusMessages: Record<string, string> = {
        CONFIRMED: "Turno confirmado",
        COMPLETED: "Turno completado",
        CANCELLED: "Turno cancelado",
        NO_SHOW: "Turno marcado como no asistió",
      };
      toast.success(statusMessages[status] || "Estado actualizado");
      router.refresh();
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error al actualizar el turno");
    } finally {
      setIsUpdating(false);
      setCancelId(null);
    }
  };

  // Título del período actual
  const periodTitle = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { locale: es });
      const end = endOfWeek(currentDate, { locale: es });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "d")} - ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
      }
      return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: es });
  }, [currentDate, viewMode]);

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">{periodTitle}</h2>
        </div>
        <Select value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
          <SelectTrigger className="w-[130px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vista Semanal */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {/* Headers de días */}
          {daysToShow.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-center py-2 rounded-t-lg font-medium text-sm",
                isToday(day) ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <div className="hidden sm:block">{format(day, "EEE", { locale: es })}</div>
              <div className="sm:hidden">{format(day, "EEEEE", { locale: es })}</div>
              <div className="text-lg">{format(day, "d")}</div>
            </div>
          ))}
          {/* Citas por día */}
          {daysToShow.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDate[dateKey] || [];

            return (
              <div
                key={`content-${day.toISOString()}`}
                className={cn(
                  "min-h-[120px] sm:min-h-[150px] border rounded-b-lg p-1 space-y-1 overflow-y-auto",
                  isToday(day) ? "border-primary bg-primary/5" : "bg-card"
                )}
              >
                {dayAppointments.map((apt) => {
                  const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                  return (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={cn(
                        "w-full text-left p-1.5 sm:p-2 rounded text-xs hover:opacity-80 transition-opacity",
                        apt.status === "CANCELLED" ? "bg-muted opacity-50" : "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.color)} />
                        <span className="font-medium truncate">{apt.startTime}</span>
                      </div>
                      <p className="truncate text-muted-foreground mt-0.5 hidden sm:block">
                        {apt.customerName}
                      </p>
                    </button>
                  );
                })}
                {dayAppointments.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    -
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Mensual */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-1">
          {/* Headers de días */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center py-2 font-medium text-sm text-muted-foreground">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
          {/* Días del mes */}
          {daysToShow.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] sm:min-h-[100px] border rounded p-1",
                  !isCurrentMonth && "opacity-40",
                  isToday(day) ? "border-primary bg-primary/5" : "bg-card"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayAppointments.slice(0, 3).map((apt) => {
                    const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={cn(
                          "w-full text-left text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate hover:opacity-80",
                          apt.status === "CANCELLED" ? "bg-muted opacity-50" : "bg-primary/10"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.color)} />
                          <span className="truncate">{apt.startTime}</span>
                        </span>
                      </button>
                    );
                  })}
                  {dayAppointments.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{dayAppointments.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalle de cita */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedAppointment && (
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
                    <div className="text-2xl font-bold">{format(parseUTCDate(selectedAppointment.date), "d")}</div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(parseUTCDate(selectedAppointment.date), "MMM", { locale: es })}
                    </div>
                  </div>
                  <div className="border-l pl-3">
                    <div className="font-medium">
                      {format(parseUTCDate(selectedAppointment.date), "EEEE", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-2">
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
                    {selectedAppointment.staff && (
                      <span> · {selectedAppointment.staff.name}</span>
                    )}
                  </div>
                </div>

                {/* Estado */}
                {(() => {
                  const status = statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      <Badge variant="outline" className={status.textColor}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  );
                })()}

                {/* Notas */}
                {selectedAppointment.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              {(selectedAppointment.status === "PENDING" || selectedAppointment.status === "CONFIRMED") && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
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
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de cancelación */}
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
    </div>
  );
}
