"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, ExternalLink, Info, Check, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ChangePasswordForm } from "./change-password-form";
import { SubscriptionCard } from "./subscription-card";
import { BookingPreview } from "./booking-preview";
import { BUSINESS_TYPES } from "@/lib/business-types";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  businessType: string;
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
  const [businessType, setBusinessType] = useState(business.businessType);
  const [savingBusinessType, setSavingBusinessType] = useState(false);
  
  // Delete business states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const handleBusinessTypeChange = async (newType: string) => {
    setSavingBusinessType(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: newType }),
      });

      if (response.ok) {
        setBusinessType(newType);
        toast.success("Tipo de negocio actualizado");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingBusinessType(false);
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

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeleteStep(1);
    setDeleteConfirmation("");
    setDeletePassword("");
    setDeleteError("");
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteStep(1);
    setDeleteConfirmation("");
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDeleteBusiness = async () => {
    if (deleteConfirmation !== "ELIMINAR MI NEGOCIO") {
      setDeleteError("Debes escribir exactamente: ELIMINAR MI NEGOCIO");
      return;
    }

    if (!deletePassword) {
      setDeleteError("Debes ingresar tu contraseña");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/business", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Tu negocio y cuenta han sido eliminados");
        // Cerrar sesión y redirigir
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleteError(data.error || "Error al eliminar el negocio");
      }
    } catch (error) {
      console.error("Error deleting business:", error);
      setDeleteError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsDeleting(false);
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
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={publicUrl} readOnly className="font-mono" />
            <Button variant="outline" size="icon" onClick={copyUrl} title="Copiar enlace">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            <a href={`/${business.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" title="Abrir en nueva pestaña">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <BookingPreview slug={business.slug} />
            <span className="text-sm text-muted-foreground">
              Visualiza cómo ven tus clientes tu página de reservas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Business Type */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Negocio</CardTitle>
          <CardDescription>
            Elige el icono que mejor represente tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {BUSINESS_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = businessType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  disabled={savingBusinessType}
                  onClick={() => handleBusinessTypeChange(type.id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  } ${savingBusinessType ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${type.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-center font-medium leading-tight">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
          {savingBusinessType && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </div>
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
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan permanentemente tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Eliminar tu negocio borrará permanentemente todos tus datos: servicios, 
              staff, horarios, citas pasadas y futuras, y tu cuenta de usuario. 
              Esta acción no se puede deshacer.
            </AlertDescription>
          </Alert>
          <Button 
            variant="destructive" 
            onClick={handleOpenDeleteDialog}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar mi negocio
          </Button>
        </CardContent>
      </Card>

      {/* Delete Business Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Eliminar negocio
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1 
                ? "¿Estás seguro de que deseas eliminar tu negocio?" 
                : "Confirma tu identidad para continuar"
              }
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Esta acción es irreversible</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Al eliminar tu negocio se borrarán permanentemente:</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Tu negocio <strong>&quot;{business.name}&quot;</strong></li>
                    <li>Todos los servicios y precios configurados</li>
                    <li>Todo el staff y sus horarios</li>
                    <li>Todas las citas (pasadas y futuras)</li>
                    <li>Los horarios de atención</li>
                    <li>Tu suscripción activa</li>
                    <li>Tu cuenta de usuario</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <Info className="h-5 w-5 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Los clientes que tengan citas programadas no serán notificados automáticamente.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleCloseDeleteDialog}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteStep(2)}
                >
                  Entiendo, continuar
                </Button>
              </DialogFooter>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Escribe <strong className="text-destructive">ELIMINAR MI NEGOCIO</strong> para confirmar
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="ELIMINAR MI NEGOCIO"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-password">Ingresa tu contraseña</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>

              {deleteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteStep(1)}
                  disabled={isDeleting}
                >
                  Volver
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteBusiness}
                  disabled={isDeleting || deleteConfirmation !== "ELIMINAR MI NEGOCIO" || !deletePassword}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar permanentemente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
