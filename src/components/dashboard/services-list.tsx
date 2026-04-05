"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, Search, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  description: string | null;
  duration: number;
  price: number | { toNumber: () => number };
  isActive: boolean;
}

interface ServicesListProps {
  services: Service[];
  businessId: string;
}

export function ServicesList({ services, businessId }: ServicesListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "duration">("name");

  // Filtrar y ordenar servicios
  const filteredServices = useMemo(() => {
    let result = services.filter((service) => {
      // Filtro por búsqueda
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // Filtro por estado
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        const priceA = typeof a.price === 'object' && 'toNumber' in a.price ? a.price.toNumber() : Number(a.price);
        const priceB = typeof b.price === 'object' && 'toNumber' in b.price ? b.price.toNumber() : Number(b.price);
        return priceA - priceB;
      } else {
        return a.duration - b.duration;
      }
    });

    return result;
  }, [services, searchTerm, statusFilter, sortBy]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Servicio eliminado correctamente");
        router.refresh();
      } else {
        toast.error("Error al eliminar el servicio");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const toggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      toast.success(currentStatus ? "Servicio desactivado" : "Servicio activado");
      router.refresh();
    } catch (error) {
      console.error("Error toggling service:", error);
      toast.error("Error al actualizar el servicio");
    }
  };

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No tienes servicios configurados
          </p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/services/new")}>
            Crear tu primer servicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filtros y búsqueda */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => value && setSortBy(value as "name" | "price" | "duration")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="price">Precio</SelectItem>
              <SelectItem value="duration">Duración</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No se encontraron servicios con los filtros aplicados
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
          const price = typeof service.price === 'object' && 'toNumber' in service.price 
            ? service.price.toNumber() 
            : Number(service.price);

          return (
            <Card key={service.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {service.name}
                    {!service.isActive && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {service.duration} min · ${price.toFixed(2)}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>} />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/dashboard/services/${service.id}/edit`)
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleActive(service.id, service.isActive)}
                    >
                      {service.isActive ? "Desactivar" : "Activar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(service.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              {service.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar servicio?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también los turnos
              asociados a este servicio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
