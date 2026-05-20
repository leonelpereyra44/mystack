# Revisión: Ciclo de Vida de Suscripciones

Fecha de revisión: 2026-05-20  
Referencia: diagrama "Conceptos básicos de los ingresos recurrentes"

---

## Estado antes de los cambios

| Concepto del diagrama | Estado | Descripción del problema |
|---|---|---|
| Prueba gratis (TRIALING) | ⚠️ Parcial | El estado existe pero es "pago pendiente", no un período de uso premium gratuito |
| Inicio → Suscripción activa | ✅ | Webhook activa el plan cuando `payment.status === "approved"` |
| Cancelación | ✅ | `/api/subscription/cancel` implementado y con tests |
| Pausa / Reinicio | ❌ | `preapproval.status === "paused"` se mapeaba igual que `"cancelled"` → se perdía el negocio |
| Upgrade de plan | ❌ | Sin endpoint. El usuario debía cancelar y contratar de cero |
| Downgrade de plan | ❌ | Ídem, sin endpoint |
| Pago rechazado → PAST_DUE | ⚠️ | Status `PAST_DUE` en schema pero **nunca se asignaba** en el webhook |
| Prorrateo | ❌ | No implementado (MercadoPago no lo soporta nativamente) |

---

## Cambios aplicados

### 1. Schema: nuevo status `PAUSED`

**Archivo:** `prisma/schema.prisma`

Agregado `PAUSED` al enum `SubscriptionStatus`. Representa una suscripción pausada en MP (puede ser recuperada).

```prisma
enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  TRIALING
  PAUSED   // ← nuevo
}
```

### 2. Webhook: mapeo correcto de estados MP

**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`

#### Antes:
```ts
case "paused":
case "cancelled":
  subscriptionStatus = "CANCELLED";  // ❌ pausa = cancelación
```

#### Después:
```ts
case "paused":
  subscriptionStatus = "PAUSED";     // ✅ pausa es recuperable
  break;
case "cancelled":
  subscriptionStatus = "CANCELLED";
```

#### Pago rechazado (nuevo):
```ts
if (payment.status === "rejected" && payment.external_reference) {
  // set PAST_DUE en la suscripción del negocio
}
```

### 3. Nuevo endpoint: cambio de plan (upgrade/downgrade)

**Archivo:** `src/app/api/subscription/change-plan/route.ts`

**POST** `{ plan: "PRO" | "BASIC" | ... }`

Flujo:
1. Valida el nuevo plan en la DB (`PlanConfig`)
2. Cancela el `preapproval` actual en MercadoPago
3. Crea un nuevo `preapproval` para el plan destino
4. Deja la suscripción en `TRIALING` hasta que el webhook confirme el pago

> **Nota sobre prorrateo:** MercadoPago no soporta prorrateo nativo en preapprovals.
> El usuario paga el nuevo plan completo desde el momento del cambio.
> Si pagó días del plan anterior que no usará, no hay reembolso automático.
> Solución futura: calcular manualmente los días restantes y emitir un reembolso parcial
> vía el endpoint `/api/subscription/refund`.

### 4. Admin UI: badge para PAUSED

**Archivo:** `src/app/admin/subscriptions/page.tsx`

Agregado badge visual para el status `PAUSED` (color naranja).

---

## Lo que queda pendiente (fuera de scope)

- **Prueba gratis real**: MP soporta `free_trial` en planes (preapproval_plan), no en preapprovals directos. Requeriría migrar a un modelo de preapproval_plan + preapproval a dos niveles.
- **Prorrateo real**: Requiere cálculo manual de días y emisión de reembolso parcial o descuento en el siguiente ciclo.
- **Reinicio explícito de pausa por usuario**: Actualmente la pausa/reinicio la controla MP automáticamente (por intentos de cobro). Para pausar manualmente, se necesitaría un endpoint `POST /api/subscription/pause` que llame a `preApproval.update({ status: "paused" })`.
