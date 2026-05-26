import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parsea un string de fecha (YYYY-MM-DD) a Date sin problemas de timezone.
 * Crea la fecha a mediodía UTC para evitar que cambie de día.
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  // Crear fecha a mediodía UTC para evitar problemas de timezone
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Retorna un Date donde getUTC*() devuelve la hora local de la timezone dada.
 * Reemplaza el patrón `new Date(Date.now() - 3 * 60 * 60 * 1000)` hardcodeado.
 *
 * Ejemplo: si son las 14:30 en "America/Argentina/Buenos_Aires",
 *   getLocalDateInTz("America/Argentina/Buenos_Aires").getUTCHours() === 14
 */
export function getLocalDateInTz(timezone: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");
  // Construir Date UTC con los componentes locales para que getUTC*() devuelva hora local
  return new Date(
    Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  );
}

/**
 * Formatea una fecha de la DB a string YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
