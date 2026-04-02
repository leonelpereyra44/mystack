"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, ExternalLink, Info } from "lucide-react";
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
import { ChangePasswordForm } from "./change-password-form";
import { SubscriptionCard } from "./subscription-card";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  allowMultipleBookings: boolean;
  subscription: {
    plan: string;
    status: string;
  } | null;
}

interface SettingsFormProps {
  business: Business;
}

const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export function SettingsForm({ business }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(business.allowMultipleBookings);
  const [savingBookingSettings, setSavingBookingSettings] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: business.name,
      description: business.description || "",
      phone: business.phone || "",
      email: business.email || "",
      address: business.address || "",
    },
  });

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${business.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("¡Enlace copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

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

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Cambios guardados correctamente");
        router.refresh();
      } else {
        toast.error("Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error updating business:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Public URL */}
      <Card>
        <CardHeader>
          <CardTitle>Tu página de reservas</CardTitle>
          <CardDescription>
            Comparte este enlace con tus clientes para que puedan reservar turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={publicUrl} readOnly className="font-mono" />
            <Button variant="outline" size="icon" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <a href={`/${business.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-green-600">¡Enlace copiado!</p>
          )}
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
          <CardDescription>
            Esta información se mostrará en tu página pública
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="Describe brevemente tu negocio..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de contacto</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contacto@tunegocio.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Av. Corrientes 1234, CABA"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reservas</CardTitle>
          <CardDescription>
            Controla cómo los clientes pueden hacer reservas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir múltiples reservas</Label>
              <p className="text-sm text-muted-foreground">
                {allowMultiple 
                  ? "Los clientes pueden tener varios turnos activos al mismo tiempo"
                  : "Los clientes solo pueden tener 1 turno activo a la vez"
                }
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
          
          <div className="rounded-lg bg-muted/50 p-4 flex gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">¿Cuándo activar?</p>
              <ul className="mt-1 space-y-1">
                <li>• <strong>Desactivado:</strong> Ideal para barberías, peluquerías, consultorios (evita reservas duplicadas)</li>
                <li>• <strong>Activado:</strong> Ideal para gimnasios, clases grupales, canchas (un cliente puede reservar varias clases)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <ChangePasswordForm />

      {/* Subscription */}
      <SubscriptionCard />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Eliminar Negocio
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta acción eliminará permanentemente tu negocio y todos los datos asociados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
