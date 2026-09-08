## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/move-candidate-drag-drop` from the base branch
- [x] 0.2 Verify branch creation and current branch status

## 1. Backend: Expose `PUT /candidates/:id/stage` (TDD, additive)

- [x] 1.1 Write the failing route/controller test for `PUT /candidates/:id/stage`: success path returns `200` and updates the candidate's stage for body `{ applicationId, currentInterviewStep }` (maps spec Scenario "New route updates the candidate's stage")
- [x] 1.2 Write the failing test for the invalid-body case: `PUT /candidates/:id/stage` with missing/malformed `applicationId` or `currentInterviewStep` returns `400` and persists nothing (maps spec Scenario "Invalid body is rejected")
- [x] 1.3 Add `router.put('/:id/stage', updateCandidateStageController)` in `backend/src/routes/candidateRoutes.ts` alongside the existing `PUT /:id`; reuse the controller and service unchanged; make 1.1–1.2 green
- [x] 1.4 Add a test asserting the existing `PUT /candidates/:id` still accepts the same body and behaves as before (non-breaking, maps spec Scenario "New route ..." AND-clause)

## 2. Frontend: Add drag-and-drop dependency

- [x] 2.1 Add `@dnd-kit/core@6.3.1` to `frontend/package.json` and install (`npm --prefix frontend install`); confirm the version resolves from the npm registry (per ADR 20260908 — dnd-kit)

## 3. Frontend: Stage-change service (TDD)

- [x] 3.1 Write the failing test for `positionService.updateCandidateStage(candidateId, applicationId, stepId)`: issues native `fetch` `PUT http://localhost:3010/candidates/${candidateId}/stage` with body `{ applicationId, currentInterviewStep: stepId }`, resolves on ok, rejects on non-ok/network failure
- [x] 3.2 Implement `updateCandidateStage` in `frontend/src/services/positionService.ts`; make 3.1 green

## 4. Frontend: Drag-and-drop move on the board (TDD)

- [x] 4.1 Write the failing `PositionDetail.test.tsx` test for the happy path: dragging card `7` (applicationId `3`) from "Applied" (step 10) to "Technical" (step 11) calls the mocked `updateCandidateStage` exactly once with `(7, 3, 11)` and the card ends in "Technical" on `200` (maps spec Scenario "Dropping on another column persists the new stage")
- [x] 4.2 Wire `DndContext` + droppable columns (keyed by step id) + draggable cards into `frontend/src/components/PositionDetail.tsx`; call the service on cross-column drop; make 4.1 green
- [x] 4.3 Write the failing test for the optimistic move: on drop the card appears in "Technical" before the pending response resolves (maps spec Scenario "Card appears in the destination column before the response")
- [x] 4.4 Implement the optimistic state move in `onDragEnd` (move in local state immediately, before awaiting the service); make 4.3 green
- [x] 4.5 Write the failing test for rollback: when `updateCandidateStage` rejects (`400`/`404`/`500`/network), the card returns to "Applied" and an error message is shown (maps spec Scenario "Error response returns the card to its original column")
- [x] 4.6 Implement source-column capture and rollback + error message on failure; make 4.5 green
- [x] 4.7 Write the failing test for the same-column no-op: dropping the card back on "Applied" issues no request and changes nothing (maps spec Scenario "Same-column drop issues no request")
- [x] 4.8 Implement the early-return when destination step id equals source step id; make 4.7 green
- [x] 4.9 Write the failing test for the in-flight lock: while card `7`'s request is pending it cannot be moved again, other cards stay movable (maps spec Scenario "In-flight card cannot be moved again")
- [x] 4.10 Implement the per-card in-flight lock (locked candidate ids → `disabled` draggable, skipped in `onDragEnd`), cleared when the request settles; make 4.9 green
- [x] 4.11 Refactor `PositionDetail.tsx` and the service for clarity with the suite green (no behaviour change, no test edits)

## 5. Backend: Review and Update Existing Tests (MANDATORY)

- [x] 5.1 Identify existing candidate route/controller/service tests affected by the added route
- [x] 5.2 Update them if needed without weakening assertions (do not modify a test just to go green)

## 6. Backend: Run Tests and Verify Data State (MANDATORY)

- [x] 6.1 Capture pre-test baseline for the impacted entities (Prisma is mocked; note the mock expectations)
- [x] 6.2 Run targeted tests: `npm --prefix backend test -- candidate`
- [x] 6.3 Run the broader suite: `npm --prefix backend test`; run types `npx --prefix backend tsc --noEmit`
- [x] 6.4 Verify post-test state and restore if needed
- [x] 6.5 Create the report under `openspec/changes/move-candidate-drag-drop/reports/YYYY-MM-DD-backend-test-and-state-verification.md`
- [x] 6.6 Mark complete only after tests pass and the report exists

## 7. Backend: Manual Interface Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 7.1 Start Postgres (`docker compose up -d`) and the API (`npm --prefix backend run dev`) on http://localhost:3010
- [x] 7.2 Exercise the success path: `PUT /candidates/:id/stage` with a valid body; verify `200` and the persisted stage change
- [x] 7.3 Restore the mutated application row to its original `currentInterviewStep` afterwards
- [x] 7.4 Exercise the error case: invalid body → verify `400`; unknown application → verify `404`
- [x] 7.5 Document every command executed and the response received
- [x] 7.6 Verify the data state matches the pre-test state

## 8. Frontend: Run Tests and Verify Data State (MANDATORY)

- [x] 8.1 Run targeted tests: `npm --prefix frontend test -- PositionDetail positionService`
- [x] 8.2 Run the broader frontend suite: `npm --prefix frontend test`; build check `npm --prefix frontend build`
- [x] 8.3 Create the report under `openspec/changes/move-candidate-drag-drop/reports/YYYY-MM-DD-frontend-test-and-state-verification.md`
- [x] 8.4 Mark complete only after tests pass and the report exists

## 9. Frontend: End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 9.1 Ensure all services run (DB + API + UI on http://localhost:3000)
- [x] 9.2 Drive the workflow with the Playwright MCP: open `/positions/:id`, drag a candidate card to another column, verify it lands there and the stage persists on reload
- [x] 9.3 Test the error scenario: force a failing move and verify the card rolls back and an error message shows
- [x] 9.4 Verify persistence: reloaded board matches the stored stage
- [x] 9.5 Restore the environment: revert any moved candidate to its original stage
- [x] 9.6 Document scenarios and outcomes in a report under `openspec/changes/move-candidate-drag-drop/reports/`; save any screenshots in that same folder

## 10. Update Technical Documentation (MANDATORY)

- [x] 10.1 Update the API specification / backend docs to record the additive `PUT /candidates/:id/stage` route
- [x] 10.2 Update `docs/project-context.md` Gotchas if a new gotcha appeared (e.g. dnd-kit test ergonomics); no new ADR needed (dnd-kit and stage-by-id ADRs already exist; the `/stage` route is trivially reversible)
- [x] 10.3 Update `prompts/prompts-CRN.md` with the curated significant prompts for this change
