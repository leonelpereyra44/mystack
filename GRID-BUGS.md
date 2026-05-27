# Auditoría del Grid de Turnos — `appointments-staff-grid.tsx`

## Contexto del producto
SaaS de turnos y reservas para negocios pequeños/medianos (peluquerías, gimnasios, consultorios, clases grupales). El grid es la vista de operación diaria del staff. Referencia de industria: Calendly, Acuity, Fresha, Mindbody, SimplyBook.

---

## Bugs encontrados

### 🔴 BUG 1 — Chain overlap: tarjetas de lane se superponen con tarjetas aggregate

**Qué pasa:**
Si los turnos forman una "cadena" (A solapa con B, B solapa con C, pero A no solapa con C), el algoritmo computa `totalLanes` por turno de forma local, no por cluster completo. Resultado: B puede entrar en modo aggregate (4+ simultáneos) pero A y C, cuyos grupos directos son más chicos, quedan en modo lane. Las tarjetas de A/C se renderizan encima del aggregate card de B.

**Ejemplo concreto:**
```
A: 10:00–10:30   (overlapa con B)
B: 10:15–11:15   (overlapa con A, C, D, E) → totalLanes=5 → aggregate
C: 10:45–11:45   (overlapa con B, D, E)   → totalLanes=4 → aggregate  ✓
D: 11:00–12:00   (overlapa con B, C, E)   → aggregate                  ✓
E: 10:50–11:00   (overlapa con B, C, D)   → aggregate                  ✓
A: NO solapa con C/D/E → totalLanes=2 → lane card ← SE SUPERPONE con B's aggregate
```

**¿Importa en producción?**
Sí, si una clase de 60min se solapa en los bordes con un grupo de alta capacidad. Visualmente confuso para el operador.

**¿Cómo lo resuelven los SaaS?**
Fresha y Mindbody usan union-find o BFS sobre el grafo de solapamientos para determinar clusters completos antes de renderizar. Cada cluster se trata como unidad — o va todo a lanes, o todo a aggregate.

**Fix correcto:**
Reemplazar el algoritmo de `assignLanes` con union-find para encontrar componentes conexos. El cluster completo determina el modo (lane vs aggregate). Complejidad: O(n²) por construcción del grafo. Para ≤50 turnos/día/staff, invisible.

**Prioridad: MEDIA** — aparece solo con cadenas de solapamientos + alta capacidad simultáneamente.

---

### 🔴 BUG 2 — Turnos fuera del horario configurado son silently dropped

**Qué pasa:**
Si el negocio tiene horario configurado (9:00–18:00) pero existe un turno a las 8:30, el cálculo `startRow < 1` devuelve `null`. El turno no aparece en el grid. No hay indicación de esto para el operador.

**¿Importa en producción?**
Sí. Puede pasar cuando:
- Un admin creó un turno manualmente fuera de horario
- Se cambió el horario del negocio después de reservar
- Turnos de días anteriores se muestran en grillas de repaso

**¿Cómo lo resuelven los SaaS?**
Acuity y Calendly extienden el rango del grid para incluir todos los turnos del día, incluso si están fuera del horario "abierto". A veces los marcan visualmente con un fondo diferente (zona fuera de horario).

**Fix correcto:**
En el `useMemo` de `timeRange`, después de calcular el rango del schedule, extender el start/end para incluir el mínimo y máximo de los turnos del día. Costo mínimo, impacto alto.

**Prioridad: ALTA** — silently drops data, inaceptable en un SaaS.

---

### 🟡 BUG 3 — Aggregate card puede exceder el fin del grid

**Qué pasa:**
Si un grupo de turnos termina después del último slot del grid, `aggStartRow + aggSpanRows` supera `gridTemplateRows`. CSS crea filas implícitas que no tienen `ROW_HEIGHT`, rompiendo el layout visual.

**¿Importa en producción?**
Solo si hay turnos que terminan después del horario de cierre (mismo escenario que Bug 2 extendido). Si se implementa Bug 2's fix, este caso se vuelve mucho menos probable.

**Fix correcto:**
`Math.min(aggSpanRows, timeSlots.length - aggStartRow + 1)` — una línea.

**Prioridad: BAJA** — edge case que desaparece parcialmente si se resuelve Bug 2.

---

### 🟡 BUG 4 — Badge del aggregate card refleja solo el estado del primer turno

