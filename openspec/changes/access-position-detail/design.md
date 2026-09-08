## Context

See proposal.md — Why. Current state: `frontend/src/App.js` uses `react-router-dom` v6
(`^6.23.1`) with `BrowserRouter/Routes/Route` and routes `/`, `/add-candidate`, `/positions`.
`frontend/src/components/Positions.tsx` renders a mock list (`mockPositions`); `type Position` has
**no `id`**, "Ver proceso" is a plain `<Button>`, and cards use `key={index}`. There is no
`/positions/:id` route and no detail component. No `*.test.*` exist under `frontend/src`, but
`@testing-library/react`, `jest-dom`, and `user-event` are installed. There is no `GET /positions`
list endpoint in the backend, so real position ids are not available from the API.

## Goals / Non-Goals

**Goals:**
- Address the detail view by id at `/positions/:id` using the existing router.
- Keep the id source local (mock list with added ids) so the story is frontend-only and swappable
  later without changing observable behavior.
- Cover the five scenarios with RTL tests rendered under `MemoryRouter`.

**Non-Goals:**
- Any backend change or data fetch (no list endpoint, no `/position/:id/...` calls) — HU-2+.
- Kanban columns, candidate cards, or data loading/empty/error states — HU-2, HU-3, HU-5.
- Reworking positions filters, search, status badges, or "Editar".
- Introducing a global navbar/footer/layout.

## Decisions

- **Route param carries the id.** `PositionDetail` reads `id` with `useParams()` rather than
  relying on router state or props. Rationale: guarantees deep-link/reload access (Scenario B);
  router state would be lost on a fresh load. Alternative (passing the position object via
  navigation state) rejected — breaks direct-URL access.
- **`id: number` added to `type Position` and every `mockPositions` item; card `key` switched to
  `position.id`.** Rationale: stable identity for navigation and React keys. The id source stays
  mock (epic risk #5) because no list endpoint exists; a future HU can swap the source without
  changing the route contract.
- **Navigation via `<Link to={\`/positions/${position.id}\`}>` (or `useNavigate`).** Prefer `<Link>`
  wrapping/behind "Ver proceso" for accessibility and testability. Do not alter card styling beyond
  what navigation needs.
- **Unknown-id handling is local, not a fetch.** `PositionDetail` decides "not found" by checking
  the id against the known mock ids (or simply rendering a neutral message when it cannot resolve a
  known position), always rendering the shell first. Rationale: Scenario E requires no-crash + back
  working; full data/error states are HU-5.
- **Shell layout: header row with back control left of the title, placeholder content region.**
  Follows the functional-component + react-bootstrap style of `Positions.tsx`. Back control is a
  `<Link to="/positions">` rendered as an arrow (e.g. "←").
- **Heading shows the raw route param, even for an unknown id.** For `/positions/does-not-exist`
  the title renders "Posición does-not-exist" above the neutral not-found message, rather than
  masking the id with a placeholder. Rationale: Scenario E only requires the shell to render without
  crashing and the back control to work; echoing the requested id keeps the view honest about what
  was addressed and avoids extra branching. Alternative (blank/"—" title for unknown ids) rejected —
  no scenario requires it and it adds conditional rendering for no user benefit.
- **Known ids derived from `mockPositions`, single source of truth.** `PositionDetail` imports the
  exported `mockPositions` and computes `knownPositionIds = mockPositions.map(p => p.id)` instead of
  a hand-maintained literal. Rationale: a duplicated id list would silently drift when the mock list
  changes (adding id 4 would render "not found" for a real position). One source removes the sync
  hazard until a real list endpoint replaces the mock (HU-2+).
- **Tests render under `MemoryRouter`.** No in-repo test template exists; follow RTL conventions.
  `Positions.test.tsx` asserts navigation target on "Ver proceso"; `PositionDetail.test.tsx` renders
  at `/positions/2`, asserts the id is shown, clicks back, asserts location is `/positions`.

## Unspecified behaviour accepted (`/verify-against-spec` block 3)

Human gate after conformance check. These items are **not** missing requirements and are **not**
added to `specs/position-detail/spec.md`; they stay implementation / temporary shell choices until
later HUs.

1. **Detail imports the mock list for known-id checks.** `PositionDetail` imports `mockPositions`
   from `Positions.tsx` and derives `knownPositionIds`. Coupling detail → list is intentional for
   this frontend-only change (see Decisions above). A later HU replaces the mock with a real list
   source (`GET /positions` / shared module) behind the same route contract; already noted in
   Non-Goals and `docs/project-context.md`.
2. **Known-id content is a temporary placeholder.** For a known id the content region shows
   "Detalle de la posición en construcción." The delta only requires the shell and that the heading
   shows the id; Kanban / real detail content is HU-2+. The placeholder is accepted as temporary
   copy, not a formalised requirement.
3. **Numeric parse before known-id lookup.** Converting the route param with `Number` /
   `Number.isInteger` before `includes` is defensive implementation of Scenario E (unknown /
   non-numeric ids → not-found shell). No extra requirement needed.

## Risks / Trade-offs

- **Mock ids diverge from any future real ids** → Mitigation: the route contract (`/positions/:id`)
  is stable; only the id source changes in a later HU, behind the same navigation.
- **Deep link to an unknown id could crash if code assumes a found position** → Mitigation:
  render the shell unconditionally, resolve the position defensively, show the neutral not-found
  message (Scenario E, covered by a test).
- **Accidental scope creep into card styling/filters** → Mitigation: non-goals are explicit; edits
  in `Positions.tsx` limited to id, key, and navigation wiring.