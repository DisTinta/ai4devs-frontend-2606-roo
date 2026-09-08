# HU-3 — Ver los candidatos en su fase actual

**Épica:** Vista Position — Kanban de candidatos  
**Origen:** enunciado S10 (tarjetas con nombre completo y puntuación media en la fase correspondiente)

## Historia

**Como** reclutador  
**quiero** ver cada candidato como tarjeta dentro de la columna de su fase actual  
**para** saber de un vistazo en qué punto del proceso está.

## Criterios de aceptación

- [ ] Se obtienen los candidatos con `GET /positions/:id/candidates` (en el repo real comprobar el montaje actual, p. ej. `GET /position/:id/candidates`).
- [ ] Cada tarjeta muestra el **nombre completo** (`fullName`).
- [ ] Cada tarjeta muestra la **puntuación media** (`averageScore`): número visible y, preferiblemente, representación visual (p. ej. puntos/estrellas sobre 5), como pide el diseño del enunciado.
- [ ] Un `averageScore` de `0` se muestra como cero (p. ej. 0 puntos rellenos), no como “sin dato”.
- [ ] Cada candidato se sitúa en la columna cuya fase corresponde a su `currentInterviewStep` (string con el nombre de la fase).
- [ ] Si un candidato trae una fase que no existe en el flujo cargado, la vista **no rompe** (fallback documentado: p. ej. columna “Sin fase” o omitir con aviso en consola/UI discreto).
- [ ] La respuesta puede incluir `id` y `applicationId` (presentes en el backend real aunque el ejemplo del enunciado no los liste); la UI de esta HU no está obligada a mostrarlos, pero deben conservarse en el modelo de cliente para HU-4.

## Non-goals

- No implementar aún el arrastre entre columnas (HU-4).
- No modificar el contrato del backend.

## Contexto técnico

- Mapeo: `candidate.currentInterviewStep` (nombre) ↔ `interviewSteps[].name` → columna.
- Servicio: `getCandidatesByPositionService` ya proyecta `fullName`, `currentInterviewStep`, `averageScore`, `id`, `applicationId`.

## Estimación

**M** — fetch candidatos + tarjetas + asignación a columnas + score visual.

---

<!-- The section below is an AI-generated enrichment draft. Review against the real system before accepting. -->

# [enhanced] HU-3 — See candidates in their current stage

## Reality map

### Exists
- `backend/src/routes/positionRoutes.ts:6` — `GET /position/:id/candidates` → `getCandidatesByPosition`.
- `backend/src/presentation/controllers/positionController.ts:4` — `res.status(200).json(candidates)` → **flat array, no wrapping** (unlike interviewflow). Error → `500 { message, error }`.
- `backend/src/application/services/positionService.ts:12` — projects each item as `{ fullName, currentInterviewStep: app.interviewStep.name, averageScore, id: candidate.id, applicationId: app.id }`. `currentInterviewStep` is the step **name string**.
- `backend/prisma/schema.prisma:148` — `Interview.score Int?` (nullable, **no range constraint** → "over 5" is a brief assumption, not enforced). `averageScore` = mean, `0` when no interviews.
- `frontend/src/services/positionService.ts` — introduced in HU-2 (`to-create` there); HU-3 extends it.
- `frontend/src/components/PositionDetail.tsx` — HU-1/HU-2 shell + columns (`to-create` there); HU-3 fills columns.
- `frontend/src/services/candidateService.js` — service style, base `http://localhost:3010`.
- `@testing-library/react` + `jest-dom` + `user-event` — test infra. No existing frontend test.

### To create
- **Backend (additive, per [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md)):** add `currentInterviewStepId: app.currentInterviewStep` to the candidates projection in `backend/src/application/services/positionService.ts:23`. The numeric id already exists in the DB (`Application.currentInterviewStep` is an `Int` FK, `schema.prisma:133`); this only exposes it. `currentInterviewStep` (name) stays. Update `positionService.test.ts` / `positionController.test.ts` accordingly.
- `getCandidates(id)` in `frontend/src/services/positionService.ts` — `to-create` (extend HU-2 service). Native `fetch` `GET /position/:id/candidates`; returns typed flat array (no unwrapping needed).
- `Candidate` type `{ fullName: string; currentInterviewStepId: number; currentInterviewStep: string; averageScore: number; id: number; applicationId: number }` — `to-create`. Keep `id`/`applicationId`/`currentInterviewStepId` for HU-4.
- `frontend/src/components/CandidateCard.tsx` — `to-create`. Renders `fullName` + `averageScore` (number + visual dots/stars **over 5**; `0` shown as zero filled, not "no data").
- `PositionDetail.tsx` extension — place each card in the column whose step **`id`** equals `currentInterviewStepId` (per ADR); fallback for unmatched id (extra "Sin fase" column or skip + discreet console warn) without crashing.
- `frontend/src/components/CandidateCard.test.tsx` + `PositionDetail.test.tsx` extension — `to-create`. RTL.

### Ticket examples checked
- `GET /positions/:id/candidates` — NOT FOUND. Real route **FOUND** at `positionRoutes.ts:6` as `GET /position/:id/candidates`.
- `fullName`, `averageScore`, `currentInterviewStep`, `id`, `applicationId` — all **FOUND** in the service projection (`positionService.ts:23-29`). Numeric stage id **NOT** projected today → added by the ADR (data present at `Application.currentInterviewStep` FK).
- Response wrapping — candidates is a **FLAT ARRAY** (no `{ candidates }` wrap), unlike the interviewflow response.

