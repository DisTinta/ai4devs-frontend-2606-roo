## Why

Recruiters can already see each candidate as a card in the column of their current interview stage
(HU-1/2/3), but they cannot change a candidate's stage from the board — that still requires a separate
form. HU-4 lets a recruiter drag a candidate card to another column to update its stage in place,
turning the kanban board from a read-only view into the primary way to advance candidates.

## What Changes

- **Backend (additive, non-breaking):** register `PUT /candidates/:id/stage` in `candidateRoutes.ts`
  **alongside** the existing `PUT /candidates/:id`, both bound to the same `updateCandidateStageController`.
  The controller and `candidateService.updateCandidateStage(candidateId, applicationId, stepId)` are
  reused unchanged. No existing route is removed or altered.
- **Frontend dependency:** add `@dnd-kit/core@6.3.1` (see
  [ADR 20260908 — dnd-kit](../../../docs/adr/20260908-drag-and-drop-library-dnd-kit.md); verified in the
  npm registry). `@dnd-kit/sortable` is **not** added — no intra-column reordering in scope.
- **Frontend service:** add `positionService.updateCandidateStage(candidateId, applicationId, stepId)` —
  native `fetch` `PUT http://localhost:3010/candidates/${candidateId}/stage`, body
  `{ applicationId, currentInterviewStep: stepId }`.
- **Frontend board:** wire drag-and-drop into `PositionDetail.tsx` — columns become droppables keyed by
  step id, cards become draggables. On drop the card moves optimistically to the destination column, the
  service is called, and on failure the move is rolled back with an error message shown. A same-column
  drop is a no-op; a card whose request is in flight is locked against further moves until it settles.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `position-candidates`: adds the recruiter-facing behavior to move a candidate to a new interview
  stage by dragging its card (optimistic move, rollback on failure, same-column no-op, per-card
  in-flight lock), and the additive `PUT /candidates/:id/stage` contract the board calls to persist
  the change.

## Impact

- **Backend code:** `backend/src/routes/candidateRoutes.ts` (one added route line); controller and
  service unchanged. New route/controller test for `PUT /candidates/:id/stage`.
- **Frontend code:** `frontend/src/services/positionService.ts` (new `updateCandidateStage`),
  `frontend/src/components/PositionDetail.tsx` (DnD wiring + optimistic state), and
  `frontend/src/components/PositionDetail.test.tsx` (new scenarios).
- **Dependencies:** `frontend/package.json` gains `@dnd-kit/core@6.3.1`.
- **APIs:** new additive endpoint `PUT /candidates/:id/stage`; body `{ applicationId,
  currentInterviewStep }` where `currentInterviewStep` is the numeric destination step id.
- **Privacy/auth/logging:** no new personal data, auth, or logging surface — reuses the existing
  stage-update logic; the only data sent is ids already held client-side.
- **Depends on:** HU-1/2/3 (board, columns, cards) and the T-2 library decision (dnd-kit).
