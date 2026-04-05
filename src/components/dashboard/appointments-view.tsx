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
  service: {
    name: string;
    duration: number;
  };
  staff: {
    name: string;
  } | null;
}

interface AppointmentsViewProps {
  appointments: Appointment[];
  allAppointments: Appointment[]; // Para el calendario (sin paginación)
  currentPage: number;
  totalPages: number;
  filter: "upcoming" | "past" | "all";
}

export function AppointmentsView({
  appointments,
  allAppointments,
  currentPage,
  totalPages,
  filter,
}: AppointmentsViewProps) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-4">
      {/* Toggle de vista */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground mr-2">Vista:</span>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Calendario</span>
          </Button>
        </div>
      </div>

      {/* Contenido según vista */}
      {view === "list" ? (
        <AppointmentsList
          appointments={appointments}
          currentPage={currentPage}
          totalPages={totalPages}
          filter={filter}
        />
      ) : (
        <AppointmentsCalendar appointments={allAppointments} />
      )}
    </div>
  );
}
