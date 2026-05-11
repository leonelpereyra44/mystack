"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const staffSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface Service {
  id: string;
  name: string;
}

export default function NewStaffPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("#6366f1");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  });

  const onSubmit = async (data: StaffFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, color, serviceIds: selectedServiceIds }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Error al agregar miembro");
        return;
      }

      toast.success("Miembro agregado correctamente");
      router.push("/dashboard/staff");
      router.refresh();
    } catch {
      setError("Error al agregar miembro");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Agregar Miembro</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo miembro a tu equipo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del Miembro</CardTitle>
          <CardDescription>
            Información del nuevo miembro del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: María García"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="maria@ejemplo.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+54 11 1234-5678"
                {...register("phone")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color en el calendario</Label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input p-0.5"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Servicios que puede realizar</Label>
                <p className="text-sm text-muted-foreground">
                  Si no seleccionas ninguno, podrá realizar todos los servicios
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="cursor-pointer font-normal">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Miembro
              </Button>
              <Link href="/dashboard/staff">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

