# End-to-End Verification Report

- Date: 2026-09-08
- Change: view-candidates-in-stage
- Step: 9. End-to-End Testing (MANDATORY - agent executed)

## Environment
- Postgres: `ai4devs-frontend-2606-roo-db-1` up (docker compose).
- Backend API: `http://localhost:3010` responding 200 (dev server hot-reloaded the additive projection field).
- Frontend: `http://localhost:3000` (`BROWSER=none npm --prefix frontend start`).
- Driver: Playwright MCP (Chromium).

## Backend contract check
- `GET http://localhost:3010/position/1/candidates` returns a **flat array** carrying the new field:
  - `John Doe` — `currentInterviewStep: "Technical Interview"`, `currentInterviewStepId: 2`, `averageScore: 5`, `id: 1`, `applicationId: 1`
  - `Jane Smith` — `currentInterviewStepId: 2`, `averageScore: 4`, `id: 2`, `applicationId: 3`
  - `Carlos García` — `currentInterviewStep: "Initial Screening"`, `currentInterviewStepId: 1`, `averageScore: 0`, `id: 3`, `applicationId: 4`
- Existing fields unchanged; `currentInterviewStepId` added; no envelope.

## Scenarios exercised

### Happy path — placement by stage id (`/positions/1`)
- Board title: "Senior Full-Stack Engineer".
- Columns rendered: "Initial Screening" (id 1), "Technical Interview" (id 2), "Manager Interview" (id 3).
- Cards land in the column of their `currentInterviewStepId`:
  - Initial Screening (id 1) → **Carlos García**, score visual `0 de 5`.
  - Technical Interview (id 2) → **John Doe** (`5 de 5`) and **Jane Smith** (`4 de 5`). Two candidates share the same stage **name**; both placed correctly because the join key is the numeric **id** (ADR 20260908).
  - Manager Interview (id 3) → no candidates (empty column, no crash).
- Score of 0 renders as `0 de 5` (zero filled), never "N/A"/"sin dato".
- Console: 0 errors.
- Evidence: `./2026-09-08-happy-path-position-1-cards.png`

### Failure / edge path — fetch failure keeps the board mounted (`/positions/999`)
- Shell stays mounted: back control ("Volver a posiciones", href `/positions`) + title "Posición 999".
- Neutral "Posición no encontrada." message; no columns, no cards, **no crash**.
- Console errors are two `404 Not Found` on `GET /position/999/interviewflow` — expected network failures, not a React crash.
- Evidence: `./2026-09-08-failure-path-position-999-no-crash.png`

## Coverage of spec scenarios
- A (card in the right column by id): covered by the happy path (John/Jane at id 2, Carlos at id 1).
- B (score 0 as zero): covered (Carlos García `0 de 5`).
- C (unknown stage id no crash): covered by unit test `PositionDetail.candidates.test.tsx`; live data had no unmatched id to exercise.
- D (ids retained for HU-4): covered by unit test `positionService.test.ts`.
- E (fetch failure no crash): covered by the `/positions/999` failure path and the unit test.

## Persistence / state
- No mutating operations performed (read-only board). No test data created; nothing to restore.

## Restore environment
- Browser closed. Postgres and backend left running (pre-existing session); frontend dev server started for this run.

## Outcome
- Status: PASS
- Blocking issues: none
