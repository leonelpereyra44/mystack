"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
}

interface NewAppointmentModalProps {
  businessId: string;
  services: Service[];
  staff: Staff[];
}

const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  staffId: z.string().optional(),
  date: z.date({ message: "Selecciona una fecha" }),
  startTime: z.string().min(1, "Selecciona un horario"),
  customerName: z.string().min(2, "Ingresa el nombre del cliente"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function NewAppointmentModal({
  businessId,
  services,
  staff,
}: NewAppointmentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const selectedDate = watch("date");
  const selectedServiceId = watch("serviceId");
  const selectedStaffId = watch("staffId");
  const selectedTime = watch("startTime");

  // Obtener el servicio seleccionado para mostrar su nombre
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  // Cargar horarios disponibles cuando cambia fecha, servicio o staff
  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !selectedServiceId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setValue("startTime", ""); // Reset selected time

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        businessId,
        date: dateStr,
        serviceId: selectedServiceId,
      });
      
      if (selectedStaffId) {
        params.append("staffId", selectedStaffId);
      }

      const response = await fetch(`/api/appointments/available?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedServiceId, selectedStaffId, businessId, setValue]);

  // Cargar slots cuando cambian las dependencias
  useEffect(() => {
    if (open && selectedServiceId && selectedDate) {
      loadAvailableSlots();
    }
  }, [open, selectedServiceId, selectedDate, selectedStaffId, loadAvailableSlots]);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId: data.serviceId,
          staffId: data.staffId || null,
          date: format(data.date, "yyyy-MM-dd"),
          startTime: data.startTime,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || null,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear el turno");
      }

      toast.success("Turno creado correctamente");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear el turno");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setShowCalendar(false);
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar turno
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Agenda un turno manualmente para un cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Servicio */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">Servicio *</Label>
            <Select
              onValueChange={(value) => setValue("serviceId", value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un servicio">
                  {selectedService 
                    ? `${selectedService.name} - ${selectedService.duration} min - $${selectedService.price}`
                    : "Selecciona un servicio"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.duration} min - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          {/* Profesional (opcional) */}
          {staff.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="staffId">Profesional (opcional)</Label>
              <Select
                onValueChange={(value) => setValue("staffId", value === "none" ? undefined : (value as string))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar">
                    {selectedStaff ? selectedStaff.name : "Sin asignar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(selectedDate, "PPP", { locale: es })
                : "Selecciona una fecha"}
            </Button>
            {showCalendar && (
              <div className="rounded-md border p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("date", date);
                      setShowCalendar(false);
                    }
                  }}
                  locale={es}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            )}
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora *</Label>
            {!selectedServiceId ? (
              <p className="text-sm text-muted-foreground py-2">
                Selecciona un servicio primero
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando horarios...
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay horarios disponibles para esta fecha
              </p>
            ) : (
              <Select onValueChange={(value) => setValue("startTime", value as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un horario">
                    {selectedTime || "Selecciona un horario"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Datos del cliente
            </p>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre *</Label>
              <Input
                id="customerName"
                placeholder="Nombre del cliente"
                {...register("customerName")}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="cliente@email.com"
                {...register("customerEmail")}
              />
              {errors.customerEmail && (
                <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+54 11 1234-5678"
                {...register("customerPhone")}
              />
            </div>

            {/* Notas */}
            <div className="mt-3 space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales..."
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear turno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
