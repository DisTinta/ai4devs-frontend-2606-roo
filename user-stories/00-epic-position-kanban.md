# Épica: Vista "Position" — Kanban de candidatos

**Proyecto:** LTI (Learning & Talent Insights) — ATS  
**Fuente:** [`exercise-brief.md`](./exercise-brief.md) — *Creando la interfaz de gestión de aplicaciones de LTI*  
**Alcance:** carpeta `/frontend` para la UI. Excepciones backend acordadas (sin reescribir el dominio):
1. Si falta `PUT /candidates/:id/stage`, **crearla** reutilizando la lógica de stage existente (T-3b).
2. Campo aditivo `currentInterviewStepId` en la proyección de `GET /position/:id/candidates`, per [ADR 20260908 — Map a candidate to its kanban column by interview-step id, not by name](../docs/adr/20260908-map-candidate-to-stage-by-id.md) (no rompe consumidores; solo expone un id ya presente en la DB).

> Como reclutador, quiero gestionar los candidatos de una posición en un tablero kanban  
> para ver de un vistazo en qué fase está cada uno y moverlos entre fases sin salir de la pantalla.

Las historias de esta épica viven en ficheros individuales en esta carpeta (`HU-01` … `HU-06`).

---

## Índice de user stories

| ID | Título | Fichero |
|----|--------|---------|
| HU-1 | Acceder al detalle de una posición | [HU-01-access-position-detail.md](./HU-01-access-position-detail.md) |
| HU-2 | Ver el proceso de contratación en columnas | [HU-02-view-process-in-columns.md](./HU-02-view-process-in-columns.md) |
| HU-3 | Ver los candidatos en su fase actual | [HU-03-view-candidates-in-stage.md](./HU-03-view-candidates-in-stage.md) |
| HU-4 | Mover un candidato de fase arrastrando su tarjeta | [HU-04-move-candidate-drag-drop.md](./HU-04-move-candidate-drag-drop.md) |
| HU-5 | Estados de carga, error y vacío | [HU-05-loading-error-empty-states.md](./HU-05-loading-error-empty-states.md) |
| HU-6 | Uso en móvil | [HU-06-mobile-use.md](./HU-06-mobile-use.md) |

---

## Tareas técnicas (no son historias de usuario)

| ID | Tarea |
|----|-------|
| T-1 | Explorar `/frontend` (routing, componentes, UI, HTTP, estilos) y documentar convenciones. Sin código de feature aún. |
| T-2 | Evaluar librería de drag & drop frente a `package.json`; justificar la elección. |
| T-3 | Capa de servicios frontend para los tres endpoints y tipado. |
| T-3b | Si no existe, añadir en backend `PUT /candidates/:id/stage` reutilizando `updateCandidateStageController` / servicio actual. |
| T-4 | Mantener `prompts/prompts-CRN.md` con prompts significativos curados (entrega del ejercicio). |
| T-5 | Rama `frontend-CRN`, commit descriptivo y push al fork. |

---

## Riesgos y preguntas abiertas (revisados contra el repo)

1. **IDs para el PUT — resuelto en el backend real.** El ejemplo del enunciado omite `id` y `applicationId` en `GET …/candidates`, pero el servicio del repo **sí los devuelve** (`id` del candidato, `applicationId` de la aplicación). Usarlos en HU-4. Si en runtime faltaran, preguntar al humano (no inventar backend).
2. **Rutas del enunciado vs repo.** Enunciado: `GET /positions/:id/…` y `PUT /candidates/:id/stage`. Repo hoy: montaje `app.use('/position', …)` → `GET /position/:id/candidates`, `GET /position/:id/interviewflow`; stage en `PUT /candidates/:id` (sin `/stage`). **Decisión:** la ruta `PUT /candidates/:id/stage` del enunciado **debe existir**; si no está, **crearla** en el backend (reutilizando la lógica actual de actualización de fase) y cablear el frontend contra ella. Los GET pueden seguir el path real del repo o alinearse al enunciado si se acuerda en implementación.
3. **Forma de `interviewFlow`.** El enunciado espera `{ positionName, interviewFlow }`. El controller hace `res.json({ interviewFlow })` sobre un objeto que ya incluye `positionName` → anidación distinta. Leer la respuesta real en T-1/T-3 y adaptar el mapeo en frontend.
4. **Vínculo candidato–fase — resuelto por ADR.** `currentInterviewStep` llega como string (nombre de fase) y mapear por `name` es frágil con nombres duplicados. **Decisión ([ADR 20260908 — Map a candidate to its kanban column by interview-step id, not by name](../docs/adr/20260908-map-candidate-to-stage-by-id.md)):** mapear por **id numérico de fase**. El id ya está en la DB (`Application.currentInterviewStep` es `Int` FK); se expone con un campo aditivo `currentInterviewStepId` en la proyección de candidatos. HU-3 (colocación) y HU-4 (PUT) comparten esa misma clave numérica.
5. **Listado de posiciones.** Hoy `Positions.tsx` usa datos mock y "Ver proceso" no navega. HU-1 incluye enlazar con el `id` de posición (habrá que disponer de ids reales o de mock con id).
