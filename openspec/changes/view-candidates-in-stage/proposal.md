## Why

The position kanban (HU-1 shell, HU-2 columns) shows the interview stages as columns but leaves them
empty. A recruiter cannot yet tell where each candidate sits in the process. HU-3 fills each column
with the candidates currently at that stage, so the board answers "who is where" at a glance.

## What Changes

- **Backend (additive, non-breaking):** expose the numeric stage id on the candidates projection by
  adding `currentInterviewStepId: app.currentInterviewStep` in
  `backend/src/application/services/positionService.ts`. The id already exists in the DB
  (`Application.currentInterviewStep` is an `Int` FK to `InterviewStep.id`); this only surfaces it.
  The existing `currentInterviewStep` name string stays. Rationale and naming hazard are recorded in
  [ADR 20260908](../../../docs/adr/20260908-map-candidate-to-stage-by-id.md). Backend tests
  (`positionService.test.ts`, `positionController.test.ts`) are updated to assert the new field.
- **Frontend service:** add `getCandidates(id)` to `frontend/src/services/positionService.ts`, using
  native `fetch` on `GET /position/:id/candidates`. The response is a flat array (no `{ candidates }`
  wrapping, unlike interviewflow), returned as a typed `Candidate[]`.
- **Frontend type:** add a `Candidate` type that retains `id`, `applicationId` and
  `currentInterviewStepId` (needed by HU-4's stage PUT) alongside `fullName`, `currentInterviewStep`
  (name) and `averageScore`.
- **Frontend component:** add `CandidateCard.tsx` rendering `fullName` and `averageScore` as a number
  plus a visual over 5 (max 5), where `0` renders as zero filled — never "N/A" / "sin dato".
- **Frontend placement:** extend `PositionDetail.tsx` to fetch candidates and drop each card into the
  column whose step `id` equals the candidate's `currentInterviewStepId`. Unmatched ids are handled by
  a single documented fallback without crashing.

## Capabilities

### New Capabilities
- `position-candidates`: fetching a position's candidates, rendering each as a card with its average
  score visualized over 5, and placing each card in the interview-stage column that matches its
  numeric stage id — with defensive fallbacks for an unknown stage id and for a failed fetch.

### Modified Capabilities
<!-- None. Backend surfaces an existing DB value additively; no existing spec's requirements change.
     HU-2's position-interview-flow columns are consumed as-is, not altered. -->

## Impact

- **Backend:** `backend/src/application/services/positionService.ts` (one additive field) and its two
  tests. Additive to the `GET /position/:id/candidates` contract; no field removed, existing consumers
  unaffected.
- **Frontend:** `frontend/src/services/positionService.ts` (extended), new
  `frontend/src/components/CandidateCard.tsx`, extended `frontend/src/components/PositionDetail.tsx`;
  new tests `CandidateCard.test.tsx` and extended `PositionDetail.test.tsx`.
- **Dependencies:** none added (native `fetch`, existing react-bootstrap, RTL v13). No auth, no
  personal-data or logging change beyond a discreet `console.warn` on an unmatched stage id.
- **Sequencing:** depends on HU-1 (shell/route) and HU-2 (columns). Enables HU-4 (drag between
  columns, which reuses the retained numeric ids).
