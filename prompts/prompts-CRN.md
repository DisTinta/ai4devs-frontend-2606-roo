# prompts-CRN

Registro de prompts significativos del ejercicio (S10). Formato acordado: título, prompt literal, resultado, y ajuste humano si aplica.

---

### Prompt 1 — Instalar el SDD Harness Kit y adaptarlo al stack del repo

```
Instala el SDD Harness Kit en este repositorio (ai4devs-frontend-2606-roo) y adáptalo al stack real:
Express + Prisma + Jest en backend/, React CRA + Bootstrap en frontend/, Postgres solo en Docker Compose.
Rellena project-context, sdd-harness.env y standards; deja un adaptador personal reutilizable en el propio repo.
```

**Resultado.** Kit instalado (detección `_template` + frontend React). Configuración Express/Prisma/CRA rellenada; arranque documentado (Docker → backend `:3010` → frontend `:3000`); unit tests sin Docker; carpeta `sdd-personal-adapter/express-prisma/`.

**Por qué funcionó.** El adaptador no inventó Fastify/Adonis: comandos y rutas salieron del monorepo real (`npm --prefix backend`, capas `application` / `presentation`).

**Ajuste humano.** Se descartó forzar un adaptador oficial del kit; el relleno se guarda como adaptador personal en el repo del ejercicio.

---

### Prompt 2 — Hallazgo del test en rojo, bitácora y decisión de arreglo

```
El test positionService.test.ts falla tras instalar el harness. Explica la causa, deja constancia en una bitácora de hallazgos (prompts/findings.md) y, con mi decisión explícita, alinea el test al contrato actual del servicio (no recortes el DTO).
```

**Resultado.** Causa: el servicio ya devolvía `id` y `applicationId`; el test no. Bitácora creada/actualizada. Test corregido (mock con `candidate.id`); suite backend 4/4 verde; `KIT_SKIP_STOP_TESTS=0`.

**Ajuste humano.** Decisión: arreglar el test, no el servicio. La bitácora queda como sitio para futuros hallazgos.

---

### Prompt 3 — Premisa de trabajo: registro de prompts

```
Premisa obligatoria del ejercicio: mantén prompts/prompts-CRN.md con los prompts significativos (no toda la conversación), en orden, con el prompt en bloque de código, una nota breve del resultado, y si aporta: «Por qué funcionó» y «Ajuste humano» (qué se cambió o rechazó de la salida del modelo).
```

**Resultado.** Fichero `prompts/prompts-CRN.md` con entradas curadas; regla añadida en `docs/project-context.md` para sesiones siguientes.

**Ajuste humano.** No volcar el hilo completo del chat: solo prompts condensados que representen el trabajo real (install/adaptación, hallazgo+fix, premisa).

---

### Prompt 4 — Desglose del enunciado en user stories

```
Eres un arquitecto de software senior con experiencia en sistemas ATS (Applicant Tracking Systems) y en Spec-Driven Development.

Lee y analiza el enunciado del ejercicio en `user-stories/exercise-brief.md` (vista Position tipo kanban para LTI).

Contrástalo con el repositorio real cuando haga falta (rutas API, DTOs, frontend existente).

Entrega:
1. Una épica breve alineada con el enunciado.
2. User stories INVEST, cada una en su propio fichero dentro de `user-stories/` (una story = un archivo), con criterios de aceptación comprobables, non-goals y contexto técnico mínimo.
3. Si detectas desajustes entre el enunciado y el código, documéntalos en la épica (riesgos) y corrige las stories para que sean implementables; no inventes backend salvo decisión explícita (p. ej. crear `PUT /candidates/:id/stage` si no existe).

No implementes la UI todavía: solo el desglose en historias.
```

**Resultado.** Carpeta `user-stories/` con `00-epic-position-kanban.md` y HU-01…HU-06. Stories alineadas al enunciado; riesgos de API contrastados con el repo; decisión de crear `/stage` si falta.

**Por qué funcionó.** Separar enunciado (`exercise-brief.md`) del prompt de trabajo evita mezclar requisitos del curso con instrucciones al modelo.

