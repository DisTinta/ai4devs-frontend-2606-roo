# End-to-End Testing Report

- Date: 2026-09-08
- Change: move-candidate-drag-drop
- Step: 9. Frontend: End-to-End Testing (AGENT EXECUTED, Playwright MCP)

## Environment
- Full stack already running: Postgres (docker compose), API http://localhost:3010, UI http://localhost:3000.
- Position `/positions/1` ("Senior Full-Stack Engineer"), columns: Initial Screening (1), Technical Interview (2), Manager Interview (3).
- E2E baseline captured at start (candidate → stage id):
  - Carlos García (app 4) → 1
  - Jane Smith (app 3) → 1
  - John Doe (app 1) → 2
  - Note: Jane Smith was at stage 1 at E2E start (changed by activity outside this change; not touched here).

## Scenario 1 — Happy path (drag persists)
- Dragged **John Doe** from Technical Interview (2) → Manager Interview (3).
- Result: card moved to Manager Interview; live region announced
  "Draggable item 1 was dropped over droppable area 3".
- Persistence: `GET /position/1/candidates` → John Doe `currentInterviewStepId: 3`. ✔
- Evidence: `./2026-09-08-e2e-after-move.png`

## Scenario 2 — Failure rolls back + error shown
- Forced the stage `PUT` to reject via a `window.fetch` override (network failure), then dragged
  **John Doe** from Manager Interview (3) → Technical Interview (2).
- Result: card returned to Manager Interview (optimistic move rolled back); an alert appeared:
  "No se pudo mover al candidato. Inténtalo de nuevo." ✔
- Persistence: `GET /position/1/candidates` → John Doe still `currentInterviewStepId: 3` (nothing
  persisted on the failed move). ✔
- Evidence: `./2026-09-08-e2e-rollback-error.png`

## Persistence verification
- After the happy-path move, the stored stage matched the board (step 3).
- After the forced-failure move, the stored stage was unchanged (step 3), matching the rolled-back board.

## Environment restore
- Restored John Doe to stage 2 via `PUT /candidates/1/stage {applicationId:1, currentInterviewStep:2}` → 200.
- Final state re-verified = E2E baseline: Carlos 1, Jane 1, John 2. ✔
- Browser closed.

## Outcome
- Status: PASS — real drag-and-drop persists the stage on success and rolls back with an error on
  failure; nothing persists on the failed move. State restored.