## 1. User story

As a recruiter, I want to see each candidate as a card inside the column of their current stage,
so that I can tell at a glance where in the process each one is.

## 2. Acceptance criteria

### Scenario A — Happy path: cards land in the right column (by id)
Given position `1` with steps [id 10 "Applied", id 11 "Technical"] and a candidate whose `currentInterviewStepId` is 11, `fullName` "Ada Lovelace", `averageScore` 4
When I open `/positions/1` and candidates are fetched
Then a card "Ada Lovelace" renders inside the "Technical" (id 11) column (not "Applied")
And the card shows the score 4 as a number and as a visual over 5 (max 5).

### Scenario B — Score of 0 renders as zero (edge)
Given a candidate with `averageScore` 0
When the card renders
Then it shows 0 (e.g. 0 filled dots of 5), not "sin dato" / "N/A".

### Scenario C — Unknown stage does not break (error/edge)
Given a candidate whose `currentInterviewStepId` (99) is absent from the loaded flow's step ids
When the view renders
Then the view does not crash
And the candidate is handled by the documented fallback (rendered in a "Sin fase" bucket or omitted with a discreet console warning), decided once and consistent.

### Scenario D — id/applicationId/stepId preserved for HU-4 (edge)
Given the fetched candidate carries `id`, `applicationId` and `currentInterviewStepId`
When it is mapped into the client model
Then all three fields are retained on the card's data model (even if not shown in the UI), so HU-4 can issue the stage PUT with numeric ids.

### Scenario E — Fetch failure does not crash (error)
Given `GET /position/:id/candidates` fails or returns 500
When the view renders
Then the columns (HU-2) stay mounted without candidate cards and without crashing.
(Rich loading/error/empty states are HU-5; HU-3 only guarantees no crash.)

## 3. Technical context

Backend (additive change, per [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md)):
- Add `currentInterviewStepId: app.currentInterviewStep` to the candidates projection
  (`positionService.ts:23`). The id already exists in the DB — `Application.currentInterviewStep` is
  an `Int` FK to `InterviewStep.id` (`schema.prisma:133,137`). Additive, non-breaking. Update the
  backend tests (`positionService.test.ts`, `positionController.test.ts`).

Exists (consume):
- Route `GET /position/:id/candidates` (`positionRoutes.ts:6`), flat array response (`positionController.ts:4`).
- Each item today `{ fullName, currentInterviewStep(name string), averageScore, id, applicationId }`
  (`positionService.ts:12`) — plus the new `currentInterviewStepId` above.
- Stage link is by **id** (per ADR): `candidate.currentInterviewStepId` ↔ `interviewSteps[].id`.
  Name matching is only a defensive fallback.

To create (frontend):
- `getCandidates(id)` in `frontend/src/services/positionService.ts` — native `fetch`
  `http://localhost:3010/position/${id}/candidates`; returns `Candidate[]` (no unwrap; flat array).
- `Candidate` type retaining `id` + `applicationId` + `currentInterviewStepId` for HU-4.
- `frontend/src/components/CandidateCard.tsx` — `fullName` + `averageScore` (number + visual over 5,
  max 5; `0` = zero filled). Follows `Positions.tsx` react-bootstrap `Card` style.
- `PositionDetail.tsx` — group candidates by `currentInterviewStepId`, render each group's cards under
  the column with the matching step `id`; apply the documented fallback for unmatched ids.
- Tests: `CandidateCard.test.tsx` (fullName + score 0 + score visual) and `PositionDetail.test.tsx`
  extension (card lands in correct column by id; unknown id does not crash), RTL under `MemoryRouter`,
  service mocked.

## 4. Non-goals
- No drag & drop between columns — HU-4.
- No backend changes **beyond** the single additive `currentInterviewStepId` field sanctioned by
  [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md). No new routes, no removed fields.
- No rich loading/error/empty UI — HU-5 (HU-3 only guarantees "does not crash").
- The card is not required to display `id`/`applicationId`/`currentInterviewStepId` — only to retain them.

## 5. Labels and estimate
- Labels: `area:frontend`, `area:backend`, `type:feature`, `data-fetch`, `ui`.
- Size: **M** — additive backend field + fetch + card component + score visual + stage→column mapping by id with fallback; depends on HU-1 + HU-2.

## INVEST
Independent: partial — depends on HU-1 (shell/route) and HU-2 (columns), and adds one backend field.
Negotiable, Valuable, Estimable (M), Small enough (≤ 1 day), Testable (5 RTL/service scenarios).
Passes; sequence after HU-2.

## Resolved decisions
- **Score scale = over 5 (max 5)**. `Interview.score` is `Int?` in `schema.prisma` with no DB range;
  the "over 5" scale is a product decision. The visual clamps/rounds to 0–5.
- **Stage→column mapping by numeric id**, not by name — see
  [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md). Requires the additive
  `currentInterviewStepId` backend field. Resolves epic open risk #4 (duplicate names).

> ⚠️ These acceptance criteria are a first draft generated by AI. Review them against the real system before accepting them: the model does not know the legacy integration that breaks on Mondays, nor the business rule that only one person remembers.
