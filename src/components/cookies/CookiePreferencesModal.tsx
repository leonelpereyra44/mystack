"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ShieldCheck, BarChart2, Megaphone } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CookieConsent, CookiePreferences } from "@/types/cookies"

interface CookiePreferencesModalProps {
  isOpen: boolean
  preferences: CookiePreferences | null
  onSave: (consent: CookieConsent) => void
  onClose: () => void
}

export function CookiePreferencesModal({
  isOpen,
  preferences,
  onSave,
  onClose,
}: CookiePreferencesModalProps) {
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false)
  const [marketing, setMarketing] = useState(preferences?.marketing ?? false)
  const [mounted, setMounted] = useState(false)

  // Sync toggles when preferences change (e.g. on open)
  useEffect(() => {
    setAnalytics(preferences?.analytics ?? false)
    setMarketing(preferences?.marketing ?? false)
  }, [preferences, isOpen])

  // Animate in after mount
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 10)
      return () => clearTimeout(t)
    } else {
      setMounted(false)
    }
  }, [isOpen])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener("keydown", handleKeyDown)
    // Prevent background scroll
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 ease-out",
          mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2
              id="cookie-modal-title"
              className="font-heading text-base font-semibold text-foreground"
            >
              Preferencias de cookies
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Elige qué cookies deseas habilitar
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mt-0.5 -mr-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categories */}
        <div className="px-6 pb-6 space-y-3">
          {/* Necessary — always on */}
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-primary/10">
              <ShieldCheck size={15} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Necesarias</span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                  Siempre activas
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Esenciales para el funcionamiento básico del sitio. No se pueden desactivar.
              </p>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-start gap-3.5 p-4 rounded-xl border border-border transition-colors hover:bg-muted/30">
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-accent/10">
              <BarChart2 size={15} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Analíticas</span>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Habilitar cookies analíticas"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Nos ayudan a entender cómo usas el sitio para mejorar continuamente la experiencia.
              </p>
            </div>
          </div>

          {/* Marketing */}
          <div className="flex items-start gap-3.5 p-4 rounded-xl border border-border transition-colors hover:bg-muted/30">
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-muted">
              <Megaphone size={15} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Marketing</span>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  aria-label="Habilitar cookies de marketing"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Permiten mostrarte contenido y anuncios relevantes según tus intereses.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => onSave({ analytics, marketing })}
              className="flex-1 h-8 text-xs"
            >
              Guardar preferencias
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
