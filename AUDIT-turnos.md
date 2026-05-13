# Auditoría: Turnos y Horarios
**Fecha:** Mayo 2026  
**Alcance:** Toda la lógica de disponibilidad, reservas, horarios y bloqueos de agenda  
**Perspectiva:** dueño de peluquería + cliente final

---

## Resumen ejecutivo

La arquitectura general es sólida. Los flujos principales (crear turno, confirmar por email, cancelar, reprogramar, horarios por negocio/staff/servicio, bloqueos) están bien diseñados. Sin embargo, se encontraron **2 bugs críticos de integridad de datos**, **4 bugs de funcionalidad alta** y varios problemas medianos/bajos.

---

## Mapa del sistema auditado

```
BOOKING PÚBLICO
  /{slug}/page.tsx
    └── BookingForm
          ├── /api/appointments/availability   (resalta días en calendario)
          ├── /api/business/{slug}/blocked-dates (días bloqueados)
          ├── /api/appointments/available      (slots del día)
          └── /api/appointments (POST)         (crear turno)
                └── email → /api/appointments/[id]/confirm/[token]

DASHBOARD
  /dashboard/appointments
    ├── AppointmentsView → AppointmentsList / AppointmentsCalendar
    ├── NewAppointmentModal
    └── /api/appointments/[id] (PATCH/DELETE/cancel/reschedule)

  /dashboard/schedule
    ├── ScheduleForm → /api/business/schedule (PUT)
    └── BlockedTimesManager → /api/business/blocked-time (GET/POST/DELETE)

  /dashboard/staff/[id]/edit
    └── /api/staff/[id]/schedule (GET/PUT)

  /dashboard/services/[id]/edit
    └── /api/services/[id]/schedule (GET/PUT)

CRON
  /api/cron/reminders       → recordatorios día anterior
  /api/cron/cleanup-pending → elimina PENDING expirados (medianoche)
```

---

## 🔴 CRÍTICO — Integridad de datos

### Bug #1 — Race condition (TOCTOU) al crear un turno
**Archivo:** `src/app/api/appointments/route.ts:133-167`  
**Estado:** Sin corregir

El chequeo de disponibilidad y la creación del turno son dos queries separadas sin transacción ni lock de base de datos. Dos clientes que envíen el formulario al mismo tiempo pueden pasar ambos el chequeo `overlappingCount < slotCapacity` y crear dos turnos en el mismo slot cuando la capacidad es 1. Resultado: double-booking.

**Flujo problemático:**
```
Cliente A → count = 0 (< 1) ✓
Cliente B → count = 0 (< 1) ✓
Cliente A → INSERT  ← ok
Cliente B → INSERT  ← double booking!
```

**Fix:** Usar transacción con re-validación atómica o `SELECT FOR UPDATE` dentro de una transacción Prisma.

---

### Bug #2 — Race condition (TOCTOU) al reprogramar
**Archivo:** `src/app/api/appointments/[id]/reschedule/route.ts:59-94`  
**Estado:** Sin corregir

Misma vulnerabilidad que el Bug #1: chequeo de solapamiento + update sin transacción atómica.

---

## 🟠 ALTO — Lógica incorrecta

### Bug #3 — Calendario mensual ignora completamente los bloqueos de agenda
**Archivo:** `src/app/api/appointments/availability/route.ts`  
**Estado:** Sin corregir

El endpoint que pinta los días verdes/disponibles en el calendario no consulta la tabla `blocked_times` en ningún momento. Un día marcado como bloqueado (vacaciones, feriado) puede aparecer verde.

El frontend tiene un workaround parcial: llama a `/api/business/{slug}/blocked-dates` por separado y desactiva esos días. Sin embargo:
- Solo cubre **bloqueos de día completo**. Los bloqueos parciales (ej: bloqueo de 9 a 13hs) siguen sin considerarse en el `slotsCount`, por lo que el día aparece con más slots de los reales.
- No considera si **todos los horarios** de un día quedan cubiertos por múltiples bloqueos parciales.

---

### Bug #4 — Calendario mensual ignora los `ServiceSchedule`
**Archivo:** `src/app/api/appointments/availability/route.ts`  
**Estado:** Sin corregir

