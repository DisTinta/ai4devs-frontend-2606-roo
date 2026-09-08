## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/access-position-detail` from the main branch (no ticket id in scope)
- [x] 0.2 Verify branch creation and current branch status
- [x] 0.3 Wire the missing frontend jest runner (`jest.config.js` script referenced by `package.json` but absent): add `jest.config.js` (jsdom, babel-jest + babel-preset-react-app, CSS→identity-obj-proxy, image→fileMock) and `src/setupTests.ts` (jest-dom). Prerequisite for all test tasks; deps already installed. Approved as added scope (out of HU-1 spec, tooling only)

## 1. Frontend: Position id and navigation (TDD)

- [x] 1.1 Write failing RTL test `frontend/src/components/Positions.test.tsx`: render `Positions` under `MemoryRouter`, click "Ver proceso" on a known card, assert navigation target is `/positions/<that id>` (maps Scenario: Click "Ver proceso" navigates to the detail route)
- [x] 1.2 Add `id: number` to `type Position` and to every `mockPositions` item in `frontend/src/components/Positions.tsx`; switch card `key={index}` to `key={position.id}`
- [x] 1.3 Wire "Ver proceso" to navigate to `/positions/${position.id}` using `<Link>` (styled as button) from react-router-dom; make test 1.1 pass. Do not touch filters, "Editar", or card styling beyond navigation (non-goal)

## 2. Frontend: PositionDetail shell + routing (TDD)

- [x] 2.1 Write failing RTL test `frontend/src/components/PositionDetail.test.tsx`: render at `/positions/2` under `MemoryRouter`, assert the id `2` is shown in a heading (maps Scenario: Open a detail URL directly / deep-link)
- [x] 2.2 Create `frontend/src/components/PositionDetail.tsx`: functional react-bootstrap component reading `id` via `useParams`; header row with back control (`<Link to="/positions">` arrow) left of the title; placeholder content region. Make test 2.1 pass
- [x] 2.3 Add `<Route path="/positions/:id" element={<PositionDetail />} />` inside the existing `<Routes>` in `frontend/src/App.js`; keep `BrowserRouter`
- [x] 2.4 Add failing RTL test for the back control: on `/positions/3`, activate back control, assert location is `/positions` (maps Scenario: Activate the back control); make it pass
- [x] 2.5 Add failing RTL test for unknown id: render at `/positions/does-not-exist`, assert shell renders without crashing, a neutral "position not found" message shows, back control still targets `/positions` (maps Scenario: Open a detail URL for an unknown id); implement defensive resolution to make it pass
- [x] 2.6 Add RTL assertion that moving between `/positions` and `/positions/:id` changes only inner content, no global chrome added/removed (maps Scenario: No global chrome change between routes)

## 3. Frontend: Refactor (REFACTOR)

- [x] 3.1 With the suite green, reviewed `PositionDetail.tsx` / `Positions.tsx`: already match sibling functional + react-bootstrap `Container` style; naming clear. No behaviour change, tests untouched

## 4. Frontend: Review and Update Existing Tests (MANDATORY)

- [x] 4.1 Confirmed: no prior `*.test.*` existed under `frontend/src`. Full suite = only the two new files (2 suites, 5 tests)
- [x] 4.2 N/A — no pre-existing tests to update

## 5. Frontend: Run Tests and Verify Data State (MANDATORY)

- [x] 5.1 Baseline captured: no prior test files; frontend-only change mutates no persistent data
- [x] 5.2 Targeted tests run (`npm --prefix frontend test -- Positions` and `-- PositionDetail`): 5/5 pass
- [x] 5.3 Broader suite run (`npm --prefix frontend test`): 2 suites, 5 tests pass, ~6.5s
- [x] 5.4 Post-test state verified: no unintended file/data mutation
- [x] 5.5 Report created at `openspec/changes/access-position-detail/reports/2026-09-08-run-tests-test-and-state-verification.md`
- [x] 5.6 Complete — tests pass and report exists

## 6. Frontend: End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 6.1 UI verified running on http://localhost:3000 (HTTP 200 on `/positions`; server already up, live app reflects branch changes)
- [x] 6.2 Playwright: `/positions` → click "Ver proceso" (id 1) → URL `/positions/1`, heading "Posición 1"; back control → `/positions`. PASS
- [x] 6.3 Deep link `/positions/2` → renders, no redirect; `/positions/does-not-exist` → shell + "Posición no encontrada", back works. PASS
- [x] 6.4 No global `banner`/`navigation`/`contentinfo` landmark across either route. PASS
- [x] 6.5 Screenshots saved under `reports/` (`2026-09-08-detail-id-1.png`, `2026-09-08-detail-unknown-id.png`); browser closed
- [x] 6.6 Report `openspec/changes/access-position-detail/reports/2026-09-08-e2e-position-detail.md`

## 7. Update Technical Documentation (MANDATORY)

- [x] 7.1 No standalone frontend route-inventory doc exists; routes are declared in `App.js` (now includes `/positions/:id`). Nothing else to update
- [x] 7.2 Updated `docs/project-context.md`: frontend jest runner note (config added, user-event v13) and mock-id gotcha for `/positions/:id`
- [x] 7.3 No ADR — reversible single-module routing decision, no hard-to-reverse choice