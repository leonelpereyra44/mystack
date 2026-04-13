"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Loader2,
  TrendingUp,
  Users,
  Building2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  businesses: {
    total: number;
    today: number;
    byType: Array<{ type: string; count: number }>;
  };
  appointments: {
    total: number;
    today: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    cancellationRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error al cargar estadísticas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">
          Análisis detallado de la plataforma
        </p>
      </div>

      {/* Growth Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios hoy</CardDescription>
            <CardTitle className="text-3xl">{stats.users.today}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Nuevos registros</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Esta semana</CardDescription>
            <CardTitle className="text-3xl">{stats.users.thisWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>Usuarios nuevos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este mes</CardDescription>
            <CardTitle className="text-3xl">{stats.users.thisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>Usuarios nuevos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.users.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>Usuarios registrados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reservas
            </CardTitle>
            <CardDescription>Estadísticas de citas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{stats.appointments.today}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Este mes</p>
                <p className="text-2xl font-bold">{stats.appointments.thisMonth}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.appointments.completed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{stats.appointments.cancelled}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasa de cancelación</span>
                <span className={`text-lg font-bold ${
                  Number(stats.appointments.cancellationRate) > 20 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats.appointments.cancellationRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tipos de Negocio
            </CardTitle>
            <CardDescription>Distribución por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.businesses.byType.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay datos disponibles
              </p>
            ) : (
              <div className="space-y-3">
                {stats.businesses.byType.map((type, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ 
                          width: `${Math.max(20, (type.count / stats.businesses.total) * 100)}px` 
                        }}
                      />
                      <span className="text-sm font-medium w-8 text-right">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
