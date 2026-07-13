# Auditoría: Suscripciones con Mercado Pago

**Fecha:** 2026-07-13
**Síntoma reportado:** 1 usuario canceló la suscripción pero se le sigue renovando cada mes.
**Estado:** ✅ Resuelto (caso del usuario afectado + fixes preventivos aplicados).

---

## Resumen ejecutivo

| Hallazgo | Estado |
|---|---|
| Bug principal: webhook revivía suscripción CANCELLED ante pago aprobado | ✅ Corregido |
| Cancelación no verificada post-`update` en MP | ✅ Corregido |
| Preapprovals huérfanos en MP (múltiples ACTIVE) | ✅ Detectados y cancelados (caso usuario + fix preventivo) |
| `subscription_preapproval` handler reactivaba con `authorized` huérfano | ✅ Corregido |
| Idempotencia frágil por `lastPaymentId` | ✅ Reemplazada por tabla `PaymentEvent` con UNIQUE real |
| Cron de reconciliación DB ↔ MP | ✅ Implementado (diario 3:30 AM) |
| `currentPeriodEnd` mal calculado (`date_last_updated + 30d`) | ✅ Usa `next_payment_date` del preapproval |
| Usuario afectado (payer 2991577188) | ✅ 3 preapprovals cancelados en MP, DB sincronizada con período de gracia hasta 12/8/2026 |

---

## Bug principal (causa de la renovación post-cancelación)

`src/app/api/webhooks/mercadopago/route.ts:182-275` — el handler de pagos **resucita la suscripción cancelada**.

Cuando MP ejecuta un cargo recurrente (`type=payment`, `action=created`, `status=approved`), el webhook ejecutaba un `upsert` que incondicionalmente sobrescribe:

```ts
update: {
  plan: planToActivate as SubscriptionPlan,
  status: "ACTIVE",                       // ← revive la suscripción
  lastPaymentId: paymentId.toString(),
  currentPeriodEnd: ... +30 días,          // ← extiende el período
}
```

No había **ningún chequeo** del estado previo (`CANCELLED`) ni de `cancelledAt`. Cada pago aprobado reactivaba la suscripción y empujaba `currentPeriodEnd` +30 días.

---

## Causa raíz en MP (por qué sigue cobrando)

`src/app/api/subscription/cancel/route.ts:39-59` cancelaba correctamente en MP, pero 3 problemas explicaban que MP siga generando pagos:

1. **Cancelación no verificada** (`mercadopago.ts:99-116`): se hacía `preApproval.update({ status: "cancelled" })` y se confiaba en el `success: true`, sin un `get` posterior para confirmar el cambio.
2. **Preapprovals huérfanos en MP**: el `Subscription.mpSubscriptionId` se sobrescribía en cada nueva suscripción. Si un usuario creaba 2 preapprovals (abandonó uno sin pagar y se re-suscribió), MP mantenía N preapprovals activos pero la DB solo referenciaba el último.
3. **El handler de `subscription_preapproval`** era el único lugar que actualizaba `mpSubscriptionId`, y solo al crear la suscripción. Sin reconciliación, un pago huérfano se procesaba como legítimo.

---

## Bugs secundarios detectados y resueltos

| #  | Archivo: línea (antes) | Problema | Estado |
|----|---|---|---|
| S1 | `webhooks/mercadopago/route.ts` | `subscription_preapproval` reactivaba con `authorized` huérfano | ✅ Ahora chequea estado local antes de upsert |
| S2 | `webhooks/mercadopago/route.ts` | `update` sobre `CANCELLED` reseteaba `cancelledAt` silenciosamente | ✅ Validación previa evita el upsert |
| S3 | `webhooks/mercadopago/route.ts` | Idempotencia solo por `lastPaymentId` (frágil) | ✅ Ahora `PaymentEvent` con UNIQUE[paymentId, action] |
| S4 | `api/subscription/route.ts:65` | Permitía crear nueva suscripción sin cancelar la anterior | ✅ Pre-cancela preapproval anterior + huérfanos del payer |
| S5 | `mercadopago.ts:99-116` | No verificaba estado real en MP tras cancelar | ✅ Ahora `get` post-`update`; error si status != cancelled |
| S6 | `webhooks/mercadopago/route.ts:182` | Solo procesaba `action === "created"` | ✅ Ahora también `action === "updated"` |
| S7 | `webhooks/mercadopago/route.ts:234` | `currentPeriodEnd = date_last_updated + 30d` | ✅ Usa `next_payment_date` del preapproval (fetch inverso) |
| S8 | `mercadopago.ts:80` + `api/subscription/route.ts:127/132` | Inconsistencia temporal entre `TRIALING` local y `pending` en MP | Documentado; el webhook tolera ambos eventos en cualquier orden |

