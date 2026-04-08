"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Building2,
  CheckCircle2,
  Calendar,
  Users,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { trackSignupConversion } from "@/components/analytics/google-analytics";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Componente para medir fortaleza de contraseña
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const labels = ["", "Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= strength ? colors[strength] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs transition-colors ${
        strength <= 2 ? "text-destructive" : strength <= 3 ? "text-yellow-600" : "text-green-600"
      }`}>
        {labels[strength]}
      </p>
    </div>
  );
}

// Beneficios para mostrar en el lado izquierdo
const benefits = [
  {
    icon: Calendar,
    title: "Gestión de turnos",
    description: "Agenda automática 24/7"
  },
  {
    icon: Users,
    title: "Control de clientes",
    description: "Historial y preferencias"
  },
  {
    icon: BarChart3,
    title: "Estadísticas",
    description: "Métricas de tu negocio"
  },
  {
    icon: Sparkles,
    title: "URL personalizada",
    description: "mystack.com/tunegocio"
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  // Observar el valor de la contraseña
  const watchPassword = watch("password");
  useEffect(() => {
    setPasswordValue(watchPassword || "");
  }, [watchPassword]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Error al registrar");
        return;
      }

      // Trackear conversión de registro en Google Ads
      if (result.user?.id) {
        trackSignupConversion(result.user.id);
      }

      router.push("/login?registered=true");
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validar paso actual antes de avanzar
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["name", "businessName"];
    } else if (step === 2) {
      fieldsToValidate = ["email"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  // Verificar si el paso actual es válido
  const isStepValid = (currentStep: number) => {
    const values = getValues();
    if (currentStep === 1) {
      return values.name?.length >= 2 && values.businessName?.length >= 2;
    }
    if (currentStep === 2) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || "");
    }
    return true;
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo - Info y beneficios (oculto en móvil) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Patrón de fondo decorativo */}
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
          
          <h1 className="text-4xl font-bold mb-4">
            Digitaliza tu negocio hoy
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-12">
            Únete a cientos de negocios que ya gestionan sus turnos de forma inteligente
          </p>

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all hover:bg-white/15"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{benefit.description}</p>
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo para móvil */}
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

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      s < step 
                        ? "bg-green-500 text-white" 
                        : s === step 
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                      s < step ? "bg-green-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Datos</span>
              <span>Email</span>
              <span>Contraseña</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {step === 1 && "¡Empecemos!"}
              {step === 2 && "Tu email"}
              {step === 3 && "Crea tu contraseña"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {step === 1 && "Cuéntanos sobre ti y tu negocio"}
              {step === 2 && "Lo usarás para iniciar sesión"}
              {step === 3 && "Elige una contraseña segura"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            {/* Step 1: Nombre y Negocio */}
            <div className={`space-y-4 transition-all duration-300 ${step === 1 ? "block" : "hidden"}`}>
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Tu nombre
                </Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  {...register("name")}
                  disabled={isLoading}
                  className="h-12 text-base"
                />
                {errors.name && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Nombre de tu negocio
                </Label>
                <Input
                  id="businessName"
                  placeholder="Peluquería Juan"
                  {...register("businessName")}
                  disabled={isLoading}
                  className="h-12 text-base"
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1">{errors.businessName.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Este será el nombre público de tu negocio
                </p>
              </div>
            </div>

            {/* Step 2: Email */}
            <div className={`space-y-4 transition-all duration-300 ${step === 2 ? "block" : "hidden"}`}>
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
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1">{errors.email.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Te enviaremos confirmaciones de turnos a este correo
                </p>
              </div>
            </div>

            {/* Step 3: Contraseñas */}
            <div className={`space-y-4 transition-all duration-300 ${step === 3 ? "block" : "hidden"}`}>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Contraseña
                </Label>
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
                <PasswordStrength password={passwordValue} />
                {errors.password && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    disabled={isLoading}
                    className="h-12 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  className="h-12 px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!isStepValid(step)}
                  className="flex-1 h-12 text-base"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Crear mi cuenta
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Términos y condiciones */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al registrarte, aceptas nuestros{" "}
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
    </div>
  );
}
