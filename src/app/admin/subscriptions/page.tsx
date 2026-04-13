"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Loader2,
  Crown,
  TrendingUp,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pro: 0,
    free: 0,
    mrr: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, subsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/subscriptions"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            pro: statsData.subscriptions.pro,
            free: statsData.subscriptions.free,
            mrr: statsData.subscriptions.mrr,
          });
        }

        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setSubscriptions(subsData.subscriptions);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>;
      case "PAST_DUE":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Vencida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground">
          Gestión de planes y facturación
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suscripciones PRO
            </CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pro}</div>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan Gratuito
            </CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
            <p className="text-xs text-muted-foreground">Negocios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.mrr.toLocaleString("es-AR")}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos mensuales</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suscripciones PRO</CardTitle>
          <CardDescription>Lista de suscripciones activas y pasadas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>No hay suscripciones PRO</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Próximo cobro</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.business.name}</p>
                        <p className="text-sm text-muted-foreground">
                          /{sub.business.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          sub.plan === "PRO"
                            ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]"
                            : ""
                        }
                        variant={sub.plan === "PRO" ? "default" : "secondary"}
                      >
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.currentPeriodEnd 
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("es-AR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
