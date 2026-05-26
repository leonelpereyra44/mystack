# Lista de Clientes — Plan de Implementación

## Contexto

El sistema actualmente no tiene un modelo `Client` en la base de datos. Los clientes son solo campos inline en `Appointment` (`customerName`, `customerEmail`, `customerPhone`). Esta feature agrega un modelo persistente de clientes, gateado al plan PRO.

La razón de usar un modelo persistente (en vez de derivar desde appointments) es que en el futuro se van a implementar **reseñas por servicio**, las cuales necesitan una entidad `Client` como ancla referencial.

---

## Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Almacenamiento | Modelo `Client` en DB | Requerido para futuras reseñas |
| Plan mínimo | PRO (y superiores activos) | Alineado con otras features premium |
| Nav para FREE | Visible con badge/candado | Descubribilidad del feature |
| Vista detalle | No en v1 | Scope acotado — solo lista |
| Identificación | `(businessId, email)` unique | Un cliente por negocio por email |

---

## Modelo Prisma

```prisma
model Client {
  id          String   @id @default(cuid())
  businessId  String
  email       String
  name        String
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business     Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@unique([businessId, email])
  @@index([businessId])
  @@map("clients")
}
```

La relación `Appointment → Client` es opcional: `clientId String?` en `Appointment`, vinculado via el email.

---

## API

### `GET /api/clients`

**Auth:** sesión requerida (BUSINESS_OWNER)

**Plan check:** si el plan activo no es PRO/PREMIUM/ENTERPRISE, retorna:
```json
{ "requiresPro": true }
```
con status `403`.

**Response:**
```json
{
  "clients": [
    {
      "id": "...",
      "email": "cliente@example.com",
      "name": "Juan Pérez",
      "phone": "+54911...",
      "totalAppointments": 8,
      "lastAppointmentDate": "2026-05-20",
      "totalSpent": 42000,
      "createdAt": "2025-01-15T..."
    }
  ],
  "total": 42
}
```

**Aggregation:** JOIN con `appointments` para calcular `totalAppointments`, `lastAppointmentDate` y `totalSpent` (suma de `service.price` de turnos no cancelados).

---

## Auto-creación de clientes

En `POST /api/appointments` (endpoint de reserva pública), después de crear el appointment se ejecuta un `upsert` sin bloquear la respuesta:

```ts
prisma.client.upsert({
  where: { businessId_email: { businessId, email: customerEmail } },
  update: { name: customerName, phone: customerPhone ?? undefined },
  create: { businessId, email: customerEmail, name: customerName, phone: customerPhone },
})
```

Esto mantiene el nombre y teléfono actualizados con la info más reciente.

---

## Rutas del dashboard

```
/dashboard/clients          ← lista paginada de clientes (PRO)
```

Vista de detalle `/dashboard/clients/[id]` queda para una iteración futura.

---

## Componentes

| Archivo | Descripción |
|---|---|
| `src/app/dashboard/clients/page.tsx` | Server component, carga datos y verifica plan |
| `src/app/dashboard/clients/loading.tsx` | Skeleton loader |
| `src/components/dashboard/clients-list.tsx` | Tabla interactiva (búsqueda, sort, estados) |

---

## Nav

Nuevo ítem en sidebar y mobile nav:
- Icono: `ContactRound` (lucide-react)
- Label: "Clientes"
- Href: `/dashboard/clients`
- Para FREE: muestra badge `PRO` pero el link sí funciona (lleva a la preview bloqueada)

---

## Backfill

Script en `scripts/backfill-clients.ts` para crear registros `Client` desde los `appointments` existentes. Se ejecuta una sola vez después de la migración.

```bash
npx tsx scripts/backfill-clients.ts
```

---

## Plan gating (FREE)

Idéntico al patrón de Analytics:
1. La página hace fetch a `/api/clients`
2. Si recibe `requiresPro: true`, renderiza preview borrosa + card Crown
3. La preview muestra 4 clientes ficticios con datos de ejemplo
4. Card con botón "Actualizar a PRO" → `/dashboard/settings`

---

## Futuras iteraciones

- [ ] Vista detalle de cliente con historial de turnos (`/dashboard/clients/[id]`)
- [ ] Reseñas por servicio vinculadas al modelo `Client`
- [ ] Notas internas por cliente
- [ ] Etiquetas/segmentación de clientes
- [ ] Exportar lista de clientes a CSV
- [ ] Envío de comunicaciones/recordatorios por email a clientes

---

## Archivos modificados

```
prisma/schema.prisma                              ← nuevo modelo Client + relaciones
prisma/migrations/[timestamp]_add_clients/        ← migración additive (solo CREATE TABLE)
src/app/api/clients/route.ts                      ← nuevo endpoint
src/app/dashboard/clients/page.tsx                ← nueva página
src/app/dashboard/clients/loading.tsx             ← skeleton
src/components/dashboard/clients-list.tsx         ← nuevo componente
src/components/dashboard/nav.tsx                  ← agregar ítem Clientes
src/components/dashboard/mobile-nav.tsx           ← agregar ítem Clientes
src/app/api/appointments/route.ts                 ← upsert Client al crear appointment
scripts/backfill-clients.ts                       ← script de backfill (ejecutar 1 vez)
```
