# Análisis de rendimiento — Vercel Functions / CPU

> Fecha: 28/05/2026  
> Contexto: Next.js 16 App Router + NextAuth v5 + Prisma + Vercel  
> Síntoma: Alto "Fluid Active CPU" y muchas invocations tipo "proxy" en Vercel

---

## ✅ IMPLEMENTADO

### 1. `src/app/layout.tsx` — Root layout dinámico global ✅

**Era el problema más grave.** El root layout hacía `await headers()` + `auth()` + query Prisma en cada request, forzando que TODA la app fuera dinámica (landing, `/[slug]`, login, legal, etc.).

**Implementado**: Layout convertido a función síncrona sin imports de `headers`, `auth`, `isMaintenanceMode`. El check de maintenance se movió al proxy. Toda la app puede volver a ser estática/ISR.

---

### 9 (renumerado). `src/proxy.ts` — Auth + maintenance en el edge ✅

**Era**: sin proxy, `authorized` callback nunca corría. Existía un `proxy.ts` vacío que solo pasaba el `x-pathname`.

**Implementado**:
- `NextAuth(authConfig)` corre en el proxy → redirecciones de auth al edge (sin Prisma, sin Node.js)
- Maintenance mode check via Upstash Redis REST API (HTTP puro, edge-compatible)
- `src/lib/system-config.ts` sincroniza `maintenance_mode` a Redis al escribir
- Eliminado `src/middleware.ts` (era el nombre viejo, Next.js 16 usa `proxy.ts`)

---

### 5 (parcial). Suspense en landing — streaming inmediato ✅

**Implementado**: `AnnouncementBanner` y `PricingSection` envueltos en `<Suspense>` en `src/app/page.tsx`. La landing streameaba HTML estático inmediatamente; antes quedaba en loading hasta que las queries de DB terminaran.

**Pendiente**: agregar `unstable_cache` (ver abajo).

---

## 🔴 PENDIENTE — CRÍTICO

### 2. `src/components/dashboard/notifications-dropdown.tsx` — Polling cada 30 segundos

Cada llamada a `/api/notifications` ejecuta `auth()` + 2 queries Prisma. Con 50 usuarios activos: **100 invocaciones/minuto** continuas.

**Fix inmediato**: Subir intervalo a 60s + pausar cuando la pestaña no está visible:

```ts
useEffect(() => {
  const interval = setInterval(() => {
    if (!document.hidden) fetchNotifications();
  }, 60000);
  return () => clearInterval(interval);
}, [fetchNotifications]);
```

**Fix adicional**: Combinar las dos queries en memoria (sin segunda query a DB):

```ts
const notifications = await prisma.notification.findMany({ ... take: 20 });
const unreadCount = notifications.filter(n => !n.isRead).length; // sin segunda query
```

**Fix largo plazo**: Server-Sent Events o WebSockets.

---

### 3. Double `auth()` + double `prisma.business.findFirst()` en cada página del dashboard

`DashboardLayout` carga session + business, y luego cada página del dashboard repite exactamente lo mismo. Afecta a: `page.tsx`, `appointments/`, `services/`, `clients/`, `staff/`, `schedule/`, `booking/`.

**Fix**: Usar `cache()` de React para deduplicar dentro del mismo request tree:

```ts
// src/lib/queries.ts
import { cache } from "react";
export const getSession = cache(async () => auth());
export const getBusinessBySession = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.business.findFirst({ where: { ownerId: session.user.id } });
});
```

---

## 🟡 PENDIENTE — IMPORTANTE

### 4. `src/app/[slug]/page.tsx` — Double query en `generateMetadata` + sin ISR

`generateMetadata` y el componente de página hacen dos queries a la misma fila por request. Sin `revalidate`, cada visita es en tiempo real.

**Fix**:

```ts
import { cache } from "react";
const getBusiness = cache(async (slug: string) => prisma.business.findUnique({ ... }));
// ambos generateMetadata y el componente usan getBusiness(slug) → 1 sola query

export const revalidate = 60; // ISR
```

---

### 5. `unstable_cache` en `PricingSection` y `AnnouncementBanner`

Los Suspense ya están. Falta cachear las queries para que no golpeen la DB en cada render:

```ts
import { unstable_cache } from "next/cache";

const getPlansWithPromotions = unstable_cache(
  async () => { /* lógica actual */ },
  ["plans-promotions"],
  { revalidate: 3600, tags: ["plans"] }
);

const getSystemAnnouncement = unstable_cache(
  async () => getSystemConfigs([...]),
  ["system-announcement"],
  { revalidate: 300, tags: ["system-config"] }
);
```

---

### 6. `src/components/dashboard/subscription-card.tsx` — 3 API calls en mount

3 `useEffect` = 3 invocaciones serverless en cada carga de la página de suscripción.

**Fix**: Consolidar `/api/subscription` para devolver también los planes disponibles, eliminando la llamada a `/api/plans`.

---

### 7. `src/app/dashboard/analytics/page.tsx` — Fetch pesado en cada cambio de filtro

Carga todos los appointments del período y calcula en JS. Costoso para negocios grandes.

**Fix corto plazo**: Debounce en el cambio de `months`.

**Fix largo plazo**: Usar `groupBy` + `aggregate` en Prisma para que la DB haga los cálculos.

---

## 🔵 PENDIENTE — MENOR

### 8. `src/app/api/plans/route.ts` — `headers()` rompe cache de edge

`headers()` hace la route dinámica aunque tiene `Cache-Control: s-maxage=3600`. La función se ejecuta en cada request.

---

### 10. `src/lib/prisma.ts` — Pool sin límite de conexiones

```ts
const pool = new Pool({ connectionString }); // ← sin max connections
```

**Fix**: `max: 1` — en serverless, 1 conexión por instancia es lo correcto.

---

## Estado actual

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `src/app/layout.tsx` | `headers()` + `auth()` + Prisma en root layout | ✅ Implementado |
| 9 | `src/proxy.ts` | Auth + maintenance en el edge | ✅ Implementado |
| 5a | `page.tsx` (landing) | Suspense para streaming inmediato | ✅ Implementado |
| 2 | `notifications-dropdown.tsx` | Polling cada 30s, 2 queries por usuario | 🔴 Pendiente |
| 3 | `dashboard/*/page.tsx` | Double `auth()` + double business query | 🔴 Pendiente |
| 4 | `[slug]/page.tsx` | Double query en `generateMetadata` + sin ISR | 🟡 Pendiente |
| 5b | `pricing-section.tsx` + `announcement-banner.tsx` | Sin `unstable_cache` | 🟡 Pendiente |
| 6 | `subscription-card.tsx` | 3 useEffect = 3 API calls en mount | 🟡 Pendiente |
| 7 | `analytics/page.tsx` | Fetch pesado, cálculos en JS | 🟡 Pendiente |
| 8 | `api/plans/route.ts` | `headers()` rompe cache | 🔵 Pendiente |
| 10 | `prisma.ts` | Pool sin `max: 1` | 🔵 Pendiente |