Si un servicio tiene restricciones de días/horarios configuradas (tabla `service_schedules`), el calendario mensual las ignora por completo. Muestra como "disponibles" todos los días hábiles del negocio, aunque ese servicio específico no se ofrezca esos días. El cliente selecciona la fecha, carga los slots, y se encuentra con 0 resultados.

---

### Bug #5 — Turnos PENDING expirados siguen bloqueando slots hasta medianoche
**Archivos:** `src/app/api/appointments/available/route.ts:204-212`, `src/app/api/cron/cleanup-pending/route.ts`  
**Estado:** Sin corregir

El cron de limpieza corre **una vez por día a medianoche**. Los turnos PENDING con token expirado (15 min si es hoy, 60 min en el futuro) NO son filtrados en la consulta de slots disponibles — se tratan igual que un CONFIRMED. Si alguien crea un turno a las 10:00 y no confirma en 15 min, ese slot queda bloqueado para todos hasta las 00:00.

Para una peluquería con un solo barbero y alta demanda, esto significa que un bot o accidente puede bloquear la agenda por horas.

**Consulta actual:**
```typescript
status: { notIn: ["CANCELLED"] },
// PENDING expirados cuentan como ocupados ← bug
```

**Fix conceptual:**
```typescript
status: { notIn: ["CANCELLED"] },
NOT: {
  AND: [
    { status: "PENDING" },
    { tokenExpiresAt: { lt: new Date() } }
  ]
}
```

---

### Bug #6 — `blocked-dates` público devuelve bloqueos de staff cuando no hay staffId
**Archivo:** `src/app/api/business/[slug]/blocked-dates/route.ts:29-50`  
**Estado:** Sin corregir

Sin `staffId` en la query, el endpoint devuelve **todos** los bloqueos — incluyendo los de staff individual. Si "Carlos" está de vacaciones el lunes, el calendario de un cliente que no eligió profesional muestra ese lunes como bloqueado, aunque "Lucía" esté disponible.

El endpoint `available` maneja esto correctamente (`staffId: null` cuando no hay staff seleccionado). La inconsistencia es en `blocked-dates`.

**Código actual:**
```typescript
// Sin staffId → devuelve TODOS los bloqueos (bug)
...(staffId && {
  OR: [{ staffId }, { staffId: null }],
}),
```

**Fix:** Cuando no hay `staffId`, filtrar solo bloqueos del negocio completo:
```typescript
...(staffId
  ? { OR: [{ staffId }, { staffId: null }] }
  : { staffId: null } // solo bloqueos del negocio
),
```

---

## 🟡 MEDIO — Inconsistencias

### Bug #7 — Disponibilidad mensual no aplica `bufferTime`
**Archivo:** `src/app/api/appointments/availability/route.ts`  
**Estado:** Sin corregir

El `bufferTime` (minutos de descanso entre turnos) solo se aplica al obtener slots de un día específico. El calendario puede mostrar X slots disponibles, pero al seleccionar la fecha el cliente ve menos. El `slotsCount` mostrado en el calendario es incorrecto.

---

### Bug #8 — Disponibilidad mensual ignora `minBookingNotice` para días futuros
**Archivo:** `src/app/api/appointments/availability/route.ts:187-193`  
**Estado:** Sin corregir

El endpoint mensual hardcodea 30 minutos de margen solo para hoy. No aplica el `minBookingNotice` configurado por el negocio, ni maneja el escenario cross-day (ej: si el aviso mínimo es 12h y son las 8 PM, "mañana" no debería mostrarse con slots de las 7 AM).

El endpoint de slots del día (`available`) sí implementa esta lógica completa.

---

### Bug #9 — 30 minutos hardcodeados aunque `minBookingNotice = 0`
**Archivo:** `src/app/api/appointments/available/route.ts:265`  
**Estado:** Sin corregir

```typescript
const marginMinutes = Math.max(30, minBookingNotice * 60);
```

Un negocio con `minBookingNotice = 0` (walk-in digital, sin aviso previo) igual bloquea los próximos 30 minutos. Si el negocio quiere aceptar reservas en tiempo real, no puede.

---

### Bug #10 — `reschedule` no valida el nuevo slot contra horarios ni bloqueos
**Archivo:** `src/app/api/appointments/[id]/reschedule/route.ts`  
**Estado:** Sin corregir

