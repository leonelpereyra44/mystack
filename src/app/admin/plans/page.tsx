"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Check,
  Infinity,
  Crown,
  Zap,
  Building2,
  Star,
  Sparkles,
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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type PlanType = "FREE" | "BASIC" | "PRO" | "PREMIUM" | "ENTERPRISE";

const ALL_PLAN_SLOTS: PlanType[] = ["FREE", "BASIC", "PRO", "PREMIUM", "ENTERPRISE"];

const PLAN_SLOT_LABELS: Record<PlanType, string> = {
  FREE: "Gratuito (FREE)",
  BASIC: "Básico (BASIC)",
  PRO: "Profesional (PRO)",
  PREMIUM: "Premium (PREMIUM)",
  ENTERPRISE: "Empresarial (ENTERPRISE)",
};

interface PlanConfig {
  id: string;
  plan: PlanType;
  name: string;
  description: string | null;
  price: string;
  maxReservationsPerMonth: number | null;
  maxStaff: number | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

function PlanIcon({ plan }: { plan: string }) {
  if (plan === "PRO")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
        <Crown className="h-5 w-5 text-white" />
      </div>
    );
  if (plan === "PREMIUM")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
    );
  if (plan === "ENTERPRISE")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700">
        <Building2 className="h-5 w-5 text-white" />
      </div>
    );
  if (plan === "BASIC")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-600">
        <Star className="h-5 w-5 text-white" />
      </div>
    );
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
      <Zap className="h-5 w-5 text-white" />
    </div>
  );
}