---

## Flujo del bug (cómo se reproducía)

```
1. Usuario crea suscripción → MP crea PreApproval A (id=A) → DB: mpSubscriptionId=A, status=TRIALING
2. Usuario paga → webhook "payment/created/approved" → DB: status=ACTIVE, currentPeriodEnd=+30d
3. Usuario cancela → webhook "subscription_preapproval/cancelled" → DB: status=CANCELLED, cancelledAt=now
   (cancel/route.ts también llama a MP: preApproval.update A → status=cancelled)
4. [Si la cancelación en MP falló silenciosamente o hay preapproval huérfano B]
   MP ejecuta cargo recurrente → webhook "payment/created/approved"
   → upsert sobrescribe: status=ACTIVE, currentPeriodEnd=+30d ← BUG
   Resultado: suscripción reviva, usuario vuelve a tener acceso y se le cobra.
```

**Con los fixes aplicados:**
- Paso 4 ya no revive la suscripción (chequeo `CANCELLED` + registro en `PaymentEvent` con `ignoredReason="cancel_protected"`).
- Si el pago tiene ≤10 días, se auto-reembolsa (`ignoredReason="auto_refunded"`).
- El cron de reconciliación detectaría el huérfano al día siguiente y lo cancelaría en MP si llegara a escaparse.

---

## Caso del usuario afectado (payer 2991577188)

Diagnóstico con `scripts/audit-mp-preapprovals.ts` reveló 4 preapprovals en MP:

| Preapproval ID | Status | Cobro | Acción tomada |
|---|---|---|---|
| `d2770aaaf7cb4c389559cf59ffa9bec1` | pending | No | Cancelado en MP |
| `69639fe7375f49d391f2a2987bf306ed` | pending | No | Cancelado en MP |
| `cc54f0309e5344e581c6a6ab31784b11` | cancelled | No | Ya estaba cancelado |
| `fa7c24524a7f4beeaf041f939cf82310` | **authorized** | **Sí, $15.000 ARS, próximo 2026-08-13** | **Cancelado en MP** |

Business local `cmp42jtdt000104jpcg7gm2d6` estaba `status=ACTIVE, mpSubId=null, cancelledAt=null` — la DB se había desincronizado completamente del estado real de MP.

**Acción ejecutada:**
- 3 preapprovals activos cancelados en MP (incluido `fa7c24524` que cobraba).
- DB local sincronizada: `status=CANCELLED, mpSubscriptionId=fa7c24524, mpCustomerId=2991577188, currentPeriodEnd=2026-08-12` → usuario conserva acceso PRO hasta 12/8/2026 (período ya abonado).

---

## Correcciones aplicadas (archivos modificados)

### `src/app/api/webhooks/mercadopago/route.ts`
- No reactiva la suscripción si `status === "CANCELLED"` (handler de pago y de preapproval).
- Inserta `PaymentEvent` por cada webhook recibido → idempotencia real vía constraint UNIQUE `[paymentId, action]`.
- Procesa `action === "updated"` además de `"created"`.
- Usa `next_payment_date` del preapproval para `currentPeriodEnd` (fetch `GET /preapproval/:id` con `payment.order.id` o `mpSubscriptionId`).
- Auto-reembolso si el pago llegué a una suscripción CANCELLED y tiene ≤10 días (derecho de arrepentimiento).
- `ignoredReason` queda registrado en `PaymentEvent` (`duplicate`, `cancel_protected`, `auto_refunded`).

