"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBusinessType, getBusinessTerminology } from "@/lib/business-types";
import { cn } from "@/lib/utils";

interface SuggestedServicesPanelProps {
  businessType: string;
  /** When true, panel starts expanded (e.g. no services yet) */
  defaultOpen?: boolean;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function SuggestedServicesPanel({
  businessType,
  defaultOpen = false,
}: SuggestedServicesPanelProps) {
  const router = useRouter();
  const config = getBusinessType(businessType);
  const terminology = getBusinessTerminology(businessType);

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [importing, setImporting] = useState(false);
  const [services, setServices] = useState(
    config.suggestedServices.map((s) => ({
      ...s,
      selected: true,
      editedName: s.name,
      editedPrice: String(s.price),
    }))
  );

  if (config.suggestedServices.length === 0) return null;

  const selectedCount = services.filter((s) => s.selected).length;

  const handleImport = async () => {
    const selected = services.filter((s) => s.selected);
    if (selected.length === 0) return;

    setImporting(true);
    try {
      for (const service of selected) {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: service.editedName,
            description: service.description || "",
            duration: service.duration,
            price: parseFloat(service.editedPrice) || 0,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al importar");
        }
      }
      toast.success(
        `${selected.length} ${selected.length === 1 ? terminology.service.toLowerCase() + " importado" : terminology.services.toLowerCase() + " importados"} correctamente`
      );
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al importar los servicios");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setIsOpen((v) => !v)}
      >
        <CardHeader className="pb-3 hover:bg-muted/30 transition-colors rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {terminology.services} sugeridos
              </CardTitle>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
          <CardDescription>
            Importá {terminology.services.toLowerCase()} típicos para un negocio de este tipo. Podés editar los nombres y precios antes de importar.
          </CardDescription>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          {services.map((service, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                service.selected
                  ? "border-primary/30 bg-primary/5"
                  : "border-muted bg-muted/30"
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                  checked={service.selected}
                  onChange={(e) =>
                    setServices((prev) =>
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
                        setServices((prev) =>
                          prev.map((s, i) =>
                            i === index ? { ...s, editedName: e.target.value } : s
                          )
                        )
                      }
                      className="h-8 text-sm font-medium"
                      disabled={!service.selected}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
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
                        setServices((prev) =>
                          prev.map((s, i) =>
                            i === index
                              ? { ...s, editedPrice: e.target.value }
                              : s
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${selectedCount} ${selectedCount === 1 ? terminology.service.toLowerCase() : terminology.services.toLowerCase()}`
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
