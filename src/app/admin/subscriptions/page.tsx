"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  CreditCard, 
  Loader2,
  Crown,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SyncDetail {
  business: string;
  plan: string;
  result: "updated" | "skipped" | "failed";
  oldPrice?: number;
  newPrice?: number;
  error?: string;
}

interface SyncResult {
  updated: number;
  skipped: number;
  failed: number;
  details: SyncDetail[];
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pro: 0, free: 0, mrr: 0 });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const fetchSubscriptions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const [statsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetchSubscriptions(1),
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            pro: statsData.subscriptions.pro,
            free: statsData.subscriptions.free,
            mrr: statsData.subscriptions.mrr,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }
    fetchInitial();
  }, [fetchSubscriptions]);

  const handleSyncPrices = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/subscriptions/sync-prices", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al sincronizar");
        return;
      }
      setSyncResult(data);
      if (data.updated > 0) {
        toast.success(`${data.updated} suscripción${data.updated !== 1 ? "es" : ""} actualizada${data.updated !== 1 ? "s" : ""} en MercadoPago.`);
      } else {
        toast.info("Todos los precios ya están sincronizados.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>;
      case "PAST_DUE":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Vencida</Badge>;
      case "PAUSED":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Pausada</Badge>;
      case "TRIALING":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pendiente de pago</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground">Gestión de planes y facturación</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones PRO</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pro}</div>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan Gratuito</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
            <p className="text-xs text-muted-foreground">Negocios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.mrr.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground">Ingresos mensuales</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Suscripciones</CardTitle>
            <CardDescription>
              {pagination.total} resultado{pagination.total !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2" disabled={syncing}>
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Sincronizar precios
                </Button>
              }
            />
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Sincronizar precios con MercadoPago</DialogTitle>
                <DialogDescription className="space-y-2">
                  <span className="block">
                    Esta acción actualizará el monto de cobro en MercadoPago de todas las
                    suscripciones activas para que coincida con el precio actual en la tabla de planes.
                  </span>
                  <span className="block font-medium text-foreground">
                    Los suscriptores existentes comenzarán a pagar el nuevo precio en su próximo ciclo de facturación.
                  </span>
                  <span className="block text-xs">
                    Solo se modifican las suscripciones cuyo precio en MP difiere del configurado.
                    Esta operación puede tardar unos segundos.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                <DialogClose
                  render={
                    <Button onClick={handleSyncPrices} disabled={syncing}>
                      {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar sincronización
                    </Button>
                  }
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* Sync result summary */}
        {syncResult && (
          <div className="px-6 pb-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-6 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {syncResult.updated} actualizada{syncResult.updated !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  {syncResult.skipped} sin cambios
                </span>
                {syncResult.failed > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {syncResult.failed} error{syncResult.failed !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
              {syncResult.details.filter((d) => d.result !== "skipped").length > 0 && (
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {syncResult.details
                    .filter((d) => d.result !== "skipped")
                    .map((d, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {d.result === "updated" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600 shrink-0" />
                        )}
                        <span className="font-medium">{d.business}</span>
                        {d.result === "updated" && (
                          <span>
                            ${d.oldPrice?.toLocaleString("es-AR")} → ${d.newPrice?.toLocaleString("es-AR")}
                          </span>
                        )}
                        {d.result === "failed" && <span className="text-red-600">{d.error}</span>}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>No hay suscripciones</p>
            </div>
          ) : (
            <>
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
                          <p className="text-sm text-muted-foreground">/{sub.business.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sub.plan !== "FREE"
                              ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]"
                              : ""
                          }
                          variant={sub.plan !== "FREE" ? "default" : "secondary"}
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSubscriptions(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSubscriptions(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
