import {
  Scissors,
  Sparkles,
  Heart,
  Trophy,
  GraduationCap,
  Camera,
  Music,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface BusinessTerminology {
  /** Singular: "Turno", "Cita", "Reserva", "Clase", "Consulta", "Sesión", "Reunión" */
  appointment: string;
  appointments: string;
  newAppointment: string;
  /** Singular: "Servicio", "Clase", "Tratamiento", "Cancha" */
  service: string;
  services: string;
  newService: string;
  /** Singular: "Cliente", "Paciente", "Alumno", "Socio" */
  client: string;
  clients: string;
}

export interface SuggestedService {
  name: string;
  description?: string;
  duration: number; // minutes
  price: number;    // ARS (editable by user)
}

export interface DefaultScheduleDay {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  openTime: string;  // "HH:mm"
  closeTime: string; // "HH:mm"
  isOpen: boolean;
}

export interface BusinessTypeConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind bg color class
  terminology: BusinessTerminology;
  suggestedServices: SuggestedService[];
  defaultSchedule: DefaultScheduleDay[];
  /** Duration options shown first in service forms, most common for this type */
  suggestedDurations: number[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchedule(
  open: Record<number, { openTime: string; closeTime: string }>
): DefaultScheduleDay[] {
  return Array.from({ length: 7 }, (_, day) => {
    const hours = open[day];
    return {
      dayOfWeek: day,
      openTime: hours?.openTime ?? "09:00",
      closeTime: hours?.closeTime ?? "18:00",
      isOpen: !!hours,
    };
  });
}

// ---------------------------------------------------------------------------
// Business types
// ---------------------------------------------------------------------------

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: "barbershop",
    label: "Barbería",
    icon: Scissors,
    color: "bg-amber-600",
    terminology: {
      appointment: "Turno",
      appointments: "Turnos",
      newAppointment: "Nuevo turno",
      service: "Servicio",
      services: "Servicios",
      newService: "Nuevo servicio",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Corte de cabello", duration: 30, price: 2000 },
      { name: "Barba", description: "Perfilado y arreglo de barba", duration: 20, price: 1500 },
      { name: "Corte + Barba", duration: 45, price: 3000 },
      { name: "Afeitado clásico", duration: 30, price: 1800 },
    ],
    defaultSchedule: makeSchedule({
      2: { openTime: "09:00", closeTime: "19:00" },
      3: { openTime: "09:00", closeTime: "19:00" },
      4: { openTime: "09:00", closeTime: "19:00" },
      5: { openTime: "09:00", closeTime: "19:00" },
      6: { openTime: "09:00", closeTime: "19:00" },
    }),
    suggestedDurations: [15, 20, 30, 45, 60],
  },
  {
    id: "salon",
    label: "Peluquería / Salón",
    icon: Sparkles,
    color: "bg-pink-500",
    terminology: {
      appointment: "Turno",
      appointments: "Turnos",
      newAppointment: "Nuevo turno",
      service: "Servicio",
      services: "Servicios",
      newService: "Nuevo servicio",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Corte femenino", duration: 45, price: 3000 },
      { name: "Tinte", description: "Coloración completa", duration: 90, price: 5000 },
      { name: "Peinado", duration: 60, price: 3500 },
      { name: "Tratamiento capilar", duration: 60, price: 4000 },
      { name: "Cejas", description: "Depilación y diseño de cejas", duration: 20, price: 1500 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "09:00", closeTime: "20:00" },
      2: { openTime: "09:00", closeTime: "20:00" },
      3: { openTime: "09:00", closeTime: "20:00" },
      4: { openTime: "09:00", closeTime: "20:00" },
      5: { openTime: "09:00", closeTime: "20:00" },
      6: { openTime: "09:00", closeTime: "20:00" },
    }),
    suggestedDurations: [20, 30, 45, 60, 90, 120],
  },
  {
    id: "spa",
    label: "Spa / Estética",
    icon: Heart,
    color: "bg-rose-400",
    terminology: {
      appointment: "Turno",
      appointments: "Turnos",
      newAppointment: "Nuevo turno",
      service: "Tratamiento",
      services: "Tratamientos",
      newService: "Nuevo tratamiento",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Masaje relajante", duration: 60, price: 5000 },
      { name: "Limpieza facial", duration: 60, price: 4500 },
      { name: "Manicura", duration: 45, price: 2500 },
      { name: "Pedicura", duration: 60, price: 3000 },
      { name: "Depilación", description: "Zona a convenir", duration: 30, price: 2000 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "09:00", closeTime: "20:00" },
      2: { openTime: "09:00", closeTime: "20:00" },
      3: { openTime: "09:00", closeTime: "20:00" },
      4: { openTime: "09:00", closeTime: "20:00" },
      5: { openTime: "09:00", closeTime: "20:00" },
      6: { openTime: "09:00", closeTime: "20:00" },
    }),
    suggestedDurations: [30, 45, 60, 90, 120],
  },
  {
    id: "sports",
    label: "Cancha / Deportes",
    icon: Trophy,
    color: "bg-green-600",
    terminology: {
      appointment: "Reserva",
      appointments: "Reservas",
      newAppointment: "Nueva reserva",
      service: "Cancha",
      services: "Canchas",
      newService: "Nueva cancha",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Cancha de fútbol", description: "1 hora de alquiler", duration: 60, price: 5000 },
      { name: "Cancha de pádel", description: "1 hora de alquiler", duration: 60, price: 4000 },
      { name: "Cancha de tenis", description: "1 hora de alquiler", duration: 60, price: 3000 },
    ],
    defaultSchedule: makeSchedule({
      0: { openTime: "08:00", closeTime: "22:00" },
      1: { openTime: "08:00", closeTime: "22:00" },
      2: { openTime: "08:00", closeTime: "22:00" },
      3: { openTime: "08:00", closeTime: "22:00" },
      4: { openTime: "08:00", closeTime: "22:00" },
      5: { openTime: "08:00", closeTime: "22:00" },
      6: { openTime: "08:00", closeTime: "22:00" },
    }),
    suggestedDurations: [60, 90, 120],
  },
  {
    id: "education",
    label: "Educación / Clases",
    icon: GraduationCap,
    color: "bg-indigo-500",
    terminology: {
      appointment: "Clase",
      appointments: "Clases",
      newAppointment: "Nueva clase",
      service: "Clase",
      services: "Clases",
      newService: "Nueva clase",
      client: "Alumno",
      clients: "Alumnos",
    },
    suggestedServices: [
      { name: "Clase individual", duration: 60, price: 3000 },
      { name: "Clase grupal", duration: 90, price: 1500 },
      { name: "Taller", description: "Taller intensivo", duration: 120, price: 4000 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "08:00", closeTime: "20:00" },
      2: { openTime: "08:00", closeTime: "20:00" },
      3: { openTime: "08:00", closeTime: "20:00" },
      4: { openTime: "08:00", closeTime: "20:00" },
      5: { openTime: "08:00", closeTime: "20:00" },
      6: { openTime: "09:00", closeTime: "14:00" },
    }),
    suggestedDurations: [45, 60, 90, 120],
  },
  {
    id: "photography",
    label: "Fotografía / Estudio",
    icon: Camera,
    color: "bg-purple-500",
    terminology: {
      appointment: "Sesión",
      appointments: "Sesiones",
      newAppointment: "Nueva sesión",
      service: "Servicio",
      services: "Servicios",
      newService: "Nuevo servicio",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Sesión de retrato", duration: 60, price: 15000 },
      { name: "Sesión familiar", duration: 90, price: 20000 },
      { name: "Sesión de producto", description: "Fotografía para e-commerce", duration: 120, price: 25000 },
      { name: "Sesión de embarazo / maternidad", duration: 90, price: 18000 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "09:00", closeTime: "18:00" },
      2: { openTime: "09:00", closeTime: "18:00" },
      3: { openTime: "09:00", closeTime: "18:00" },
      4: { openTime: "09:00", closeTime: "18:00" },
      5: { openTime: "09:00", closeTime: "18:00" },
      6: { openTime: "10:00", closeTime: "16:00" },
    }),
    suggestedDurations: [60, 90, 120, 180, 240],
  },
  {
    id: "music",
    label: "Música / Estudio",
    icon: Music,
    color: "bg-violet-500",
    terminology: {
      appointment: "Clase",
      appointments: "Clases",
      newAppointment: "Nueva clase",
      service: "Clase",
      services: "Clases",
      newService: "Nueva clase",
      client: "Alumno",
      clients: "Alumnos",
    },
    suggestedServices: [
      { name: "Clase de guitarra", duration: 60, price: 3000 },
      { name: "Clase de piano", duration: 60, price: 3000 },
      { name: "Clase de canto", duration: 60, price: 3000 },
      { name: "Clase de batería", duration: 60, price: 3500 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "09:00", closeTime: "20:00" },
      2: { openTime: "09:00", closeTime: "20:00" },
      3: { openTime: "09:00", closeTime: "20:00" },
      4: { openTime: "09:00", closeTime: "20:00" },
      5: { openTime: "09:00", closeTime: "20:00" },
      6: { openTime: "10:00", closeTime: "16:00" },
    }),
    suggestedDurations: [45, 60, 90],
  },
  {
    id: "consulting",
    label: "Consultoría / Oficina",
    icon: Briefcase,
    color: "bg-cyan-600",
    terminology: {
      appointment: "Reunión",
      appointments: "Reuniones",
      newAppointment: "Nueva reunión",
      service: "Servicio",
      services: "Servicios",
      newService: "Nuevo servicio",
      client: "Cliente",
      clients: "Clientes",
    },
    suggestedServices: [
      { name: "Consulta inicial", description: "Primera reunión de evaluación", duration: 60, price: 8000 },
      { name: "Reunión de trabajo", duration: 90, price: 12000 },
      { name: "Asesoramiento", description: "Sesión de asesoramiento puntual", duration: 30, price: 5000 },
    ],
    defaultSchedule: makeSchedule({
      1: { openTime: "09:00", closeTime: "18:00" },
      2: { openTime: "09:00", closeTime: "18:00" },
      3: { openTime: "09:00", closeTime: "18:00" },
      4: { openTime: "09:00", closeTime: "18:00" },
      5: { openTime: "09:00", closeTime: "18:00" },
    }),
    suggestedDurations: [30, 45, 60, 90, 120],
  },
];

export function getBusinessType(typeId: string): BusinessTypeConfig {
  return BUSINESS_TYPES.find((t) => t.id === typeId) || BUSINESS_TYPES[0];
}

export function getBusinessIcon(typeId: string): LucideIcon {
  return getBusinessType(typeId).icon;
}

export function getBusinessColor(typeId: string): string {
  return getBusinessType(typeId).color;
}

export function getBusinessTerminology(typeId: string): BusinessTerminology {
  return getBusinessType(typeId).terminology;
}