**Ajuste humano.** Se fijó que la ruta `PUT /candidates/:id/stage` debe crearse en backend si no existe.

---

### Prompt 5 — Enriquecimiento de las user stories (enrich-us)

```
Enriquece cada user story de user-stories/ (HU-01…HU-06) con el skill enrich-us.
Antes de redactar, lee la épica (00-epic-position-kanban.md) para el alcance, los riesgos de API y la tarea T-3b (/stage), y el enunciado (exercise-brief.md) si hay que contrastar requisitos.
```

**Resultado.** HU-01…HU-06 enriquecidas con write-back (bloque `[enhanced]` bajo cada original). Hallazgos contrastados con el repo: doble anidación en `GET /position/:id/interviewflow`; candidatos como array plano; ruta real `/position/…` vs. enunciado; `PUT /candidates/:id/stage` ausente (crear, T-3b). Decisiones de diseño fijadas en 3 ADRs.

**Por qué funcionó.** Delegar en el skill (que ya obliga a Reality map antes de redactar) + leer la épica primero mantiene el alcance y hace que los criterios citen rutas y campos reales, no los ejemplos del enunciado.

**Ajuste humano.** Decisiones de producto/arquitectura que resolví con tu confirmación: escala de score sobre 5; mapeo por **id** de fase (no por nombre) → ADR; `@dnd-kit/core` como librería DnD → ADR; `/stage` añadida junto a `PUT /:id`; carga conjunta + retry granular; breakpoint `md` + long-press táctil.

---

### Prompt 6 — HU-01 acceso al detalle de posición (opsx:propose + opsx:apply)

```
/opsx:propose user-stories/HU-01-access-position-detail.md
/opsx:apply
```

**Resultado.** Change `access-position-detail` (proposal/spec/design/tasks, ya archivado en `openspec/changes/archive/2026-09-08-access-position-detail`). Implementación: ruta `/positions/:id` en `App.js`, shell `PositionDetail.tsx` (back control + título + región placeholder, sin crash en id desconocido), y cableado de "Ver proceso" en `Positions.tsx` (añadido `id` a `Position`/`mockPositions`, `key={position.id}`). Tests RTL `PositionDetail.test.tsx` + `Positions.test.tsx`; E2E Playwright (detalle id 1 + id desconocido). Sin dependencias nuevas ni cambios de backend.

**Por qué funcionó.** El Reality map de la HU fijó que "Ver proceso" era un botón inerte y que no existe `GET /positions` (lista mock), así que el alcance quedó en routing + shell sin inventar backend, dejando el detalle real para HU-02+.

**Ajuste humano.** Base de la nueva funcionalidad: la lista de posiciones sigue siendo mock con `id`s 1–3 (riesgo #5 de la épica); `/positions/:id` direcciona por ese id mock hasta que una HU posterior cambie la fuente.

---

### Prompt 7 — HU-02 ver proceso en columnas (opsx:propose + opsx:apply)

```
/opsx:propose user-stories/HU-02-view-process-in-columns.md
/opsx:apply
```

**Resultado.** Change `view-process-in-columns` (proposal/spec/design/tasks) e implementación TDD: `positionService.ts` (fetch nativo, desanida la respuesta doble y ordena por `orderIndex`) + extensión del shell HU-1 `PositionDetail.tsx` (título = `positionName`, una columna por fase). 15/15 tests verde, `tsc` limpio, E2E Playwright (happy `/positions/1` + fallo `/positions/999` sin crash).

**Por qué funcionó.** El Reality map de la HU ya fijaba la doble anidación y la ausencia de axios, así que el spec/design partieron de rutas y campos reales; el TDD por capas (servicio → componente) mantuvo cada paso en un turno.

**Ajuste humano.** Decidiste ramificar HU-02 desde `origin/feature/access-position-detail` (el shell HU-1 no estaba en `frontend-CRN`). Para respetar la regla 4, los tests HU-1 quedaron intactos y los de HU-02 se añadieron en `PositionDetail.flow.test.tsx` (el componente captura el rechazo del fetch, así los tests HU-1 siguen verde sin mock).
