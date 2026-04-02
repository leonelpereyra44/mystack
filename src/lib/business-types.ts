import {
  Store,
  Scissors,
  Sparkles,
  Heart,
  Dumbbell,
  Trophy,
  Stethoscope,
  UtensilsCrossed,
  Car,
  GraduationCap,
  Camera,
  Palette,
  Music,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface BusinessTypeConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind bg color class
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: "store",
    label: "Tienda / Comercio",
    icon: Store,
    color: "bg-emerald-500",
  },
  {
    id: "barbershop",
    label: "Barbería",
    icon: Scissors,
    color: "bg-amber-600",
  },
  {
    id: "salon",
    label: "Peluquería / Salón",
    icon: Sparkles,
    color: "bg-pink-500",
  },
  {
    id: "spa",
    label: "Spa / Estética",
    icon: Heart,
    color: "bg-rose-400",
  },
  {
    id: "gym",
    label: "Gimnasio / Fitness",
    icon: Dumbbell,
    color: "bg-orange-500",
  },
  {
    id: "sports",
    label: "Cancha / Deportes",
    icon: Trophy,
    color: "bg-green-600",
  },
  {
    id: "medical",
    label: "Consultorio Médico",
    icon: Stethoscope,
    color: "bg-blue-500",
  },
  {
    id: "restaurant",
    label: "Restaurante / Café",
    icon: UtensilsCrossed,
    color: "bg-red-500",
  },
  {
    id: "automotive",
    label: "Taller / Automotriz",
    icon: Car,
    color: "bg-slate-600",
  },
  {
    id: "education",
    label: "Educación / Clases",
    icon: GraduationCap,
    color: "bg-indigo-500",
  },
  {
    id: "photography",
    label: "Fotografía / Estudio",
    icon: Camera,
    color: "bg-purple-500",
  },
  {
    id: "creative",
    label: "Arte / Diseño",
    icon: Palette,
    color: "bg-fuchsia-500",
  },
  {
    id: "music",
    label: "Música / Estudio",
    icon: Music,
    color: "bg-violet-500",
  },
  {
    id: "consulting",
    label: "Consultoría / Oficina",
    icon: Briefcase,
    color: "bg-cyan-600",
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
