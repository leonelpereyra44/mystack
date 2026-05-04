"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, Clock, Users, TrendingUp, CheckCircle, XCircle, AlertCircle, Phone, Mail, User, Scissors } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function parseUTCDate(dateValue: Date | string): Date {
  const d = new Date(dateValue);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

const statusConfig = {
  PENDING: { label: "Pendiente", variant: "secondary" as const, icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
  COMPLETED: { label: "Completado", variant: "outline" as const, icon: CheckCircle },
  NO_SHOW: { label: "No asistió", variant: "destructive" as const, icon: XCircle },
};

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
  service: { name: string; duration: number };
  staff: { name: string } | null;
}

interface Stats {
  todayCount: number;
  monthCount: number;
  servicesCount: number;
  staffCount: number;
}

interface DashboardInteractiveProps {
  stats: Stats;
  upcomingAppointments: Appointment[];
  terminology: { appointments: string; services: string; clients: string };
}

export function DashboardInteractive({
  stats,
  upcomingAppointments,
  terminology,
}: DashboardInteractiveProps) {
  const router = useRouter();
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const messages: Record<string, string> = {
        CONFIRMED: "Turno confirmado",
        COMPLETED: "Turno completado",
        CANCELLED: "Turno cancelado",
        NO_SHOW: "Marcado como no asistió",
      };
      toast.success(messages[status] || "Estado actualizado");
      setSelectedApt(null);
      router.refresh();
    } catch {
      toast.error("Error al actualizar el turno");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusCfg = selectedApt
    ? statusConfig[selectedApt.status as keyof typeof statusConfig] ?? statusConfig.PENDING
    : null;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Link href="/dashboard/appointments" className="group">
          <Card className="p-0 transition-colors hover:border-primary/50 hover:bg-muted/40 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">{terminology.appointments} Hoy</CardTitle>
              <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-2xl font-bold">{stats.todayCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/appointments" className="group">
          <Card className="p-0 transition-colors hover:border-primary/50 hover:bg-muted/40 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Este Mes</CardTitle>
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-2xl font-bold">{stats.monthCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/services" className="group">
          <Card className="p-0 transition-colors hover:border-primary/50 hover:bg-muted/40 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">{terminology.services}</CardTitle>
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-2xl font-bold">{stats.servicesCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/staff" className="group">
          <Card className="p-0 transition-colors hover:border-primary/50 hover:bg-muted/40 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 lg:p-6 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Empleados</CardTitle>
              <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-2xl font-bold">{stats.staffCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos {terminology.appointments}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay {terminology.appointments.toLowerCase()} próximos
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => setSelectedApt(apt)}
                  className="w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 hover:border-primary/50 cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{apt.customerName}</p>
                    <p className="text-sm text-muted-foreground">{apt.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {format(parseUTCDate(apt.date), "d MMM", { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.startTime} - {apt.endTime}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="max-w-md">
          {selectedApt && statusCfg && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedApt.customerName}
                  <Badge variant={statusCfg.variant} className="ml-1">
                    <statusCfg.icon className="mr-1 h-3 w-3" />
                    {statusCfg.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {format(parseUTCDate(selectedApt.date), "EEEE, d 'de' MMMM", { locale: es })}
                    {" · "}
                    {selectedApt.startTime} – {selectedApt.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scissors className="h-4 w-4 shrink-0" />
                  <span>
                    {selectedApt.service.name}
                    {selectedApt.staff && ` · ${selectedApt.staff.name}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{selectedApt.customerEmail}</span>
                </div>

                {selectedApt.customerPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{selectedApt.customerPhone}</span>
                  </div>
                )}

                {selectedApt.notes && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="italic">{selectedApt.notes}</span>
                  </div>
                )}
              </div>

              {(selectedApt.status === "PENDING" || selectedApt.status === "CONFIRMED") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {selectedApt.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(selectedApt.id, "CONFIRMED")}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Confirmar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selectedApt.id, "COMPLETED")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completado
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selectedApt.id, "NO_SHOW")}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    No asistió
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(selectedApt.id, "CANCELLED")}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
