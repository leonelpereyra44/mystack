"use client";

import { useState } from "react";
import { 
  Settings,
  Save,
  Loader2,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  
  // Valores actuales (hardcodeados por ahora, se pueden mover a BD)
  const [proPlanPrice, setProPlanPrice] = useState("15000");
  const [freeReservationsLimit, setFreeReservationsLimit] = useState("150");
  const [freeStaffLimit, setFreeStaffLimit] = useState("1");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado - en producción esto iría a una API
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Configuración guardada (demo)");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes globales de la plataforma
        </p>
      </div>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Precios
          </CardTitle>
          <CardDescription>
            Configuración de planes y precios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pro-price">Precio Plan PRO (ARS/mes)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="pro-price"
                  type="number"
                  value={proPlanPrice}
                  onChange={(e) => setProPlanPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Nota: Cambiar el precio solo afectará a nuevas suscripciones. 
            Las existentes mantienen su precio original.
          </p>
        </CardContent>
      </Card>

      {/* Free Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Límites Plan Gratuito
          </CardTitle>
          <CardDescription>
            Restricciones para el plan FREE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="free-reservations">Reservas por mes</Label>
              <Input
                id="free-reservations"
                type="number"
                value={freeReservationsLimit}
                onChange={(e) => setFreeReservationsLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-staff">Máximo de staff</Label>
              <Input
                id="free-staff"
                type="number"
                value={freeStaffLimit}
                onChange={(e) => setFreeStaffLimit(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Modo Mantenimiento
          </CardTitle>
          <CardDescription>
            Activar para bloquear acceso temporal a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo mantenimiento</Label>
              <p className="text-sm text-muted-foreground">
                Los usuarios verán una página de mantenimiento
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
          {maintenanceMode && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ El modo mantenimiento está activo. Los usuarios no podrán acceder.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Esta configuración está en modo demo. 
            Para implementar cambios persistentes, se necesita crear una tabla 
            de configuración en la base de datos y una API correspondiente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
