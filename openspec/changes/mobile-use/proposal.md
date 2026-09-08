## Why

The position board was built desktop-first: stage columns lay out horizontally and drag-and-drop is
mouse-driven. A recruiter on a phone cannot use it — columns overflow awkwardly and cards cannot be
moved by touch. HU-06 makes the board usable on a phone so a recruiter can review and move candidates
away from the desktop.

## What Changes

- **Responsive column layout** in `PositionDetail.tsx`: horizontal stage columns (with horizontal
  scroll when they exceed the viewport) at the `md` breakpoint and up; stacked full-width columns
  below `md` (768px), via Bootstrap 5 responsive utilities.
- **Touch drag** on the HU-4 `DndContext`: configure a `TouchSensor` (and keep `PointerSensor` for
  mouse) with an activation constraint (long-press `delay ~200ms` + `tolerance`) so a short swipe
  scrolls the page and only a held press starts a drag. On drop the existing HU-4 move fires (the
  stage-update `PUT`), now reachable by touch, not only mouse.
- **Responsive header**: the title and back control stay visible, tappable and non-overlapping on a
  narrow viewport.

## Capabilities

### New Capabilities
- `position-board-mobile`: the position board's mobile/responsive behavior — responsive column layout
  (horizontal+scroll on desktop, stacked full-width on mobile), a usable narrow-viewport header, and
  touch drag with a long-press activation constraint — layered over the HU-2 columns and HU-4
  drag-and-drop.

### Modified Capabilities
<!-- none. Touch drag reuses the HU-4 move behavior already specified in position-candidates
     ("Move a candidate to a new stage by dragging its card"); this change adds the touch input
     dimension and responsive layout without changing that move contract. -->

## Impact

- **Frontend code:** `frontend/src/components/PositionDetail.tsx` — responsive Bootstrap classes on the
  column row/columns and header, and dnd-kit sensor configuration (`PointerSensor` + `TouchSensor`
  with activation constraint) on the existing `DndContext`. `PositionDetail` test additions.
- **No backend, API, or dependency changes.** Reuses `@dnd-kit/core@6.3.1` (its `TouchSensor`, per
  ADR 20260908 — dnd-kit) and the already-installed Bootstrap responsive utilities.
- **Interacts with HU-4:** the touch sensor is added to the same `DndContext`; the drop handler and
  the stage-update `PUT` are unchanged.
- **Testing note:** jsdom has no layout/media-query engine, so unit tests assert the responsive
  classes/props are applied; actual stacking and touch drag are demonstrated with the Playwright MCP
  under an emulated mobile viewport.
- **Privacy/auth/logging:** none — pure presentation/interaction.
- **Depends on:** HU-2 (columns) and HU-4 (DnD).
