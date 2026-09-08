# HU-1 — Access a position's detail view

## Reality map

### Exists
- `frontend/src/App.js` — router with `BrowserRouter/Routes/Route`; routes `/`, `/add-candidate`, `/positions`. No `/positions/:id`.
- `frontend/src/components/Positions.tsx` — mock list (`mockPositions`), `type Position` has **no `id`**. "Ver proceso" is a plain `<Button>` with no `Link`/`navigate`. Card uses `key={index}`.
- `frontend/src/components/RecruiterDashboard.js`, `AddCandidateForm.js`, `FileUploader.js` — sibling components; style reference.
- `frontend/src/services/candidateService.js` — axios service, base `http://localhost:3010`. Not needed in HU-1.
- `react-router-dom` `^6.23.1` in `frontend/package.json` (v6 API: `useNavigate`, `useParams`, `<Link>`, `<MemoryRouter>`).
- `@testing-library/react` `^13.4.0`, `@testing-library/jest-dom` `^5.17.0`, `@testing-library/user-event` `^13.5.0`. **No existing `*.test.*` under `frontend/src`** → no in-repo test template; follow RTL conventions.
- Backend `GET /position/:id/candidates`, `GET /position/:id/interviewflow` (`backend/src/routes/positionRoutes.ts`) — consumed by later HUs, **not** HU-1.

### To create
- `frontend/src/components/PositionDetail.tsx` — `to-create`. Detail page shell: back control left of a title; reads `:id` via `useParams`. Follows the functional-component + react-bootstrap style of `Positions.tsx`.
- Route entry `<Route path="/positions/:id" element={<PositionDetail />} />` in `frontend/src/App.js` — edit of an **Exists** file.
- `id` on `type Position` + on each `mockPositions` item, and `Link`/`useNavigate` wiring on "Ver proceso" in `Positions.tsx`; card `key` switched to `position.id` — edit of an **Exists** file.
- `frontend/src/components/PositionDetail.test.tsx` — `to-create`. RTL test.
- `frontend/src/components/Positions.test.tsx` — `to-create`. RTL test.

### Ticket examples checked
- `frontend/src/components/Positions.tsx` — FOUND.
- `frontend/src/App.js` — FOUND.
- Route `/positions/:id` — NOT FOUND → **To create**.
- API source of real position ids (`GET /positions` list) — NOT FOUND (backend exposes no list endpoint; only `/position/:id/...`). Decision: keep the **mock list, add an `id` per item** (epic risk #5). Backend is a non-goal.

## 1. User story

As a recruiter, I want to click "Ver proceso" on a position card in the positions list,
so that I open that position's detail (kanban) view addressed by its id.

## 2. Acceptance criteria

### Scenario A — Happy path: navigate from the list
Given the positions list at `/positions` rendering the mock positions, each with a stable `id`
When I click "Ver proceso" on the card whose id is `1`
Then the app navigates to `/positions/1`
And the detail view renders showing that id (e.g. a heading containing "1").

### Scenario B — Deep link / reload
Given I open `/positions/2` directly by URL (fresh load, no prior list render)
When the app boots
Then the detail view for id `2` renders from the route param
And no redirect to `/positions` or `/` occurs.

### Scenario C — Back control returns to the list
Given I am on `/positions/3`
When I activate the back control placed to the left of the title
Then the app navigates to `/positions`
And the positions list is shown again.

### Scenario D — Global structure preserved (edge)
Given the current app has no global navbar/footer chrome
When I move between `/positions` and `/positions/:id`
Then no global chrome is added or removed by this story
And only the inner content region changes.
(If a global layout is introduced later, the detail view must live inside it, not replace it.)

### Scenario E — Unknown/invalid id (error)
Given I open `/positions/does-not-exist` (id absent from the mock list)
When the detail view renders
Then it still renders the shell (title + back control) without crashing
And it shows a neutral "position not found" message in the content region
And the back control still returns to `/positions`.
(Full data/empty/error states are HU-5; HU-1 only guarantees no crash + back works.)

## 3. Technical context

Exists (extend):
- `frontend/src/App.js` — add `<Route path="/positions/:id" element={<PositionDetail />} />` inside the existing `<Routes>`. Keep `BrowserRouter` (react-router-dom v6, already `^6.23.1`).
- `frontend/src/components/Positions.tsx` — add `id: number` to `type Position` and to every `mockPositions` item; change the card `key={index}` to `key={position.id}`; make "Ver proceso" navigate to `/positions/${position.id}` using `<Link>` (or `useNavigate`) from react-router-dom. Do not touch filters, "Editar", or card styling beyond what navigation needs (non-goal).
- Test infra: `@testing-library/react` + `jest-dom` + `user-event` are present. No existing frontend test to copy; render components under `MemoryRouter` and assert on route param / navigation.

To create (new, follow existing component style):
- `frontend/src/components/PositionDetail.tsx` — functional component using react-bootstrap like `Positions.tsx`. Reads `id` with `useParams()`. Renders a header row: back control on the left (a `<Link to="/positions">` styled as an arrow, e.g. "←") followed by the title. Content region is a placeholder for HU-2/HU-3. On unknown id, render a neutral "position not found" message (Scenario E).
- `frontend/src/components/PositionDetail.test.tsx` — RTL: render at `/positions/2` under `MemoryRouter`; assert id shown; click back control; assert location is `/positions`.
- `frontend/src/components/Positions.test.tsx` — RTL: render list; click "Ver proceso" on a known card; assert navigation target is `/positions/<that id>`.

Backend: untouched. There is no `GET /positions` list endpoint in the repo — the list stays mock with added ids (epic risk #5 resolved this way). The `/position/:id/...` GET endpoints belong to HU-2+.

## 4. Non-goals
- No backend changes (no list endpoint, no data fetch) — HU-1 is routing + shell only.
- No kanban columns, candidate cards, or data loading — those are HU-2, HU-3, HU-5.
- No rework of positions filters, search, status badges, or "Editar" button.
- No global navbar/footer/layout introduced by this story.

## 5. Labels and estimate
- Labels: `area:frontend`, `type:feature`, `routing`.
- Size: **S** — one route, one edit to the list for id + navigation, one small shell component, three RTL scenarios. No backend, no data layer.

## INVEST
Independent (frontend-only), Negotiable (id source = mock, swappable), Valuable (unlocks detail epic), Estimable (S), Small (≤ half day), Testable (5 RTL-mappable scenarios). Passes — no split needed.
