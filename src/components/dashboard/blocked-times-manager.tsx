"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarOff, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Staff {
  id: string;
  name: string;
}

interface BlockedTime {
  id: string;
  date: string;
  groupId: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isAllDay: boolean;
  staffId: string | null;
  staff: Staff | null;
}

// Para mostrar en UI - puede ser un día individual o un rango agrupado
interface BlockedTimeDisplay {
  id: string; // id del primer item o groupId
  isGroup: boolean;
  startDate: string;
  endDate?: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isAllDay: boolean;
  staffId: string | null;
  staff: Staff | null;
  groupId: string | null;
  count: number; // número de días
}

interface BlockedTimesManagerProps {
  staff: Staff[];
}

export function BlockedTimesManager({ staff }: BlockedTimesManagerProps) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [displayItems, setDisplayItems] = useState<BlockedTimeDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [isDateRange, setIsDateRange] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [staffId, setStaffId] = useState<string>("all");
  const [isAllDay, setIsAllDay] = useState(true);

  // Agrupar blocked times por groupId para mostrar rangos
  const groupBlockedTimes = (times: BlockedTime[]): BlockedTimeDisplay[] => {
    const groups: Record<string, BlockedTime[]> = {};
    const singles: BlockedTime[] = [];

    // Separar en grupos y sueltos
    times.forEach((bt) => {
      if (bt.groupId) {
        if (!groups[bt.groupId]) {
          groups[bt.groupId] = [];
        }
        groups[bt.groupId].push(bt);
      } else {
        singles.push(bt);
      }
    });

    const result: BlockedTimeDisplay[] = [];

    // Convertir grupos a display items
    Object.entries(groups).forEach(([groupId, items]) => {
      // Ordenar por fecha
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = items[0];
      const last = items[items.length - 1];

      result.push({
        id: groupId,
        isGroup: true,
        startDate: first.date,
        endDate: last.date,
        startTime: first.startTime,
        endTime: first.endTime,
        reason: first.reason,
        isAllDay: first.isAllDay,
        staffId: first.staffId,
        staff: first.staff,
        groupId,
        count: items.length,
      });
    });

    // Convertir sueltos a display items
    singles.forEach((bt) => {
      result.push({
        id: bt.id,
        isGroup: false,
        startDate: bt.date,
        startTime: bt.startTime,
        endTime: bt.endTime,
        reason: bt.reason,
        isAllDay: bt.isAllDay,
        staffId: bt.staffId,
        staff: bt.staff,
        groupId: null,
        count: 1,
      });
    });

    // Ordenar por fecha de inicio
    return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  useEffect(() => {
    fetchBlockedTimes();
  }, []);

  useEffect(() => {
    setDisplayItems(groupBlockedTimes(blockedTimes));
  }, [blockedTimes]);

  const fetchBlockedTimes = async () => {
    try {
      const res = await fetch("/api/business/blocked-time");
      if (res.ok) {
        const data = await res.json();
        setBlockedTimes(data);
      }
    } catch {
      console.error("Error fetching blocked times");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/business/blocked-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          dateEnd: isDateRange ? dateEnd : null,
          startTime: isAllDay ? null : startTime,
          endTime: isAllDay ? null : endTime,
          reason: reason || null,
          staffId: staffId === "all" ? null : staffId,
          isAllDay,
        }),
      });

      if (res.ok) {
        const newBlocked = await res.json();
        // Si es un grupo (rango de fechas), agregar los items
        if (newBlocked.isGroup && newBlocked.items) {
          setBlockedTimes([...blockedTimes, ...newBlocked.items]);
          toast.success(`${newBlocked.count} días bloqueados correctamente`);
        } else {
          setBlockedTimes([...blockedTimes, newBlocked]);
          toast.success("Bloqueo creado correctamente");
        }
        setIsDialogOpen(false);
        resetForm();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al crear bloqueo");
      }
    } catch {
      toast.error("Error al crear bloqueo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: BlockedTimeDisplay) => {
    setDeletingId(item.id);

    try {
      // Si es un grupo, eliminar por groupId, sino por id
      const endpoint = item.isGroup 
        ? `/api/business/blocked-time?groupId=${item.groupId}`
        : `/api/business/blocked-time/${item.id}`;
      
      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      if (res.ok) {
        if (item.isGroup && item.groupId) {
          // Eliminar todos los del grupo
          setBlockedTimes(blockedTimes.filter((bt) => bt.groupId !== item.groupId));
          toast.success(`${item.count} días de bloqueo eliminados`);
        } else {
          setBlockedTimes(blockedTimes.filter((bt) => bt.id !== item.id));
          toast.success("Bloqueo eliminado");
        }
      } else {
        toast.error("Error al eliminar bloqueo");
      }
    } catch {
      toast.error("Error al eliminar bloqueo");
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setDate("");
    setDateEnd("");
    setIsDateRange(false);
    setStartTime("09:00");
    setEndTime("18:00");
    setReason("");
    setStaffId("all");
    setIsAllDay(true);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00"), "d 'de' MMMM", {
      locale: es,
    });
  };

  const formatDateFull = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  const handleStaffChange = (value: string | null) => {
    setStaffId(value || "all");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Bloqueos de Agenda
            </CardTitle>
            <CardDescription>
              Bloquea días u horarios para vacaciones, feriados o capacitación
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Bloqueo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Bloqueo de Agenda</DialogTitle>
                <DialogDescription>
                  Bloquea un día completo o un rango de horarios
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="isDateRange"
                    checked={isDateRange}
                    onCheckedChange={(checked) => {
                      setIsDateRange(checked as boolean);
                      if (!checked) setDateEnd("");
                    }}
                  />
                  <Label htmlFor="isDateRange" className="cursor-pointer">
                    Bloquear rango de fechas
                  </Label>
                </div>

                <div className={isDateRange ? "grid grid-cols-2 gap-4" : ""}>
                  <div className="space-y-2">
                    <Label htmlFor="date">{isDateRange ? "Fecha inicio" : "Fecha"}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        // Si la fecha de fin es anterior, actualizarla
                        if (dateEnd && e.target.value > dateEnd) {
                          setDateEnd(e.target.value);
                        }
                      }}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  {isDateRange && (
                    <div className="space-y-2">
                      <Label htmlFor="dateEnd">Fecha fin</Label>
                      <Input
                        id="dateEnd"
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                        required={isDateRange}
                        min={date || new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffId">Profesional</Label>
                  <Select value={staffId} onValueChange={handleStaffChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Todo el negocio (todos los profesionales)
                      </SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAllDay"
                    checked={isAllDay}
                    onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
                  />
                  <Label htmlFor="isAllDay" className="cursor-pointer">
                    Bloquear todo el día
                  </Label>
                </div>

                {!isAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Hora inicio</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required={!isAllDay}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Hora fin</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required={!isAllDay}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Vacaciones, Feriado, Capacitación"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Crear Bloqueo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay bloqueos de agenda configurados</p>
            <p className="text-sm">
              Crea un bloqueo para vacaciones, feriados o días sin atención
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={item.staffId ? "secondary" : "destructive"}
                    >
                      {item.staff ? item.staff.name : "Todo el negocio"}
                    </Badge>
                    {item.isGroup && (
                      <Badge variant="outline">
                        {item.count} días
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {item.isAllDay
                        ? "Todo el día"
                        : `${item.startTime} - ${item.endTime}`}
                    </span>
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {item.isGroup && item.endDate
                      ? `${formatDate(item.startDate)} → ${formatDate(item.endDate)}`
                      : formatDateFull(item.startDate)}
                  </div>
                  {item.reason && (
                    <span className="text-sm text-muted-foreground">
                      {item.reason}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
