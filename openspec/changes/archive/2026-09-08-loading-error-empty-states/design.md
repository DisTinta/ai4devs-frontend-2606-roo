## Context

See proposal.md — Why. `PositionDetail.tsx` already fires both fetches in one `useEffect` and today
collapses failure into the success shape: a flow error sets `flow = null` (renders the "en
construcción" text) and a candidates error sets `candidates = []` — which is indistinguishable from a
genuine empty list. The board columns are rendered by the HU-4 `DroppableColumn`/`DraggableCard`
components inside a `DndContext`. `react-bootstrap` (`Spinner`, `Alert`, `Button`) is already a
dependency. Frontend tests are RTL + `@testing-library/user-event` v13 under `MemoryRouter`, with
`positionService` mocked.

## Goals / Non-Goals

**Goals:**
- Track each fetch's status independently so `[]` (empty success) and rejection (error) are never
  conflated.
- Present one joint loading indicator, granular error+retry, and an empty state that keeps the columns
  and their drop targets.

**Non-Goals:**
- No backend, dependency, or API change.
- No per-card move error UI (that rollback/alert is HU-4, already shipped).
- No global toast system.

## Decisions

**D1 — Per-fetch status state, not a collapsed value.**
Replace the current `flow: InterviewFlow | null` + `candidates: Candidate[]` model with a status per
fetch: `flowState: { status: 'loading' | 'success' | 'error'; data?: InterviewFlow }` and
`candidatesState: { status: 'loading' | 'success' | 'error'; data: Candidate[] }`. This is what lets
the render distinguish empty-success (`success` + `data.length === 0`) from `error`. Alternatives —
keeping `null`/`[]` sentinels — cannot express the empty-vs-error distinction the spec requires.

**D2 — Joint loading gate.**
The board renders only when `flowState.status === 'success' && candidatesState.status === 'success'`.
While either is `loading`, render a single `Spinner`. This matches the resolved "joint loading"
decision and avoids a partial board flashing in.

**D3 — Granular retry via two independent fetch runners.**
Extract `loadFlow()` and `loadCandidates()` (each sets its own state to `loading` then `success`/
`error`). The initial `useEffect` calls both; each error `Alert`'s "Retry" button calls only its
runner. A flow failure renders a board-level `Alert` (no columns, keeps the HU-1 shell + title). A
candidates failure renders the columns' region replaced by (or carrying) a candidates-area `Alert`.
Re-issuing only the failed request is the resolved "granular retry" decision and avoids redundant
network calls.

**D4 — Empty state keeps columns; placeholder lives inside the droppable.**
On `candidatesState.status === 'success'` with zero candidates for a column, the column renders a
placeholder as a child of the existing `DroppableColumn` (the dnd-kit droppable), so the column stays
a valid HU-4 drop target with zero cards. A board-level "no candidates" message is shown when the
whole result is `[]`. This satisfies both the empty message and the empty-column-drop-target
requirements without a separate non-droppable placeholder.

**D5 — Distinct messages, never blank.**
Empty and error are separate render branches keyed off `status`, so `[]` shows only the empty message
and a rejection shows only the error+retry message. Every state (loading/error/empty/success) renders
visible feedback; no branch falls through to an empty content area.

## Risks / Trade-offs

- **Refactor touches the HU-4 render path** → mitigated by keeping `DndContext`/`DroppableColumn`/
  `DraggableCard` intact; only the surrounding state gating and the empty-column child change. The
  existing HU-3/HU-4 tests must stay green (they assert placement, drag, rollback).
- **Existing HU-2/HU-3 "no crash" tests assume `null`/`[]` fallback** → those tests may need updating
  to the new status model; update without weakening assertions (never edit a test just to go green).
- **Joint loading could mask a fast flow behind a slow candidates fetch** → acceptable and intended
  per the resolved joint-loading decision; the board appears once, fully populated.

## Migration Plan

Pure frontend, presentation-only. No data or deploy steps. Rollback = revert `PositionDetail.tsx` to
the `null`/`[]` model; the board returns to the HU-3/HU-4 no-crash behavior without rich states.
