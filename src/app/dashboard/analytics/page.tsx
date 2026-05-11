"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Clock, 
  Users,
  Loader2,
  Crown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface AnalyticsData {
  period: {
    start: string;
    end: string;
    months: number;
  };
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    averageTicket: number;
    cancellationRate: number;
  };
  trends: {
    revenueChange: number;
    appointmentsChange: number;
  };
  monthlyRevenue: Array<{
    month: string;
    monthLabel: string;
    revenue: number;
  }>;
  popularServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    hourLabel: string;
    count: number;
  }>;
  appointmentsByDay: Array<{
    day: number;
    dayLabel: string;
    count: number;
  }>;
  staffStats: Array<{
    name: string;
    appointments: number;
    revenue: number;
  }>;
  statusCounts: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    pending: number;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-green-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPro, setRequiresPro] = useState(false);
  const [months, setMonths] = useState("1");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics?months=${months}`);
        const result = await response.json();
        
        if (!response.ok) {
          if (result.requiresPro) {
            setRequiresPro(true);
          } else {
            setError(result.error || "Error al cargar estadísticas");
          }
          return;
        }
        
        setData(result);
        setRequiresPro(false);
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [months]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requiresPro) {
    const previewData: AnalyticsData = {
      period: { start: "", end: "", months: 1 },
      summary: { totalAppointments: 48, totalRevenue: 84500, averageTicket: 3200, cancellationRate: 8 },
      trends: { revenueChange: 15, appointmentsChange: 12 },
      popularServices: [
        { name: "Corte de cabello", count: 18, revenue: 27000 },
        { name: "Coloración", count: 12, revenue: 36000 },
        { name: "Peinado", count: 10, revenue: 15000 },
        { name: "Tratamiento", count: 8, revenue: 6500 },
      ],
      peakHours: [
        { hour: 10, hourLabel: "10:00", count: 12 },
        { hour: 11, hourLabel: "11:00", count: 9 },
        { hour: 14, hourLabel: "14:00", count: 8 },
        { hour: 16, hourLabel: "16:00", count: 7 },
      ],
      appointmentsByDay: [
        { day: 0, dayLabel: "Dom", count: 3 },
        { day: 1, dayLabel: "Lun", count: 8 },
        { day: 2, dayLabel: "Mar", count: 9 },
        { day: 3, dayLabel: "Mié", count: 7 },
        { day: 4, dayLabel: "Jue", count: 10 },
        { day: 5, dayLabel: "Vie", count: 11 },
        { day: 6, dayLabel: "Sáb", count: 6 },
      ],
      statusCounts: { total: 48, confirmed: 40, cancelled: 4, pending: 4, completed: 0, noShow: 0 },
      monthlyRevenue: [],
      staffStats: [
        { name: "Ana García", appointments: 24, revenue: 42000 },
        { name: "Carlos López", appointments: 16, revenue: 28800 },
        { name: "María Torres", appointments: 8, revenue: 13700 },
      ],
    };
    const maxDayPreview = Math.max(...previewData.appointmentsByDay.map((d) => d.count), 1);
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">
          <PreviewAnalytics data={previewData} maxDayCount={maxDayPreview} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="shadow-2xl max-w-sm w-full mx-4">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Crown className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reportes y Analytics</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Accede a estadísticas detalladas: ingresos, servicios populares, horarios pico y rendimiento del equipo.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button className="gap-2 w-full">
                  <Crown className="h-4 w-4" />
                  Actualizar a PRO
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  if (!data) return null;

  const maxDayCount = Math.max(...data.appointmentsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reportes y Analytics
          </h1>
          <p className="text-muted-foreground">
            Estadísticas detalladas de tu negocio
          </p>
        </div>
        <Select value={months} onValueChange={(value) => value && setMonths(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Último mes</SelectItem>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendBadge value={data.trends.revenueChange} />
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalAppointments}</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendBadge value={data.trends.appointmentsChange} />
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.averageTicket)}</div>
            <p className="text-xs text-muted-foreground mt-1">Por cita confirmada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cancelación</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.cancellationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.statusCounts.cancelled} de {data.statusCounts.total} citas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Servicios Populares */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Servicios Más Populares</CardTitle>
            <CardDescription>Top 5 servicios por cantidad de citas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.popularServices.length > 0 ? (
              <div className="space-y-4">
                {data.popularServices.map((service, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">
                        {service.count} citas · {formatCurrency(service.revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(service.count / data.popularServices[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos suficientes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Horarios Pico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios Pico
            </CardTitle>
            <CardDescription>Horas con más reservas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.peakHours.length > 0 ? (
              <div className="space-y-3">
                {data.peakHours.map((hour, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded w-16 text-center">
                      {hour.hourLabel}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{
                          width: `${(hour.count / data.peakHours[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{hour.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos suficientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointments by Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Citas por Día de la Semana</CardTitle>
          <CardDescription>Distribución semanal de reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {data.appointmentsByDay.map((day) => {
              const heightPercent = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium">{day.count}</span>
                  <div className="w-full bg-muted rounded-t-md relative" style={{ height: "100px" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.dayLabel}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance */}
      {data.staffStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rendimiento del Equipo
            </CardTitle>
            <CardDescription>Citas e ingresos por profesional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Profesional</th>
                    <th className="text-right py-3 px-2 font-medium">Citas</th>
                    <th className="text-right py-3 px-2 font-medium">Ingresos</th>
                    <th className="text-right py-3 px-2 font-medium">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffStats.map((staff, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{staff.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">{staff.appointments}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(staff.revenue)}</td>
                      <td className="text-right py-3 px-2 text-muted-foreground">
                        {formatCurrency(staff.appointments > 0 ? staff.revenue / staff.appointments : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado de Citas</CardTitle>
          <CardDescription>Desglose por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{data.statusCounts.pending}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.statusCounts.confirmed}</div>
              <div className="text-xs text-muted-foreground">Confirmadas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.statusCounts.completed}</div>
              <div className="text-xs text-muted-foreground">Completadas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.statusCounts.cancelled}</div>
              <div className="text-xs text-muted-foreground">Canceladas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{data.statusCounts.noShow}</div>
              <div className="text-xs text-muted-foreground">No asistieron</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewAnalytics({ data, maxDayCount }: { data: AnalyticsData; maxDayCount: number }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.averageTicket)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cancelación</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.cancellationRate}%</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Servicios Más Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.popularServices.map((service, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-muted-foreground">{service.count} citas</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(service.count / data.popularServices[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citas por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {data.appointmentsByDay.map((day) => {
                const heightPercent = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-medium">{day.count}</span>
                    <div className="w-full bg-muted rounded-t-md relative" style={{ height: "100px" }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md" style={{ height: `${heightPercent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
