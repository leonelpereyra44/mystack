"use client";

import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentsList } from "./appointments-list";
import { AppointmentsCalendar } from "./appointments-calendar";

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
  serviceId: string;
  staffId: string | null;
  service: { name: string; duration: number };
  staff: { name: string } | null;
}

interface AppointmentsViewProps {
  appointments: Appointment[];
  slotCapacity: number;
  services?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
  businessName: string;
  businessAddress?: string | null;
  businessTimezone?: string;
}

export function AppointmentsView({
  appointments,
  slotCapacity,
  services,
  staff,
  businessName,
  businessAddress,
  businessTimezone,
}: AppointmentsViewProps) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-4">
      {/* Mobile: segmented control full-width */}
      <div className="grid grid-cols-2 rounded-md border bg-muted p-0.5 sm:hidden">
        <button
          onClick={() => setView("list")}
          className={`flex items-center justify-center gap-1.5 rounded-sm py-1.5 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center justify-center gap-1.5 rounded-sm py-1.5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendario
        </button>
      </div>

      {/* Desktop: toggle alineado a la derecha */}
      <div className="hidden sm:flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Vista:</span>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-1" />
            Lista
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Calendario
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <AppointmentsList
          appointments={appointments}
          slotCapacity={slotCapacity}
          services={services}
          staff={staff}
          businessName={businessName}
          businessAddress={businessAddress}
          businessTimezone={businessTimezone}
        />
      ) : (
        <AppointmentsCalendar appointments={appointments} />
      )}
    </div>
  );
}
