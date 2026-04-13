"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  CreditCard, 
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    recent: Array<{
      id: string;
      name: string | null;
      email: string;
      createdAt: string;
      image: string | null;
    }>;
  };
  businesses: {
    total: number;
    today: number;
    byType: Array<{ type: string; count: number }>;
    recent: Array<{
      id: string;
      name: string;
      slug: string;
      businessType: string | null;
      createdAt: string;
      subscription: { plan: string } | null;
    }>;
  };
  subscriptions: {
    pro: number;
    free: number;
    cancelled: number;
    mrr: number;
  };
  appointments: {
    total: number;
    today: number;
    thisMonth: number;
    cancelled: number;
    completed: number;
    cancellationRate: number;
  };
}

export default function AdminDashboard() {
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

  const statCards = [
    {
      title: "Usuarios",
      value: stats.users.total,
      change: `+${stats.users.thisWeek} esta semana`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Negocios",
      value: stats.businesses.total,
      change: `+${stats.businesses.today} hoy`,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Suscripciones PRO",
      value: stats.subscriptions.pro,
      change: `${stats.subscriptions.free} gratuitas`,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "MRR",
      value: `$${stats.subscriptions.mrr.toLocaleString("es-AR")}`,
      change: "Ingresos mensuales",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Reservas",
      value: stats.appointments.total,
      change: `+${stats.appointments.today} hoy`,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Tasa cancelación",
      value: `${stats.appointments.cancellationRate}%`,
      change: `${stats.appointments.cancelled} canceladas`,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Resumen general de MyStack
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Usuarios Recientes</CardTitle>
              <CardDescription>Últimos registros</CardDescription>
            </div>
            <Link 
              href="/admin/users"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.users.recent.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              ))}
              {stats.users.recent.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay usuarios registrados
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Negocios Recientes</CardTitle>
              <CardDescription>Últimos registros</CardDescription>
            </div>
            <Link 
              href="/admin/businesses"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.businesses.recent.map((business) => (
                <div key={business.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {business.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      /{business.slug}
                    </p>
                  </div>
                  <Badge variant={business.subscription?.plan === "PRO" ? "default" : "secondary"}>
                    {business.subscription?.plan || "FREE"}
                  </Badge>
                </div>
              ))}
              {stats.businesses.recent.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay negocios registrados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Types Distribution */}
      {stats.businesses.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.businesses.byType.map((type, i) => (
                <Badge key={i} variant="outline" className="text-sm py-1 px-3">
                  {type.type}: {type.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