### `src/lib/mercadopago.ts`
- `cancelSubscription` ahora hace `preApproval.get` post-`update` y verifica `status === "cancelled"`. Si MP no lo efectiviza, devuelve `success: false`.
- Nuevas helpers: `listActivePreapprovalsByPayer(mpCustomerId)` y `cancelOrphanPreapprovals(mpCustomerId, keepId)`.

### `src/app/api/subscription/cancel/route.ts`
- Tras cancelar el preapproval legítimo, lista y cancela todos los preapprovals huérfanos activos del payer.
- Si la DB no tiene `mpCustomerId`, lo rescata con `GET /preapproval/:id` y lo persiste.

### `src/app/api/subscription/route.ts`
- Antes de crear una nueva suscripción, pre-cancela el preapproval anterior y eventuales huérfanos del payer.

### `src/app/api/cron/reconcile-subscriptions/route.ts` (NUEVO)
- Cron diario (3:30 AM) que reconcilia DB ↔ MP para cada suscripción activa/pending/paused/past_due.
- Detecta: MP=cancelled y DB!=CANCELLED → sincroniza + email al usuario.
- Detecta: MP=authorized y DB=CANCELLED → re-cancela en MP + alerta admin.
- Cancela preapprovals huérfanos del payer.
- Notifica a `ADMIN_EMAIL` si hay alertas (vía Resend).

### `prisma/schema.prisma` + `prisma/migrations/20260713150000_add_payment_events_table/`
- Nuevo modelo `PaymentEvent` con campos: `businessId`, `preapprovalId`, `paymentId`, `action`, `status`, `amount`, `currency`, `externalReference`, `rawPayload`, `processedAt`, `ignoredReason`.
- Constraint `@@unique([paymentId, action])` para idempotencia a nivel DB.
- Índices: `(businessId, processedAt)`, `(preapprovalId)`.
- FK a `Business` con `onDelete: Cascade`.
- Migración aplicada a la DB de producción (`prisma db push` + `migrate resolve`).

### `scripts/audit-mp-preapprovals.ts` (NUEVO)
- Herramienta reusable de diagnóstico/limpieza.
- Lista preapprovals por `payer_id` o `businessId`, los cruza con la DB local, detecta huérfanos y los cancela en MP con `--cancel-orphans`.

### `vercel.json`
- Nuevo cron entry: `/api/cron/reconcile-subscriptions` con schedule `30 3 * * *`.

### `.env` / `.env.example`
- Documentadas variables `CRON_SECRET` y `ADMIN_EMAIL`.

---

## Tests y verificación

- `npx vitest run` → **131/131 tests pass**.
- 5 tests nuevos en `src/__tests__/api/webhooks/mercadopago.test.ts`:
  - `PaymentEvent.create` registra el evento.
  - `PaymentEvent` duplicado (P2002) no re-procesa.
  - Pago aprobado para CANCELLED marca `cancel_protected` y no hace upsert.
  - Pago aprobado usa `next_payment_date` del preapproval.
  - Pago aprobado sin `order.id` usa fallback +30d.
- 1 test adicional en `src/__tests__/lib/mercadopago.test.ts`:
  - `cancelSubscription` devuelve `success: false` si MP no efectiviza la cancelación.
- Typecheck: sin errores nuevos.
- ESLint: sin errores (1 warning preexistente de `sendSubscriptionPaymentFailed` no usado).

---

## Endpoints/claves de MP

- PreApproval API: `https://api.mercadopago.com/preapproval/:id`
- PreApproval Search: `https://api.mercadopago.com/preapproval/search?payer_id=:id`
- Payment API: `https://api.mercadopago.com/v1/payments/:id`
- Payment Refund API: `https://api.mercadopago.com/v1/payments/:id/refunds`