Al reprogramar, solo se verifica si el slot está ocupado por otro turno (capacidad). No se valida:
- Que la nueva fecha/hora esté dentro del horario del negocio
- Que no sea un día/horario bloqueado
- Que esté dentro del horario del staff asignado
- Que respete el `minBookingNotice`

Un cliente podría reprogramar a las 3 AM, un feriado, o a un horario fuera del horario del negocio.

---

### Bug #11 — `ServiceSchedule` PUT no valida los horarios
**Archivo:** `src/app/api/services/[id]/schedule/route.ts:66-76`  
**Estado:** Sin corregir

Solo valida tipos de datos básicos (número, string). No verifica:
- Que `startTime < endTime`
- Que los horarios estén dentro del horario del negocio
- Formato correcto de tiempo ("HH:MM")

El API de horarios de staff sí realiza estas validaciones. Inconsistencia entre los dos.

---

## 🔵 BAJO / UX

### Bug #12 — Selector de profesional aparece después de elegir fecha y hora
**Archivo:** `src/components/booking/booking-form.tsx:756-778`  
**Estado:** Sin corregir

En el paso 2 el flujo es: elegir fecha → ver slots → elegir slot → **luego** elegir profesional. Cambiar el profesional resetea el slot seleccionado. El orden natural sería: elegir profesional → ver su disponibilidad → elegir fecha y hora.

---

### Bug #13 — Fallback de error en carga de slots muestra todos los horarios sin validar
**Archivo:** `src/components/booking/booking-form.tsx:308-310`  
**Estado:** Sin corregir

Si la llamada a `/api/appointments/available` falla por error de red, se muestran todos los slots teóricos del horario del negocio (sin chequeo de ocupación, bloqueos, etc.). El servidor rechazaría el submit, pero la UX es confusa.

---

### Bug #14 — Creación de bloqueos en rango usa queries secuenciales (N+1)
**Archivo:** `src/app/api/business/blocked-time/route.ts:119-141`  
**Estado:** Sin corregir

Para un rango de 30 días, se hacen 30 `CREATE` individuales en un loop `while`. Debería usar `createMany`.

---

### Bug #15 — Link de Google Calendar no incluye timezone
**Archivo:** `src/components/booking/booking-form.tsx:381-383`  
**Estado:** Sin corregir

El link generado usa formato `20260515T100000` sin zona horaria. Google Calendar lo interpreta en la zona del usuario, que puede no ser Argentina (UTC-3).

**Fix:** Usar formato UTC (`20260515T130000Z`) convirtiendo la hora Argentina a UTC.

---

## Estado de correcciones

| # | Severidad | Descripción | Estado |
|---|-----------|-------------|--------|
| 1 | 🔴 Crítico | Race condition al crear turno | ✅ Corregido |
| 2 | 🔴 Crítico | Race condition al reprogramar | ✅ Corregido |
| 3 | 🟠 Alto | Calendar mensual ignora blocked times | ✅ Corregido |
| 4 | 🟠 Alto | Calendar mensual ignora ServiceSchedule | ✅ Corregido |
| 5 | 🟠 Alto | PENDING expirados bloquean slots | ✅ Corregido |
| 6 | 🟠 Alto | blocked-dates devuelve bloqueos de staff sin filtro | ✅ Corregido |
| 7 | 🟡 Medio | Calendar mensual ignora bufferTime | ✅ Corregido (incluido en fix #3) |
| 8 | 🟡 Medio | Calendar mensual ignora minBookingNotice | ✅ Corregido (incluido en fix #3) |
| 9 | 🟡 Medio | 30min hardcodeados aunque minBookingNotice = 0 | ✅ Corregido |
| 10 | 🟡 Medio | reschedule no valida horarios/bloqueos | ✅ Corregido |
| 11 | 🟡 Medio | ServiceSchedule PUT sin validaciones | ✅ Corregido |
| 12 | 🔵 Bajo | Staff selector después del time picker | ✅ Corregido |
| 13 | 🔵 Bajo | Fallback de error muestra slots sin validar | ✅ Corregido |
| 14 | 🔵 Bajo | Bloqueo de rango con N queries secuenciales | ✅ Corregido |
| 15 | 🔵 Bajo | Google Calendar link sin timezone | ✅ Corregido |
