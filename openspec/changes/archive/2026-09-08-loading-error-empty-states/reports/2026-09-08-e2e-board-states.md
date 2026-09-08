# End-to-End Testing Report

- Date: 2026-09-08
- Change: loading-error-empty-states
- Step: 8. Frontend: End-to-End Testing (AGENT EXECUTED, Playwright MCP)

## Environment
- Full stack running: Postgres (docker compose), API http://localhost:3010, UI http://localhost:3000.
- No backend state was mutated. The error/empty cases were forced with client-side `window.fetch`
  overrides that were reverted before finishing; no DB writes occurred.

## Scenario B — Flow failure shows a board-level error + Retry (real data)
- Opened `/positions/3`. Its `GET /position/3/interviewflow` returns `404` (Position not found).
- Result: board-level `Alert` "No se pudo cargar el proceso de la posición." with a "Reintentar"
  button; the HU-1 shell (title + back) stayed mounted; no columns. ✔
- Evidence: `./2026-09-08-e2e-flow-error-retry.png`

## Scenario C/E — Empty list keeps the columns with placeholders
- On `/positions/1`, overrode `fetch` so the candidates request resolves to `[]`, then re-entered the
  detail via the list (SPA navigation).
- Result: board message "No hay candidatos en esta posición." plus all three columns (Initial
  Screening / Technical Interview / Manager Interview), each showing the placeholder "Sin candidatos
  en esta fase." No error alert shown. ✔
- Evidence: `./2026-09-08-e2e-empty-state.png`

## Scenario B/E — Candidates failure shows error + Retry, distinct from empty
- Overrode `fetch` so the candidates request rejects, then re-entered the detail.
- Result: `Alert` "No se pudieron cargar los candidatos." with a "Reintentar" button; the flow columns
  still rendered; the empty message was NOT shown (error and empty stay distinct). ✔
- Evidence: `./2026-09-08-e2e-candidates-error-retry.png`

## Scenario B — Granular retry recovers, re-issuing only the failed request
- Restored `fetch`, clicked "Reintentar".
- Result: the candidates request was re-issued (the flow was not re-fetched — the title/columns never
  reloaded); the error cleared and the board rendered the real candidates (Carlos García, John Doe,
  Jane Smith) in their columns. ✔
- Evidence: `./2026-09-08-e2e-retry-recovered.png`

## Environment restore
- `window.fetch` override reverted in-page; browser closed. No backend/data changes to undo.

## Notes
- The transient joint-loading spinner (Scenario A) is covered by the unit suite
  (`PositionDetail.states.test.tsx`); locally it resolves too fast to capture reliably in the browser.

## Outcome
- Status: PASS — loading (unit), flow error+retry, empty-with-placeholders, candidates error+retry
  (distinct from empty), and granular-retry recovery all verified.