**Qué pasa:**
Si un grupo de 8 turnos tiene 5 CONFIRMADOS y 3 PENDIENTES, el color/badge del aggregate card muestra el estado del turno con `laneIdx=0` (el primero por orden de inicio). Puede mostrar "Confirmado" aunque haya pendientes que necesiten atención.

**¿Importa en producción?**
Para el operador que escanea el grid buscando pendientes: sí, puede ignorar un grupo con turnos sin atender.

**¿Cómo lo resuelven los SaaS?**
Mindbody y Fresha muestran el estado más "urgente" del grupo (PENDING > CONFIRMED > COMPLETED). En clases grupales, el badge muestra "X/Y cupos" en lugar de un estado individual.

**Fix correcto:**
Función `getGroupStatusConfig(apts[])` que ordena por urgencia y devuelve el config del más urgente. Simple.

**Prioridad: MEDIA** — afecta UX operacional pero no rompe funcionalidad.

---

### 🟢 UX 5 — Group modal description usa solo el primer turno

**Qué pasa:**
`{first.service.name} · {first.startTime} – {first.endTime}` puede mostrar info incorrecta si el grupo tiene diferentes servicios o turnos con distintos horarios de inicio.

**Fix correcto:**
Computar servicios únicos y rango real de horas del grupo. 2-3 líneas.

**Prioridad: BAJA** — cosmética, no afecta funcionalidad.

---

### 🟢 UX 6 — Sin "Volver al grupo" desde el modal individual

**Qué pasa:**
Desde el group modal → Ver detalle → modal individual → cerrar = volvés al grid sin poder volver al grupo. Con 10 turnos, tenés que abrir el aggregate card de nuevo para ver el resto.

**¿Cómo lo resuelven los SaaS?**
Fresha tiene breadcrumb dentro del modal. Acuity usa un panel lateral persistente. La solución mínima es un botón "← Volver al grupo".

**Fix correcto:**
Estado `groupContext` que recuerda desde qué grupo se navegó. Al cerrar el modal individual, re-abre el grupo. ~10 líneas.

**Prioridad: MEDIA** — UX importante para clases de alta capacidad.

---

### 🔵 CODE — `assignLanes` es O(n³)

**Qué pasa:**
`apts.find((a) => a.id === otherId)` dentro del doble loop = O(n³). Para el uso real (≤30 turnos/día/staff), completamente invisible. Con union-find (fix de Bug 1) desaparece solo.

**Prioridad: NO URGENTE** — resuelto como side effect del fix del Bug 1.

---

## Plan de acción recomendado

| # | Fix | Impacto | Esfuerzo | ¿Hacerlo? |
|---|-----|---------|----------|-----------|
| Bug 2 | Extender timeRange para incluir turnos fuera de horario | 🔴 Alta | ⚡ Mínimo (1 useMemo) | **SÍ — ahora** |
| Bug 3 | Clamp aggSpanRows al límite del grid | 🟡 Media | ⚡ 1 línea | **SÍ — junto con Bug 2** |
| Bug 4 | Badge aggregate con estado más urgente | 🟡 Media | ⚡ ~10 líneas | **SÍ — junto con Bug 2** |
| UX 5  | Description del group modal con rango real | 🟢 Baja | ⚡ 3 líneas | **SÍ — trivial** |
| UX 6  | Back to group desde modal individual | 🟢 Media | 🔧 ~10 líneas | **SÍ — vale la pena** |
| Bug 1 | Union-find para chain overlaps | 🔴 Media | 🔧 Refactor assignLanes | **SÍ — pero en iteración separada** |

### Orden sugerido
1. **Iteración inmediata** — Bug 2 + Bug 3 + Bug 4 + UX 5 + UX 6 (bajo riesgo, alto valor)
2. **Iteración siguiente** — Bug 1 (refactor de assignLanes, testear cadenas de solapamiento)

---

## Nota sobre approach de SaaS de referencia

**Fresha / Mindbody / Acuity** para alta capacidad (clases grupales de 20+ personas):
- No muestran tarjetas individuales en el grid — solo "12/20 cupos" con color de estado
- El detalle completo está en un panel lateral o modal con lista paginada
- La grilla usa colores para semáforo de ocupación, no datos individuales
- Para baja capacidad (1-3 simultáneos) sí usan lanes side-by-side

Lo que tenemos actualmente está alineado con esa filosofía (lane ≤3, aggregate >3). La diferencia es que ellos NO tienen el bug de chain overlap porque usan cluster-based rendering desde el principio.