function EditPlanDialog({
  plan,
  onSaved,
}: {
  plan: PlanConfig;
  onSaved: (updated: PlanConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description ?? "",
    price: String(plan.price),
    maxReservationsPerMonth:
      plan.maxReservationsPerMonth === null
        ? ""
        : String(plan.maxReservationsPerMonth),
    maxStaff: plan.maxStaff === null ? "" : String(plan.maxStaff),
    isActive: plan.isActive,
    newFeature: "",
    features: [...plan.features],
  });

  const addFeature = () => {
    const f = form.newFeature.trim();
    if (!f || form.features.includes(f)) return;
    setForm((p) => ({ ...p, features: [...p.features, f], newFeature: "" }));
  };

  const removeFeature = (idx: number) => {
    setForm((p) => ({
      ...p,
      features: p.features.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price) || 0,
          maxReservationsPerMonth: form.maxReservationsPerMonth
            ? parseInt(form.maxReservationsPerMonth)
            : null,
          maxStaff: form.maxStaff ? parseInt(form.maxStaff) : null,
          features: form.features,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
        return;
      }
      const data = await res.json();
      onSaved(data.plan);
      toast.success("Plan actualizado");
      setOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Editar Plan {plan.plan}</DialogTitle>
        <DialogDescription>
          Modifica los detalles del plan. Los cambios aplican a nuevas
          suscripciones.
        </DialogDescription>

        <div className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`name-${plan.id}`}>Nombre</Label>
              <Input
                id={`name-${plan.id}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`price-${plan.id}`}>
                Precio mensual (ARS)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id={`price-${plan.id}`}
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`desc-${plan.id}`}>Descripción</Label>
            <Textarea
              id={`desc-${plan.id}`}
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Descripción breve del plan..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`res-${plan.id}`}>
                Reservas/mes
              </Label>
              <Input
                id={`res-${plan.id}`}
                type="number"
                min={1}
                value={form.maxReservationsPerMonth}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    maxReservationsPerMonth: e.target.value,
                  }))
                }
                placeholder="Vacío = ilimitado"
              />
              <p className="text-xs text-muted-foreground">
                Dejar vacío para ilimitado
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`staff-${plan.id}`}>
                Máx. staff
              </Label>
              <Input
                id={`staff-${plan.id}`}
                type="number"
                min={1}
                value={form.maxStaff}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxStaff: e.target.value }))
                }
                placeholder="Vacío = ilimitado"
              />
              <p className="text-xs text-muted-foreground">
                Dejar vacío para ilimitado
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Características</Label>
            <div className="space-y-1.5">
              {form.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span className="flex-1 text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nueva característica..."
                value={form.newFeature}
                onChange={(e) =>
                  setForm((p) => ({ ...p, newFeature: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Plan activo</Label>
              <p className="text-xs text-muted-foreground">
                Si está inactivo, no se mostrará en la landing
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, isActive: checked }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlanDialog({
  existingPlanKeys,
  onCreated,
}: {
  existingPlanKeys: PlanType[];
  onCreated: (plan: PlanConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const available = ALL_PLAN_SLOTS.filter((s) => !existingPlanKeys.includes(s));

  const emptyForm = {
    plan: available[0] ?? ("" as PlanType),
    name: "",
    description: "",
    price: "0",
    maxReservationsPerMonth: "",
    maxStaff: "",
    isActive: true,
    newFeature: "",
    features: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  const addFeature = () => {
    const f = form.newFeature.trim();
    if (!f || form.features.includes(f)) return;
    setForm((p) => ({ ...p, features: [...p.features, f], newFeature: "" }));
  };

  const removeFeature = (idx: number) => {
    setForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));
  };

  const handleCreate = async () => {
    if (!form.plan || !form.name) {
      toast.error("El tipo de plan y el nombre son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: form.plan,
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price) || 0,
          maxReservationsPerMonth: form.maxReservationsPerMonth
            ? parseInt(form.maxReservationsPerMonth)
            : null,
          maxStaff: form.maxStaff ? parseInt(form.maxStaff) : null,
          features: form.features,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al crear plan");
        return;
      }
      const data = await res.json();
      onCreated(data.plan);
      toast.success("Plan creado");
      setForm(emptyForm);
      setOpen(false);
    } catch {
      toast.error("Error al crear plan");
    } finally {
      setSaving(false);
    }
  };

  if (available.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Añadir plan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Nuevo Plan</DialogTitle>
        <DialogDescription>
          Crea un nuevo plan de suscripción. Aparecerá en la landing page automáticamente.
        </DialogDescription>

        <div className="space-y-4 mt-2">
          {/* Plan type selector */}
          <div className="space-y-1.5">
            <Label>Tipo de plan</Label>
            <div className="flex flex-wrap gap-2">
              {available.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, plan: slot }))}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    form.plan === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  {PLAN_SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Nombre</Label>
              <input
                id="new-name"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={PLAN_SLOT_LABELS[form.plan]?.split(" ")[0] ?? "Nombre"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-price">Precio mensual (ARS)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  id="new-price"
                  type="number"
                  min={0}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-7 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Descripción</Label>
            <Textarea
              id="new-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descripción breve del plan..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-res">Reservas/mes</Label>
              <Input
                id="new-res"
                type="number"
                min={1}
                value={form.maxReservationsPerMonth}
                onChange={(e) => setForm((p) => ({ ...p, maxReservationsPerMonth: e.target.value }))}
                placeholder="Vacío = ilimitado"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-staff">Máx. staff</Label>
              <Input
                id="new-staff"
                type="number"
                min={1}
                value={form.maxStaff}
                onChange={(e) => setForm((p) => ({ ...p, maxStaff: e.target.value }))}
                placeholder="Vacío = ilimitado"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Características</Label>
            <div className="space-y-1.5">
              {form.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span className="flex-1 text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nueva característica..."
                value={form.newFeature}
                onChange={(e) => setForm((p) => ({ ...p, newFeature: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Plan activo</Label>
              <p className="text-xs text-muted-foreground">Visible en la landing page</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => toast.error("Error al cargar planes"))
      .finally(() => setLoading(false));
  }, []);

  const handlePlanSaved = (updated: PlanConfig) => {
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePlanCreated = (created: PlanConfig) => {
    setPlans((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
  };

  const handleDelete = async (plan: PlanConfig) => {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(plan.id);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar");
        return;
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success(`Plan "${plan.name}" eliminado`);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const formatLimit = (val: number | null, suffix: string) =>
    val === null ? (
      <span className="flex items-center gap-1 font-medium">
        <Infinity className="h-4 w-4" /> ilimitado
      </span>
    ) : (
      <span className="font-medium">
        {val.toLocaleString("es-AR")} {suffix}
      </span>
    );

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
          <h1 className="text-3xl font-bold">Planes</h1>
          <p className="text-muted-foreground">
            Configura los planes de suscripción disponibles
          </p>
        </div>
        <CreatePlanDialog
          existingPlanKeys={plans.map((p) => p.plan)}
          onCreated={handlePlanCreated}
        />
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Nota:</strong> Los cambios de precio aplican solo a nuevas
          suscripciones. Los planes existentes mantienen su precio original.
          Para ofertas temporales, usa la sección de{" "}
          <Link href="/admin/promotions" className="underline font-medium">
            Promociones
          </Link>
          .
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.plan === "PRO"
                ? "border-amber-200 dark:border-amber-800 ring-1 ring-amber-100 dark:ring-amber-900"
                : ""
            }
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <PlanIcon plan={plan.plan} />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono"
                      >
                        {plan.plan}
                      </Badge>
                      {!plan.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditPlanDialog plan={plan} onSaved={handlePlanSaved} />
                  {plan.plan !== "FREE" && plan.plan !== "PRO" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan)}
                      disabled={deletingId === plan.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === plan.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="flex items-baseline gap-1">
                {parseFloat(plan.price) === 0 ? (
                  <span className="text-3xl font-bold">Gratis</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">
                      ${parseFloat(plan.price).toLocaleString("es-AR")}
                    </span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </>
                )}
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Reservas/mes
                  </p>
                  {formatLimit(plan.maxReservationsPerMonth, "")}
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Staff máx.
                  </p>
                  {formatLimit(plan.maxStaff, "")}
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  CARACTERÍSTICAS ({plan.features.length})
                </p>
                <ul className="space-y-1">
                  {(plan.features as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Distribución de planes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ve la distribución actual en{" "}
            <Link href="/admin/subscriptions" className="underline font-medium">
              Suscripciones
            </Link>{" "}
            y los ingresos en{" "}
            <Link href="/admin/analytics" className="underline font-medium">
              Estadísticas
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
