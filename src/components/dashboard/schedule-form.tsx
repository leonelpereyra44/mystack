"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getBusinessType } from "@/lib/business-types";

import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";

interface Schedule {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface ScheduleFormProps {
  schedules: Schedule[];
  businessId: string;
  businessType?: string;
}

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

export function ScheduleForm({ schedules, businessId, businessType = "salon" }: ScheduleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(schedules);

  const typeConfig = getBusinessType(businessType);

  const applyDefaultSchedule = () => {
    setLocalSchedules((prev) =>
      prev.map((s) => {
        const def = typeConfig.defaultSchedule.find(
          (d) => d.dayOfWeek === s.dayOfWeek
        );
        if (!def) return s;
        return {
          ...s,
          isOpen: def.isOpen,
          openTime: def.openTime,
          closeTime: def.closeTime,
        };
      })
    );
    toast.info(`Horarios sugeridos para ${typeConfig.label} aplicados. Guardá los cambios para confirmar.`);
  };

  const updateSchedule = (dayOfWeek: number, field: string, value: string | boolean) => {
    setLocalSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/business/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: localSchedules }),
      });

      if (response.ok) {
        toast.success("Horarios guardados correctamente");
        router.refresh();
      } else {
        toast.error("Error al guardar los horarios");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Error al guardar los horarios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Horarios de Atención</CardTitle>
            <CardDescription>
              Define en qué horarios tu negocio está abierto para recibir reservas
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={applyDefaultSchedule}
            className="shrink-0 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Horarios sugeridos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, index) => {
          const schedule = localSchedules.find((s) => s.dayOfWeek === index);
          if (!schedule) return null;

          return (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <span className="font-medium">{day}</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={schedule.isOpen}
                    onChange={(e) =>
                      updateSchedule(index, "isOpen", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Abierto</span>
                </label>
              </div>

              {schedule.isOpen && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm min-w-[40px]">Desde</Label>
                    <Select
                      value={schedule.openTime}
                      onValueChange={(value) =>
                        updateSchedule(index, "openTime", value || "09:00")
                      }
                    >
                      <SelectTrigger className="w-20 sm:w-24">
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
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm min-w-[40px]">Hasta</Label>
                    <Select
                      value={schedule.closeTime}
                      onValueChange={(value) =>
                        updateSchedule(index, "closeTime", value || "18:00")
                      }
                    >
                      <SelectTrigger className="w-20 sm:w-24">
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
                  </div>
                </div>
              )}

              {!schedule.isOpen && (
                <span className="text-sm text-muted-foreground">Cerrado</span>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
