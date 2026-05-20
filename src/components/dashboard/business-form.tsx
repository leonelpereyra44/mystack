"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Copy,
  ExternalLink,
  Check,
  Instagram,
  Facebook,
  Globe,
  Twitter,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  website: string | null;
  whatsapp: string | null;
}

interface BusinessFormProps {
  business: Business;
}

const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string()
    .min(2, "La URL debe tener al menos 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export function BusinessForm({ business }: BusinessFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [businessType, setBusinessType] = useState(business.businessType);
  const [savingBusinessType, setSavingBusinessType] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    publicUrl: true,
    logo: true,
    businessType: false,
    businessInfo: true,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Suggested services modal
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [importingServices, setImportingServices] = useState(false);
  const [pendingServices, setPendingServices] = useState<
    Array<{
      name: string;
      description?: string;
      duration: number;
      price: number;
      selected: boolean;
      editedName: string;
      editedPrice: string;
    }>
  >([]);

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
      slug: business.slug,
      description: business.description || "",
      phone: business.phone || "",
      email: business.email || "",
      address: business.address || "",
      instagram: business.instagram || "",
      facebook: business.facebook || "",
      twitter: business.twitter || "",
      tiktok: business.tiktok || "",
      website: business.website || "",
      whatsapp: business.whatsapp || "",
    },
  });

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${business.slug}`;

  const watchedName = watch("name");
  const watchedSlug = watch("slug");

  const previewSlug = watchedSlug
    ? watchedSlug
    : watchedName
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
        body: JSON.stringify({
          ...data,
          // Send the manually-set slug (or let the API derive it from name if empty)
          slug: data.slug && data.slug !== business.slug ? data.slug : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Cambios guardados correctamente");
        router.refresh();
      } else {
        const err = await response.json();
        if (err.error === "slug_reserved") {
          toast.error(
            err.message ??
              "Este nombre genera una URL reservada. Por favor usá un nombre más específico.",
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
              <Button
                variant="outline"
                size="icon"
                onClick={copyUrl}
                title="Copiar enlace"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a
                href={`/${business.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${type.color} text-white`}
                    >
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL pública personalizada</Label>
                <div className="flex items-center gap-0">
                  <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground select-none">/</span>
                  <Input
                    id="slug"
                    {...register("slug")}
                    className="rounded-l-none font-mono"
                    placeholder={previewSlug}
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Dejá en blanco para que se genere automáticamente desde el nombre.
                  {slugChanged && (
                    <span className="ml-1 text-amber-600 font-medium">
                      (se actualizará al guardar)
                    </span>
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
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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

                <div className="mt-4 space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    {...register("whatsapp")}
                    placeholder="+54 9 11 1234-5678"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparecerá como botón de contacto en tu página pública
                  </p>
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

      {/* Suggested Services Modal */}
      <Dialog
        open={showSuggestedModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowSuggestedModal(false);
            router.refresh();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Servicios sugeridos</DialogTitle>
            <DialogDescription>
              Estos son los servicios más comunes para este tipo de negocio. Seleccioná
              los que querés agregar y editá los nombres y precios a tu gusto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {pendingServices.map((service, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 transition-colors ${
                  service.selected
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30"
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
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
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
              onClick={() => {
                setShowSuggestedModal(false);
                router.refresh();
              }}
              disabled={importingServices}
            >
              Omitir
            </Button>
            <Button
              onClick={handleImportServices}
              disabled={
                importingServices || pendingServices.every((s) => !s.selected)
              }
            >
              {importingServices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${pendingServices.filter((s) => s.selected).length} servicio${
                  pendingServices.filter((s) => s.selected).length === 1 ? "" : "s"
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Type Confirmation Modal */}
      <Dialog
        open={!!pendingType}
        onOpenChange={(open) => {
          if (!open) setPendingType(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cambiar tipo de negocio?</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <span className="block">
                Estás por cambiar el rubro a{" "}
                <strong>
                  {pendingType ? getBusinessType(pendingType).label : ""}
                </strong>
                .
              </span>
              <span className="block">
                Esto actualizará la terminología del dashboard (turnos, servicios,
                clientes) y te ofrecerá servicios sugeridos para el nuevo rubro.
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