### Env vars relevantes

| Variable | Rol |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Token del vendedor (todas las calls) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Verificación HMAC de webhooks |
| `MERCADOPAGO_PUBLIC_KEY` | Cliente (no usado en backend) |
| `CRON_SECRET` | AuthN de endpoints `/api/cron/*` |
| `ADMIN_EMAIL` | Destinatario de alertas de reconciliación |
| `NEXTAUTH_URL` | URLs de retorno en MP (`back_url`s) |

---

## Pendientes

### Operativos (antes del deploy)
- [ ] **Setear en Vercel** las env vars:
  - `CRON_SECRET` = `XGGtNx30LoO1TT3CIoSzH3quwUC7Der72eKCwF7JITI=` (mismo valor que `.env` local)
  - `ADMIN_EMAIL` = email donde querés recibir las alertas del cron
- [ ] **Correr `prisma migrate deploy` en Vercel** (o asegurar que `prisma db push` se ejecuta en build) para crear la tabla `payment_events` en producción.
- [ ] Confirmar en el panel de MP que los webhooks apuntan a `https://mystack.com.ar/api/webhooks/mercadopago` y que la firma HMAC está activada con `MERCADOPAGO_WEBHOOK_SECRET`.

### Mejoras sugeridas (no bloqueantes)
- [ ] **Backfill de `PaymentEvent` histórico:** opcional — cargar el histórico desde la API de MP `/v1/payments/search` parakinear pagos del pasado. Solo vale si necesitás reportes históricos.
- [ ] **Logs estructurados:** reemplazar `console.log/warn/error` por un serializer con `businessId`, `mpSubscriptionId`, `preapprovalId`, `statusPrevio`, `statusNuevo` para que los logs de Vercel sean buscables.
- [ ] **Validar `lastProcessedEventId`** (cabecera `x-request-id` de MP) además del tuple `[paymentId, action]` — las dos claves combinadas dan defensa en profundidad contra duplicados.
- [ ] **Endpoint admin /admin/subscriptions/audit:** exponer el script `audit-mp-preapprovals.ts` como API interna para admins (actualmente es CLI-only).
- [ ] **Métricas:** emitir contadores (`cron_reconcile_marked_cancelled_total`, `webhook_payment_cancel_protected_total`, etc.) a Vercel Analytics o similar.

### Documentación
- [ ] Documentar runbook operativo "qué hacer si un usuario reporta cobro post-cancelación" (paso 1: correr `npx tsx scripts/audit-mp-preapprovals.ts --business=<bizId> --cancel-orphans`).

---

## Archivos relevantes

| Archivo | Rol |
|---|---|
| `src/lib/mercadopago.ts` | Cliente MP: createSubscription, cancelSubscription (con verify), getSubscriptionStatus, refundPayment, listActivePreapprovalsByPayer, cancelOrphanPreapprovals |
| `src/app/api/subscription/route.ts` | POST crea suscripción (pre-cancela anterior); GET devuelve estado |
| `src/app/api/subscription/cancel/route.ts` | POST cancela suscripción (MP + huérfanos + DB) |
| `src/app/api/webhooks/mercadopago/route.ts` | Recibe webhooks (preapproval + payment) con PaymentEvent y anti-revival |
| `src/app/api/cron/reconcile-subscriptions/route.ts` | Cron diario DB ↔ MP (nuevo) |
| `src/lib/plan-limits.ts` | `resolveEffectivePlan`: decide plan efectivo (FREE/PRO) según estado + currentPeriodEnd |
| `prisma/schema.prisma` | Modelos `Subscription`, `PaymentEvent` (nuevo) + enums |
| `prisma/migrations/20260713150000_add_payment_events_table/` | Migración de PaymentEvent |
| `scripts/audit-mp-preapprovals.ts` | Script de diagnóstico/limpieza de huérfanos (nuevo) |
| `vercel.json` | Crons (reminders, cleanup-pending, reconcile-subscriptions) |
| `auditoria-suscripciones.md` | Este documento |