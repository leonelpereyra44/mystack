"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, ExternalLink, Info, Check, AlertTriangle, Trash2, Instagram, Facebook, Globe, Twitter, ChevronDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChangePasswordForm } from "./change-password-form";
import { Switch } from "@/components/ui/switch";
import { SubscriptionCard } from "./subscription-card";
import { BookingPreview } from "./booking-preview";
import { LogoUpload } from "./logo-upload";
import { BUSINESS_TYPES, getBusinessType } from "@/lib/business-types";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  businessType: string;
  allowMultipleBookings: boolean;
  bookingInterval: number;
  slotCapacity: number;
  bufferTime: number;
  showPrices: boolean;
  showDurations: boolean;
  minBookingNotice: number;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  website: string | null;
  welcomeMessage: string | null;
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
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export function SettingsForm({ business }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(business.allowMultipleBookings);
  const [savingBookingSettings, setSavingBookingSettings] = useState(false);
  const [bookingInterval, setBookingInterval] = useState(business.bookingInterval);
  const [savingInterval, setSavingInterval] = useState(false);
  const [slotCapacity, setSlotCapacity] = useState(business.slotCapacity);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [bufferTime, setBufferTime] = useState(business.bufferTime);
  const [savingBufferTime, setSavingBufferTime] = useState(false);
  const [showPrices, setShowPrices] = useState(business.showPrices);
  const [showDurations, setShowDurations] = useState(business.showDurations);
  const [minBookingNotice, setMinBookingNotice] = useState(business.minBookingNotice);
  const [savingMinNotice, setSavingMinNotice] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(business.welcomeMessage ?? "");
  const [savingWelcomeMessage, setSavingWelcomeMessage] = useState(false);
  const [businessType, setBusinessType] = useState(business.businessType);
  const [savingBusinessType, setSavingBusinessType] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    publicUrl: true,
    logo: true,
    businessType: false,
    businessInfo: true,
    bookingSettings: false,
    dangerZone: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Suggested services modal
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [importingServices, setImportingServices] = useState(false);
  const [pendingServices, setPendingServices] = useState<Array<{
    name: string;
    description?: string;
    duration: number;
    price: number;
    selected: boolean;
    editedName: string;
    editedPrice: string;
  }>>([])

  // Business type confirmation
  const [pendingType, setPendingType] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: business.name,
      description: business.description || "",
      phone: business.phone || "",
      email: business.email || "",
      address: business.address || "",
      instagram: business.instagram || "",
      facebook: business.facebook || "",
      twitter: business.twitter || "",
      tiktok: business.tiktok || "",
      website: business.website || "",
    },
  });

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${business.slug}`;

  const watchedName = watch("name");
  const previewSlug = watchedName
    ? watchedName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
    : business.slug;
  const slugChanged = previewSlug !== business.slug;

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

  const handleBufferTimeChange = async (value: number) => {
    setSavingBufferTime(true);
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bufferTime: value }),
      });
      if (response.ok) {
        setBufferTime(value);
        toast.success("Buffer actualizado");
        router.refresh();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingBufferTime(false);
    }
  };

  const handleToggleField = async (field: "showPrices" | "showDurations", value: boolean) => {
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

        const typeConfig = getBusinessType(newType);
        if (typeConfig.suggestedServices.length > 0) {
          setPendingServices(
            typeConfig.suggestedServices.map((s) => ({
              ...s,
              selected: true,
              editedName: s.name,
              editedPrice: String(s.price),
            }))
          );
          setShowSuggestedModal(true);
        } else {
          router.refresh();
        }
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingBusinessType(false);
    }
  };

  const handleImportServices = async () => {
    const selected = pendingServices.filter((s) => s.selected);
    if (selected.length === 0) {
      setShowSuggestedModal(false);
      router.refresh();
      return;
    }
    setImportingServices(true);
    try {
      for (const service of selected) {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: service.editedName,
            description: service.description || "",
            duration: service.duration,
            price: parseFloat(service.editedPrice) || 0,
          }),
        });
      }
      toast.success(
        `${selected.length} ${selected.length === 1 ? "servicio importado" : "servicios importados"} correctamente`
      );
      setShowSuggestedModal(false);
      router.refresh();
    } catch {
      toast.error("Error al importar los servicios");
    } finally {
      setImportingServices(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
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
        const err = await response.json();
        if (err.error === "slug_reserved") {
          toast.error(
            err.message ?? "Este nombre genera una URL reservada. Por favor usá un nombre más específico.",
            { duration: 8000 }
          );
        } else if (err.error === "slug_taken") {
          toast.error(
            `La URL "/${err.slug}" ya está en uso por otro negocio. Probá con un nombre diferente, por ejemplo agregando tu ciudad o apellido.`,
            { duration: 6000 }
          );
        } else {
          toast.error("Error al guardar los cambios");
        }
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
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("publicUrl")}
        >
          <div>
            <CardTitle>Tu página de reservas</CardTitle>
            <CardDescription>
              Comparte este enlace con tus clientes para que puedan reservar turnos
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.publicUrl ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.publicUrl && (
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
        )}
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("logo")}
        >
          <div>
            <CardTitle>Logo del Negocio</CardTitle>
            <CardDescription>
              Sube una imagen que represente tu negocio. Se mostrará en tu página pública.
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.logo ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.logo && (
        <CardContent>
          <LogoUpload 
            currentLogo={business.logo} 
            businessName={business.name}
            onLogoChange={() => router.refresh()}
          />
        </CardContent>
        )}
      </Card>

      {/* Business Type */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("businessType")}
        >
          <div>
            <CardTitle>Tipo de Negocio</CardTitle>
            <CardDescription>
              Elige el icono que mejor represente tu negocio
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.businessType ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.businessType && (
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
                  onClick={() => {
                    if (!isSelected) setPendingType(type.id);
                  }}
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
        )}
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("businessInfo")}
        >
          <div>
            <CardTitle>Información del Negocio</CardTitle>
            <CardDescription>
              Esta información se mostrará en tu página pública
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.businessInfo ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.businessInfo && (
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                URL pública:{" "}
                <span className={slugChanged ? "font-medium text-foreground" : ""}>
                  /{previewSlug}
                </span>
                {slugChanged && (
                  <span className="ml-1 text-amber-600">(se actualizará al guardar)</span>
                )}
              </p>
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

            {/* Redes Sociales */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Redes Sociales (opcional)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega tus redes para que tus clientes te sigan y conozcan más de tu trabajo
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    {...register("instagram")}
                    placeholder="@tunegocio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    {...register("facebook")}
                    placeholder="tunegocio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    {...register("twitter")}
                    placeholder="@tunegocio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    {...register("tiktok")}
                    placeholder="@tunegocio"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sitio Web
                </Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://www.tunegocio.com"
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
        )}
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("bookingSettings")}
        >
          <div>
            <CardTitle>Configuración de Reservas</CardTitle>
            <CardDescription>
              Controla cómo los clientes pueden hacer reservas
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.bookingSettings ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.bookingSettings && (
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

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Intervalo entre turnos</Label>
              <p className="text-sm text-muted-foreground">
                Cada cuánto tiempo puede empezar un nuevo turno
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingInterval && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
              {savingCapacity && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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

          {/* Buffer entre turnos */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Buffer entre turnos</Label>
              <p className="text-sm text-muted-foreground">
                Minutos de descanso/limpieza entre cada turno
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingBufferTime && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={bufferTime}
                  disabled={savingBufferTime}
                  className="w-[80px] text-center"
                  onChange={(e) => {
                    const val = Math.min(60, Math.max(0, parseInt(e.target.value) || 0));
                    setBufferTime(val);
                  }}
                  onBlur={(e) => {
                    const val = Math.min(60, Math.max(0, parseInt(e.target.value) || 0));
                    if (val !== business.bufferTime) {
                      handleBufferTimeChange(val);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Show Prices */}
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

          {/* Show Durations */}
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

          {/* Min Booking Notice */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Antelación mínima</Label>
              <p className="text-sm text-muted-foreground">
                Horas de anticipación mínima para poder realizar una reserva (0 = sin límite)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingMinNotice && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={minBookingNotice}
                  disabled={savingMinNotice}
                  className="w-[80px] text-center"
                  onChange={(e) => setMinBookingNotice(Math.min(72, Math.max(0, parseInt(e.target.value) || 0)))}
                  onBlur={handleMinNoticeBlur}
                />
                <span className="text-sm text-muted-foreground">hs</span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label className="text-base">Mensaje de bienvenida</Label>
            <p className="text-sm text-muted-foreground">
              Texto personalizado que se muestra al inicio del formulario de reservas
            </p>
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
              {savingWelcomeMessage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />}
            </div>
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
        )}
      </Card>

      {/* Change Password */}
      <ChangePasswordForm />

      {/* Subscription */}
      <SubscriptionCard />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader
          className="cursor-pointer select-none flex flex-row items-start justify-between space-y-0"
          onClick={() => toggleSection("dangerZone")}
        >
          <div>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona de Peligro
            </CardTitle>
            <CardDescription>
              Acciones irreversibles que afectan permanentemente tu cuenta
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform mt-1 shrink-0 ${
              openSections.dangerZone ? "" : "-rotate-90"
            }`}
          />
        </CardHeader>
        {openSections.dangerZone && (
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
        )}
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

      {/* Suggested Services Modal */}
      <Dialog open={showSuggestedModal} onOpenChange={(open) => {
        if (!open) { setShowSuggestedModal(false); router.refresh(); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Servicios sugeridos</DialogTitle>
            <DialogDescription>
              Estos son los servicios más comunes para este tipo de negocio. Seleccioná los que querés agregar y editá los nombres y precios a tu gusto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {pendingServices.map((service, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 transition-colors ${
                  service.selected ? "border-primary bg-primary/5" : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                    checked={service.selected}
                    onChange={(e) =>
                      setPendingServices((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, selected: e.target.checked } : s
                        )
                      )
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={service.editedName}
                        onChange={(e) =>
                          setPendingServices((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, editedName: e.target.value } : s
                            )
                          )
                        }
                        className="h-8 text-sm font-medium"
                        disabled={!service.selected}
                      />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Precio $</span>
                      <Input
                        type="number"
                        min="0"
                        value={service.editedPrice}
                        onChange={(e) =>
                          setPendingServices((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, editedPrice: e.target.value } : s
                            )
                          )
                        }
                        className="h-7 w-28 text-sm"
                        disabled={!service.selected}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => { setShowSuggestedModal(false); router.refresh(); }}
              disabled={importingServices}
            >
              Omitir
            </Button>
            <Button
              onClick={handleImportServices}
              disabled={importingServices || pendingServices.every((s) => !s.selected)}
            >
              {importingServices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${pendingServices.filter((s) => s.selected).length} servicio${pendingServices.filter((s) => s.selected).length === 1 ? "" : "s"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Type Confirmation Modal */}
      <Dialog open={!!pendingType} onOpenChange={(open) => { if (!open) setPendingType(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cambiar tipo de negocio?</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <span className="block">
                Estás por cambiar el rubro a{" "}
                <strong>{pendingType ? getBusinessType(pendingType).label : ""}</strong>.
              </span>
              <span className="block">
                Esto actualizará la terminología del dashboard (turnos, servicios, clientes) y te ofrecerá servicios sugeridos para el nuevo rubro.
              </span>
              <span className="block text-amber-600 font-medium">
                Tus servicios y configuraciones actuales no se eliminarán.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setPendingType(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const t = pendingType!;
                setPendingType(null);
                handleBusinessTypeChange(t);
              }}
            >
              Sí, cambiar rubro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
