"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  User,
  Scissors,
  ArrowRight,
  MoreVertical,
  Star,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactModal } from "@/components/dashboard/contact-modal";
import { cn } from "@/lib/utils";

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

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  service: { name: string; duration: number };
  staff: { name: string } | null;
}

interface RecentActivityItem {
  id: string;
  type: string;
  customerName: string;
  serviceName: string;
  date: Date;
  startTime: string;
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
  recentActivity: RecentActivityItem[];
  terminology: { appointments: string; services: string; clients: string };
  user: { name?: string | null; email?: string | null };
}

export function DashboardInteractive({
  stats,
  upcomingAppointments,
  recentActivity,
  terminology,
  user,
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

  const statsCards = [
    {
      label: `${terminology.appointments} Hoy`,
      value: stats.todayCount,
      icon: Calendar,
      href: "/dashboard/appointments",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Este Mes",
      value: stats.monthCount,
      icon: TrendingUp,
      href: "/dashboard/appointments",
      iconBg: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: terminology.services,
      value: stats.servicesCount,
      icon: Clock,
      href: "/dashboard/services",
      iconBg: "bg-amber-100 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Empleados",
      value: stats.staffCount,
      icon: Users,
      href: "/dashboard/staff",
      iconBg: "bg-green-100 dark:bg-green-950",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statsCards.map((card) => (
          <Link key={card.label} href={card.href} className="group">
            <Card className="transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer h-full">
              <CardContent className="p-4 lg:p-5">
                <div className={cn("inline-flex rounded-lg p-2", card.iconBg)}>
                  <card.icon className={cn("h-4 w-4 lg:h-5 lg:w-5", card.iconColor)} />
                </div>
                <div className="mt-3">
                  <p className="text-xs lg:text-sm text-muted-foreground font-medium">
                    {card.label}
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold mt-0.5 tabular-nums">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main content — 2 columns on large screens */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Próximos {terminology.appointments}
              </CardTitle>
              <Link
                href="/dashboard/appointments"
                className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
              >
                Ver calendario
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No hay {terminology.appointments.toLowerCase()} próximos
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingAppointments.map((apt) => {
                  const sc =
                    statusConfig[apt.status as keyof typeof statusConfig] ??
                    statusConfig.PENDING;
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      {/* Time */}
                      <span className="text-sm font-semibold text-muted-foreground w-11 shrink-0 tabular-nums">
                        {apt.startTime}
                      </span>

                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          getAvatarColor(apt.customerName)
                        )}
                      >
                        {getInitials(apt.customerName)}
                      </div>

                      {/* Name + service */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {apt.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {apt.service.name}
                        </p>
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant={sc.variant}
                        className="shrink-0 hidden sm:flex text-xs"
                      >
                        {sc.label}
                      </Badge>

                      {/* Action menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedApt(apt)}>
                            Ver detalles
                          </DropdownMenuItem>
                          {apt.status === "PENDING" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateStatus(apt.id, "CONFIRMED")}
                              >
                                Confirmar
                              </DropdownMenuItem>
                            </>
                          )}
                          {(apt.status === "PENDING" ||
                            apt.status === "CONFIRMED") && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatus(apt.id, "COMPLETED")}
                              >
                                Marcar completado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(apt.id, "NO_SHOW")}
                              >
                                No asistió
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => updateStatus(apt.id, "CANCELLED")}
                              >
                                Cancelar turno
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity + Help */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col flex-1">
            <div className="flex-1">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin actividad reciente
                </p>
              ) : (
                <div className="divide-y">
                  {recentActivity.map((item) => {
                    const isNew =
                      item.type === "CONFIRMED" || item.type === "PENDING";
                    const isCancelled =
                      item.type === "CANCELLED" || item.type === "NO_SHOW";
                    const isCompleted = item.type === "COMPLETED";

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            isNew && "bg-green-100 dark:bg-green-950",
                            isCancelled && "bg-red-100 dark:bg-red-950",
                            isCompleted && "bg-primary/10",
                            !isNew &&
                              !isCancelled &&
                              !isCompleted &&
                              "bg-muted"
                          )}
                        >
                          {isNew && (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                          {isCancelled && (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          {isCompleted && (
                            <Star className="h-4 w-4 text-primary" />
                          )}
                          {!isNew && !isCancelled && !isCompleted && (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {isNew && "Nuevo turno agendado"}
                            {isCancelled && "Turno cancelado"}
                            {isCompleted && "Turno completado"}
                            {!isNew &&
                              !isCancelled &&
                              !isCompleted &&
                              "Turno actualizado"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {format(parseUTCDate(item.date), "d MMM", {
                              locale: es,
                            })}{" "}
                            · {item.startTime} · {item.customerName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Help section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  ¿Necesitas ayuda con los reportes?
                </p>
              </div>
              <ContactModal
                user={user}
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    Ir al centro de ayuda
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
                    {format(
                      parseUTCDate(selectedApt.date),
                      "EEEE, d 'de' MMMM",
                      { locale: es }
                    )}
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

              {(selectedApt.status === "PENDING" ||
                selectedApt.status === "CONFIRMED") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {selectedApt.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus(selectedApt.id, "CONFIRMED")
                      }
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
