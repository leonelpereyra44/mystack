"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Info, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

const serviceSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  duration: z.number().min(5, "La duración mínima es 5 minutos"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  isActive: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Schedule state
  const [schedules, setSchedules] = useState<ServiceScheduleEntry[]>([]);
  const [savingSchedules, setSavingSchedules] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duration: 30,
      price: 0,
      isActive: true,
    },
  });



  useEffect(() => {
    async function fetchService() {
      try {
        const [serviceRes, scheduleRes] = await Promise.all([
          fetch(`/api/services/${id}`),
          fetch(`/api/services/${id}/schedule`),
        ]);

        if (serviceRes.ok) {
          const service = await serviceRes.json();
          setValue("name", service.name);
          setValue("description", service.description || "");
          setValue("duration", service.duration);
          setValue("price", Number(service.price));
          setValue("isActive", service.isActive);
        } else {
          setError("Servicio no encontrado");
        }

        if (scheduleRes.ok) {
          const { schedules: existing } = await scheduleRes.json();
          setSchedules(
            existing.map((s: ServiceScheduleEntry) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          );
        }
      } catch {
        setError("Error al cargar el servicio");
      } finally {
        setIsFetching(false);
      }
    }
    fetchService();
  }, [id, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Error al actualizar el servicio");
        return;
      }

      toast.success("Servicio actualizado correctamente");
      router.push("/dashboard/services");
      router.refresh();
    } catch {
      setError("Error al actualizar el servicio");
    } finally {
      setIsLoading(false);
    }
  };

  const isDayEnabled = (dayOfWeek: number) =>
    schedules.some((s) => s.dayOfWeek === dayOfWeek);

  const getDaySchedule = (dayOfWeek: number): ServiceScheduleEntry | undefined =>
    schedules.find((s) => s.dayOfWeek === dayOfWeek);

  const toggleDay = (dayOfWeek: number) => {
    if (isDayEnabled(dayOfWeek)) {
      setSchedules((prev) => prev.filter((s) => s.dayOfWeek !== dayOfWeek));
    } else {
      setSchedules((prev) => [
        ...prev,
        { dayOfWeek, startTime: "09:00", endTime: "18:00" },
      ]);
    }
  };

  const updateDayTime = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    try {
      const response = await fetch(`/api/services/${id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || "Error al guardar franjas");
        return;
      }

      toast.success(
        schedules.length > 0
          ? "Franjas horarias guardadas"
          : "Franjas eliminadas — el servicio usa el horario del negocio"
      );
    } catch {
      toast.error("Error al guardar franjas");
    } finally {
      setSavingSchedules(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Servicio</h1>
          <p className="text-muted-foreground">
            Modifica la información del servicio
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del Servicio</CardTitle>
          <CardDescription>
            Actualiza la información del servicio
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
                {...register("name")}
                placeholder="Ej: Corte de cabello"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe el servicio..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  placeholder="30"
                  {...register("duration", { valueAsNumber: true })}
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">
                    {errors.duration.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="font-normal">
                Servicio activo (visible para reservas)
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
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

      {/* Service Schedule */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Franjas Horarias del Servicio
          </CardTitle>
          <CardDescription>
            Define los días y horarios en que se puede reservar este servicio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Si no configuras franjas horarias, este servicio estará disponible
              durante todo el horario del negocio. Activar días restringe la
              disponibilidad solo a las horas indicadas.
            </p>
          </div>

          <div className="space-y-3">
            {DAYS.map(({ value, label }) => {
              const enabled = isDayEnabled(value);
              const sched = getDaySchedule(value);
              return (
                <div key={value} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`day-${value}`}
                    checked={enabled}
                    onChange={() => toggleDay(value)}
                    className="h-4 w-4 rounded border-gray-300 shrink-0"
                  />
                  <Label
                    htmlFor={`day-${value}`}
                    className="w-24 shrink-0 font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                  {enabled && sched ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={sched.startTime}
                        onChange={(e) =>
                          updateDayTime(value, "startTime", e.target.value)
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <Input
                        type="time"
                        value={sched.endTime}
                        onChange={(e) =>
                          updateDayTime(value, "endTime", e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {enabled ? "" : "No disponible"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleSaveSchedules}
            disabled={savingSchedules}
            className="mt-2"
          >
            {savingSchedules && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Franjas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

