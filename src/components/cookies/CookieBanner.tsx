"use client"

import { useState, useEffect } from "react"
import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CookieBannerProps {
  onAccept: () => void
  onReject: () => void
  onConfigure: () => void
}

export function CookieBanner({ onAccept, onReject, onConfigure }: CookieBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so the slide-up animation is noticeable on mount
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl",
        "transition-all duration-500 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      )}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/[0.08] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-primary/10">
              <Cookie size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                Usamos cookies
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Usamos cookies propias y de terceros para mejorar tu experiencia,
                analizar el tráfico y personalizar contenido.{" "}
                <a
                  href="/legal/privacidad"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Más información
                </a>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              onClick={onConfigure}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap px-1"
            >
              Configurar
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="flex-1 sm:flex-none h-8 text-xs"
            >
              Rechazar opcionales
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 sm:flex-none h-8 text-xs"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
