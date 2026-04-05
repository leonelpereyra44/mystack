"use client";

import { useState } from "react";
import { Eye, Monitor, Smartphone, Tablet, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BookingPreviewProps {
  slug: string;
}

type DeviceSize = "mobile" | "tablet" | "desktop";

const deviceSizes: Record<DeviceSize, { width: string; label: string; icon: typeof Smartphone }> = {
  mobile: { width: "375px", label: "Móvil", icon: Smartphone },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  desktop: { width: "100%", label: "Escritorio", icon: Monitor },
};

export function BookingPreview({ slug }: BookingPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [device, setDevice] = useState<DeviceSize>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const previewUrl = `/${slug}`;

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Preview en vivo
        </Button>
      } />
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview de tu página de reservas
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Device toggles */}
              <div className="flex border rounded-lg overflow-hidden">
                {(Object.keys(deviceSizes) as DeviceSize[]).map((size) => {
                  const { icon: Icon, label } = deviceSizes[size];
                  return (
                    <Button
                      key={size}
                      variant={device === size ? "default" : "ghost"}
                      size="sm"
                      className="rounded-none h-8 px-3"
                      onClick={() => setDevice(size)}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                title="Recargar preview"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {/* Open in new tab */}
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" title="Abrir en nueva pestaña">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* Preview iframe container */}
        <div className="flex-1 bg-muted/50 overflow-auto flex items-start justify-center p-4">
          <div
            className={cn(
              "bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300",
              device === "mobile" && "border-8 border-gray-800 rounded-[2rem]",
              device === "tablet" && "border-8 border-gray-700 rounded-2xl"
            )}
            style={{
              width: deviceSizes[device].width,
              maxWidth: "100%",
              height: device === "desktop" ? "100%" : "calc(100% - 2rem)",
            }}
          >
            {/* Device notch for mobile */}
            {device === "mobile" && (
              <div className="bg-gray-800 h-6 flex items-center justify-center">
                <div className="w-20 h-4 bg-black rounded-full" />
              </div>
            )}
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0"
              style={{
                height: device === "mobile" ? "calc(100% - 1.5rem)" : "100%",
                minHeight: device === "desktop" ? "600px" : "500px",
              }}
              title="Preview de página de reservas"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between flex-shrink-0">
          <span>
            Los cambios guardados se reflejan automáticamente. Usa el botón de recargar para ver actualizaciones.
          </span>
          <span className="font-mono">{previewUrl}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
