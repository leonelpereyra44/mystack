"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Save,
  Loader2,
  AlertTriangle,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
interface SystemConfigs {
  maintenance_mode?: string;
  maintenance_message?: string;
  site_announcement?: string;
  announcement_color?: string;
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // System config state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "Estamos realizando mantenimiento. Volvemos pronto."
  );
  const [announcement, setAnnouncement] = useState("");
  const [announcementColor, setAnnouncementColor] = useState("info");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const settingsRes = await fetch("/api/admin/settings");

      if (settingsRes.ok) {
        const { configs } = (await settingsRes.json()) as { configs: SystemConfigs };
        setMaintenanceMode(configs.maintenance_mode === "true");
        setMaintenanceMessage(
          configs.maintenance_message ||
            "Estamos realizando mantenimiento. Volvemos pronto."
        );
        setAnnouncement(configs.site_announcement || "");
        setAnnouncementColor(configs.announcement_color || "info");
      }
    } catch {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance_mode: String(maintenanceMode),
          maintenance_message: maintenanceMessage,
          site_announcement: announcement,
          announcement_color: announcementColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
        return;
      }

      toast.success("Configuración guardada correctamente");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Ajustes globales de la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Recargar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      <Separator />

      {/* Site Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Anuncio del sitio
          </CardTitle>
          <CardDescription>
            Banner de anuncio en la landing page. Déjalo vacío para ocultarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="announcement">Texto del anuncio</Label>
            <Textarea
              id="announcement"
              rows={2}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Ej: 🎉 ¡50% OFF en el Plan PRO este mes! Usá el código VERANO2025"
            />
            <p className="text-xs text-muted-foreground">
              Puede incluir emojis. Se mostrará en la landing page.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Color del anuncio</Label>
            <div className="flex gap-2">
              {[
                { value: "info", label: "Azul", className: "bg-blue-100 border-blue-300 text-blue-800" },
                { value: "warning", label: "Naranja", className: "bg-orange-100 border-orange-300 text-orange-800" },
                { value: "success", label: "Verde", className: "bg-green-100 border-green-300 text-green-800" },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setAnnouncementColor(color.value)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    color.className
                  } ${
                    announcementColor === color.value
                      ? "ring-2 ring-offset-1 ring-current"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {announcement && (
            <div
              className={`rounded-lg border p-3 text-sm font-medium ${
                announcementColor === "warning"
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : announcementColor === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <strong>Preview:</strong> {announcement}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className={maintenanceMode ? "border-destructive" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${maintenanceMode ? "text-destructive" : ""}`} />
            Modo Mantenimiento
          </CardTitle>
          <CardDescription>
            Muestra una página de mantenimiento a todos los visitantes (excepto admins).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className={maintenanceMode ? "text-destructive font-semibold" : ""}>
                {maintenanceMode ? "⚠️ Modo mantenimiento ACTIVO" : "Modo mantenimiento"}
              </Label>
              <p className="text-sm text-muted-foreground">
                Los visitantes verán la página de mantenimiento
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          {maintenanceMode && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  El sitio está en mantenimiento. Solo los administradores pueden acceder.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-msg">Mensaje de mantenimiento</Label>
            <Textarea
              id="maintenance-msg"
              rows={2}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Estamos realizando mantenimiento. Volvemos pronto."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar todos los cambios
        </Button>
      </div>
    </div>
  );
}

