"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LogoUploadProps {
  currentLogo: string | null;
  businessName: string;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ currentLogo, businessName, onLogoChange }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.");
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 2MB.");
      return;
    }

    // Mostrar preview inmediato
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Subir archivo
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/business/logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      setPreviewUrl(data.url);
      onLogoChange(data.url);
      toast.success("Logo actualizado correctamente");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen");
      setPreviewUrl(currentLogo); // Revertir preview
    } finally {
      setIsUploading(false);
      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!previewUrl) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/business/logo", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el logo");
      }

      setPreviewUrl(null);
      onLogoChange(null);
      toast.success("Logo eliminado");
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el logo");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20">
              <Image
                src={previewUrl}
                alt={businessName}
                fill
                className="object-cover"
              />
              {(isUploading || isDeleting) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-medium">Logo del negocio</h4>
            <p className="text-sm text-muted-foreground">
              Se mostrará en tu página de reservas. Recomendado: imagen cuadrada, mínimo 200x200px.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isDeleting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {previewUrl ? "Cambiar" : "Subir logo"}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading || isDeleting}
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Formatos: JPG, PNG, WebP, GIF. Máximo 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
