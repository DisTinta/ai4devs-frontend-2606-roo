## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/view-candidates-in-stage` from the integration branch `frontend-CRN` (no ticket id for this S10 story)
- [x] 0.2 Verify branch creation and current branch status

## 1. Backend: Expose the numeric stage id (TDD)

Covers spec scenario "Candidate item includes the numeric stage id".

- [x] 1.1 Write the failing test in `backend/src/application/services/positionService.test.ts` asserting each projected candidate includes `currentInterviewStepId` equal to `Application.currentInterviewStep`, with existing fields unchanged
- [x] 1.2 Add `currentInterviewStepId: app.currentInterviewStep` to the candidates projection in `backend/src/application/services/positionService.ts` (keep `currentInterviewStep` name string); make the test pass
- [x] 1.3 Update `backend/src/presentation/controllers/positionController.test.ts` to assert the flat-array response carries the new field; keep it green
- [x] 1.4 Run `npx --prefix backend tsc --noEmit` and confirm no type errors (ran `cd backend && npx tsc --noEmit -p tsconfig.json`; the `--prefix` form swallows the flag)

## 2. Frontend: Candidate service and type (TDD)

Covers spec scenario "Candidates are fetched and typed for the board".

- [x] 2.1 Write the failing test for `getCandidates(id)` in `frontend/src/services/positionService.test.ts` (mock `fetch`): returns a typed `Candidate[]` from the flat array on success, and throws on `!response.ok`
- [x] 2.2 Add the `Candidate` type `{ fullName, currentInterviewStepId, currentInterviewStep, averageScore, id, applicationId }` and implement `getCandidates(id)` with native `fetch` on `http://localhost:3010/position/${id}/candidates` (no unwrap); make the test pass

## 3. Frontend: CandidateCard component (TDD)

Covers spec scenarios "Card renders name and score as number and visual" and "Score of zero renders as zero, not as missing data".

- [x] 3.1 Write failing `frontend/src/components/CandidateCard.test.tsx`: renders `fullName`, shows `averageScore` 4 as a number and a visual filled to 4 of 5, and renders 0 as zero filled (never "N/A"/"sin dato")
- [x] 3.2 Implement `frontend/src/components/CandidateCard.tsx` (react-bootstrap `Card` style from `Positions.tsx`): name + numeric score + a 0–5 pip visual, clamping/rounding the score into 0–5; make the tests pass

## 4. Frontend: Place cards in the matching column (TDD)

Covers spec scenarios "Card lands in the column of its stage id", "Candidate with an unknown stage id is handled without crashing" and "Failed candidate fetch renders columns without cards".

- [x] 4.1 Write failing extensions in `frontend/src/components/PositionDetail.test.tsx` (service mocked, `MemoryRouter`): card lands in the column whose step id matches `currentInterviewStepId`; an unknown id (99) does not crash and follows the documented fallback (omit + `console.warn`); a failed `getCandidates` leaves columns mounted with no cards and no crash (added as `PositionDetail.candidates.test.tsx`, mirroring the HU-2 `.flow.test.tsx` split)
- [x] 4.2 Extend `PositionDetail.tsx` to fetch candidates independently, group them by `currentInterviewStepId`, render each group's `CandidateCard`s inside the matching step `Col`, apply the omit + `console.warn` fallback for unmatched ids, and keep the columns mounted on fetch failure; make the tests pass

## 5. Frontend: Retain ids for HU-4 (verification)

Covers spec requirement "Fetch a position's candidates" (ids retained).

- [x] 5.1 Confirm (via the service/type test) that `id`, `applicationId` and `currentInterviewStepId` are retained on the client `Candidate` model even though the card does not display them (asserted in `positionService.test.ts` getCandidates test)

## 6. Refactor (with the suite green)

- [x] 6.1 Refactor service/card/placement for clarity without changing behaviour; keep all tests green (grouping extracted to a pure `groupByStageId` helper; no further change needed)

## 7. Review and Update Existing Tests (MANDATORY)

- [x] 7.1 Identify tests affected by the backend field and the `PositionDetail` extension (backend `positionService.test.ts`/`positionController.test.ts`; frontend `PositionDetail.flow.test.tsx`)
- [x] 7.2 Update them without weakening assertions (do not modify a test only to make the suite pass) — backend tests gained the new field assertion; the flow test only stubs the newly-added `getCandidates` dependency (no assertion weakened)

## 8. Run Tests and Verify Data State (MANDATORY)

- [x] 8.1 Capture pre-test baseline (frontend and backend suite status)
- [x] 8.2 Run targeted tests: `npm --prefix backend test -- positionService positionController` and `npm --prefix frontend test -- CandidateCard PositionDetail positionService`
- [x] 8.3 Run the broader suites: `npm --prefix backend test` and `npm --prefix frontend test`
- [x] 8.4 Verify post-test state (no unintended mutation; unit tests mock Prisma so no DB change expected)
- [x] 8.5 Create the report under `openspec/changes/view-candidates-in-stage/reports/` named `YYYY-MM-DD-run-tests-test-and-state-verification.md`
- [x] 8.6 Mark complete only after tests pass and the report exists

## 9. End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 9.1 Ensure all services run: `docker compose up -d` (Postgres), `npm --prefix backend run dev` (:3010), `npm --prefix frontend start` (:3000)
- [x] 9.2 Drive `/positions/1` with the Playwright MCP: candidates appear as cards in the correct stage columns, scores render over 5, a 0 shows zero filled
- [x] 9.3 Exercise the edge paths: an unmatched stage id does not crash the board; a candidates fetch failure leaves columns mounted without cards (unknown-id via unit test — no unmatched id in live data; fetch-failure via `/positions/999`)
- [x] 9.4 Verify displayed placement matches the candidate's `currentInterviewStepId` (John/Jane id 2, Carlos id 1; duplicate stage name resolved by id)
- [x] 9.5 Save screenshots under `openspec/changes/view-candidates-in-stage/reports/` (e.g. `YYYY-MM-DD-happy-path-position-1-cards.png`) and close the browser
- [x] 9.6 Document scenarios and outcomes in a report under the same `reports/` folder (`2026-09-08-e2e-candidates-in-stage.md`)

## 10. Update Technical Documentation (MANDATORY)

- [x] 10.1 Update `backend/api-spec.yaml` for the additive `currentInterviewStepId` field on the candidates response (added it plus the returned `id`/`applicationId`, previously undocumented)
- [x] 10.2 The ADR already exists (`docs/adr/20260908-map-candidate-to-stage-by-id.md`); confirm it still reflects the implementation, no new ADR needed (concrete field name matches; no new ADR)
- [x] 10.3 Update `docs/project-context.md` gotchas only if a new one appeared (added the candidates flat-array + `currentInterviewStepId` gotcha)
- [x] 10.4 Add a significant curated prompt entry to `prompts/prompts-CRN.md` per the course-log rule (Prompt 8)
