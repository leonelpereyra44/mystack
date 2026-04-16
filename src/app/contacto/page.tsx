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
  User, 
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  Headphones,
  CreditCard,
  Lightbulb,
  Bug,
  HelpCircle,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const contactCategories = [
  { value: "general", label: "Consulta general", icon: HelpCircle, color: "bg-slate-100 text-slate-600" },
  { value: "support", label: "Soporte técnico", icon: Headphones, color: "bg-blue-100 text-blue-600" },
  { value: "billing", label: "Facturación", icon: CreditCard, color: "bg-green-100 text-green-600" },
  { value: "feature", label: "Sugerencia", icon: Lightbulb, color: "bg-amber-100 text-amber-600" },
  { value: "bug", label: "Reportar bug", icon: Bug, color: "bg-red-100 text-red-600" },
  { value: "other", label: "Otro", icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
];

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  category: z.string().min(1, "Selecciona una categoría"),
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
  const messageLength = watch("message")?.length || 0;

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
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-teal-200">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            ¡Mensaje enviado!
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            Gracias por contactarnos. Te responderemos a tu correo lo antes posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => setIsSuccess(false)} 
              variant="outline"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Enviar otro mensaje
            </Button>
            <Link href="/">
              <Button className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mystacklogosinfondo.png"
              alt="MyStack Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">
              <span className="text-slate-800">my</span>
              <span className="text-[oklch(0.55_0.15_230)]">stack</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Estamos para ayudarte
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Completa el formulario y nuestro equipo te responderá en menos de 24 horas
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-xl shadow-slate-200/50 border-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">¿Sobre qué tema nos escribes?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {contactCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setValue("category", cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                          isSelected 
                            ? "border-teal-500 bg-teal-50 shadow-md" 
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", cat.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-teal-700" : "text-slate-600"
                        )}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Name & Email */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    Nombre completo
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ej: Juan Pérez"
                    {...register("name")}
                    className={cn(
                      "h-11",
                      errors.name ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register("email")}
                    className={cn(
                      "h-11",
                      errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Describe brevemente tu consulta"
                  {...register("subject")}
                  className={cn(
                    "h-11",
                    errors.subject ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Mensaje
                </Label>
                <Textarea
                  id="message"
                  placeholder="Cuéntanos con detalle cómo podemos ayudarte..."
                  rows={5}
                  {...register("message")}
                  className={cn(
                    "resize-none",
                    errors.message ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                />
                <div className="flex justify-between items-center">
                  {errors.message ? (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  ) : (
                    <span className="text-xs text-slate-400">Mínimo 20 caracteres</span>
                  )}
                  <span className={cn(
                    "text-xs",
                    messageLength < 20 ? "text-slate-400" : "text-teal-600"
                  )}>
                    {messageLength} caracteres
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                  <Bug className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold gap-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando mensaje...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar mensaje
                  </>
                )}
              </Button>

              {/* Response Time Note */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>Respondemos en menos de 24 horas hábiles</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MyStack. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}
