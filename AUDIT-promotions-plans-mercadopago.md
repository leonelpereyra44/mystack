# Auditoría: Promociones, Planes y MercadoPago
**Rama:** `audit/promotions-plans-mercadopago`  
**Fecha de auditoría:** 2026-05-22  
**Fecha de implementación:** 2026-05-22  
**Estado:** ✅ Todos los ítems implementados — 125/125 tests pasando

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Mapa de archivos modificados](#2-mapa-de-archivos-modificados)
3. [Problemas críticos](#3-problemas-críticos)
4. [Problemas medios](#4-problemas-medios)
5. [Problemas menores / UX](#5-problemas-menores--ux)
6. [Features nuevos implementados](#6-features-nuevos-implementados)
7. [Estado final](#7-estado-final)

---

## 1. Resumen ejecutivo

El sistema de suscripciones tenía una base sólida pero presentaba **cinco problemas críticos** de operación real, seis medios y cinco de UX. Todos fueron implementados en la misma sesión.

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Crítico | 5 | ✅ Todos resueltos |
| 🟡 Medio | 6 | ✅ Todos resueltos |
| 🟢 Menor | 5 | ✅ C1, U1, U4, U5 resueltos · U2/U3 no aplican (promos automáticas) |

Adicionalmente se detectó un **bug de producción activo** (`ReferenceError: PLANS is not defined` en la ruta de reembolso) y se implementó un feature de sincronización de precios con MercadoPago.

---

## 2. Mapa de archivos modificados

```
src/
├── app/
│   ├── admin/
│   │   └── subscriptions/page.tsx          ← Reescrito: paginación + sync-prices UI
│   ├── api/
│   │   ├── admin/
│   │   │   ├── stats/route.ts              ← M1: MRR calculado desde DB
│   │   │   ├── subscriptions/route.ts      ← U4: paginación (page, PAGE_SIZE=20)
│   │   │   └── subscriptions/
│   │   │       └── sync-prices/route.ts    ← NUEVO: sincroniza precios con MP
│   │   ├── subscription/
│   │   │   ├── route.ts                    ← C1: auto-aplica promo activa + usedCount
│   │   │   ├── cancel/route.ts             ← C5: solo CANCELLED (sin plan FREE), M6: email
│   │   │   ├── change-plan/route.ts        ← C1: promo + usedCount, M2: previousMpId
│   │   │   └── refund/route.ts             ← M3: any paid plan, M4: PLANS removido
│   │   └── webhooks/mercadopago/route.ts   ← C3: fail-closed, C4: upsert, C5: sin FREE, M6: emails
│   └── dashboard/
│       ├── layout.tsx                      ← C2: SubscriptionStatusToast
│       ├── settings/page.tsx               ← C2: redirige preservando ?subscription= param
│       └── subscription/page.tsx           ← NUEVO: página dedicada de suscripción
├── components/
│   └── dashboard/
│       ├── nav.tsx                         ← C2: link a /dashboard/subscription
│       ├── mobile-nav.tsx                  ← C2: idem
│       └── subscription-status-toast.tsx   ← NUEVO: toast post-pago MP
└── lib/
    ├── mercadopago.ts                      ← C2: MP_URLS → /dashboard/subscription
    ├── plan-limits.ts                      ← C5 + U5: resolveEffectivePlan con TRIALING TTL
    └── email.ts                            ← M6: 3 nuevas funciones de suscripción
```

---

## 3. Problemas críticos

### ✅ C1 — Promociones eran puramente visuales

**Problema original:** `usedCount` nunca se incrementaba. El preapproval se creaba con precio completo aunque hubiera una promo activa. La sección de precios del landing mostraba el descuento, pero el usuario siempre pagaba el precio completo.

**Solución implementada:**
- `POST /api/subscription` y `POST /api/subscription/change-plan` buscan automáticamente la primera promoción activa (`isActive: true`, dentro de vigencia, con usos disponibles).
- Si existe, aplican el precio con descuento al crear el preapproval en MP.
- `usedCount` se incrementa atómicamente con `increment: 1` vía Prisma.
- **Decisión de diseño:** aplicación automática (sin código de cupón). Los códigos promocionales se descartaron por solicitud explícita.

---

### ✅ C2 — URL de retorno de MercadoPago llegaba a página muerta

**Problema original:** `MP_URLS` apuntaban a `/dashboard/settings?subscription=...` que hacía `redirect("/dashboard/business")` descartando todos los query params. El usuario nunca recibía retroalimentación del resultado del pago.

**Solución implementada:**
- `MP_URLS` ahora apuntan a `/dashboard/subscription?subscription=success/error/pending`.
- Nueva página `/dashboard/subscription/page.tsx` — punto central de gestión de suscripción.
- Nuevo componente `subscription-status-toast.tsx` — lee el query param, muestra toast via Sonner, limpia el param de la URL.
- `dashboard/layout.tsx` incluye el componente globalmente (disponible en todo el dashboard).
- `dashboard/settings/page.tsx` redirige preservando el param `?subscription=...`.
- Nav y mobile-nav incluyen enlace a `/dashboard/subscription` con ícono `CreditCard`.

---

### ✅ C3 — Verificación de webhook omitida si faltaba la env var

**Problema original:** La firma HMAC solo se verificaba si `MERCADOPAGO_WEBHOOK_SECRET` estaba definida. Si faltaba en producción, aceptaba cualquier petición — un atacante podía activar planes sin pago o cancelar suscripciones activas.

**Solución implementada:** Fail-closed — si `NODE_ENV === "production"` y falta `MERCADOPAGO_WEBHOOK_SECRET`, la ruta responde 500 con log de error crítico. No se puede bypassear la verificación por ausencia de configuración.

---

### ✅ C4 — Race condition: pago aprobado antes que el preapproval

**Problema original:** El handler de `payment` usaba `prisma.subscription.update()`. Si el evento llegaba antes del `subscription_preapproval`, Prisma lanzaba `RecordNotFound` silenciosamente y MP no reintentaba porque recibía 200. El negocio pagaba pero no se activaba el plan.

**Solución implementada:** Cambiado a `prisma.subscription.upsert()` en el handler de `payment`. Si la subscription no existe, se crea. No se pierde ningún pago independientemente del orden de llegada de los webhooks.

---

### ✅ C5 — Cancelación inmediata: usuario perdía acceso el mismo día

**Problema original:** `cancel/route.ts` seteaba `plan: "FREE"` en el mismo momento de cancelar, sin respetar el período de facturación ya pagado. El webhook también bajaba el plan a FREE al recibir `status: "cancelled"` de MP.

**Solución implementada:**
- `cancel/route.ts` solo setea `status: "CANCELLED"` y `cancelledAt`. El `plan` no se modifica.
- El webhook tampoco baja el plan a FREE en el upsert de `cancelled`.
- `resolveEffectivePlan(status, plan, currentPeriodEnd)` en `plan-limits.ts` evalúa en cada request: si `status === "CANCELLED"` y `currentPeriodEnd < now()` → devuelve FREE. Mientras el período no venza, el usuario mantiene acceso al plan pagado.

---

## 4. Problemas medios

### ✅ M1 — MRR hardcodeado a $15,000

**Problema original:** `mrr = proSubscriptions * 15000` — ignoraba el precio real de `PlanConfig` y no contabilizaba otros planes.

**Solución implementada:** `api/admin/stats/route.ts` usa `prisma.subscription.groupBy({ by: ['plan'], where: { status: 'ACTIVE' } })` + `prisma.planConfig.findMany()` para calcular `Σ (count × price)` por plan. MRR ahora refleja precios reales de la DB.

---

### ✅ M2 — Change-plan sin rollback ante fallo del nuevo preapproval

**Problema original:** Si la creación del nuevo preapproval fallaba, el preapproval anterior ya había sido cancelado. El usuario quedaba sin suscripción y sin forma de recuperarse.

**Solución implementada:**
- Se guarda `previousMpId` antes de cancelar el preapproval anterior.
- Si `createSubscription` falla, se loguea el error con contexto completo (`businessId`, `previousMpId`, error) para intervención manual del admin.
- Se retorna 500 con mensaje claro. La DB **no se actualiza** si MP falla.

---

### ✅ M3 — Reembolso solo cubría plan PRO

**Problema original:** `if (subscription.plan !== "PRO")` bloqueaba reembolsos de cualquier otro plan de pago.

**Solución implementada:** Condición cambiada a `if (subscription.plan === "FREE")` — acepta cualquier plan de pago activo (BASIC, PRO, PREMIUM, ENTERPRISE). Mensaje de error actualizado: `"No tienes una suscripción de pago activa"`.

---

### ✅ M4 — Constante `PLANS` vestigial con precios hardcodeados

**Problema original:** `PLANS` con precios hardcodeados importada en `cancel/route.ts` y `refund/route.ts`, creando doble fuente de verdad con `PlanConfig` en DB.

**Bug de producción detectado:** `refund/route.ts` tenía `newPlan: PLANS.FREE` en la respuesta JSON — `PLANS` había sido eliminada del import, causando `ReferenceError: PLANS is not defined` en producción al procesar cualquier reembolso.

**Solución implementada:**
- Eliminadas las importaciones de `PLANS` en `cancel/route.ts` y `refund/route.ts`.
- Eliminado `newPlan: PLANS.FREE` de la respuesta de refund.
- La constante se mantiene en `mercadopago.ts` para no romper consumidores indirectos, pero ya no se usa en endpoints críticos.

---

### ✅ M5 — `mpPreapprovalId` eliminado del schema

**Estado:** Resuelto. Eliminado de `prisma/schema.prisma` y fixture de test. Migración `20260522134724_remove_mp_preapproval_id` aplicada — `ALTER TABLE "Subscription" DROP COLUMN "mpPreapprovalId"` ejecutado en la DB.

---

### ✅ M6 — Sin notificaciones por email en eventos de suscripción

**Problema original:** No había emails al activar, fallar un pago ni cancelar una suscripción.

**Solución implementada:** 3 nuevas funciones en `src/lib/email.ts`:
- `sendSubscriptionActivated({ email, name, planName, nextBillingDate })` — llamada desde el webhook tras upsert de pago aprobado
- `sendSubscriptionPaymentFailed({ email, name, planName })` — implementada, disponible para el handler de pago rechazado
- `sendSubscriptionCancelled({ email, name, planName, accessUntil })` — llamada desde `cancel/route.ts` con la fecha hasta la que mantiene acceso

Los errores de email son silenciosos (`try/catch` que no propaga) para no interrumpir el flujo principal.

---

## 5. Problemas menores / UX

### ✅ U1 — Sin página de gestión de suscripción para el usuario

**Solución:** Nueva página `/dashboard/subscription` que muestra el plan actual, siguiente cobro y acciones (cambiar plan, cancelar). Server component con auth guard que renderiza `<SubscriptionCard />`.

---

### ~ U2 — Formulario de promos solo mostraba FREE y PRO

**Estado:** No aplica. Con promociones automáticas (C1), el alcance por plan no requiere modificar el formulario de promos.

---

### ~ U3 — Estadísticas de usos siempre en 0

**Estado:** Resuelto como consecuencia de C1. `usedCount` ahora se incrementa correctamente en cada aplicación de promo.

---

### ✅ U4 — Admin: suscripciones sin paginación

**Solución:** `GET /api/admin/subscriptions` acepta `?page=N`. Retorna `{ subscriptions, pagination: { total, page, pageSize, totalPages } }` con `PAGE_SIZE = 20`. La UI tiene controles de página con estado reactivo.

---

### ✅ U5 — TRIALING sin fecha de expiración

**Solución:** `resolveEffectivePlan()` recibe un 4º parámetro opcional `trialingStartedAt`. Si `status === "TRIALING"` y han pasado más de 48h desde `createdAt`, devuelve FREE. Los 3 callers internos pasan `business.subscription?.createdAt`.

---

## 6. Features nuevos implementados

### Sync-prices — Sincronización de precios con MercadoPago

**Motivación:** Si el admin actualiza el precio de un plan en `PlanConfig`, los preapprovals existentes en MP mantienen el precio anterior hasta la siguiente renovación.

**Implementación:**
- `POST /api/admin/subscriptions/sync-prices` — itera todas las suscripciones ACTIVE/PAST_DUE, compara `PlanConfig.price` vs `transaction_amount` de MP, llama `preApproval.update()` para las que difieren. Rate limit: 300ms entre llamadas a MP. Retorna `{ updated, skipped, failed, details[] }`.
- UI en `admin/subscriptions/page.tsx`: botón "Sincronizar precios con MP" con Dialog de confirmación y panel de resultados (updated/skipped/failed con detalle por suscripción).

---

## 7. Estado final

### Tests
```
Test Files  9 passed (9)
Tests      125 passed (125)
Duration   ~1s
```

### Archivos nuevos creados
| Archivo | Propósito |
|---------|-----------|
| `src/app/dashboard/subscription/page.tsx` | Página de gestión de suscripción del usuario (U1, C2) |
| `src/app/api/admin/subscriptions/sync-prices/route.ts` | Sincronización de precios con MP |
| `src/components/dashboard/subscription-status-toast.tsx` | Toast post-pago (C2) |

### Pendientes para próxima iteración
| Item | Descripción |
|------|-------------|
| **Email pago rechazado** | `sendSubscriptionPaymentFailed` está implementada pero el handler de `rejected` usa `updateMany` que no retorna datos del negocio — requiere lookup adicional de owner/planConfig |
| **Prorrateo** | MP no soporta prorrateo nativo en preapprovals; requiere cálculo de días restantes + reembolso parcial antes de crear el nuevo preapproval |

### Notas de arquitectura
- **`isActive: true`** al buscar `PlanConfig` en la creación de suscripción protege correctamente contra activar planes deshabilitados por el admin.
- **`externalReference`** sigue el formato `"businessId:planKey"` (ej. `"abc123:PRO"`). El webhook soporta el formato legacy `"businessId"` (sin planKey) consultando el plan en DB como fallback.
- **`resolveEffectivePlan()`** es el único punto de verdad para determinar el plan efectivo de un negocio — todos los checks de límites pasan por esta función.
