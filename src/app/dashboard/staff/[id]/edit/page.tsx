"use client";

import { useState, useEffect, use } from "react";
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
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            Modifica la información del miembro del equipo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
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
                Guardar Cambios
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
