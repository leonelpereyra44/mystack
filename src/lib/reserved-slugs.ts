/**
 * Slugs that cannot be used as business slugs.
 *
 * Two categories:
 *  1. App routes — would cause routing conflicts at the root level (/{slug})
 *  2. Generic SEO terms — single-word names the platform may want to own or
 *     that are too ambiguous to identify a specific business.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // ── App routes ──────────────────────────────────────────
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "contacto",
  "legal",
  "appointments",
  "para",
  "sitemap",
  "sitemap.xml",
  "robots",
  "robots.txt",
  "not-found",
  "404",
  "500",
  "mystack",

  // ── Generic business-type terms (SEO) ───────────────────
  "peluqueria",
  "peluquerias",
  "salon",
  "salones",
  "barberia",
  "barberias",
  "spa",
  "estetica",
  "esteticas",
  "cancha",
  "canchas",
  "fotografia",
  "fotografo",
  "fotografa",
  "musica",
  "academia",
  "academias",
  "consultoria",
  "consultor",
  "educacion",
  "clases",
  "clase",
  "turno",
  "turnos",
  "reserva",
  "reservas",
  "cita",
  "citas",
  "negocio",
  "negocios",
  "empresa",
  "empresas",
]);

/**
 * Returns true if the slug is reserved and cannot be used for a business.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}

/**
 * A human-readable error message to show the user when their business name
 * generates a reserved slug.
 */
export const RESERVED_SLUG_ERROR =
  "Este nombre genera una URL reservada por el sistema. Por favor usá un nombre más específico para tu negocio (por ejemplo: \"Barbería La Rosa\" en lugar de solo \"Barbería\").";
