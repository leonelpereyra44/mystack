"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  Headphones,
  CreditCard,
  Lightbulb,
  Bug,
  HelpCircle,
  ArrowRight,
  Zap,
  Shield,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const contactCategories = [
  { value: "general", label: "Consulta general", icon: HelpCircle },
  { value: "support", label: "Soporte técnico", icon: Headphones },
  { value: "billing", label: "Facturación", icon: CreditCard },
  { value: "feature", label: "Sugerencia", icon: Lightbulb },
  { value: "bug", label: "Reportar bug", icon: Bug },
  { value: "other", label: "Otro", icon: MessageSquare },
];

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  category: z.string().min(1, "Selecciona un motivo"),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  message: z.string().min(20, "El mensaje debe tener al menos 20 caracteres"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: "",
    },
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar el mensaje");
      }

      setIsSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-8">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-4 tracking-tight">
            Mensaje enviado
          </h1>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">
            Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderemos a la brevedad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setIsSuccess(false)} 
              variant="outline"
              size="lg"
              className="rounded-full px-6"
            >
              Enviar otro mensaje
            </Button>
            <Link href="/">
              <Button size="lg" className="rounded-full px-6 w-full sm:w-auto">
                Volver al inicio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/mystacklogosinfondo.png"
                alt="MyStack Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold tracking-tight">
                <span className="text-slate-900">my</span>
                <span className="text-teal-600">stack</span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Info */}
          <div className="lg:pr-8">
            <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
              Hablemos
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-12">
              ¿Tienes una pregunta o necesitas ayuda? Completa el formulario y 
              nuestro equipo se pondrá en contacto contigo lo antes posible.
            </p>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Respuesta rápida</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Nuestro equipo responde en menos de 24 horas hábiles
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Soporte dedicado</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Atención personalizada para resolver todas tus dudas
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Equipo experto</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Especialistas listos para ayudarte con tu negocio
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Email */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-2">
                ¿Prefieres escribirnos directamente?
              </p>
              <a 
                href="mailto:contacto@mystack.com.ar"
                className="inline-flex items-center gap-2 text-slate-900 font-medium hover:text-teal-600 transition-colors"
              >
                <Mail className="h-4 w-4" />
                contacto@mystack.com.ar
              </a>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Motivo del contacto
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {contactCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setValue("category", cat.value)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            isSelected 
                              ? "bg-slate-900 text-white" 
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div>

                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      Nombre
                    </Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre"
                      {...register("name")}
                      className={cn(
                        "h-11 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400",
                        errors.name && "border-red-300 focus:border-red-400 focus:ring-red-400"
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      {...register("email")}
                      className={cn(
                        "h-11 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400",
                        errors.email && "border-red-300 focus:border-red-400 focus:ring-red-400"
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-slate-700">
                    Asunto
                  </Label>
                  <Input
                    id="subject"
                    placeholder="¿En qué podemos ayudarte?"
                    {...register("subject")}
                    className={cn(
                      "h-11 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400",
                      errors.subject && "border-red-300 focus:border-red-400 focus:ring-red-400"
                    )}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-500">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                    Mensaje
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe tu consulta con el mayor detalle posible..."
                    rows={5}
                    {...register("message")}
                    className={cn(
                      "rounded-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400 resize-none",
                      errors.message && "border-red-300 focus:border-red-400 focus:ring-red-400"
                    )}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-lg font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar mensaje
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Respuesta típica en menos de 24 horas
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
