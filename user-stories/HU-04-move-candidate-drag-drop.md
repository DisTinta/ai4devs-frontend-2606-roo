# HU-4 — Move a candidate between stages by dragging its card

## Reality map

### Exists
- `backend/src/routes/candidateRoutes.ts:22` — `PUT /candidates/:id` → `updateCandidateStageController`. **No `/stage`** route today.
- `backend/src/presentation/controllers/candidateController.ts:34` — `updateCandidateStageController`: `:id` = candidate, body `{ applicationId, currentInterviewStep }` (both `parseInt`; `currentInterviewStep` is the numeric **step id**). Returns `200 { message, data }`; `400` on invalid format; `404` "Application not found".
- `backend/src/application/services/candidateService.ts` — `updateCandidateStage(candidateId, applicationId, stepId)` (signature confirmed by `candidateService.test.ts:33` → `(1,1,2)`).
- `frontend/src/services/positionService.ts` — introduced in HU-2 (`to-create`); HU-4 extends it.
- `frontend/src/components/PositionDetail.tsx` — shell + columns + cards (HU-1/2/3 `to-create`); HU-4 adds DnD.
- Client `Candidate` model with `id`, `applicationId`, `currentInterviewStepId` (HU-3 + [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md)) — the PUT keys.
- `interviewSteps[].id` (HU-2) — destination column id.
- `@testing-library/react` + `jest-dom` + `user-event` — test infra. No existing frontend test.

### To create
- **Backend (T-3b, additive):** register `router.put('/:id/stage', updateCandidateStageController)` in `candidateRoutes.ts`, **alongside** the existing `PUT /:id` (decision: add, do not replace → no break to other consumers; reversible in one file, no ADR needed). Reuses the existing controller + service unchanged. `to-create`.
- Backend route/controller test covering `PUT /candidates/:id/stage` — `to-create` (service already covered by `candidateService.test.ts`).
- **DnD dependency:** add **`@dnd-kit/core@6.3.1`** to `frontend/package.json` (decision, T-2 — see [ADR 20260908 — dnd-kit](../docs/adr/20260908-drag-and-drop-library-dnd-kit.md); verified in the npm registry). Built-in pointer/touch/keyboard sensors cover HU-6 and accessibility. `@dnd-kit/sortable` is **not** required (no intra-column reordering in scope). `to-create`.
- `updateCandidateStage(candidateId, applicationId, stepId)` in `frontend/src/services/positionService.ts` — `to-create`. Native `fetch` `PUT http://localhost:3010/candidates/${candidateId}/stage`, body `{ applicationId, currentInterviewStep: stepId }`.
- `PositionDetail.tsx` DnD wiring — `to-create`/extend: `DndContext` + droppable columns + draggable cards; optimistic move on drop, rollback on failure, per-card lock while its request is in flight, no-op when dropped on the same column.
- `PositionDetail.test.tsx` extension — `to-create`. RTL/`user-event`: optimistic move, rollback on 500, same-column no-op, in-flight lock.

### Ticket examples checked
- `PUT /candidates/:id/stage` — **NOT FOUND**. Only `PUT /candidates/:id` (`candidateRoutes.ts:22`). Create it (T-3b).
- body `{ applicationId, currentInterviewStep }` — **FOUND** as the shape the existing controller already reads (`candidateController.ts:37`); `currentInterviewStep` is the numeric step id.
- `id` + `applicationId` from the candidates GET — **FOUND** (HU-3 projection + `currentInterviewStepId` from the ADR).

## 1. User story

As a recruiter, I want to drag a candidate's card to another column,
so that I update their stage in the process without intermediate forms.

## 2. Acceptance criteria

### Scenario A — Happy path: drop moves stage and calls the API
Given candidate id `7` (applicationId `3`) sits in column "Applied" (step id 10), and column "Technical" has step id 11
When I drag the card and drop it on "Technical"
Then `PUT /candidates/7/stage` is called once with body `{ applicationId: 3, currentInterviewStep: 11 }`
And on `200` the card stays in "Technical".

### Scenario B — Optimistic update (edge)
Given a slow/pending backend response
When I drop the card on "Technical"
Then the card appears in "Technical" immediately, before the response arrives (no spinner-gated move).

### Scenario C — Failure rolls back (error)
Given `PUT /candidates/7/stage` returns `400`/`404`/`500` or network-fails
When the response arrives
Then the card returns to its original column ("Applied")
And an error message is shown to the recruiter.

### Scenario D — Same-column drop is a no-op (edge)
Given the card is in "Applied"
When I drop it back on "Applied"
Then no PUT request is issued and nothing changes.

### Scenario E — Locked while in flight (edge)
Given a move request for card `7` is in progress
When I try to drag card `7` again before it resolves
Then that card cannot be moved again until the request settles (other cards remain movable).

## 3. Technical context

Backend (T-3b, additive — reuse, do not rewrite):
- Add `router.put('/:id/stage', updateCandidateStageController)` in `candidateRoutes.ts`, alongside
  `PUT /:id`. The controller (`candidateController.ts:34`) and service
  `updateCandidateStage(candidateId, applicationId, stepId)` are reused unchanged. `:id` = candidate,
  body `{ applicationId, currentInterviewStep(=step id) }`. Add a route/controller test for `/stage`.

Frontend (consume + extend):
- Add `@dnd-kit/core@6.3.1`. Wrap the columns in `DndContext`; columns are droppables keyed by step
  `id`; cards are draggables carrying `{ candidateId: id, applicationId }`.
- `positionService.updateCandidateStage(candidateId, applicationId, stepId)` — native `fetch` PUT to
  `/candidates/${candidateId}/stage`, body `{ applicationId, currentInterviewStep: stepId }`.
- `PositionDetail.tsx` `onDragEnd`: if destination column id === source, do nothing (D). Otherwise
  move the card in local state immediately (B), mark the card locked (E), call the service; on error
  revert to the source column and surface an error message (C); on success clear the lock.
- Tests mock `positionService.updateCandidateStage`; drive drops with `user-event`/dnd-kit test
  helpers under `MemoryRouter`.

## 4. Non-goals
- No editing of notes or other application fields.
- No rewriting the stage business logic — reuse the existing controller/service and expose `/stage`.
- No touch/mobile-specific behaviour here — that is HU-6 (dnd-kit's touch sensor is enabled but its
  UX is validated in HU-6).
- No intra-column reordering (`@dnd-kit/sortable` out of scope).

## 5. Labels and estimate
- Labels: `area:frontend`, `area:backend`, `type:feature`, `dnd`, `data-mutation`.
- Size: **M** — additive backend route (reused logic) + DnD dependency + optimistic move with rollback and per-card lock; depends on T-2 (lib), HU-1/2/3.

## INVEST
Independent: partial — depends on HU-1/2/3 and the T-2 library choice, and adds a backend route +
one dependency. Negotiable, Valuable, Estimable (M), Small enough (≤ 1 day), Testable (5 scenarios).
Passes; sequence after HU-3.

## Resolved decisions
- **DnD library = `@dnd-kit/core@6.3.1`** — see
  [ADR 20260908 — dnd-kit](../docs/adr/20260908-drag-and-drop-library-dnd-kit.md) (verified in npm
  registry). Pointer/touch/keyboard sensors cover HU-6 + a11y; `@dnd-kit/sortable` not needed.
- **`/stage` route added alongside** `PUT /:id` (non-breaking), reusing the existing controller +
  service. No ADR (trivially reversible, single file).
- **Stage key = numeric step id** in the PUT body, consistent with
  [ADR 20260908](../docs/adr/20260908-map-candidate-to-stage-by-id.md).
