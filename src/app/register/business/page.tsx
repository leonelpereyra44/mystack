"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Loader2, Sparkles } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { trackSignupConversion } from "@/components/analytics/google-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { update: updateSession, data: session } = useSession();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/setup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), businessType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el negocio");
        return;
      }

      // Trackear conversión de registro OAuth en Google Ads
      if (session?.user?.id) {
        trackSignupConversion(session.user.id);
      }

      // Forzar refresh del JWT para que needsOnboarding se actualice a false.
      // updateSession() hace PATCH a /api/auth/session y re-ejecuta el JWT callback,
      // donde ahora detecta que el negocio ya existe y limpia el flag.
      await updateSession();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="bg-white rounded-full p-2">
              <Image
                src="/mystacklogosinfondo.png"
                alt="MyStack Logo"
                width={48}
                height={48}
                className="h-10 w-auto"
              />
            </div>
            <span className="text-3xl font-bold">MyStack</span>
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">¡Ya casi!</h1>
          </div>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Solo nos falta saber el nombre de tu negocio para configurar tu espacio.
          </p>
          <p className="text-sm text-primary-foreground/60">
            Podrás personalizar todo esto más adelante desde la configuración.
          </p>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/60">
          © 2026 MyStack. Todos los derechos reservados.
        </div>
      </div>

      {/* Lado derecho - formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/mystacklogosinfondo.png"
                alt="MyStack Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold">MyStack</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Configurá tu negocio</h2>
            <p className="text-muted-foreground mt-1">
              Un último paso antes de entrar a tu dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <Label htmlFor="businessName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Nombre de tu negocio
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Peluquería Juan"
                disabled={isLoading}
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Este será el nombre público de tu negocio
              </p>
            </div>

            {/* Tipo de negocio */}
            <div className="space-y-3">
              <Label>Tipo de negocio</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = businessType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBusinessType(type.id)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
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
              <p className="text-xs text-muted-foreground text-center">
                Podés cambiarlo después desde la configuración
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading || businessName.trim().length < 2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando tu negocio...
                </>
              ) : (
                "Entrar al dashboard"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
