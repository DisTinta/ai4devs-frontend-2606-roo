# Use @dnd-kit/core for the Position kanban drag & drop

## Status
Accepted

## Context and problem
HU-4 moves a candidate between kanban columns by dragging its card, and HU-6 requires the same board
to work on touch devices. The frontend (`frontend/package.json`) ships **no drag-and-drop library**
today, so one must be chosen and added before HU-4 can be implemented (epic task T-2: "evaluate a
drag & drop library against `package.json`; justify the choice").

Constraints that shape the choice:
- The stack is React 18 (`react ^18.3.1`) with CRA/`react-scripts 5` and TypeScript.
- HU-6 needs **touch** support; accessibility (keyboard) is desirable on an ATS board.
- The board is column-to-column card movement (kanban), not intra-list reordering.
- Adding a dependency requires justification and verifying the package actually exists in the npm
  registry (base-standards §10 prohibitions).

## Options considered
* **@dnd-kit/core** — modern, actively maintained, first-class pointer/touch/keyboard sensors,
  lightweight, headless (no imposed markup), good TypeScript types.
* **@hello-pangea/dnd** — maintained fork of the archived `react-beautiful-dnd`. Ergonomic kanban API
  and solid touch support, but heavier and more opinionated about DOM structure; less flexible.
* **react-dnd** — mature and flexible, but its default HTML5 backend does not handle touch; touch
  needs a separate backend and more wiring, which works against HU-6.

## Decision
We choose **@dnd-kit/core**, pinned at **6.3.1** (verified present in the npm registry, current
`dist-tags.latest = 6.3.1`), because:
* Built-in pointer, touch and keyboard sensors cover HU-6 and accessibility without an extra backend.
* Actively maintained and lightweight, with good TypeScript support for a TS React 18 codebase.
* Headless model fits the existing react-bootstrap card/column markup without rewriting it.

`@dnd-kit/sortable` is **not** adopted: there is no intra-column reordering requirement; `core`
(`DndContext` + droppable columns + draggable cards) is sufficient.

## Consequences
* One new frontend dependency (`@dnd-kit/core@6.3.1`). It becomes the shared DnD contract for HU-4 and
  HU-6; a later change of library would mean reworking the board and its tests (> 1 day) — hence this
  record.
* HU-4 wires `DndContext` with droppable columns keyed by interview-step id (consistent with
  [ADR 20260908 — map by id](./20260908-map-candidate-to-stage-by-id.md)) and draggable candidate
  cards; HU-6 validates the touch sensor UX.
* If intra-column ordering is ever required, `@dnd-kit/sortable` can be added on top without replacing
  `core`.
