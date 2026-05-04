"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getBusinessTerminology, getBusinessType } from "@/lib/business-types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  duration: z.number().min(5, "La duración mínima es 5 minutos"),
  price: z.number().min(0, "El precio no puede ser negativo"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessType = searchParams.get("type") ?? "salon";
  const terminology = getBusinessTerminology(businessType);
  const { suggestedDurations } = getBusinessType(businessType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duration: suggestedDurations[0] ?? 30,
      price: 0,
    },
  });

  const selectedDuration = watch("duration");

  const ALL_DURATION_OPTIONS: Record<number, string> = {
    15: "15 minutos",
    20: "20 minutos",
    30: "30 minutos",
    45: "45 minutos",
    60: "1 hora",
    90: "1 hora 30 min",
    120: "2 horas",
    180: "3 horas",
    240: "4 horas",
  };

  // Show suggested durations for this business type first, then the rest
  const orderedDurations = [
    ...suggestedDurations,
    ...[15, 20, 30, 45, 60, 90, 120, 180, 240].filter(
      (d) => !suggestedDurations.includes(d)
    ),
  ];

  const onSubmit = async (data: ServiceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Error al crear el servicio");
        return;
      }

      toast.success("Servicio creado correctamente");
      router.push("/dashboard/services");
      router.refresh();
    } catch {
      setError("Error al crear el servicio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{terminology.newService}</h1>
          <p className="text-muted-foreground">
            Agrega {terminology.service === "Clase" ? "una nueva" : "un nuevo"} {terminology.service.toLowerCase()} para tus {terminology.clients.toLowerCase()}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Detalles del {terminology.service}</CardTitle>
          <CardDescription>
            Configura el nombre, duración y precio del {terminology.service.toLowerCase()}
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
              <Label htmlFor="name">Nombre del servicio *</Label>
              <Input
                id="name"
                placeholder="Ej: Corte de pelo"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción opcional del servicio..."
                {...register("description")}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración *</Label>
                <Select
                  defaultValue={String(suggestedDurations[0] ?? 30)}
                  onValueChange={(value) => setValue("duration", parseInt(value || "30"))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona duración">
                      {ALL_DURATION_OPTIONS[selectedDuration] || "Selecciona duración"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {orderedDurations.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {ALL_DURATION_OPTIONS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear {terminology.service}
              </Button>
              <Link href="/dashboard/services">
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
