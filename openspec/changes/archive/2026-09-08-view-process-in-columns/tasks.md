## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/view-process-in-columns` from `origin/feature/access-position-detail` (HU-1 shell base — not yet merged into `frontend-CRN`; HU-2 extends that shell). No ticket id: HU-02 is not a ticket-shaped key
- [x] 0.2 Verify branch creation and current branch status

## 1. Frontend Service: types + `getInterviewFlow` (TDD)

- [x] 1.1 Write failing test `frontend/src/services/positionService.test.ts` covering: unwrap of the double-nested response (title from `data.interviewFlow.positionName`, steps from `data.interviewFlow.interviewFlow.interviewSteps`) and ascending `orderIndex` sort of an out-of-order array (spec scenarios "Response unwrapping", "Unordered array is sorted"). Mock `fetch`
- [x] 1.2 Create `frontend/src/services/positionService.ts` with `InterviewStep` / `InterviewFlowResponse` types and `getInterviewFlow(id: number)` using native `fetch` against `http://localhost:3010/position/${id}/interviewflow`; unwrap nesting; return `{ positionName, steps }` sorted ascending by `orderIndex`. Implement the minimum to pass 1.1
- [x] 1.3 Refactor service for clarity with the test green; keep sort + unwrap in one place

## 2. Frontend Component: title + columns (TDD)

- [x] 2.1 Write failing test `frontend/src/components/PositionDetail.test.tsx`: mock `positionService.getInterviewFlow`, render under `MemoryRouter` at `/positions/1`, assert (a) title shows `positionName`, (b) 3 columns render with headers in ascending order "Applied","Screening","Technical", (c) 5-step flow → 5 columns and 1-step → 1 column, (d) rejected fetch keeps the shell mounted and renders no columns (spec scenarios "Happy path title", "Columns render in order", "Column count follows the data", "Fetch failure keeps the shell mounted")
- [x] 2.2 Extend `frontend/src/components/PositionDetail.tsx` (HU-1 shell): on mount call `getInterviewFlow(id)`; render `positionName` as title; render one react-bootstrap `Col` per step (matching `Positions.tsx`) with `step.name` as header; on fetch rejection catch, keep shell mounted, render no columns. Implement the minimum to pass 2.1
- [x] 2.3 Refactor component with tests green; no behaviour change

## 3. Review and Update Existing Tests (MANDATORY)

- [x] 3.1 Identify tests affected by the change (HU-1 `PositionDetail` tests, any `positionService` tests)
- [x] 3.2 Update them without weakening assertions; never edit a test only to go green (base-standards rule 4) — HU-1 `PositionDetail.test.tsx` left untouched and still green (component catches the fetch rejection, so the null-flow shell path preserves the id heading + not-found message); HU-2 tests added in sibling `PositionDetail.flow.test.tsx`

## 4. Run Tests and Verify Data State (MANDATORY)

- [x] 4.1 Capture pre-test baseline (frontend suite currently passing; no DB — Prisma mocked / frontend has no DB)
- [x] 4.2 Run targeted tests: `npm --prefix frontend test -- positionService PositionDetail`
- [x] 4.3 Run the broader frontend suite: `npm --prefix frontend test` — 15 passed, 4 suites; `tsc --noEmit` clean
- [x] 4.4 Verify post-test state (no source mutations left behind); restore if needed
- [x] 4.5 Create the report under `openspec/changes/view-process-in-columns/reports/` named `2026-09-08-run-tests-test-and-state-verification.md`
- [x] 4.6 Mark complete only after tests pass and the report exists

## 5. End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Ensure all services running: `docker compose up -d` (Postgres), `npm --prefix backend run dev` (:3010), `npm --prefix frontend start` (:3000) — DB seeded via `ts-node --transpile-only prisma/seed.ts` (was empty)
- [x] 5.2 Drive the workflow with Playwright MCP: open `/positions/1`, confirm the position title and one column per interview stage in ascending `orderIndex` order — title "Senior Full-Stack Engineer", 3 columns in order
- [x] 5.3 Test the failure path: point at a non-existent position / stopped backend; confirm the shell stays mounted and no columns render (no crash) — `/positions/999` → 404, shell mounted, no columns, no crash
- [x] 5.4 Verify displayed columns match the backend `GET /position/1/interviewflow` step order — Initial Screening → Technical Interview → Manager Interview
- [x] 5.5 Restore the environment (stop dev servers; leave Postgres per local preference); save screenshots under `openspec/changes/view-process-in-columns/reports/` as `YYYY-MM-DD-<scenario-slug>.png`
- [x] 5.6 Document scenarios and outcomes in the reports folder — `2026-09-08-e2e-interview-flow-columns.md`

## 6. Update Technical Documentation (MANDATORY)

- [x] 6.1 Update `docs/project-context.md` gotchas only if a new one appeared (e.g. the double-nested interview-flow response) — added the double-nesting gotcha
- [x] 6.2 Write an ADR only if a non-trivial, hard-to-reverse decision was taken (native fetch is already covered by `docs/adr/20260908-frontend-http-native-fetch.md` — reference, do not duplicate) — no new hard-to-reverse decision; native fetch already covered, referenced not duplicated
- [x] 6.3 Append a curated entry to `prompts/prompts-CRN.md` for this change — Prompt 6 added
