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
 * Formatea una fecha de la DB a string YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
