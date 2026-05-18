# Auditoria: Panel de Turnos y Servicios

> Fecha: Mayo 2026

---

## Panel de Servicios

### Lo que se saco / cambio

- **Duracion maxima inconsistente**: En "nuevo servicio" se podia hasta 240 min, en "editar" solo hasta 120 min. Unificados con input numerico libre con validacion en lugar de un `<Select>` con opciones fijas.
- **Input numerico libre para duracion**: Reemplaza el select de opciones fijas por un input que acepta cualquier valor entre 5 y 480 minutos.
- **El campo `price`**: No tiene soporte para moneda configurada por pais. Esta hardcodeado para mostrar `$XX.XX`. Para un negocio argentino en 2026 esto es un problema real (precios de 4-5 digitos, sin simbolo `$` o con `ARS`).
- **No hay vista previa de como ve el cliente el servicio**: El dueno edita el servicio pero no tiene un "ver como cliente" rapido.

### Lo que se mejoro

- **Tarjetas de servicio sin jerarquia visual**: La grilla mostraba nombre, duracion, precio y el badge "Inactivo" pero sin ningun enfasis visual. El nombre deberia ser el elemento dominante, con precio y duracion como metadata secundaria.
- **Drag & drop para reordenar solo en desktop**: La libreria `@dnd-kit` esta configurada pero en mobile probablemente no es usable. Se necesita un fallback (flechas arriba/abajo en mobile).
- **Sin busqueda/filtrado**: Si un negocio tiene 15+ servicios, no habia forma de buscar.
- **Sin agrupacion por categoria**: No existe el concepto de categorias de servicio. Un spa con "Faciales", "Masajes", "Depilacion" los tiene mezclados en una sola grilla.
- **La configuracion de horario por servicio esta oculta**: Esta enterrada en la pagina de edicion (`/services/[id]/edit`). No es evidente que existe.

### Lo que se agrego (backlog)

- **Imagen/thumbnail por servicio**: Para la pagina publica de reservas, una imagen mejora mucho la conversion.
- **Tags o categorias** para agrupar servicios.
- **Campo de color** por servicio para diferenciarlo en el calendario.
- **Servicios de grupo / capacidad maxima**: Ya existe `slotCapacity` en los turnos pero no es editable por servicio desde la UI.
- **Duracion variable**: Algunos negocios tienen el mismo servicio con duraciones distintas (ej. masaje 30/60/90 min). Hoy habria que crear 3 servicios distintos.

---

## Panel de Turnos

### Lo que se saco

- **`alert()` en el formulario de booking del cliente**: Habia dos `alert()` hardcodeados en `booking-form.tsx:325,329`. Es un error de UX y consistencia — el resto del app usa `sonner` para toasts. **Corregido.**
- **Filtros duplicados**: El bloque de filtros (Proximos/Pasados/Todos + selects de servicio/staff + botones de export) estaba copy-pasted dentro de dos branches del mismo componente. Extraido a subcomponente. **Corregido.**

### Lo que se cambio

- **`window.innerWidth` en SSR**: `AppointmentsCalendar.tsx` usaba `window.innerWidth` dentro de un `useMemo` para detectar mobile/desktop. Es un anti-patron de hidratacion que puede causar mismatch. **Corregido.**
- **UTC-3 hardcodeado**: Para los exports a Google Calendar e ICS, el codigo sumaba `hour + 3` para convertir a UTC. No maneja DST ni funciona fuera de Argentina. **Corregido usando timezone dinamica.**
- **Sin optimistic updates**: Cada cambio de estado (confirmar, completar, cancelar) hacia un `router.refresh()` que refetcheaba todo desde el servidor. Con 50+ turnos en pantalla esto se nota. **Corregido con actualizacion local optimista.**
- **Paginacion de 10 items**: Es muy conservador. Con filtros activos (solo "Proximos"), 10 items fuerza demasiada navegacion. **Aumentado a 25.**

### Lo que se mejoro

- **Vista calendario sin color por servicio**: El calendario usa colores solo para estado (PENDING/CONFIRMED/etc) pero no diferencia por servicio.
- **Vista semana en mobile**: La vista semanal del calendario tiene implementaciones separadas desktop/mobile en el mismo archivo (838 lineas). Es complejo de mantener y la version mobile parece incompleta.
- **El modal de "Nuevo Turno" no muestra disponibilidad**: Al crear un turno manualmente desde el dashboard, el owner ingresa fecha/hora libre sin ver que slots ya estan ocupados.
- **Sin notificacion al cliente cuando el owner crea un turno manual**: Si el dueno crea un turno desde el dashboard, el cliente no recibe confirmacion.

### Lo que se agrego

- **Busqueda por nombre/email de cliente**: Hoy solo habia filtros por servicio/staff/estado. **Implementado.**
- **Vista "Agenda del dia"**: Una vista de dia tipo Google Calendar con franja horaria visual. (backlog)
- **Acciones en bulk**: Seleccion multiple para confirmar/cancelar varios turnos a la vez. (backlog)
- **Notas internas**: Ya existe el campo `notes` pero es visible para el cliente tambien. Seria util tener un campo de "nota interna" solo para el staff. (backlog)
- **Historial de cambios por turno**: Saber que un turno fue confirmado a las 10:30, luego rescheduled, etc. (backlog)
- **Recordatorios configurables**: Envio automatico de recordatorio X horas antes del turno. (backlog)

---

## Prioridades implementadas

| Prioridad | Cambio | Estado |
|---|---|---|
| Alta | Fix `alert()` -> `toast()` en booking-form | Hecho |
| Alta | Unificar opciones de duracion nuevo/editar servicio | Hecho |
| Alta | Busqueda por cliente en turnos | Hecho |
| Media | Extraer filtros duplicados en AppointmentsList | Hecho |
| Media | Fix timezone hardcodeada en exports ICS/GCal | Hecho |
| Media | Optimistic updates en cambios de estado | Hecho |
| Media | Input numerico libre para duracion/precio | Hecho |

## Backlog

| Prioridad | Cambio | Esfuerzo estimado |
|---|---|---|
| Media | Color por servicio + reflejado en calendario | Alto |
| Media | Categorias de servicios | Alto |
| Baja | Recordatorios automaticos | Alto |
| Baja | Vista agenda del dia | Medio |
| Baja | Acciones en bulk en turnos | Medio |
| Baja | Notas internas para staff | Bajo |
| Baja | Imagen/thumbnail por servicio | Medio |
