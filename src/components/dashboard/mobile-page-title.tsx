"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/appointments": "Turnos",
  "/dashboard/services": "Servicios",
  "/dashboard/staff": "Equipo",
  "/dashboard/schedule": "Horarios",
  "/dashboard/clients": "Clientes",
  "/dashboard/analytics": "Reportes",
  "/dashboard/business": "Mi Negocio",
  "/dashboard/booking": "Reservas",
  "/dashboard/account": "Cuenta",
  "/dashboard/subscription": "Suscripción",
  "/dashboard/settings": "Ajustes",
};

export function DashboardMobileTitle() {
  const pathname = usePathname();
  // Match exact or sub-paths (e.g. /dashboard/staff/new)
  const title =
    pageTitles[pathname] ??
    Object.entries(pageTitles)
      .filter(([key]) => key !== "/dashboard")
      .find(([key]) => pathname.startsWith(key))?.[1] ??
    "Dashboard";

  return <span className="font-semibold text-base">{title}</span>;
}
