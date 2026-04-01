"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface AppointmentsListProps {
  appointments: Appointment[];
}

const statusConfig = {
  PENDING: { label: "Pendiente", variant: "secondary" as const, icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
  COMPLETED: { label: "Completado", variant: "outline" as const, icon: CheckCircle },
  NO_SHOW: { label: "No asistió", variant: "destructive" as const, icon: XCircle },
};

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const router = useRouter();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error al actualizar el turno");
    } finally {
      setIsUpdating(false);
      setCancelId(null);
    }
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, apt) => {
    const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(apt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No hay turnos programados para los próximos días
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedAppointments).map(([dateKey, dayAppointments]) => (
          <div key={dateKey}>
            <h3 className="mb-3 font-semibold">
              {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-3">
              {dayAppointments.map((apt) => {
                const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                const StatusIcon = status.icon;

                return (
                  <Card key={apt.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2">
                          <span className="text-lg font-bold">{apt.startTime}</span>
                          <span className="text-xs text-muted-foreground">
                            {apt.endTime}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apt.customerName}</p>
                            <Badge variant={status.variant}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {apt.service.name}
                            {apt.staff && ` • ${apt.staff.name}`}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {apt.customerEmail}
                            </span>
                            {apt.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {apt.customerPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>} />
                        <DropdownMenuContent align="end">
                          {apt.status === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirmar
                            </DropdownMenuItem>
                          )}
                          {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatus(apt.id, "COMPLETED")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar completado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(apt.id, "NO_SHOW")}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                No asistió
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setCancelId(apt.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar turno
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar turno?</DialogTitle>
            <DialogDescription>
              Se notificará al cliente sobre la cancelación.
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
              {isUpdating ? "Cancelando..." : "Cancelar turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
