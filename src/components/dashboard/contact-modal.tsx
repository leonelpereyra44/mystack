"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Headphones,
  CreditCard,
  Lightbulb,
  MessageSquare,
  Loader2,
  Send,
  CheckCircle,
  Clock,
  Mail,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contactCategories = [
  { value: "general", label: "Consulta general", icon: HelpCircle },
  { value: "support", label: "Soporte técnico", icon: Headphones },
  { value: "billing", label: "Facturación", icon: CreditCard },
  { value: "feature", label: "Sugerencia", icon: Lightbulb },
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

interface ContactModalProps {
  user: { name?: string | null; email?: string | null };
  trigger: React.ReactElement;
}

export function ContactModal({ user, trigger }: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email ?? "",
      category: "",
    },
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: ContactFormData) => {
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al enviar el mensaje");
      setIsSuccess(true);
      reset({ name: user.name ?? "", email: user.email ?? "", category: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setIsSuccess(false);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Mensaje enviado</h2>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo te responderá a la brevedad.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setIsSuccess(false)}>
                Enviar otro
              </Button>
              <Button onClick={() => setOpen(false)}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Contactar soporte</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Motivo del contacto</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {contactCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setValue("category", cat.value, { shouldValidate: true })}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          selectedCategory === cat.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Name & Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cm-name">Nombre</Label>
                  <Input id="cm-name" placeholder="Tu nombre" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cm-email">Email</Label>
                  <Input id="cm-email" type="email" placeholder="tu@email.com" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="cm-subject">Asunto</Label>
                <Input id="cm-subject" placeholder="¿En qué podemos ayudarte?" {...register("subject")} />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="cm-message">Mensaje</Label>
                <Textarea
                  id="cm-message"
                  placeholder="Describe tu consulta con el mayor detalle posible..."
                  rows={4}
                  className="resize-none"
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
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
                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Respuesta típica en menos de 24 horas
                </p>
                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  contacto@mystack.com.ar
                </p>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
