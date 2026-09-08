## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/mobile-use` from `frontend-CRN`
- [x] 0.2 Verify branch creation and current branch status

## 1. Frontend: Responsive column layout (TDD)

- [x] 1.1 Write the failing `PositionDetail` test asserting the columns container carries the responsive classes: stacked below `md` and horizontal with overflow scroll at `md`+ (`flex-column flex-md-row` + `overflow-md-auto`), and each column carries its stacking/min-width class (maps spec Scenarios "Desktop lays columns out horizontally with horizontal overflow scroll" and "Mobile stacks columns full-width" — class-level assertion; real layout is validated in the E2E)
- [x] 1.2 Replace the `Row` with a Bootstrap flex container (`d-flex flex-column flex-md-row` + `overflow-md-auto`) and give each `DroppableColumn` a `md`+ min-width; make 1.1 green (design.md D1)

## 2. Frontend: Responsive header (TDD)

- [x] 2.1 Write the failing test asserting the header lets the title shrink/wrap without overlapping the back control on a narrow viewport (title carries `min-w-0`/`text-break`; back control present) (maps spec Scenario "Title and back control remain usable when narrow")
- [x] 2.2 Apply the header wrap/shrink classes; make 2.1 green (design.md D4)

## 3. Frontend: Touch drag sensors (implementation; touch behaviour validated in E2E)

- [x] 3.1 Configure dnd-kit sensors via `useSensors`: `useSensor(MouseSensor)` (immediate) and `useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })`, and pass `sensors` to the existing `DndContext` (design.md D2, D3) — maps spec Scenarios "Long-press drag on touch moves the card and persists", "Short swipe scrolls instead of dragging" and "Held press starts a drag"; the HU-4 `onDragEnd`/`PUT` path is unchanged
- [x] 3.2 Add/adjust a unit test to confirm the board still renders and mouse drag is unaffected (reuse the HU-4 mock-based dnd test path); note in the test that touch activation is validated in the E2E (jsdom has no touch/gesture engine)

## 4. Frontend: Refactor (suite green)

- [x] 4.1 Refactor `PositionDetail.tsx` for clarity with the suite green (no behaviour change, no test edits)

## 5. Frontend: Review and Update Existing Tests (MANDATORY)

- [x] 5.1 Identify HU-2/HU-3/HU-4/HU-5 `PositionDetail` tests affected by the layout change (column container markup, headings lookup)
- [x] 5.2 Update them only as needed for the new markup, without weakening assertions (do not modify a test just to go green)

## 6. Frontend: Run Tests and Verify Data State (MANDATORY)

- [x] 6.1 Capture pre-test baseline (frontend unit tests mock `positionService`; no DB/network state)
- [x] 6.2 Run targeted tests: `npm --prefix frontend test -- PositionDetail`
- [x] 6.3 Run the broader frontend suite: `npm --prefix frontend test`; build check `CI=true npm --prefix frontend run build`
- [x] 6.4 Verify post-test state (no persistent state to restore)
- [x] 6.5 Create the report under `openspec/changes/mobile-use/reports/YYYY-MM-DD-frontend-test-and-state-verification.md`
- [x] 6.6 Mark complete only after tests pass and the report exists

## 7. Frontend: End-to-End Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 7.1 Ensure all services run (DB + API + UI on http://localhost:3000)
- [x] 7.2 Playwright MCP, desktop viewport (≥ md): open a position, verify columns are horizontal and, when they overflow, the column area scrolls horizontally without breaking the page (maps Scenario A)
- [x] 7.3 Playwright MCP, mobile viewport (< md, e.g. 375px): verify columns stack full-width (maps Scenario B) and the header title + back control stay visible and non-overlapping (maps Scenario C)
- [x] 7.4 Playwright MCP, emulated touch: long-press a card and drag it to another column → it moves and the stage-update `PUT` fires; restore the moved candidate afterwards (maps Scenario D)
- [x] 7.5 Playwright MCP, emulated touch: a short swipe on the board scrolls the page and does not start a drag; a held press starts a drag (maps Scenario E)
- [x] 7.6 Document scenarios and outcomes in a report under `openspec/changes/mobile-use/reports/`; save screenshots in that same folder; restore any moved data and close the browser

## 8. Update Technical Documentation (MANDATORY)

- [x] 8.1 Update `docs/project-context.md` Gotchas if a new gotcha appeared (responsive breakpoint `md`, MouseSensor+TouchSensor long-press config). No backend/API doc change (frontend-only)
- [x] 8.2 No ADR needed (presentation-only, reuses the dnd-kit ADR); record this explicitly if asked
- [x] 8.3 Update `prompts/prompts-CRN.md` with the curated significant prompts for this change
