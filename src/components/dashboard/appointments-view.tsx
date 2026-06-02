"use client";

import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { List, CalendarDays, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppointmentsList } from "./appointments-list";
import { AppointmentsCalendar } from "./appointments-calendar";
import { AppointmentsStaffGrid } from "./appointments-staff-grid";
import { NewAppointmentModal } from "./new-appointment-modal";
import type { BusinessTerminology } from "@/lib/business-types";

// ── Types ──────────────────────────────────────────────────────────────────────

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
  service: { name: string; duration: number };
  staff: { name: string } | null;
}

export interface DuplicateSource {
  serviceId?: string;
  staffId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  /** ID of the original appointment to cancel after the new one is saved. */
  rescheduleSourceId?: string;
}

interface ServiceOption {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

interface StaffOption {
  id: string;
  name: string;
  color?: string;
}

interface BusinessSchedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface AppointmentsViewProps {
  appointments: Appointment[];
  slotCapacity: number;
  services?: ServiceOption[];
  staff?: StaffOption[];
  businessName: string;
  businessAddress?: string | null;
  businessTimezone?: string;
  businessId: string;
  terminology: BusinessTerminology;
  schedules?: BusinessSchedule[];
  bookingInterval?: number;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AppointmentsView({
  appointments,
  slotCapacity,
  services,
  staff,
  businessName,
  businessAddress,
  businessTimezone,
  businessId,
  terminology,
  schedules,
  bookingInterval,
}: AppointmentsViewProps) {
  const [view, setView] = useState<"list" | "calendar" | "grid">(
    () => (staff && staff.length > 0 ? "grid" : "list")
  );
  const [duplicateSource, setDuplicateSource] = useState<DuplicateSource | null>(null);

  const recentClients = useMemo(() => {
    const seen = new Set<string>();
    const clients: Array<{ name: string; email: string; phone?: string | null }> = [];
    for (const apt of appointments) {
      if (!seen.has(apt.customerEmail)) {
        seen.add(apt.customerEmail);
        clients.push({ name: apt.customerName, email: apt.customerEmail, phone: apt.customerPhone });
      }
    }
    return clients.sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const hasStaff = staff && staff.length > 0;

  const handleDuplicate = useCallback((apt: Appointment) => {
    setDuplicateSource({
      serviceId: apt.serviceId,
      staffId: apt.staffId ?? undefined,
      customerName: apt.customerName,
      customerEmail: apt.customerEmail,
      customerPhone: apt.customerPhone ?? undefined,
      notes: apt.notes ?? undefined,
      rescheduleSourceId: apt.id,
    });
  }, []);

  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="space-y-5">
      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight">
            {terminology.appointments}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View selector */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-1.5 px-2.5"
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-1.5 px-2.5"
              onClick={() => setView("calendar")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
            {hasStaff && (
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-none gap-1.5 px-2.5"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
            )}
          </div>

          {/* Add appointment — also handles duplicate pre-fill */}
          <NewAppointmentModal
            businessId={businessId}
            services={services ?? []}
            staff={staff ?? []}
            terminology={terminology}
            recentClients={recentClients}
            initialValues={duplicateSource ?? undefined}
            rescheduleSourceId={duplicateSource?.rescheduleSourceId}
            onInitialValuesConsumed={() => setDuplicateSource(null)}
          />
        </div>
      </div>

      {/* ── View content ───────────────────────────────────── */}
      {view === "list" && (
        <AppointmentsList
          appointments={appointments}
          slotCapacity={slotCapacity}
          services={services}
          staff={staff}
          businessName={businessName}
          businessAddress={businessAddress}
          businessTimezone={businessTimezone}
          onDuplicate={handleDuplicate}
        />
      )}

      {view === "calendar" && (
        <AppointmentsCalendar
          appointments={appointments}
          onDuplicate={handleDuplicate}
        />
      )}

      {view === "grid" && (
        <AppointmentsStaffGrid
          appointments={appointments}
          staff={staff ?? []}
          schedules={schedules ?? []}
          bookingInterval={bookingInterval ?? 60}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
}
