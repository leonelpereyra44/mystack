"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, Search, Filter, GripVertical, Copy, Tag } from "lucide-react";
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
  category: string | null;
  duration: number;
  price: number | { toNumber: () => number };
  isActive: boolean;
  sortOrder?: number;
}

interface ServicesListProps {
  services: Service[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-AR")}`;
}

function getPrice(price: Service["price"]): number {
  return typeof price === "object" && "toNumber" in price
    ? price.toNumber()
    : Number(price);
}

// ─── Shared card body ─────────────────────────────────────────────────────────

function ServiceCardBody({
  service,
  dragHandle,
  onEdit,
  onToggleActive,
  onDelete,
  onClone,
  isDragging = false,
}: {
  service: Service;
  dragHandle?: React.ReactNode;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onClone: () => void;
  isDragging?: boolean;
}) {
  const price = getPrice(service.price);
  return (
    <Card className={cn(isDragging && "shadow-lg ring-2 ring-primary")}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {dragHandle}
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 flex-wrap text-base">
              {service.name}
              {!service.isActive && <Badge variant="secondary">Inactivo</Badge>}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 flex-wrap">
              <span>{formatDuration(service.duration)}</span>
              <span>·</span>
              <span>{formatPrice(price)}</span>
              {service.category && (
                <Badge variant="outline" className="text-xs font-normal gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {service.category}
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title="Editar"
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClone}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
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
        </div>
      </CardHeader>
      {service.description && (
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Sortable wrapper ─────────────────────────────────────────────────────────

function SortableServiceCard(props: {
  service: Service;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onClone: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.service.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-50 z-50")}
    >
      <ServiceCardBody
        {...props}
        isDragging={isDragging}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Arrastra para reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        }
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ServicesList({ services: initialServices }: ServicesListProps) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [services, setServices] = useState(initialServices);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"custom" | "name" | "price" | "duration">("custom");

  // Track last successfully saved order for accurate revert on DnD failure
  const lastSavedOrderRef = useRef<Service[]>(initialServices);

  // ── Derived ────────────────────────────────────────────────────────────────
  const availableCategories = useMemo(() => {
    const cats = services.map((s) => s.category).filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }, [services]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredServices = useMemo(() => {
    let result = services.filter((service) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        (service.description?.toLowerCase().includes(q) ?? false) ||
        (service.category?.toLowerCase().includes(q) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "__none__"
          ? !service.category
          : service.category === categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });

    if (sortBy !== "custom") {
      result = [...result].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price") return getPrice(a.price) - getPrice(b.price);
        return a.duration - b.duration;
      });
    }

    return result;
  }, [services, searchTerm, statusFilter, categoryFilter, sortBy]);

  const canDragAndDrop =
    sortBy === "custom" && !searchTerm && statusFilter === "all" && categoryFilter === "all";

  const isFiltered = !!searchTerm || statusFilter !== "all" || categoryFilter !== "all";

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(services, oldIndex, newIndex);
    setServices(newOrder);

    setIsSavingOrder(true);
    try {
      const response = await fetch("/api/services/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
      });
      if (response.ok) {
        lastSavedOrderRef.current = newOrder;
        toast.success("Orden guardado");
      } else {
        toast.error("Error al guardar el orden");
        setServices(lastSavedOrderRef.current);
      }
    } catch {
      toast.error("Error al guardar el orden");
      setServices(lastSavedOrderRef.current);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteService) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${deleteService.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Servicio eliminado");
        const updated = services.filter((s) => s.id !== deleteService.id);
        setServices(updated);
        lastSavedOrderRef.current = updated;
        router.refresh();
      } else {
        toast.error("Error al eliminar el servicio");
      }
    } catch {
      toast.error("Error al eliminar el servicio");
    } finally {
      setIsDeleting(false);
      setDeleteService(null);
    }
  };

  const toggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) {
        toast.error("Error al actualizar el servicio");
        return;
      }
      toast.success(currentStatus ? "Servicio desactivado" : "Servicio activado");
      setServices(
        services.map((s) => (s.id === serviceId ? { ...s, isActive: !currentStatus } : s))
      );
      router.refresh();
    } catch {
      toast.error("Error al actualizar el servicio");
    }
  };

  const handleClone = async (service: Service) => {
    const price = getPrice(service.price);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Copia de ${service.name}`,
          description: service.description,
          category: service.category,
          duration: service.duration,
          price,
          isActive: service.isActive,
        }),
      });
      if (response.ok) {
        const cloned = await response.json();
        const updated = [...services, { ...cloned, price: Number(cloned.price) }];
        setServices(updated);
        lastSavedOrderRef.current = updated;
        toast.success("Servicio duplicado");
        router.refresh();
      } else {
        toast.error("Error al duplicar el servicio");
      }
    } catch {
      toast.error("Error al duplicar el servicio");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  // ── Card props helper ─────────────────────────────────────────────────────
  const cardProps = (service: Service) => ({
    service,
    onEdit: () => router.push(`/dashboard/services/${service.id}/edit`),
    onToggleActive: () => toggleActive(service.id, service.isActive),
    onDelete: () => setDeleteService(service),
    onClone: () => handleClone(service),
  });

  // ── Empty state ────────────────────────────────────────────────────────────
  if (initialServices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No tienes servicios configurados</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/services/new")}>
            Crear tu primer servicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              value && setStatusFilter(value as "all" | "active" | "inactive")
            }
            items={{ all: "Todos", active: "Activos", inactive: "Inactivos" }}
          >
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          {availableCategories.length > 0 && (
            <Select
              value={categoryFilter}
              onValueChange={(value) => value && setCategoryFilter(value)}
              items={{ all: "Todas las categorías", ...Object.fromEntries(availableCategories.map(cat => [cat, cat])), __none__: "Sin categoría" }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="__none__">Sin categoría</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select
            value={sortBy}
            onValueChange={(value) =>
              value && setSortBy(value as "custom" | "name" | "price" | "duration")
            }
            items={{ custom: "Personalizado", name: "Nombre", price: "Precio", duration: "Duración" }}
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

      {/* Counter / drag hint */}
      <div className="flex items-center mb-4 min-h-[20px]">
        {isFiltered ? (
          <p className="text-sm text-muted-foreground">
            {filteredServices.length === services.length
              ? `${services.length} servicio${services.length !== 1 ? "s" : ""}`
              : `${filteredServices.length} de ${services.length} servicio${services.length !== 1 ? "s" : ""}`}
            {filteredServices.length !== services.length && (
              <button
                onClick={clearFilters}
                className="ml-2 text-primary underline-offset-2 hover:underline text-xs"
              >
                Limpiar filtros
              </button>
            )}
          </p>
        ) : canDragAndDrop ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Arrastra para reordenar
            {isSavingOrder && <span className="text-primary ml-1">(Guardando...)</span>}
          </p>
        ) : null}
      </div>

      {/* Results */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No se encontraron servicios con los filtros aplicados
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
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
                <SortableServiceCard key={service.id} {...cardProps(service)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCardBody key={service.id} {...cardProps(service)} />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar &quot;{deleteService?.name}&quot;?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también los turnos
              asociados a este servicio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteService(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
