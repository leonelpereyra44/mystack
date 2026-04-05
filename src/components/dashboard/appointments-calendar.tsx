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

type ViewMode = "week" | "month" | "day";

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [mobileViewMode, setMobileViewMode] = useState<ViewMode>("month");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calcular días a mostrar según la vista
  const daysToShow = useMemo(() => {
    const activeView = typeof window !== 'undefined' && window.innerWidth < 640 ? mobileViewMode : viewMode;
    if (activeView === "day") {
      return [currentDate];
    } else if (activeView === "week") {
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
  }, [currentDate, viewMode, mobileViewMode]);

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
    const activeView = typeof window !== 'undefined' && window.innerWidth < 640 ? mobileViewMode : viewMode;
    if (activeView === "day") {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (activeView === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    const activeView = typeof window !== 'undefined' && window.innerWidth < 640 ? mobileViewMode : viewMode;
    if (activeView === "day") {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (activeView === "week") {
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
    if (viewMode === "day") {
      return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { locale: es });
      const end = endOfWeek(currentDate, { locale: es });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "d")} - ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
      }
      return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: es });
  }, [currentDate, viewMode]);

  const mobilePeriodTitle = useMemo(() => {
    if (mobileViewMode === "day") {
      return format(currentDate, "EEEE d", { locale: es });
    } else if (mobileViewMode === "week") {
      const start = startOfWeek(currentDate, { locale: es });
      const end = endOfWeek(currentDate, { locale: es });
      return `${format(start, "d")} - ${format(end, "d MMM", { locale: es })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: es });
  }, [currentDate, mobileViewMode]);

  return (
    <div className="space-y-4">
      {/* Controles Desktop */}
      <div className="hidden sm:flex items-center justify-between gap-4">
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
            <SelectItem value="day">Día</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Controles Mobile - Estilo similar a la imagen */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-sm font-medium">
              Hoy
            </Button>
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setMobileViewMode("month")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                mobileViewMode === "month" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              )}
            >
              Mes
            </button>
            <button
              onClick={() => setMobileViewMode("week")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                mobileViewMode === "week" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              )}
            >
              Semana
            </button>
            <button
              onClick={() => setMobileViewMode("day")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                mobileViewMode === "day" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              )}
            >
              Día
            </button>
          </div>
        </div>
        <h2 className="text-center text-lg font-semibold capitalize">{mobilePeriodTitle}</h2>
      </div>

      {/* ===== VISTAS DESKTOP ===== */}

      {/* Vista Día Desktop */}
      {viewMode === "day" && (
        <div className="hidden sm:block">
          <div className="border rounded-lg p-4 min-h-[300px]">
            <h3 className="font-semibold mb-4 capitalize">
              {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            {(() => {
              const dateKey = format(currentDate, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate[dateKey] || [];
              if (dayAppointments.length === 0) {
                return <p className="text-muted-foreground text-center py-8">Sin turnos para este día</p>;
              }
              return (
                <div className="space-y-2">
                  {dayAppointments.map((apt) => {
                    const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg flex items-center gap-3 hover:opacity-80 transition-opacity",
                          apt.status === "CANCELLED" ? "bg-muted opacity-50" : "bg-primary/10"
                        )}
                      >
                        <div className={cn("w-1 h-12 rounded-full shrink-0", status.color)} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{apt.startTime} - {apt.endTime}</span>
                            <Badge variant="outline">{status.label}</Badge>
                          </div>
                          <p className="font-medium">{apt.customerName}</p>
                          <p className="text-sm text-muted-foreground">{apt.service.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Vista Semanal Desktop */}
      {viewMode === "week" && (
        <div className="hidden sm:grid grid-cols-7 gap-2">
          {/* Headers de días */}
          {daysToShow.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-center py-2 rounded-t-lg font-medium text-sm",
                isToday(day) ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <div>{format(day, "EEE", { locale: es })}</div>
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
                  "min-h-[150px] border rounded-b-lg p-1 space-y-1 overflow-y-auto",
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
                        "w-full text-left p-2 rounded text-xs hover:opacity-80 transition-opacity",
                        apt.status === "CANCELLED" ? "bg-muted opacity-50" : "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.color)} />
                        <span className="font-medium truncate">{apt.startTime}</span>
                      </div>
                      <p className="truncate text-muted-foreground mt-0.5">{apt.customerName}</p>
                    </button>
                  );
                })}
                {dayAppointments.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">-</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Mensual */}
      {viewMode === "month" && (
        <div className="hidden sm:grid grid-cols-7 gap-1">
          {/* Headers de días */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center py-2 font-medium text-sm text-muted-foreground">
              {day}
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
                  "min-h-[100px] border rounded p-1",
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
                          "w-full text-left text-xs p-1 rounded truncate hover:opacity-80",
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

      {/* ===== VISTAS MOBILE ===== */}
      
      {/* Vista Mes Mobile - Estilo limpio como la imagen */}
      {mobileViewMode === "month" && (
        <div className="sm:hidden">
          {/* Headers de días */}
          <div className="grid grid-cols-7 mb-2">
            {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center py-2 font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-y-1">
            {daysToShow.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const hasAppointments = dayAppointments.length > 0;
              const pendingCount = dayAppointments.filter(a => a.status === "PENDING").length;
              const confirmedCount = dayAppointments.filter(a => a.status === "CONFIRMED").length;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDayModal(day)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-full transition-colors mx-auto w-10 h-10",
                    !isCurrentMonth && "opacity-30",
                    isToday(day) && "bg-primary text-primary-foreground font-bold",
                    !isToday(day) && hasAppointments && "hover:bg-muted"
                  )}
                >
                  <span className="text-sm">{format(day, "d")}</span>
                  {hasAppointments && !isToday(day) && (
                    <div className="flex gap-0.5 -mt-0.5">
                      {confirmedCount > 0 && <div className="w-1 h-1 rounded-full bg-primary" />}
                      {pendingCount > 0 && <div className="w-1 h-1 rounded-full bg-yellow-500" />}
                      {dayAppointments.some(a => a.status === "CANCELLED") && <div className="w-1 h-1 rounded-full bg-red-500" />}
                    </div>
                  )}
                  {hasAppointments && isToday(day) && (
                    <div className="flex gap-0.5 -mt-0.5">
                      {dayAppointments.length > 0 && <div className="w-1 h-1 rounded-full bg-primary-foreground" />}
                      {dayAppointments.length > 1 && <div className="w-1 h-1 rounded-full bg-primary-foreground" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Semana Mobile */}
      {mobileViewMode === "week" && (
        <div className="sm:hidden space-y-2">
          {daysToShow.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDate[dateKey] || [];

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDayModal(day)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isToday(day) ? "border-primary bg-primary/5" : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    isToday(day) ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="text-left">
                    <p className={cn("font-medium capitalize", isToday(day) && "text-primary")}>
                      {format(day, "EEEE", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayAppointments.length > 0 
                        ? `${dayAppointments.length} ${dayAppointments.length === 1 ? "turno" : "turnos"}`
                        : "Sin turnos"
                      }
                    </p>
                  </div>
                </div>
                {dayAppointments.length > 0 && (
                  <div className="flex gap-1">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                      return <div key={apt.id} className={cn("w-2 h-2 rounded-full", status.color)} />;
                    })}
                    {dayAppointments.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{dayAppointments.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Vista Día Mobile */}
      {mobileViewMode === "day" && (
        <div className="sm:hidden space-y-3">
          {(() => {
            const dateKey = format(currentDate, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDate[dateKey] || [];
            
            if (dayAppointments.length === 0) {
              return (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Sin turnos para este día</p>
                </div>
              );
            }

            return dayAppointments.map((apt) => {
              const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
              return (
                <button
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border flex items-start gap-3 hover:bg-muted/50 transition-colors",
                    apt.status === "CANCELLED" && "opacity-50"
                  )}
                >
                  <div className={cn("w-1 h-full min-h-[60px] rounded-full shrink-0", status.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-lg">{apt.startTime}</span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", status.textColor)}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="font-semibold truncate">{apt.customerName}</p>
                    <p className="text-sm text-muted-foreground truncate">{apt.service.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {apt.service.duration} min • hasta {apt.endTime}
                    </p>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      )}

      {/* Modal de día seleccionado (Mobile) */}
      <Dialog open={!!selectedDayModal} onOpenChange={() => setSelectedDayModal(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          {selectedDayModal && (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {format(selectedDayModal, "EEEE d 'de' MMMM", { locale: es })}
                </DialogTitle>
                <DialogDescription>
                  {(() => {
                    const dateKey = format(selectedDayModal, "yyyy-MM-dd");
                    const count = (appointmentsByDate[dateKey] || []).length;
                    return count > 0 
                      ? `${count} ${count === 1 ? "turno programado" : "turnos programados"}`
                      : "Sin turnos programados";
                  })()}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {(() => {
                  const dateKey = format(selectedDayModal, "yyyy-MM-dd");
                  const dayAppointments = appointmentsByDate[dateKey] || [];
                  
                  if (dayAppointments.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No hay turnos para este día</p>
                      </div>
                    );
                  }

                  return dayAppointments.map((apt) => {
                    const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => {
                          setSelectedDayModal(null);
                          setSelectedAppointment(apt);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-muted transition-colors border",
                          apt.status === "CANCELLED" && "opacity-50"
                        )}
                      >
                        <div className={cn("w-1.5 h-12 rounded-full shrink-0", status.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{apt.startTime} - {apt.endTime}</span>
                            <Badge variant="outline" className="text-xs">{status.label}</Badge>
                          </div>
                          <p className="font-medium truncate">{apt.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">{apt.service.name}</p>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full" onClick={() => setSelectedDayModal(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
