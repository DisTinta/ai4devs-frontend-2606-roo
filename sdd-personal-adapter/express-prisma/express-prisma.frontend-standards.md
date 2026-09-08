---
description: Frontend development standards for React CRA — components, services, Bootstrap, accessibility and testing.
globs: ["frontend/src/**/*.{js,jsx,ts,tsx}"]
alwaysApply: true
---

# Frontend Standards — React (CRA)

## 1. Technology stack

- **React** 18 with function components and hooks. No new class components.
- **TypeScript** preferred for new files; existing `.js` components may stay JS until touched meaningfully.
- **Create React App** (`react-scripts`) — build and `npm start`. Not Vite.
- **Bootstrap 5** + **react-bootstrap** (+ react-bootstrap-icons, react-datepicker). Not Tailwind.
- **Jest** (via `frontend` package scripts) + **React Testing Library** where present.
- **Playwright** (project MCP) for demonstrating critical UI flows — does not replace unit tests.
- Accessibility automation via `test:a11y` only after it is wired (see scaffold under `tests/a11y/`).

## 2. Architecture

- **Services** in `frontend/src/services/`: one module per resource; components do not hard-code fetch URLs in JSX when a service already exists.
- **Components** in `frontend/src/components/`: UI and interaction. Keep network calls in services.
- Entry: `frontend/src/App.tsx` / `App.js` and `index.tsx`.
- **State**: local hooks first. Do not add a global state library unless two unrelated screens share mutable client state.
- Loading and error states must be visible, never silent.
- Backend API base in local dev: `http://localhost:3010` (frontend on **port 3000**).

## 3. Hard rules

- Values that cross the network boundary should be typed when the file is TypeScript; prefer aligning with `backend/api-spec.yaml`.
- Never interpolate untrusted input into markup that bypasses escaping.
- Do not store secrets in frontend env vars shipped to the browser.
- Prefer accessible Testing Library queries (`getByRole`, `getByLabelText`) over test IDs as the first choice.
- Target **WCAG 2.2 AA** on touched UI: contrast, keyboard, labels, landmarks.
- Do not ask the agent to "optimise performance" without a measurement.

## 4. Testing

- Component tests for behaviour a user can observe.
- Mock at the network boundary (services / HTTP), not deep into React internals.
- End-to-end / Playwright only for critical journeys (add candidate, recruiter dashboard flows).
- Arrange-Act-Assert with clear blocks.
- Run `npm --prefix frontend test` for the frontend suite when UI behaviour changes.
- `tests/a11y/smoke.example.tsx` is a kit scaffold, not an active gate, until renamed and wired with `test:a11y`.

## 5. Definition of done for a frontend change

- Loading, empty, error and success states implemented for the touched flow.
- Keyboard use works for new interactive controls; no new obvious WCAG regressions on touched UI.
- Change exercised against a running backend (Docker Postgres + backend `:3010` + frontend `:3000`) when the ticket is UI-facing.
- Do not invent Vite, Tailwind, or Vitest tooling for this repo.
