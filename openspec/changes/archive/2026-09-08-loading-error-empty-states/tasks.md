## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/loading-error-empty-states` from `frontend-CRN`
- [x] 0.2 Verify branch creation and current branch status

## 1. Frontend: Per-fetch state model + joint loading (TDD)

- [x] 1.1 Write the failing `PositionDetail.test.tsx` test: while both `getInterviewFlow` and `getCandidates` are pending, a single loading indicator shows and no columns/empty/error appear (maps spec Scenario "Both requests pending shows one loading indicator")
- [x] 1.2 Refactor `PositionDetail.tsx` to per-fetch status (`flowState`/`candidatesState` with `loading|success|error`), extract `loadFlow()`/`loadCandidates()` runners, and render a single `Spinner` while either is loading; board renders only when both are `success`; make 1.1 green (design.md D1, D2)

## 2. Frontend: Error with granular retry (TDD)

- [x] 2.1 Write the failing test: a failed fetch shows an error message with a "Retry" control, not a blank area (maps spec Scenario "Error message offers Retry instead of a blank area")
- [x] 2.2 Implement flow-level error (board-level `Alert`, no columns, keeps shell+title) and candidates-area error `Alert`; make 2.1 green (design.md D3)
- [x] 2.3 Write the failing test: with candidates failed and flow succeeded, activating "Retry" re-issues only the candidates request and, on success, renders the board (maps spec Scenario "Retry re-issues only the failed request")
- [x] 2.4 Wire each "Retry" button to its own runner (`loadFlow`/`loadCandidates`); make 2.3 green

## 3. Frontend: Empty list keeps columns with placeholders (TDD)

- [x] 3.1 Write the failing test: flow steps ["Applied","Technical"] with candidates `[]` shows a "no candidates" message and still renders both columns, each with a placeholder (maps spec Scenario "Empty list renders message plus columns with placeholders")
- [x] 3.2 Implement the empty branch (board-level "no candidates" message + per-column placeholder rendered inside the existing `DroppableColumn`); make 3.1 green (design.md D4)
- [x] 3.3 Write the failing test: an empty column renders a placeholder and remains a valid dnd-kit drop target (droppable mounted with 0 cards) (maps spec Scenario "A card can be dropped onto an empty column")
- [x] 3.4 Ensure the placeholder sits inside the droppable so the empty column stays a drop target; make 3.3 green

## 4. Frontend: Empty is never an error (TDD)

- [x] 4.1 Write the failing test: candidates `[]` shows the empty message and never the error message; candidates rejection shows the error+retry message and never the empty message; content is never blank (maps spec Scenario "Empty success and failure render different feedback")
- [x] 4.2 Keep empty and error as separate render branches keyed on status so they never conflate; make 4.1 green (design.md D5)

## 5. Frontend: Refactor (suite green)

- [x] 5.1 Refactor `PositionDetail.tsx` for clarity with the suite green (no behaviour change, no test edits)

## 6. Frontend: Review and Update Existing Tests (MANDATORY)

- [x] 6.1 Identify HU-2/HU-3/HU-4 tests affected by the new status model (previously asserted the `null`/`[]` fallback or plain columns)
- [x] 6.2 Update them to the new loading/success states without weakening assertions (do not modify a test just to go green)

## 7. Frontend: Run Tests and Verify Data State (MANDATORY)

- [x] 7.1 Capture pre-test baseline (frontend unit tests mock `positionService`; no DB/network state)
- [x] 7.2 Run targeted tests: `npm --prefix frontend test -- PositionDetail`
- [x] 7.3 Run the broader frontend suite: `npm --prefix frontend test`; build check `CI=true npm --prefix frontend run build`
- [x] 7.4 Verify post-test state (no persistent state to restore)
- [x] 7.5 Create the report under `openspec/changes/loading-error-empty-states/reports/YYYY-MM-DD-frontend-test-and-state-verification.md`
- [x] 7.6 Mark complete only after tests pass and the report exists

## 8. Frontend: End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 8.1 Ensure all services run (DB + API + UI on http://localhost:3000)
- [x] 8.2 Drive the workflow with the Playwright MCP: loading indicator on open; a position with candidates renders the board
- [x] 8.3 Force a fetch failure (e.g. `window.fetch` override or `/positions/999`) and verify the error+retry message; retry re-issues only the failed request and recovers
- [x] 8.4 Verify the empty case (a position whose candidates resolve to `[]`) shows the "no candidates" message with columns + placeholders, distinct from the error case
- [x] 8.5 Restore the environment (revert any forced state; close the browser)
- [x] 8.6 Document scenarios and outcomes in a report under `openspec/changes/loading-error-empty-states/reports/`; save any screenshots in that same folder

## 9. Update Technical Documentation (MANDATORY)

- [x] 9.1 Update `docs/project-context.md` Gotchas if a new gotcha appeared (e.g. joint-loading gate, empty-vs-error distinction). No backend/API doc change (frontend-only, no contract change)
- [x] 9.2 No ADR needed (presentation-only, trivially reversible); record this explicitly if asked
- [x] 9.3 Update `prompts/prompts-CRN.md` with the curated significant prompts for this change
