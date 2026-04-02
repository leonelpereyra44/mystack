"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check, Crown, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionData {
  subscription: {
    plan: "FREE" | "PRO";
    status: string;
    currentPeriodEnd: string | null;
  };
  planInfo: {
    name: string;
    price: number;
    features: string[];
  };
  usage: {
    reservationsThisMonth: number;
    maxReservations: number;
    staffCount: number;
    maxStaff: number;
    reservationsPercentage: number;
  };
}

const PRO_FEATURES = [
  "Staff ilimitado",
  "Reservas ilimitadas",
  "Recordatorios automáticos",
  "Reportes y estadísticas",
  "Sin marca MyStack",
  "Soporte prioritario WhatsApp",
];

export function SubscriptionCard() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Mostrar mensaje según parámetros de URL (retorno de MP)
  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");
    if (subscriptionStatus === "success") {
      toast.success("¡Suscripción activada! Ya tienes acceso al Plan Profesional.");
    } else if (subscriptionStatus === "error") {
      toast.error("Hubo un problema con el pago. Por favor, intenta nuevamente.");
    } else if (subscriptionStatus === "pending") {
      toast.info("El pago está siendo procesado. Te notificaremos cuando se confirme.");
    }
  }, [searchParams]);

  // Cargar datos de suscripción
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setData(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.initPoint) {
        // Redirigir a Mercado Pago
        window.location.href = result.initPoint;
      } else {
        toast.error(result.error || "Error al iniciar la suscripción");
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      toast.error("Error al procesar la solicitud");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Suscripción cancelada correctamente");
        setShowCancelDialog(false);
        // Recargar datos
        window.location.reload();
      } else {
        toast.error(result.error || "Error al cancelar la suscripción");
      }
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al procesar la solicitud");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se pudo cargar la información de suscripción
        </CardContent>
      </Card>
    );
  }

  const isPro = data.subscription.plan === "PRO";
  const isNearLimit = data.usage.reservationsPercentage >= 80;

  return (
    <>
      <Card className={isPro ? "border-[oklch(0.65_0.14_175)]" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Plan Actual
                {isPro && <Crown className="h-5 w-5 text-[oklch(0.65_0.14_175)]" />}
              </CardTitle>
              <CardDescription>
                Gestiona tu suscripción a MyStack
              </CardDescription>
            </div>
            <Badge 
              variant={isPro ? "default" : "secondary"}
              className={isPro ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]" : ""}
            >
              {data.planInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Uso actual (solo para plan FREE) */}
          {!isPro && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reservas este mes</span>
                <span className="font-medium">
                  {data.usage.reservationsThisMonth} / {data.usage.maxReservations}
                </span>
              </div>
              <Progress 
                value={data.usage.reservationsPercentage} 
                className={isNearLimit ? "[&>div]:bg-amber-500" : ""}
              />
              {isNearLimit && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Estás cerca del límite mensual. ¡Considera mejorar tu plan!</span>
                </div>
              )}
            </div>
          )}

          {/* Features del plan actual */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tu plan incluye:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.planInfo.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[oklch(0.65_0.14_175)]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Precio y acción */}
          {isPro ? (
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-semibold">
                  $15.000 <span className="text-muted-foreground font-normal">/mes</span>
                </p>
                {data.subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Próximo cobro: {new Date(data.subscription.currentPeriodEnd).toLocaleDateString("es-AR")}
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(true)}
                disabled={data.subscription.status === "CANCELLED"}
              >
                {data.subscription.status === "CANCELLED" ? "Cancelado" : "Cancelar plan"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-[oklch(0.65_0.14_175)]/30 p-4 bg-[oklch(0.65_0.14_175)]/5">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] p-2">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Mejora a Plan Profesional</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Desbloquea todo el potencial de MyStack por solo $15.000/mes
                  </p>
                  <ul className="space-y-1 mb-4">
                    {PRO_FEATURES.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-[oklch(0.65_0.14_175)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] hover:opacity-90"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Mejorar ahora
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar suscripción?</DialogTitle>
            <DialogDescription>
              Tu plan pasará a Gratuito al final del período actual. Perderás acceso a:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 py-4">
            {PRO_FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-destructive" />
                {feature}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Mantener plan
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sí, cancelar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
