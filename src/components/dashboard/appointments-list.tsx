"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateString: string | Date): Date {
  const d = new Date(dateString);
  // Ajustar para usar UTC
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}
import {
  Calendar,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  currentPage?: number;
  totalPages?: number;
  filter?: "upcoming" | "past" | "all";
}

const statusConfig = {
  PENDING: { label: "Pendiente", variant: "secondary" as const, icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
  COMPLETED: { label: "Completado", variant: "outline" as const, icon: CheckCircle },
  NO_SHOW: { label: "No asistió", variant: "destructive" as const, icon: XCircle },
};

export function AppointmentsList({ 
  appointments, 
  currentPage = 1, 
  totalPages = 1,
  filter = "upcoming"
}: AppointmentsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFilterChange = (newFilter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", newFilter);
    params.delete("page"); // Reset to page 1
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

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
    const dateKey = format(parseUTCDate(apt.date), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(apt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  if (appointments.length === 0) {
    return (
      <>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filter === "upcoming" ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange("upcoming")}
          >
            Próximos
          </Button>
          <Button 
            variant={filter === "past" ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange("past")}
          >
            Pasados
          </Button>
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange("all")}
          >
            Todos
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {filter === "past" 
                ? "No hay turnos pasados" 
                : "No hay turnos programados"}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={filter === "upcoming" ? "default" : "outline"} 
          size="sm"
          onClick={() => handleFilterChange("upcoming")}
        >
          Próximos
        </Button>
        <Button 
          variant={filter === "past" ? "default" : "outline"} 
          size="sm"
          onClick={() => handleFilterChange("past")}
        >
          Pasados
        </Button>
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => handleFilterChange("all")}
        >
          Todos
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedAppointments).map(([dateKey, dayAppointments]) => (
          <div key={dateKey}>
            <h3 className="mb-3 font-semibold text-sm md:text-base">
              {format(parseUTCDate(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-3">
              {dayAppointments.map((apt, index) => {
                const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.PENDING;
                const StatusIcon = status.icon;

                return (
                  <Card key={`${apt.id}-${index}`}>
                    <CardContent className="p-3 md:p-4">
                      {/* Mobile: Stack layout */}
                      <div className="flex flex-col gap-3 md:hidden">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-2.5 py-1.5 min-w-[60px]">
                              <span className="text-xs text-muted-foreground">
                                {format(parseUTCDate(apt.date), "d MMM", { locale: es })}
                              </span>
                              <span className="text-base font-bold">{apt.startTime}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{apt.customerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {apt.service.name}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>} />
                            <DropdownMenuContent align="end">
                              {apt.status === "PENDING" && (
                                <DropdownMenuItem onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}
                              {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                                <>
                                  <DropdownMenuItem onClick={() => updateStatus(apt.id, "COMPLETED")}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Completado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(apt.id, "NO_SHOW")}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    No asistió
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setCancelId(apt.id)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={status.variant} className="text-xs">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {apt.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Desktop: Row layout */}
                      <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-[70px]">
                            <span className="text-xs text-muted-foreground">
                              {format(parseUTCDate(apt.date), "d MMM", { locale: es })}
                            </span>
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
