## Context

See proposal.md — Why. `PositionDetail.tsx` renders the stage columns inside a react-bootstrap `Row`
of `DroppableColumn`s wrapped in a HU-4 `<DndContext onDragEnd={...}>` that today uses dnd-kit's
default sensors (no explicit configuration). The header is a `d-flex align-items-center` row with the
back `Link` and the `h2` title. Bootstrap 5 (`^5.3.3`) responsive utilities are already available and
`Positions.tsx` already uses the `md` breakpoint. `@dnd-kit/core@6.3.1` ships `MouseSensor`,
`PointerSensor` and `TouchSensor` (ADR 20260908). jsdom has no layout or media-query engine.

## Goals / Non-Goals

**Goals:**
- Columns horizontal (with horizontal scroll) at `md`+ and stacked full-width below `md`.
- Touch drag that coexists with page scroll: short swipe scrolls, held press drags; mouse still drags
  immediately.
- Header usable (visible, tappable, non-overlapping) on a narrow viewport.

**Non-Goals:**
- No backend, dependency, or new-library change.
- No change to the HU-4 drop handler or the stage-update contract.
- No redesign of the positions list or global menu; no PWA/native.

## Decisions

**D1 — Responsive layout with Bootstrap flex utilities, not the plain `Row`.**
Replace the `Row` with a flex container `d-flex flex-column flex-md-row` plus `overflow-x-auto`, and
give each column a fixed-ish min width at `md`+ (e.g. `style={{ minWidth: "16rem" }}`) so the row
scrolls horizontally when columns exceed the viewport. (Note: Bootstrap's default build does not emit
a responsive `overflow-md-auto`; the axis utility `overflow-x-auto` is used instead — it scrolls
horizontally at `md`+ and is a no-op when the stacked mobile content fits.) Below `md` the `flex-column` stacks them
full-width. This uses only Bootstrap utilities and matches the `md` convention in `Positions.tsx`.
Alternative — keeping `Row`/`Col md` wrapping — was rejected: wrapping to new rows is not the
"horizontal scroll" the spec requires at `md`+.

**D2 — `MouseSensor` + `TouchSensor`, not a single `PointerSensor`.**
To get immediate mouse drag AND long-press touch drag, configure two sensors via `useSensors`:
`useSensor(MouseSensor)` (no constraint) and `useSensor(TouchSensor, { activationConstraint: { delay:
200, tolerance: 5 } })`. A single `PointerSensor` applies one activation constraint to every input, so
a delay added for touch would also delay the mouse. The story says "PointerSensor for mouse"; this
design keeps mouse immediate by using `MouseSensor` for mouse and `TouchSensor` for touch, which is
dnd-kit's recommended split when touch and mouse need different activation — same observable behavior
the spec asks for. Pass `sensors` to the existing `DndContext`.

**D3 — Touch activation constraint = long-press delay + tolerance.**
`delay: 200ms` + `tolerance: 5px` so a short swipe (movement before the delay elapses) is not a drag
and the page scrolls, while a held press starts the drag (resolved decision in the story). The `PUT`
and rollback path are untouched (HU-4).

**D4 — Header wraps/shrinks instead of overlapping.**
Keep the `d-flex align-items-center` header but let the title shrink/wrap (`min-w-0` + `text-break`
on the title, back control kept at fixed size) so on a narrow viewport both stay visible and do not
overlap.

**D5 — Test what jsdom can, demonstrate the rest with Playwright.**
Unit tests (RTL) assert the responsive classes/props are applied (container has `flex-column
flex-md-row`, columns carry the stacking/min-width, header carries the wrap classes) and that the
board still renders inside the `DndContext`. Actual stacking at a breakpoint and real touch drag are
demonstrated with the Playwright MCP under an emulated mobile viewport, since jsdom cannot evaluate
media queries or run dnd-kit's touch sensor. This limitation is recorded in tasks.

## Risks / Trade-offs

- **200ms long-press adds latency to touch drag start** → accepted trade-off; it is what preserves
  vertical page scroll (the resolved decision). Tunable via the constraint if it feels off in the
  Playwright demo.
- **Existing HU-4 dnd unit test mocks `@dnd-kit/core`** → adding a `sensors` prop to `DndContext` is
  ignored by that mock (it only reads `onDragEnd`), so the mock-based tests stay green.
- **Responsive behavior is class-based, not asserted by real layout in unit tests** → mitigated by the
  Playwright demo (D5); unit tests guard the classes so a regression in the markup is still caught.

## Migration Plan

Pure frontend, presentation/interaction only. No data or deploy steps. Rollback = revert
`PositionDetail.tsx` layout classes and remove the `sensors` prop; the board returns to the
desktop-only HU-4 behavior.
