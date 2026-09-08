## Context

See proposal.md — Why. The board already renders candidate cards inside stage columns (HU-1/2/3),
placing each card by its numeric `currentInterviewStepId`. The stage-update logic already exists on
the backend: `updateCandidateStageController` (`backend/src/presentation/controllers/candidateController.ts:34`)
reads `{ applicationId, currentInterviewStep }` and delegates to
`candidateService.updateCandidateStage(candidateId, applicationId, stepId)`. It is currently reachable
only via `PUT /candidates/:id` (`backend/src/routes/candidateRoutes.ts:22`). Frontend services use the
native `fetch` API and hard-code `http://localhost:3010` (see docs/project-context.md — Gotchas and
[ADR 20260908 — native fetch](../../../docs/adr/20260908-frontend-http-native-fetch.md)). Frontend
tests are RTL + `@testing-library/user-event` **v13** (no `userEvent.setup()`), rendered under
`MemoryRouter`.

## Goals / Non-Goals

**Goals:**
- Reuse the existing stage-update controller and service unchanged; only expose a second, semantically
  clearer route.
- Keep the drag-and-drop move responsive (optimistic) while remaining correct on failure (rollback).
- Guarantee exactly-once persistence per successful drop and no persistence on same-column drops.

**Non-Goals:**
- No intra-column reordering (so `@dnd-kit/sortable` is not added).
- No touch/mobile UX validation (HU-6 owns that, though dnd-kit's touch sensor stays enabled).
- No change to how cards are placed or scored (HU-3 owns that).

## Decisions

**D1 — Add `PUT /candidates/:id/stage` alongside `PUT /candidates/:id`, do not replace.**
Register a second route line bound to the same `updateCandidateStageController`. A dedicated `/stage`
verb reads clearly from the frontend and leaves room for `PUT /candidates/:id` to mean something else
later, without breaking today's consumer. Alternative — replacing `PUT /candidates/:id` — was rejected:
it breaks any current caller for no benefit. Trivially reversible (one line, one file), so no ADR is
needed per docs/base-standards.md.

**D2 — DnD library `@dnd-kit/core@6.3.1`, no `@dnd-kit/sortable`.**
Decided in [ADR 20260908 — dnd-kit](../../../docs/adr/20260908-drag-and-drop-library-dnd-kit.md);
version verified in the npm registry. Its built-in pointer/keyboard/touch sensors cover accessibility
and the HU-6 touch story without extra packages. `sortable` is unnecessary because there is no
intra-column ordering in scope. Alternatives (`react-beautiful-dnd`, HTML5 DnD by hand) were weighed
in the ADR.

**D3 — Optimistic move held in component state, keyed source column for rollback.**
`PositionDetail.tsx` owns the candidate→column mapping in state. `onDragEnd`: if destination step id
equals the source step id, return early (no-op, no request). Otherwise capture the source column,
move the card in state immediately, then call `positionService.updateCandidateStage`. On rejection or
error status, restore the card to the captured source column and set an error message. On success,
clear the in-flight lock. Keeping rollback state in the handler (capture-then-restore) avoids a
separate history stack.

**D4 — Per-card in-flight lock via a set of locked candidate ids.**
Track locked candidate ids in state; a card whose id is locked is rendered non-draggable (dnd-kit
`disabled`) and its id is skipped in `onDragEnd`. The lock is added on drop and removed when the
request settles. This isolates one slow request to its own card while others stay movable.

**D5 — Service mirrors the existing fetch style.**
`positionService.updateCandidateStage(candidateId, applicationId, stepId)` does a native `fetch`
`PUT http://localhost:3010/candidates/${candidateId}/stage` with JSON body
`{ applicationId, currentInterviewStep: stepId }`, resolving on ok and rejecting on non-ok/network
failure so the component's rollback path is driven uniformly.

## Risks / Trade-offs

- **Optimistic move shows a state the server may reject** → mitigated by capturing the source column
  and rolling back on any non-ok/error, plus a visible error message (Scenario C).
- **Double-drop / racing requests on one card** → mitigated by the per-card in-flight lock (D4,
  Scenario E); the lock is keyed by candidate id so it cannot leak to other cards.
- **dnd-kit test ergonomics** → drag/drop is exercised in RTL by driving dnd-kit sensors
  (pointer/keyboard) rather than raw mouse events; `positionService.updateCandidateStage` is mocked so
  the tests assert the call shape and the optimistic/rollback state transitions without a live backend.
- **New dependency** → single, well-scoped package pinned at `6.3.1`, justified in the ADR and the PR
  per docs/base-standards.md prohibitions.

## Migration Plan

Additive only. Deploy needs no data migration. Backend rollback = remove the one added route line;
`PUT /candidates/:id` is untouched. Frontend rollback = revert the DnD wiring and drop the dependency;
the board falls back to its read-only HU-3 behavior.
