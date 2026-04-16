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
  MapPin,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const contactCategories = [
  { value: "general", label: "Consulta general" },
  { value: "support", label: "Soporte técnico" },
  { value: "billing", label: "Facturación y pagos" },
  { value: "feature", label: "Sugerencia de funcionalidad" },
  { value: "bug", label: "Reportar un problema" },
  { value: "other", label: "Otro" },
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
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ¡Mensaje enviado!
            </h2>
            <p className="text-slate-600 mb-6">
              Gracias por contactarnos. Te responderemos lo antes posible a tu correo electrónico.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setIsSuccess(false)} variant="outline">
                Enviar otro mensaje
              </Button>
              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Contáctanos
            </h1>
            <p className="text-slate-600 mb-8">
              ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para asistirte. 
              Completa el formulario y te responderemos lo más pronto posible.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Email</h3>
                  <a 
                    href="mailto:contacto@mystack.com.ar"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    contacto@mystack.com.ar
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Tiempo de respuesta</h3>
                  <p className="text-slate-600">
                    Generalmente respondemos en 24-48 horas hábiles
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Ubicación</h3>
                  <p className="text-slate-600">
                    Buenos Aires, Argentina
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="inline h-4 w-4 mr-1" />
                        Nombre completo
                      </Label>
                      <Input
                        id="name"
                        placeholder="Tu nombre"
                        {...register("name")}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        {...register("email")}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) => setValue("category", value)}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto</Label>
                      <Input
                        id="subject"
                        placeholder="¿En qué podemos ayudarte?"
                        {...register("subject")}
                        className={errors.subject ? "border-destructive" : ""}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive">{errors.subject.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      <MessageSquare className="inline h-4 w-4 mr-1" />
                      Mensaje
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Describe tu consulta o problema con el mayor detalle posible..."
                      rows={6}
                      {...register("message")}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar mensaje
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MyStack. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}
