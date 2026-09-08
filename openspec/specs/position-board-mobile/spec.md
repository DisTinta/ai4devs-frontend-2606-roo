## Purpose

Makes the position board usable on a phone: stage columns lay out responsively, the header stays
usable on a narrow viewport, and candidate cards can be moved by touch without breaking page scroll.

## Requirements

### Requirement: Stage columns lay out responsively by viewport width

The board SHALL lay out its stage columns responsively. At the `md` breakpoint (768px) and above, the
columns SHALL be arranged horizontally, and when they exceed the viewport width the column area SHALL
scroll horizontally without breaking the page layout. Below `md`, the columns SHALL stack vertically,
each taking the full width.

#### Scenario: Desktop lays columns out horizontally with horizontal overflow scroll

- **WHEN** the board renders on a viewport of `md` (768px) or wider
- **THEN** the stage columns are laid out horizontally
- **AND** if the columns exceed the viewport width, the column area scrolls horizontally and the page
  layout is not broken

#### Scenario: Mobile stacks columns full-width

- **WHEN** the board renders on a viewport narrower than `md` (768px)
- **THEN** the stage columns stack vertically, each taking the full width

### Requirement: Header stays usable on a narrow viewport

On a viewport narrower than `md`, the position title and the back control SHALL both remain visible,
tappable, and non-overlapping.

#### Scenario: Title and back control remain usable when narrow

- **WHEN** the header renders on a viewport narrower than `md` (768px)
- **THEN** the title and the back control are both visible and tappable
- **AND** they do not overlap

### Requirement: A candidate can be moved by touch drag

On a touch device, the board SHALL allow a candidate card to be moved to another stage column by a
long-press drag. When a card is long-pressed, dragged onto another column, and released, the card
SHALL move to that column and the existing HU-4 stage-update `PUT` SHALL fire. This SHALL work via
touch input, not only mouse.

#### Scenario: Long-press drag on touch moves the card and persists

- **WHEN** HU-4 is active on a touch device and the recruiter long-presses a card, drags it onto
  another column, and releases
- **THEN** the card moves to that column
- **AND** the stage-update `PUT` fires (per HU-4)
- **AND** the move works through touch events, not only mouse events

### Requirement: A short swipe scrolls the page; only a held press starts a drag

The touch drag SHALL use an activation constraint (a long-press delay plus movement tolerance) so that
a short swipe on the board area scrolls the page normally and does not start a drag. Only a press held
past the activation delay/tolerance SHALL start a drag.

#### Scenario: Short swipe scrolls instead of dragging

- **WHEN** the recruiter does a short swipe on the board area on a touch device without holding
- **THEN** the page scrolls normally and no drag is triggered

#### Scenario: Held press starts a drag

- **WHEN** the recruiter presses and holds a card past the activation delay/tolerance
- **THEN** a drag starts
