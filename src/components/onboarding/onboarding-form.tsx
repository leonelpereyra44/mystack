"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_TYPES } from "@/lib/business-types";

interface OnboardingFormProps {
  userName: string;
  userEmail: string;
}

export function OnboardingForm({ userName, userEmail }: OnboardingFormProps) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/setup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), businessType }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear el negocio");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const greeting = userName ? `¡Hola, ${userName.split(" ")[0]}!` : "¡Bienvenido!";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-full bg-primary p-2">
            <Image
              src="/mystacklogosinfondo.png"
              alt="MyStack Logo"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
          </div>
          <span className="text-2xl font-bold">MyStack</span>
        </div>

        <h1 className="text-3xl font-bold">{greeting}</h1>
        <p className="mt-2 text-muted-foreground">
          Antes de continuar, contanos sobre tu negocio.
          {userEmail && (
            <span className="ml-1 text-xs text-muted-foreground/70">({userEmail})</span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          {/* Business name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Nombre de tu negocio
            </Label>
            <Input
              id="businessName"
              placeholder="Peluquería Juan"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Este será el nombre público de tu negocio
            </p>
          </div>

          {/* Business type */}
          <div className="space-y-3">
            <Label>Tipo de negocio</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <p className="text-xs text-muted-foreground">
              Podés cambiarlo después desde la configuración
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isLoading || !businessName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creando negocio...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Ir al panel
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al continuar, aceptás nuestros{" "}
          <Link href="/legal/terminos" className="underline hover:text-foreground">
            Términos de servicio
          </Link>{" "}
          y{" "}
          <Link href="/legal/privacidad" className="underline hover:text-foreground">
            Política de privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
