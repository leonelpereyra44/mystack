"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Clock, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

interface StaffSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

interface BusinessSchedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

const staffSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface EditStaffPageProps {
  params: Promise<{ id: string }>;
}

export default function EditStaffPage({ params }: EditStaffPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [businessSchedules, setBusinessSchedules] = useState<BusinessSchedule[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      isActive: true,
    },
  });

  // Cargar datos del staff
  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch(`/api/staff/${id}`);
        if (response.ok) {
          const staff = await response.json();
          setValue("name", staff.name);
          setValue("email", staff.email || "");
          setValue("phone", staff.phone || "");
          setValue("isActive", staff.isActive);
        } else {
          setError("Miembro no encontrado");
        }
      } catch {
        setError("Error al cargar el miembro");
      } finally {
        setIsFetching(false);
      }
    }
    fetchStaff();
  }, [id, setValue]);

  // Cargar horarios
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const response = await fetch(`/api/staff/${id}/schedule`);
        if (response.ok) {
          const data = await response.json();
          setStaffSchedules(data.staffSchedules || []);
          setBusinessSchedules(data.businessSchedules || []);
        }
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    }
    fetchSchedules();
  }, [id]);

  const onSubmit = async (data: StaffFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Error al actualizar el miembro");
        return;
      }

      toast.success("Miembro actualizado correctamente");
      router.push("/dashboard/staff");
      router.refresh();
    } catch {
      setError("Error al actualizar el miembro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleChange = (dayOfWeek: number, field: string, value: string | boolean) => {
    setStaffSchedules((prev) => {
      const existing = prev.find((s) => s.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.map((s) =>
          s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
        );
      }
      return [
        ...prev,
        {
          dayOfWeek,
          startTime: "09:00",
          endTime: "18:00",
          isWorking: false,
          [field]: value,
        },
      ];
    });
  };

  const saveSchedules = async () => {
    setIsSavingSchedule(true);
    setScheduleError(null);

    try {
      const response = await fetch(`/api/staff/${id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: staffSchedules }),
      });

      const result = await response.json();

      if (!response.ok) {
        setScheduleError(result.error || "Error al guardar horarios");
        return;
      }

      toast.success("Horarios actualizados correctamente");
    } catch {
      setScheduleError("Error al guardar horarios");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const getScheduleForDay = (dayOfWeek: number): StaffSchedule => {
    return (
      staffSchedules.find((s) => s.dayOfWeek === dayOfWeek) || {
        dayOfWeek,
        startTime: "09:00",
        endTime: "18:00",
        isWorking: false,
      }
    );
  };

  const getBusinessScheduleForDay = (dayOfWeek: number): BusinessSchedule | undefined => {
    return businessSchedules.find((s) => s.dayOfWeek === dayOfWeek);
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
        <Link href="/dashboard/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Miembro</h1>
          <p className="text-muted-foreground">
            Modifica la información y horarios del miembro
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos del miembro */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Miembro</CardTitle>
            <CardDescription>
              Actualiza la información del miembro
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
                  {...register("name")}
                  placeholder="Nombre del miembro"
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
                  {...register("email")}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Miembro activo (disponible para turnos)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Datos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Horarios del miembro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Trabajo
            </CardTitle>
            <CardDescription>
              Define los días y horarios en que este miembro trabaja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Los horarios deben estar dentro del horario del negocio. Los días que el negocio está cerrado aparecen deshabilitados.
              </p>
            </div>

            {scheduleError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {scheduleError}
              </div>
            )}

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = getScheduleForDay(day.value);
                const businessSchedule = getBusinessScheduleForDay(day.value);
                const isBusinessClosed = !businessSchedule?.isOpen;

                return (
                  <div
                    key={day.value}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border ${
                      isBusinessClosed ? "bg-muted/50 opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <input
                        type="checkbox"
                        checked={schedule.isWorking && !isBusinessClosed}
                        disabled={isBusinessClosed}
                        onChange={(e) =>
                          handleScheduleChange(day.value, "isWorking", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="font-medium">{day.label}</span>
                    </div>

                    {isBusinessClosed ? (
                      <span className="text-sm text-muted-foreground">
                        Negocio cerrado
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <Select
                          value={schedule.startTime}
                          onValueChange={(value) => {
                            if (value) handleScheduleChange(day.value, "startTime", value);
                          }}
                          disabled={!schedule.isWorking}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">a</span>
                        <Select
                          value={schedule.endTime}
                          onValueChange={(value) => {
                            if (value) handleScheduleChange(day.value, "endTime", value);
                          }}
                          disabled={!schedule.isWorking}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {businessSchedule && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            (Negocio: {businessSchedule.openTime} - {businessSchedule.closeTime})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              onClick={saveSchedules}
              disabled={isSavingSchedule}
              className="w-full"
            >
              {isSavingSchedule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Horarios
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start">
        <Link href="/dashboard/staff">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    </div>
  );
}
