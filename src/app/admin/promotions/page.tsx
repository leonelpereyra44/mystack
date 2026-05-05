"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tag,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  appliesTo: ("FREE" | "PRO")[];
  startsAt: string;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

type PromoStatus = "active" | "scheduled" | "expired" | "inactive";

function getPromoStatus(promo: Promotion): PromoStatus {
  if (!promo.isActive) return "inactive";
  const now = new Date();
  const starts = new Date(promo.startsAt);
  const ends = promo.endsAt ? new Date(promo.endsAt) : null;
  if (starts > now) return "scheduled";
  if (ends && ends < now) return "expired";
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return "expired";
  return "active";
}

function StatusBadge({ status }: { status: PromoStatus }) {
  const config = {
    active: {
      label: "Activa",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    scheduled: {
      label: "Programada",
      icon: Clock,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    expired: {
      label: "Vencida",
      icon: XCircle,
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    inactive: {
      label: "Inactiva",
      icon: AlertCircle,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  } as const;

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={`${className} hover:${className} flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  discountValue: "",
  appliesToFree: false,
  appliesToPro: true,
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: "",
  maxUses: "",
  isActive: true,
};

function PromoForm({
  initial,
  onSubmit,
  saving,
}: {
  initial: typeof EMPTY_FORM;
  onSubmit: (data: typeof EMPTY_FORM) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);

  const set = (key: keyof typeof EMPTY_FORM, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre de la oferta *</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Lanzamiento 50% OFF"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Código (opcional)</Label>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="Ej: VERANO2025"
            className="font-mono uppercase"
          />
          <p className="text-xs text-muted-foreground">
            Sin código = se aplica automáticamente
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descripción (opcional)</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descripción visible para el usuario..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo de descuento *</Label>
          <Select
            value={form.discountType}
            onValueChange={(v) => set("discountType", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">
                <span className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5" />
                  Porcentaje (%)
                </span>
              </SelectItem>
              <SelectItem value="FIXED">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Monto fijo (ARS)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Valor del descuento *{" "}
            <span className="text-muted-foreground font-normal">
              ({form.discountType === "PERCENTAGE" ? "1-100%" : "ARS"})
            </span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {form.discountType === "PERCENTAGE" ? "%" : "$"}
            </span>
            <Input
              type="number"
              min={1}
              max={form.discountType === "PERCENTAGE" ? 100 : undefined}
              value={form.discountValue}
              onChange={(e) => set("discountValue", e.target.value)}
              className="pl-7"
              placeholder={form.discountType === "PERCENTAGE" ? "50" : "5000"}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aplica a planes *</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.appliesToFree}
              onCheckedChange={(v) => set("appliesToFree", !!v)}
            />
            <span className="text-sm">Plan Gratuito</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.appliesToPro}
              onCheckedChange={(v) => set("appliesToPro", !!v)}
            />
            <span className="text-sm">Plan PRO</span>
          </label>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Fecha de inicio *
          </Label>
          <Input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Fecha de fin (opcional)
          </Label>
          <Input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Vacío = sin vencimiento</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Máximo de usos (opcional)</Label>
        <Input
          type="number"
          min={1}
          value={form.maxUses}
          onChange={(e) => set("maxUses", e.target.value)}
          placeholder="Vacío = ilimitado"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Activa al guardar</p>
          <p className="text-xs text-muted-foreground">
            Si está desactivada, no se aplicará a ningún usuario
          </p>
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={(v) => set("isActive", v)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={() => onSubmit(form)} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      }
    } catch {
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const formToPayload = (form: typeof EMPTY_FORM) => ({
    name: form.name,
    code: form.code || null,
    description: form.description || null,
    discountType: form.discountType,
    discountValue: parseFloat(form.discountValue),
    appliesTo: [
      ...(form.appliesToFree ? ["FREE"] : []),
      ...(form.appliesToPro ? ["PRO"] : []),
    ],
    startsAt: form.startsAt,
    endsAt: form.endsAt || null,
    maxUses: form.maxUses ? parseInt(form.maxUses) : null,
    isActive: form.isActive,
  });

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    if (!form.name || !form.discountValue || !form.startsAt) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (!form.appliesToFree && !form.appliesToPro) {
      toast.error("Selecciona al menos un plan");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al crear"); return; }
      setPromotions((p) => [data.promotion, ...p]);
      toast.success("Promoción creada");
      setCreateOpen(false);
    } catch {
      toast.error("Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: typeof EMPTY_FORM) => {
    if (!editPromo) return;
    if (!form.name || !form.discountValue || !form.startsAt) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (!form.appliesToFree && !form.appliesToPro) {
      toast.error("Selecciona al menos un plan");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/promotions/${editPromo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al actualizar"); return; }
      setPromotions((p) =>
        p.map((x) => (x.id === editPromo.id ? data.promotion : x))
      );
      toast.success("Promoción actualizada");
      setEditPromo(null);
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción? Esta acción no se puede deshacer."))
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) { toast.error("Error al eliminar"); return; }
      setPromotions((p) => p.filter((x) => x.id !== id));
      toast.success("Promoción eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const promoToForm = (promo: Promotion): typeof EMPTY_FORM => ({
    name: promo.name,
    code: promo.code ?? "",
    description: promo.description ?? "",
    discountType: promo.discountType,
    discountValue: String(promo.discountValue),
    appliesToFree: promo.appliesTo.includes("FREE"),
    appliesToPro: promo.appliesTo.includes("PRO"),
    startsAt: new Date(promo.startsAt).toISOString().slice(0, 16),
    endsAt: promo.endsAt
      ? new Date(promo.endsAt).toISOString().slice(0, 16)
      : "",
    maxUses: promo.maxUses !== null ? String(promo.maxUses) : "",
    isActive: promo.isActive,
  });

  const activeCount = promotions.filter(
    (p) => getPromoStatus(p) === "active"
  ).length;
  const scheduledCount = promotions.filter(
    (p) => getPromoStatus(p) === "scheduled"
  ).length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promociones</h1>
          <p className="text-muted-foreground">
            Ofertas y descuentos por tiempo limitado
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva oferta
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogTitle>Crear nueva oferta</DialogTitle>
            <DialogDescription>
              Configura los detalles del descuento y su vigencia.
            </DialogDescription>
            <PromoForm
              initial={EMPTY_FORM}
              onSubmit={handleCreate}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Activas ahora</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledCount}</p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {promotions.reduce((a, b) => a + b.usedCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Usos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            Todas las promociones
          </CardTitle>
          <CardDescription>
            {promotions.length === 0
              ? "No hay promociones creadas aún"
              : `${promotions.length} promoción${promotions.length !== 1 ? "es" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <Tag className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Sin promociones</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Crea tu primera oferta para atraer nuevos suscriptores con
                descuentos por tiempo limitado.
              </p>
              <Button
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primera oferta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Planes</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promo) => {
                    const status = getPromoStatus(promo);
                    return (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{promo.name}</p>
                            {promo.code && (
                              <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">
                                {promo.code}
                              </code>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {promo.discountType === "PERCENTAGE"
                              ? `${parseFloat(promo.discountValue)}%`
                              : `$${parseFloat(promo.discountValue).toLocaleString("es-AR")}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {promo.appliesTo.map((p) => (
                              <Badge
                                key={p}
                                variant="secondary"
                                className="text-xs"
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>
                              Desde:{" "}
                              {new Date(promo.startsAt).toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )}
                            </p>
                            {promo.endsAt ? (
                              <p>
                                Hasta:{" "}
                                {new Date(promo.endsAt).toLocaleDateString(
                                  "es-AR",
                                  { day: "2-digit", month: "short", year: "numeric" }
                                )}
                              </p>
                            ) : (
                              <p className="text-muted-foreground/60">Sin vencimiento</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {promo.usedCount}
                          </span>
                          {promo.maxUses !== null && (
                            <span className="text-muted-foreground">
                              /{promo.maxUses}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditPromo(promo)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(promo.id)}
                              disabled={deletingId === promo.id}
                            >
                              {deletingId === promo.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editPromo} onOpenChange={(o) => !o && setEditPromo(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle>Editar promoción</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la oferta.
          </DialogDescription>
          {editPromo && (
            <PromoForm
              initial={promoToForm(editPromo)}
              onSubmit={handleEdit}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
