"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  Zap,
  Clock,
  LogIn,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Clock,
    title: "Ahorra tiempo",
    description: "Gestiona todos tus turnos desde un solo lugar",
  },
  {
    icon: Zap,
    title: "Rápido y simple",
    description: "Interfaz intuitiva y fácil de usar",
  },
  {
    icon: Shield,
    title: "Seguro",
    description: "Tus datos siempre protegidos",
  },
];

export function LoginForm({ isMaintenance }: { isMaintenance: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registered = searchParams.get("registered");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo */}
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

          <h1 className="text-4xl font-bold mb-4">¡Bienvenido de nuevo!</h1>
          <p className="text-lg text-primary-foreground/80 mb-12">
            Accede a tu panel de control y gestiona tu negocio de forma eficiente
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all hover:bg-white/15"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground/70">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/60">
          © 2026 MyStack. Todos los derechos reservados.
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Iniciando sesión...</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-md">
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
            <h2 className="text-2xl font-bold text-foreground">
              Iniciar sesión
            </h2>
            <p className="text-muted-foreground mt-1">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isMaintenance && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3 animate-in slide-in-from-top-2">
                <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Sistema en mantenimiento</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                    Solo los administradores pueden acceder en este momento.
                  </p>
                </div>
              </div>
            )}

            {registered && (
              <div className="rounded-lg bg-green-500/15 p-4 text-sm text-green-600 flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                ¡Cuenta creada exitosamente! Ya puedes iniciar sesión.
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register("email")}
                disabled={isLoading}
                className="h-12 text-base"
              />
              {errors.email && (
                <p className="text-sm text-destructive animate-in slide-in-from-top-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Contraseña
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-in slide-in-from-top-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al iniciar sesión, aceptas nuestros{" "}
            <Link
              href="/legal/terminos"
              className="underline hover:text-foreground"
            >
              Términos de servicio
            </Link>{" "}
            y{" "}
            <Link
              href="/legal/privacidad"
              className="underline hover:text-foreground"
            >
              Política de privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
