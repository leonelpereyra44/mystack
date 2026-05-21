"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  GripVertical,
  Copy,
  ChevronDown,
  Plus,
  FolderOpen,
  Check,
  X as XIcon,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  businessType?: string;
}

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onClone: () => void;
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

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({
  service,
  dragHandle,
  onEdit,
  onToggleActive,
  onDelete,
  onClone,
  isDragging = false,
}: ServiceCardProps & { dragHandle?: React.ReactNode; isDragging?: boolean }) {
  const price = getPrice(service.price);
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group/row",
        isDragging && "bg-muted/50 shadow-lg"
      )}
    >
      {dragHandle}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!service.isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" title="Inactivo" />
          )}
          <span className={cn("font-medium text-sm", !service.isActive && "text-muted-foreground")}>
            {service.name}
          </span>
        </div>
        {service.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {service.description}
          </p>
        )}
      </div>
      <span className="shrink-0 text-sm text-muted-foreground">
        {formatDuration(service.duration)}&nbsp;·&nbsp;{formatPrice(price)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onEdit}
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Sortable service row ─────────────────────────────────────────────────────

function SortableServiceRow(props: ServiceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.service.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-50 z-50")}
    >
      <ServiceRow
        {...props}
        isDragging={isDragging}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
            title="Arrastra para reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  services,
  isCollapsed,
  onToggleCollapse,
  onAddService,
  onRenameCategory,
  onDeleteCategory,
  canDragAndDrop,
  sensors,
  onDragEnd,
  getCardProps,
}: {
  category: string | null;
  services: Service[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddService: () => void;
  onRenameCategory?: (newName: string) => void;
  onDeleteCategory?: () => void;
  canDragAndDrop: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  getCardProps: (s: Service) => ServiceCardProps;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category ?? "");

  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== category) onRenameCategory?.(trimmed);
    setIsRenaming(false);
  };

  const label = category ?? "Sin categoría";
  const isUncategorized = category === null;

  return (
    <div className={cn("border rounded-xl overflow-hidden", !isUncategorized && "border-l-[3px] border-l-muted-foreground/20")}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-b group">
        {isRenaming ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameConfirm();
                if (e.key === "Escape") setIsRenaming(false);
              }}
            />
            <button
              onClick={handleRenameConfirm}
              className="text-primary hover:text-primary/80"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsRenaming(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  isCollapsed && "-rotate-90"
                )}
              />
              <span className="font-semibold text-sm truncate">{label}</span>
            </button>
            <span className="shrink-0 text-xs font-medium text-muted-foreground/70 tabular-nums">
              {services.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddService();
              }}
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
            {!isUncategorized && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(category!);
                      setIsRenaming(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Renombrar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={onDeleteCategory}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar categoría
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* Services */}
      {!isCollapsed && (
        <>
          {services.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Esta categoría está vacía.</p>
              <button
                onClick={onAddService}
                className="mt-1 text-primary text-xs hover:underline"
              >
                Agregar primer tratamiento
              </button>
            </div>
          ) : canDragAndDrop ? (
            <DndContext
              id={`dnd-${category ?? "__none__"}`}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={services.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y">
                  {services.map((s) => (
                    <SortableServiceRow key={s.id} {...getCardProps(s)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="divide-y">
              {services.map((s) => (
                <ServiceRow key={s.id} {...getCardProps(s)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ServicesList({
  services: initialServices,
  businessType = "salon",
}: ServicesListProps) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [services, setServices] = useState(initialServices);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const lastSavedOrderRef = useRef<Service[]>(initialServices);

  // ── Derived ────────────────────────────────────────────────────────────────
  const allNamedCategories = useMemo(() => {
    const cats = services.map((s) => s.category).filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false) ||
        (s.category?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.isActive) ||
        (statusFilter === "inactive" && !s.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [services, searchTerm, statusFilter]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    for (const cat of allNamedCategories) {
      groups[cat] = filteredServices.filter((s) => s.category === cat);
    }
    const uncategorized = filteredServices.filter((s) => !s.category);
    return { groups, uncategorized };
  }, [filteredServices, allNamedCategories]);

  const isFiltered = !!searchTerm || statusFilter !== "all";
  const canDragAndDrop = !isFiltered;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
        toast.success("Tratamiento eliminado");
        const updated = services.filter((s) => s.id !== deleteService.id);
        setServices(updated);
        lastSavedOrderRef.current = updated;
        router.refresh();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error al eliminar el tratamiento");
    } finally {
      setIsDeleting(false);
      setDeleteService(null);
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    setDeleteCategoryName(categoryName);
  };

  const handleDeleteCategoryConfirm = async (mode: "delete-all" | "unassign") => {
    if (!deleteCategoryName) return;
    setIsDeleting(true);
    try {
      const inCategory = services.filter((s) => s.category === deleteCategoryName);
      if (mode === "delete-all") {
        for (const s of inCategory) {
          await fetch(`/api/services/${s.id}`, { method: "DELETE" });
        }
        toast.success(
          `Categoría y ${inCategory.length} tratamiento${inCategory.length !== 1 ? "s" : ""} eliminados`
        );
        setServices((prev) => prev.filter((s) => s.category !== deleteCategoryName));
      } else {
        for (const s of inCategory) {
          await fetch(`/api/services/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: null }),
          });
        }
        toast.success("Tratamientos movidos a Sin categoría");
        setServices((prev) =>
          prev.map((s) =>
            s.category === deleteCategoryName ? { ...s, category: null } : s
          )
        );
      }
      router.refresh();
    } catch {
      toast.error("Error al eliminar la categoría");
    } finally {
      setIsDeleting(false);
      setDeleteCategoryName(null);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    try {
      const inCategory = services.filter((s) => s.category === oldName);
      for (const s of inCategory) {
        await fetch(`/api/services/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: newName }),
        });
      }
      setServices((prev) =>
        prev.map((s) => (s.category === oldName ? { ...s, category: newName } : s))
      );
      toast.success("Categoría renombrada");
    } catch {
      toast.error("Error al renombrar la categoría");
    }
  };

  const toggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) { toast.error("Error al actualizar"); return; }
      toast.success(currentStatus ? "Desactivado" : "Activado");
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, isActive: !currentStatus } : s))
      );
    } catch {
      toast.error("Error al actualizar el tratamiento");
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
        toast.success("Tratamiento duplicado");
        router.refresh();
      } else {
        toast.error("Error al duplicar");
      }
    } catch {
      toast.error("Error al duplicar el tratamiento");
    }
  };

  const confirmNewCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (allNamedCategories.includes(name)) {
      toast.error("Ya existe una categoría con ese nombre");
      return;
    }
    setNewCategoryName("");
    setIsAddingCategory(false);
    // Redirect to new service form with category pre-filled so it persists in DB
    router.push(
      `/dashboard/services/new?type=${businessType}&category=${encodeURIComponent(name)}`
    );
  };

  const getCardProps = (service: Service): ServiceCardProps => ({
    service,
    onEdit: () => router.push(`/dashboard/services/${service.id}/edit`),
    onToggleActive: () => toggleActive(service.id, service.isActive),
    onDelete: () => setDeleteService(service),
    onClone: () => handleClone(service),
  });

  const toggleCollapse = (key: string) =>
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Empty state ────────────────────────────────────────────────────────────
  if (initialServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No hay tratamientos configurados aún</p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/dashboard/services/new?type=${businessType}`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear primer tratamiento
        </Button>
      </div>
    );
  }

  const deleteCategoryCount = services.filter(
    (s) => s.category === deleteCategoryName
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Top bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tratamiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              value && setStatusFilter(value as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue>
                {{ all: "Todos", active: "Activos", inactive: "Inactivos" }[statusFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingCategory(true);
              setNewCategoryName("");
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva categoría
          </Button>
        </div>
      </div>

      {/* ── New category input ── */}
      {isAddingCategory && (
        <div className="flex items-center gap-2 mb-4 p-3 border rounded-xl bg-muted/20">
          <Input
            placeholder="Nombre de la categoría..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmNewCategory();
              if (e.key === "Escape") setIsAddingCategory(false);
            }}
          />
          <Button
            size="sm"
            onClick={confirmNewCategory}
            disabled={!newCategoryName.trim()}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingCategory(false)}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── DnD hint ── */}
      {canDragAndDrop && services.length > 1 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
          <GripVertical className="h-3.5 w-3.5" />
          Arrastra para reordenar dentro de cada categoría
          {isSavingOrder && <span className="text-primary ml-1">(Guardando...)</span>}
        </p>
      )}

      {/* ── Category sections ── */}
      <div className="space-y-3">
        {allNamedCategories.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            services={groupedByCategory.groups[cat] ?? []}
            isCollapsed={collapsedCategories.has(cat)}
            onToggleCollapse={() => toggleCollapse(cat)}
            onAddService={() =>
              router.push(
                `/dashboard/services/new?type=${businessType}&category=${encodeURIComponent(cat)}`
              )
            }
            onRenameCategory={(newName) => handleRenameCategory(cat, newName)}
            onDeleteCategory={() => handleDeleteCategory(cat)}
            canDragAndDrop={canDragAndDrop}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            getCardProps={getCardProps}
          />
        ))}

        {/* Sin categoría */}
        {groupedByCategory.uncategorized.length > 0 && (
          <CategorySection
            category={null}
            services={groupedByCategory.uncategorized}
            isCollapsed={collapsedCategories.has("__none__")}
            onToggleCollapse={() => toggleCollapse("__none__")}
            onAddService={() =>
              router.push(`/dashboard/services/new?type=${businessType}`)
            }
            canDragAndDrop={canDragAndDrop}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            getCardProps={getCardProps}
          />
        )}

        {/* No results */}
        {isFiltered && filteredServices.length === 0 && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron tratamientos</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-2 text-primary text-xs hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Delete service dialog ── */}
      <Dialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Eliminar &quot;{deleteService?.name}&quot;?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también los turnos
              asociados a este tratamiento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteService(null)}>
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

      {/* ── Delete category dialog ── */}
      <Dialog
        open={!!deleteCategoryName}
        onOpenChange={() => setDeleteCategoryName(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Eliminar categoría &quot;{deleteCategoryName}&quot;
            </DialogTitle>
            <DialogDescription>
              Esta categoría tiene {deleteCategoryCount} tratamiento
              {deleteCategoryCount !== 1 ? "s" : ""}. ¿Qué hacemos con ellos?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteCategoryName(null)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeleteCategoryConfirm("unassign")}
              disabled={isDeleting}
            >
              Mover a Sin categoría
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteCategoryConfirm("delete-all")}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


