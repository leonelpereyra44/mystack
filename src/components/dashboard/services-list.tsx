"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, Search, Filter, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | { toNumber: () => number };
  isActive: boolean;
  sortOrder?: number;
}

interface ServicesListProps {
  services: Service[];
}

// Componente sorteable para cada servicio
function SortableServiceCard({
  service,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const price =
    typeof service.price === "object" && "toNumber" in service.price
      ? service.price.toNumber()
      : Number(service.price);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isCurrentlyDragging && "opacity-50 z-50"
      )}
    >
      <Card className={cn(isCurrentlyDragging && "shadow-lg ring-2 ring-primary")}>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              title="Arrastra para reordenar"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {service.name}
                {!service.isActive && <Badge variant="secondary">Inactivo</Badge>}
              </CardTitle>
              <CardDescription>
                {service.duration} min · ${price.toFixed(2)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {service.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        {service.description && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ServicesList({ services: initialServices }: ServicesListProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"custom" | "name" | "price" | "duration">("custom");
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar y ordenar servicios
  const filteredServices = useMemo(() => {
    let result = services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);

      return matchesSearch && matchesStatus;
    });

    if (sortBy !== "custom") {
      result = [...result].sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "price") {
          const priceA =
            typeof a.price === "object" && "toNumber" in a.price
              ? a.price.toNumber()
              : Number(a.price);
          const priceB =
            typeof b.price === "object" && "toNumber" in b.price
              ? b.price.toNumber()
              : Number(b.price);
          return priceA - priceB;
        } else {
          return a.duration - b.duration;
        }
      });
    }

    return result;
  }, [services, searchTerm, statusFilter, sortBy]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(services, oldIndex, newIndex);
      setServices(newOrder);

      // Guardar el nuevo orden en el servidor
      setIsSavingOrder(true);
      try {
        const response = await fetch("/api/services/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
        });

        if (response.ok) {
          toast.success("Orden guardado");
        } else {
          toast.error("Error al guardar el orden");
          setServices(initialServices);
        }
      } catch {
        toast.error("Error al guardar el orden");
        setServices(initialServices);
      } finally {
        setIsSavingOrder(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Servicio eliminado correctamente");
        setServices(services.filter((s) => s.id !== deleteId));
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
      setServices(
        services.map((s) =>
          s.id === serviceId ? { ...s, isActive: !currentStatus } : s
        )
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling service:", error);
      toast.error("Error al actualizar el servicio");
    }
  };

  if (initialServices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No tienes servicios configurados</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/services/new")}
          >
            Crear tu primer servicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canDragAndDrop = sortBy === "custom" && !searchTerm && statusFilter === "all";

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
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              value && setStatusFilter(value as "all" | "active" | "inactive")
            }
          >
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
          <Select
            value={sortBy}
            onValueChange={(value) =>
              value && setSortBy(value as "custom" | "name" | "price" | "duration")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Personalizado</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="price">Precio</SelectItem>
              <SelectItem value="duration">Duración</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info de drag & drop */}
      {canDragAndDrop && (
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          Arrastra para reordenar los servicios
          {isSavingOrder && <span className="text-primary">(Guardando...)</span>}
        </p>
      )}

      {/* Resultados */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No se encontraron servicios con los filtros aplicados
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : canDragAndDrop ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredServices.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <SortableServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => router.push(`/dashboard/services/${service.id}/edit`)}
                  onToggleActive={() => toggleActive(service.id, service.isActive)}
                  onDelete={() => setDeleteId(service.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const price =
              typeof service.price === "object" && "toNumber" in service.price
                ? service.price.toNumber()
                : Number(service.price);

            return (
              <Card key={service.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {service.name}
                      {!service.isActive && <Badge variant="secondary">Inactivo</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {service.duration} min · ${price.toFixed(2)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
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
