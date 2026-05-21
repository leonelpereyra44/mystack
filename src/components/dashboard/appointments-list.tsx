"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Helper para parsear fecha UTC correctamente
function parseUTCDate(dateString: string | Date): Date {
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

import {
  Calendar,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarPlus,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  CalendarClock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  notes: string | null;
  rescheduledFromId: string | null;
  serviceId: string;
  staffId: string | null;
  service: {
    name: string;
    duration: number;
  };
  staff: {
    name: string;
  } | null;
}

const ITEMS_PER_PAGE = 25;

function isAppointmentUpcoming(appointmentDate: Date, startTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  const d = new Date(appointmentDate);
  const aptDateTime = new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
  return aptDateTime > now;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  slotCapacity: number;
  services?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
  businessName: string;
  businessAddress?: string | null;
  businessTimezone?: string;
  onDuplicate?: (apt: Appointment) => void;
}

const statusConfig = {
  PENDING: { label: "Pendiente", variant: "secondary" as const, icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
  COMPLETED: { label: "Completado", variant: "outline" as const, icon: CheckCircle },
  NO_SHOW: { label: "No asistió", variant: "destructive" as const, icon: XCircle },
  RESCHEDULED: { label: "Reprogramado", variant: "secondary" as const, icon: CalendarClock },
  RESCHEDULED_PENDING:  { label: "Reprogramado · Pendiente",  variant: "secondary" as const, icon: CalendarClock },
  RESCHEDULED_CONFIRMED: { label: "Reprogramado · Confirmado", variant: "default"   as const, icon: CalendarClock },
};

function getStatusConfig(apt: Appointment) {
  if (apt.rescheduledFromId) {
    if (apt.status === "PENDING")   return statusConfig.RESCHEDULED_PENDING;
    if (apt.status === "CONFIRMED") return statusConfig.RESCHEDULED_CONFIRMED;
  }
  return statusConfig[apt.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-sky-500", "bg-pink-500", "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Filter Bar subcomponent ─────────────────────────────────────────────────

interface FilterBarProps {
  filter: "upcoming" | "past" | "all";
  onFilterChange: (f: "upcoming" | "past" | "all") => void;
  search: string;
  onSearchChange: (v: string) => void;
  filterServiceId: string;
  onFilterServiceChange: (v: string) => void;
  filterStaffId: string;
  onFilterStaffChange: (v: string) => void;
  services?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
  onExportCSV: () => void;
  onExportICS: () => void;
  hasResults: boolean;
}

function FilterBar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  filterServiceId,
  onFilterServiceChange,
  filterStaffId,
  onFilterStaffChange,
  services,
  staff,
  onExportCSV,
  onExportICS,
  hasResults,
}: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasServices = services && services.length > 1;
  const hasStaff = staff && staff.length > 0;
  const activeSecondaryFilters =
    (filterServiceId !== "all" ? 1 : 0) + (filterStaffId !== "all" ? 1 : 0);

  return (
    <div className="space-y-2 mb-4">
      {/* Mobile Row 1: full-width segmented tabs */}
      <div className="grid grid-cols-3 rounded-md border bg-muted p-0.5 md:hidden">
        {(["upcoming", "past", "all"] as const).map((f, i) => {
          const labels = ["Próximos", "Pasados", "Todos"];
          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`rounded-sm py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* Desktop Row 1: tabs + selects + exports */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5">
          <Button variant={filter === "upcoming" ? "default" : "outline"} size="sm" onClick={() => onFilterChange("upcoming")}>
            Próximos
          </Button>
          <Button variant={filter === "past" ? "default" : "outline"} size="sm" onClick={() => onFilterChange("past")}>
            Pasados
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => onFilterChange("all")}>
            Todos
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {hasServices && (
            <Select value={filterServiceId} onValueChange={(v) => { if (v) onFilterServiceChange(v); }} items={{ all: "Todos los servicios", ...Object.fromEntries(services!.map(s => [s.id, s.name])) }}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                {services!.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hasStaff && (
            <Select value={filterStaffId} onValueChange={(v) => { if (v) onFilterStaffChange(v); }} items={{ all: "Todo el personal", ...Object.fromEntries(staff!.map(s => [s.id, s.name])) }}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el personal</SelectItem>
                {staff!.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onExportCSV} disabled={!hasResults}>
            <Download className="h-3.5 w-3.5" />CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onExportICS} disabled={!hasResults}>
            <CalendarPlus className="h-3.5 w-3.5" />Calendario
          </Button>
        </div>
      </div>

      {/* Mobile Row 2: search + Filtros button */}
      <div className="flex gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="h-8 pl-8 pr-8 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5"
          onClick={() => setSheetOpen(true)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeSecondaryFilters > 0 && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeSecondaryFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Row 2: search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="h-8 pl-8 pr-8 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>Filtros y exportar</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {hasServices && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Servicio</Label>
                <Select
                  value={filterServiceId}
                  onValueChange={(v) => { if (v) { onFilterServiceChange(v); } }}
                  items={{ all: "Todos los servicios", ...Object.fromEntries(services!.map(s => [s.id, s.name])) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    {services!.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasStaff && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Personal</Label>
                <Select
                  value={filterStaffId}
                  onValueChange={(v) => { if (v) { onFilterStaffChange(v); } }}
                  items={{ all: "Todo el personal", ...Object.fromEntries(staff!.map(s => [s.id, s.name])) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Personal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el personal</SelectItem>
                    {staff!.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeSecondaryFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => {
                  onFilterServiceChange("all");
                  onFilterStaffChange("all");
                }}
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { onExportCSV(); setSheetOpen(false); }}
                disabled={!hasResults}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { onExportICS(); setSheetOpen(false); }}
                disabled={!hasResults}
              >
                <CalendarPlus className="h-4 w-4" />
                Calendario
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppointmentsList({
  appointments,
  slotCapacity,
  services,
  staff,
  businessName,
  businessAddress,
  businessTimezone,
  onDuplicate,
}: AppointmentsListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [search, setSearch] = useState("");
  const [filterServiceId, setFilterServiceId] = useState<string>("all");
  const [filterStaffId, setFilterStaffId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [exportModal, setExportModal] = useState<null | "csv" | "ics">(null);

  // Optimistic local state — starts as null (use server data), becomes array after first mutation
  const [localAppointments, setLocalAppointments] = useState<Appointment[] | null>(null);
  const activeAppointments = localAppointments ?? appointments;

  const handleFilterChange = (newFilter: "upcoming" | "past" | "all") => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Compute occupancy per slot (date+startTime) across ALL appointments (not just page)
  const slotOccupancy = activeAppointments.reduce((acc, apt) => {
    if (apt.status === "CANCELLED") return acc;
    const key = `${format(parseUTCDate(apt.date), "yyyy-MM-dd")}_${apt.startTime}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter, sort, and paginate in memory
  const filteredAppointments = activeAppointments.filter((apt) => {
    if (filter !== "all") {
      const upcoming = isAppointmentUpcoming(apt.date, apt.startTime);
      if (filter === "upcoming" && !upcoming) return false;
      if (filter === "past" && upcoming) return false;
    }
    if (filterServiceId !== "all" && apt.serviceId !== filterServiceId) return false;
    if (filterStaffId !== "all" && apt.staffId !== filterStaffId) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = apt.customerName.toLowerCase().includes(q);
      const matchEmail = apt.customerEmail.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (filter === "past") {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    }
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Timezone-aware UTC stamp ──────────────────────────────────────────────
  // Uses the business timezone if provided, otherwise falls back to the
  // runtime's local offset. Avoids the previous hardcoded UTC-3 Argentina offset.
  const toUTCStamp = (date: Date, timeStr: string): string => {
    const d = parseUTCDate(date);
    const [hour, minute] = timeStr.split(":").map(Number);

    if (businessTimezone) {
      // Build an ISO string in the business timezone and let the JS engine convert to UTC
      const isoLocal = `${format(d, "yyyy-MM-dd")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      // Use Intl to get the UTC offset for the given timezone at the given date
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: businessTimezone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      // Get UTC equivalent by creating a Date from the local ISO and computing the tz offset
      const localDate = new Date(isoLocal); // treated as local browser time
      const utcMs = localDate.getTime() - getTimezoneOffsetMs(businessTimezone, localDate);
      const utc = new Date(utcMs);
      return utc.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }

    // Fallback: treat the stored time as UTC (safest assumption when tz is unknown)
    const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0));
    return utc.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  /** Returns the offset in milliseconds between a timezone and UTC for a given Date. */
  function getTimezoneOffsetMs(timezone: string, date: Date): number {
    const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
    const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
    return new Date(tzStr).getTime() - new Date(utcStr).getTime();
  }

  const downloadCSV = () => {
    const headers = ["Fecha", "Hora", "Cliente", "Email", "Teléfono", "Servicio", "Personal", "Estado"];
    const statusLabels: Record<string, string> = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Completado",
      CANCELLED: "Cancelado",
      NO_SHOW: "No asistió",
    };
    const rows = sortedAppointments.map((apt) => [
      format(parseUTCDate(apt.date), "dd/MM/yyyy"),
      apt.startTime,
      apt.customerName,
      apt.customerEmail,
      apt.customerPhone || "",
      apt.service.name,
      apt.staff?.name || "",
      statusLabels[apt.status] || apt.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadICS = () => {
    const icsStatusMap: Record<string, string> = {
      CONFIRMED: "CONFIRMED",
      PENDING: "TENTATIVE",
      COMPLETED: "CONFIRMED",
      CANCELLED: "CANCELLED",
      NO_SHOW: "CANCELLED",
    };

    const escapeICS = (str: string) =>
      str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const events = sortedAppointments.map((apt) => {
      const dtstart = toUTCStamp(apt.date, apt.startTime);
      const dtend = toUTCStamp(apt.date, apt.endTime);
      const summary = escapeICS(`${apt.service.name} - ${apt.customerName}`);
      const descParts = [
        `Servicio: ${apt.service.name}`,
        `Duración: ${apt.service.duration} min`,
        `Cliente: ${apt.customerName}`,
        `Email: ${apt.customerEmail}`,
        apt.customerPhone ? `Teléfono: ${apt.customerPhone}` : null,
        apt.staff ? `Profesional: ${apt.staff.name}` : null,
        apt.notes ? `Notas: ${apt.notes}` : null,
      ].filter(Boolean).join("\\n");
      const location = businessAddress ? escapeICS(businessAddress) : "";
      const status = icsStatusMap[apt.status] ?? "TENTATIVE";

      return [
        "BEGIN:VEVENT",
        `UID:${apt.id}@mystack`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${descParts}`,
        location ? `LOCATION:${location}` : null,
        `STATUS:${status}`,
        `ORGANIZER;CN=${escapeICS(businessName)}:MAILTO:noreply@mystack.app`,
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MyStack//Turnos//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnos-${format(new Date(), "yyyy-MM-dd")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Deep link para agregar UN turno a Google Calendar
  const getGoogleCalendarUrl = (apt: Appointment): string => {
    const dtstart = toUTCStamp(apt.date, apt.startTime);
    const dtend = toUTCStamp(apt.date, apt.endTime);
    const title = encodeURIComponent(`${apt.service.name} - ${apt.customerName}`);
    const details = encodeURIComponent(
      [
        `Cliente: ${apt.customerName}`,
        `Email: ${apt.customerEmail}`,
        apt.customerPhone ? `Teléfono: ${apt.customerPhone}` : null,
        apt.staff ? `Profesional: ${apt.staff.name}` : null,
        apt.notes ? `Notas: ${apt.notes}` : null,
      ].filter(Boolean).join("\n")
    );
    const location = businessAddress ? encodeURIComponent(businessAddress) : "";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtstart}/${dtend}&details=${details}${location ? `&location=${location}` : ""}&sf=true&output=xml`;
  };

  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);

    // Optimistic update: change status locally before the API responds
    const previous = localAppointments ?? appointments;
    setLocalAppointments(
      previous.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("API error");

      const statusMessages: Record<string, string> = {
        CONFIRMED: "Turno confirmado",
        COMPLETED: "Turno completado",
        CANCELLED: "Turno cancelado",
        NO_SHOW: "Turno marcado como no asistió",
      };
      toast.success(statusMessages[status] || "Estado actualizado");

      // Background refresh to sync server state without blocking UI
      router.refresh();
    } catch {
      // Rollback on error
      setLocalAppointments(previous);
      toast.error("Error al actualizar el turno");
    } finally {
      setIsUpdating(false);
      setCancelId(null);
    }
  };

  const deleteAppointment = async (id: string) => {
    setIsUpdating(true);
    const previous = localAppointments ?? appointments;
    // Optimistic removal
    setLocalAppointments(previous.filter((apt) => apt.id !== id));
    setDeleteId(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("API error");
      toast.success("Turno eliminado");
      router.refresh();
    } catch {
      setLocalAppointments(previous);
      toast.error("Error al eliminar el turno");
    } finally {
      setIsUpdating(false);
    }
  };

  // Group appointments by date, then by startTime
  const groupedAppointments = paginatedAppointments.reduce((groups, apt) => {
    const dateKey = format(parseUTCDate(apt.date), "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = {};
    if (!groups[dateKey][apt.startTime]) groups[dateKey][apt.startTime] = [];
    groups[dateKey][apt.startTime].push(apt);
    return groups;
  }, {} as Record<string, Record<string, Appointment[]>>);

  const filterBarProps: FilterBarProps = {
    filter,
    onFilterChange: handleFilterChange,
    search,
    onSearchChange: handleSearchChange,
    filterServiceId,
    onFilterServiceChange: (v) => { setFilterServiceId(v); setCurrentPage(1); },
    filterStaffId,
    onFilterStaffChange: (v) => { setFilterStaffId(v); setCurrentPage(1); },
    services,
    staff,
    onExportCSV: () => setExportModal("csv"),
    onExportICS: () => setExportModal("ics"),
    hasResults: sortedAppointments.length > 0,
  };

  if (paginatedAppointments.length === 0) {
    return (
      <>
        <FilterBar {...filterBarProps} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {search.trim()
                ? `No se encontraron turnos para "${search.trim()}"`
                : filter === "past"
                ? "No hay turnos pasados"
                : "No hay turnos programados"}
            </p>
            {search.trim() && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => handleSearchChange("")}
              >
                Limpiar búsqueda
              </Button>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <FilterBar {...filterBarProps} />

      <div className="space-y-6">
        {Object.entries(groupedAppointments).map(([dateKey, timeGroups]) => (
          <div key={dateKey}>
            <h3 className="mb-3 font-semibold text-sm md:text-base capitalize">
              {format(parseUTCDate(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-4">
              {Object.entries(timeGroups).map(([timeKey, slotAppointments]) => {
                const slotKey = `${dateKey}_${timeKey}`;
                const occupied = slotOccupancy[slotKey] || slotAppointments.length;

                return (
                  <div key={timeKey}>
                    {/* Time sub-header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm tabular-nums">{timeKey}</span>
                      {slotAppointments[0] && (
                        <span className="text-xs text-muted-foreground">→ {slotAppointments[0].endTime}</span>
                      )}
                      {slotCapacity > 1 && (
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                          occupied >= slotCapacity
                            ? "bg-destructive/10 text-destructive"
                            : occupied >= slotCapacity * 0.8
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {occupied}/{slotCapacity} cupos
                        </span>
                      )}
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Cards for this time slot */}
                    <div className="space-y-2 pl-0 md:pl-4">
                      {slotAppointments.map((apt, index) => {
                        const status = getStatusConfig(apt);
                        const StatusIcon = status.icon;

                        return (
                          <Card key={`${apt.id}-${index}`}>
                            <CardContent className="p-3 md:p-4">
                              {/* Mobile: flat layout with avatar */}
                              <div className="flex items-center gap-3 md:hidden">
                                {/* Avatar */}
                                <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold ${getAvatarColor(apt.customerName)}`}>
                                  {getInitials(apt.customerName)}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{apt.customerName}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {apt.service.name}{apt.staff && ` · ${apt.staff.name}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{apt.customerEmail}</p>
                                </div>
                                {/* Badge + menu */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge variant={status.variant} className="text-xs hidden sm:flex">
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {status.label}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>} />
                                    <DropdownMenuContent align="end">
                                      <div className="px-2 py-1.5 flex items-center gap-1.5 sm:hidden">
                                        <Badge variant={status.variant} className="text-xs">
                                          <StatusIcon className="mr-1 h-3 w-3" />
                                          {status.label}
                                        </Badge>
                                      </div>
                                      {apt.status === "PENDING" && (
                                        <DropdownMenuItem onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Confirmar
                                        </DropdownMenuItem>
                                      )}
                                      {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                                        <>
                                          <DropdownMenuItem onClick={() => updateStatus(apt.id, "COMPLETED")}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Completado
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateStatus(apt.id, "NO_SHOW")}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            No asistió
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-destructive" onClick={() => setCancelId(apt.id)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancelar
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {apt.status === "COMPLETED" && (
                                        <DropdownMenuItem onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                                          <RotateCcw className="mr-2 h-4 w-4" />
                                          Reabrir turno
                                        </DropdownMenuItem>
                                      )}
                                      {(apt.status === "CANCELLED" || apt.status === "NO_SHOW" || apt.status === "RESCHEDULED") && (
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(apt.id)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar turno
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onDuplicate?.(apt)}>
                                        <CalendarClock className="mr-2 h-4 w-4" />
                                        Reprogramar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(apt), "_blank", "noopener,noreferrer")}>
                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                        Agregar a Google Calendar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Desktop: Row layout */}
                              <div className="hidden md:flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{apt.customerName}</p>
                                    <Badge variant={status.variant}>
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {status.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {apt.service.name}
                                    {apt.staff && ` • ${apt.staff.name}`}
                                  </p>
                                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {apt.customerEmail}
                                    </span>
                                    {apt.customerPhone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {apt.customerPhone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>} />
                                   <DropdownMenuContent align="end">
                                     {apt.status === "PENDING" && (
                                       <DropdownMenuItem onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                                         <CheckCircle className="mr-2 h-4 w-4" />
                                         Confirmar
                                       </DropdownMenuItem>
                                     )}
                                     {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                                       <>
                                         <DropdownMenuItem onClick={() => updateStatus(apt.id, "COMPLETED")}>
                                           <CheckCircle className="mr-2 h-4 w-4" />
                                           Marcar completado
                                         </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => updateStatus(apt.id, "NO_SHOW")}>
                                           <XCircle className="mr-2 h-4 w-4" />
                                           No asistió
                                         </DropdownMenuItem>
                                         <DropdownMenuSeparator />
                                         <DropdownMenuItem className="text-destructive" onClick={() => setCancelId(apt.id)}>
                                           <XCircle className="mr-2 h-4 w-4" />
                                           Cancelar turno
                                         </DropdownMenuItem>
                                       </>
                                     )}
                                     {apt.status === "COMPLETED" && (
                                       <DropdownMenuItem onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                                         <RotateCcw className="mr-2 h-4 w-4" />
                                         Reabrir turno
                                       </DropdownMenuItem>
                                     )}
                                     {(apt.status === "CANCELLED" || apt.status === "NO_SHOW" || apt.status === "RESCHEDULED") && (
                                       <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(apt.id)}>
                                         <Trash2 className="mr-2 h-4 w-4" />
                                         Eliminar turno
                                       </DropdownMenuItem>
                                     )}
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => onDuplicate?.(apt)}>
                                       <CalendarClock className="mr-2 h-4 w-4" />
                                       Reprogramar
                                     </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(apt), "_blank", "noopener,noreferrer")}>
                                       <CalendarPlus className="mr-2 h-4 w-4" />
                                       Agregar a Google Calendar
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={exportModal !== null} onOpenChange={() => setExportModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {exportModal === "csv" ? "Exportar como CSV" : "Exportar al calendario"}
            </DialogTitle>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {exportModal === "csv" ? (
                <>
                  <p>
                    Se descargará un archivo <strong className="text-foreground">.csv</strong> con{" "}
                    <strong className="text-foreground">{sortedAppointments.length} {sortedAppointments.length === 1 ? "turno" : "turnos"}</strong>
                    {filter !== "all" && <> ({filter === "upcoming" ? "próximos" : "pasados"})</>}.
                  </p>
                  <p>
                    Podés abrirlo con Excel, Google Sheets u otras planillas de cálculo. Incluye fecha, hora, cliente, servicio, profesional y estado de cada turno.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Se descargará un archivo <strong className="text-foreground">.ics</strong> con{" "}
                    <strong className="text-foreground">{sortedAppointments.length} {sortedAppointments.length === 1 ? "turno" : "turnos"}</strong>
                    {filter !== "all" && <> ({filter === "upcoming" ? "próximos" : "pasados"})</>}.
                  </p>
                  <p>
                    Para importarlo en <strong className="text-foreground">Google Calendar</strong>: abrí calendar.google.com → Otros calendarios → Importar.
                  </p>
                  <p>
                    También es compatible con <strong className="text-foreground">Apple Calendar</strong> y <strong className="text-foreground">Outlook</strong> (Archivo → Importar).
                  </p>
                </>
              )}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (exportModal === "csv") downloadCSV();
                else downloadICS();
                setExportModal(null);
              }}
            >
              {exportModal === "csv" ? (
                <><Download className="mr-2 h-4 w-4" />Descargar CSV</>
              ) : (
                <><CalendarPlus className="mr-2 h-4 w-4" />Descargar .ics</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar turno?</DialogTitle>
            <DialogDescription>
              Se notificará al cliente sobre la cancelación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelId && updateStatus(cancelId, "CANCELLED")}
              disabled={isUpdating}
            >
              {isUpdating ? "Cancelando..." : "Cancelar turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar turno?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El turno será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteAppointment(deleteId)}
              disabled={isUpdating}
            >
              {isUpdating ? "Eliminando..." : "Eliminar turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
