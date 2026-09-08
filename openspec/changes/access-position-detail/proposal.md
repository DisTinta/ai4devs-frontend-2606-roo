## Why

The positions list renders position cards with a "Ver proceso" button, but the button is inert:
there is no `/positions/:id` route and no detail view to open. Recruiters cannot reach a position's
detail (future kanban) view. This change adds the routing and the shell that unlock the detail epic
(HU-2+), without touching the backend or the data layer.

## What Changes

- Add a `/positions/:id` route to the frontend router in `frontend/src/App.js`.
- Create `frontend/src/components/PositionDetail.tsx`: a shell detail page that reads `:id` via
  `useParams`, renders a header row (back control on the left of the title), and a placeholder
  content region reserved for HU-2/HU-3. On an unknown id it renders the shell plus a neutral
  "position not found" message without crashing.
- Wire "Ver proceso" in `frontend/src/components/Positions.tsx` to navigate to `/positions/${id}`.
  Add `id: number` to `type Position` and to every `mockPositions` item; switch the card
  `key={index}` to `key={position.id}`.
- The back control returns from `/positions/:id` to `/positions`.
- No global navbar/footer/layout is introduced; only the inner content region changes across routes.

## Capabilities

### New Capabilities
- `position-detail`: navigating from the positions list to a position's detail view addressed by
  its id, including deep-link/reload access, a back control returning to the list, and a no-crash
  fallback for unknown ids.

### Modified Capabilities
<!-- None: no existing spec-level behavior changes. -->

## Impact

- **Frontend code**: `frontend/src/App.js` (route), `frontend/src/components/Positions.tsx`
  (id + navigation), new `frontend/src/components/PositionDetail.tsx`, new RTL tests
  `PositionDetail.test.tsx` and `Positions.test.tsx`.
- **Dependencies**: none added. Uses existing `react-router-dom ^6.23.1`, `react-bootstrap`, and
  `@testing-library/*` already in `frontend/package.json`.
- **Backend**: untouched. No `GET /positions` list endpoint exists; the list stays mock with added
  ids (epic risk #5). The `/position/:id/...` endpoints belong to HU-2+.
- **Privacy/auth/logging**: no personal data, auth, or logging impact.