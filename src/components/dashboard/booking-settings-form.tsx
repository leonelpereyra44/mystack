"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Business {
  id: string;
  allowMultipleBookings: boolean;
  bookingInterval: number;
  slotCapacity: number;
  showPrices: boolean;
  showDurations: boolean;
  minBookingNotice: number;
  welcomeMessage: string | null;
}

interface BookingSettingsFormProps {
  business: Business;
}

export function BookingSettingsForm({ business }: BookingSettingsFormProps) {
  const router = useRouter();
  const [allowMultiple, setAllowMultiple] = useState(business.allowMultipleBookings);
  const [savingBookingSettings, setSavingBookingSettings] = useState(false);
  const [bookingInterval, setBookingInterval] = useState(business.bookingInterval);
  const [savingInterval, setSavingInterval] = useState(false);
  const [slotCapacity, setSlotCapacity] = useState(business.slotCapacity);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [showPrices, setShowPrices] = useState(business.showPrices);
  const [showDurations, setShowDurations] = useState(business.showDurations);
  const [minBookingNotice, setMinBookingNotice] = useState(business.minBookingNotice);
  const [savingMinNotice, setSavingMinNotice] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(business.welcomeMessage ?? "");
  const [savingWelcomeMessage, setSavingWelcomeMessage] = useState(false);

  const handleBookingSettingsChange = async (allowMultipleBookings: boolean) => {
    setSavingBookingSettings(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowMultipleBookings }),
      });

      if (response.ok) {
        setAllowMultiple(allowMultipleBookings);
        toast.success("Configuración actualizada");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingBookingSettings(false);
    }
  };

  const handleIntervalChange = async (value: string | null) => {
    if (!value) return;
    const interval = parseInt(value);
    setSavingInterval(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingInterval: interval }),
      });

      if (response.ok) {
        setBookingInterval(interval);
        toast.success("Intervalo actualizado");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingInterval(false);
    }
  };

  const handleCapacityChange = async (value: number) => {
    setSavingCapacity(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotCapacity: value }),
      });

      if (response.ok) {
        setSlotCapacity(value);
        toast.success("Capacidad actualizada");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleToggleField = async (
    field: "showPrices" | "showDurations",
    value: boolean
  ) => {
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (response.ok) {
        if (field === "showPrices") setShowPrices(value);
        else setShowDurations(value);
        toast.success("Configuración actualizada");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    }
  };

  const handleMinNoticeBlur = async () => {
    if (minBookingNotice === business.minBookingNotice) return;
    setSavingMinNotice(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minBookingNotice }),
      });
      if (response.ok) {
        toast.success("Antelación mínima actualizada");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingMinNotice(false);
    }
  };

  const handleWelcomeMessageBlur = async () => {
    const newVal = welcomeMessage.trim() || null;
    if (newVal === business.welcomeMessage) return;
    setSavingWelcomeMessage(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ welcomeMessage: newVal }),
      });
      if (response.ok) {
        toast.success("Mensaje de bienvenida actualizado");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingWelcomeMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Múltiples reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas múltiples</CardTitle>
          <CardDescription>
            Controla si los clientes pueden tener más de un turno activo al mismo tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir múltiples reservas</Label>
              <p className="text-sm text-muted-foreground">
                {allowMultiple
                  ? "Los clientes pueden tener varios turnos activos al mismo tiempo"
                  : "Los clientes solo pueden tener 1 turno activo a la vez"}
              </p>
            </div>
            <Button
              variant={allowMultiple ? "default" : "outline"}
              size="sm"
              disabled={savingBookingSettings}
              onClick={() => handleBookingSettingsChange(!allowMultiple)}
            >
              {savingBookingSettings ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : allowMultiple ? (
                "Activado"
              ) : (
                "Desactivado"
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-4 flex gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">¿Cuándo activar?</p>
              <ul className="mt-1 space-y-1">
                <li>
                  • <strong>Desactivado:</strong> Ideal para barberías, peluquerías,
                  consultorios (evita reservas duplicadas)
                </li>
                <li>
                  • <strong>Activado:</strong> Ideal para gimnasios, clases grupales,
                  canchas (un cliente puede reservar varias clases)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempos y capacidad */}
      <Card>
        <CardHeader>
          <CardTitle>Tiempos y capacidad</CardTitle>
          <CardDescription>
            Define los intervalos de reserva y la capacidad máxima por turno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Intervalo entre turnos</Label>
              <p className="text-sm text-muted-foreground">
                Cada cuánto tiempo puede empezar un nuevo turno
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingInterval && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Select
                value={String(bookingInterval)}
                onValueChange={handleIntervalChange}
                disabled={savingInterval}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Capacidad por turno</Label>
              <p className="text-sm text-muted-foreground">
                Cantidad máxima de personas que pueden reservar el mismo horario
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingCapacity && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Input
                type="number"
                min={1}
                max={50}
                value={slotCapacity}
                disabled={savingCapacity}
                className="w-[100px] text-center"
                onChange={(e) => {
                  const val = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
                  setSlotCapacity(val);
                }}
                onBlur={(e) => {
                  const val = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
                  if (val !== business.slotCapacity) {
                    handleCapacityChange(val);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Antelación mínima</Label>
              <p className="text-sm text-muted-foreground">
                Horas de anticipación mínima para poder realizar una reserva (0 = sin límite)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingMinNotice && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={minBookingNotice}
                  disabled={savingMinNotice}
                  className="w-[80px] text-center"
                  onChange={(e) =>
                    setMinBookingNotice(
                      Math.min(72, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  onBlur={handleMinNoticeBlur}
                />
                <span className="text-sm text-muted-foreground">hs</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibilidad en la página pública */}
      <Card>
        <CardHeader>
          <CardTitle>Visibilidad en la página pública</CardTitle>
          <CardDescription>
            Elige qué información ven los clientes al reservar un turno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Mostrar precios</Label>
              <p className="text-sm text-muted-foreground">
                Muestra el precio de cada servicio en la página de reservas
              </p>
            </div>
            <Switch
              checked={showPrices}
              onCheckedChange={(v) => handleToggleField("showPrices", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Mostrar duración</Label>
              <p className="text-sm text-muted-foreground">
                Muestra la duración de cada servicio en la página de reservas
              </p>
            </div>
            <Switch
              checked={showDurations}
              onCheckedChange={(v) => handleToggleField("showDurations", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de bienvenida */}
      <Card>
        <CardHeader>
          <CardTitle>Mensaje de bienvenida</CardTitle>
          <CardDescription>
            Texto personalizado que se muestra al inicio del formulario de reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Textarea
              placeholder="Ej: ¡Gracias por elegirnos! Recordá traer tu documento."
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              onBlur={handleWelcomeMessageBlur}
              disabled={savingWelcomeMessage}
              rows={3}
              className="resize-none"
            />
            {savingWelcomeMessage && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
