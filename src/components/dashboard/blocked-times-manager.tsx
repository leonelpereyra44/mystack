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
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isAllDay: boolean;
  staffId: string | null;
  staff: Staff | null;
}

interface BlockedTimesManagerProps {
  staff: Staff[];
}

export function BlockedTimesManager({ staff }: BlockedTimesManagerProps) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [staffId, setStaffId] = useState<string>("all");
  const [isAllDay, setIsAllDay] = useState(true);

  useEffect(() => {
    fetchBlockedTimes();
  }, []);

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
          startTime: isAllDay ? null : startTime,
          endTime: isAllDay ? null : endTime,
          reason: reason || null,
          staffId: staffId === "all" ? null : staffId,
          isAllDay,
        }),
      });

      if (res.ok) {
        const newBlocked = await res.json();
        setBlockedTimes([...blockedTimes, newBlocked]);
        toast.success("Bloqueo creado correctamente");
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/business/blocked-time/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBlockedTimes(blockedTimes.filter((bt) => bt.id !== id));
        toast.success("Bloqueo eliminado");
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
    setStartTime("09:00");
    setEndTime("18:00");
    setReason("");
    setStaffId("all");
    setIsAllDay(true);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  // Agrupar por fecha
  const groupedByDate = blockedTimes.reduce((acc, bt) => {
    const dateKey = bt.date.split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(bt);
    return acc;
  }, {} as Record<string, BlockedTime[]>);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

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
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Bloqueo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Bloqueo de Agenda</DialogTitle>
                <DialogDescription>
                  Bloquea un día completo o un rango de horarios
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
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
        ) : blockedTimes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay bloqueos de agenda configurados</p>
            <p className="text-sm">
              Crea un bloqueo para vacaciones, feriados o días sin atención
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 capitalize">
                  {formatDate(dateKey)}
                </h4>
                <div className="space-y-2">
                  {groupedByDate[dateKey].map((bt) => (
                    <div
                      key={bt.id}
                      className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={bt.staffId ? "secondary" : "destructive"}
                        >
                          {bt.staff ? bt.staff.name : "Todo el negocio"}
                        </Badge>
                        <span className="text-sm">
                          {bt.isAllDay
                            ? "Todo el día"
                            : `${bt.startTime} - ${bt.endTime}`}
                        </span>
                        {bt.reason && (
                          <span className="text-sm text-muted-foreground">
                            • {bt.reason}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bt.id)}
                        disabled={deletingId === bt.id}
                      >
                        {deletingId === bt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
