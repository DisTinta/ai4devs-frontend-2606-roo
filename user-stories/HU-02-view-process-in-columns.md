# HU-2 — See the hiring process as columns

## Reality map

### Exists
- `backend/src/routes/positionRoutes.ts:7` — `GET /position/:id/interviewflow` → `getInterviewFlowByPosition` (route is singular `/position`, lowercase `interviewflow`).
- `backend/src/presentation/controllers/positionController.ts:18` — wraps `res.json({ interviewFlow })` where the inner value **already** contains `positionName` + `interviewFlow` → **double nesting**. Not-found → `404 { message, error }`.
- `backend/src/application/services/positionService.ts:36` — returns `{ positionName, interviewFlow: { id, description, interviewSteps: [{ id, interviewFlowId, interviewTypeId, name, orderIndex }] } }`.
- `backend/prisma/schema.prisma:92` — `InterviewStep { id, name, orderIndex: Int, ... }`.
- `frontend/src/services/candidateService.js` — service style + base URL `http://localhost:3010`. Imports `axios`, which is **absent from `frontend/package.json`**.
- `frontend/src/components/App.js`, `Positions.tsx` — router + TS component style.
- `frontend/tsconfig.json` + `typescript ^4.9.5` + `react-scripts 5.0.1` → `.ts/.tsx` supported.
- `@testing-library/react` + `jest-dom` + `user-event` — test infra. No existing frontend test.

### To create
- `frontend/src/services/positionService.ts` — `to-create`. `getInterviewFlow(id)` calls `GET /position/:id/interviewflow` using **native `fetch`** (decision: axios is absent from the manifest; native fetch avoids an undeclared dependency and honours the no-new-deps non-goal). Unwraps the double nesting; returns a typed, orderIndex-sorted flow. Mirrors `candidateService.js` base URL.
- Types `InterviewStep` / `InterviewFlowResponse` in the service or `frontend/src/types/` — `to-create`.
- `frontend/src/components/PositionDetail.tsx` — extends the **HU-1 shell** (that component is `to-create` in HU-1). HU-2 adds fetch-on-mount, title from `positionName`, one column per step sorted ascending by `orderIndex`.
- `frontend/src/components/PositionDetail.test.tsx` — `to-create`. RTL: mock `positionService`, assert title + ordered columns.

### Ticket examples checked
- `GET /positions/:id/interviewFlow` — NOT FOUND. Real route **FOUND** at `positionRoutes.ts:7` as `GET /position/:id/interviewflow`.
- `positionName` at top level — NOT FOUND at top level; nested at `data.interviewFlow.positionName` (double wrap).
- `interviewSteps` array — FOUND, nested at `data.interviewFlow.interviewFlow.interviewSteps`.

## 1. User story

As a recruiter, I want to see the position name and one column per interview stage,
so that I have context on where I am and how the hiring pipeline is shaped.

## 2. Acceptance criteria

### Scenario A — Happy path: title + columns in order
Given position id `1` whose interview flow returns steps with orderIndex [2:"Technical", 0:"Applied", 1:"Screening"]
When I open `/positions/1` and the flow is fetched
Then the position title (positionName) is shown at the top of the view
And exactly 3 columns render with headers in ascending orderIndex order: "Applied", "Screening", "Technical".

### Scenario B — Column count follows the data (edge)
Given a position whose flow has 5 steps
When the view renders
Then exactly 5 columns render — no fixed or client-invented columns
And a position with 1 step renders exactly 1 column.

### Scenario C — Response unwrapping (edge)
Given the real backend response is double-nested: `{ interviewFlow: { positionName, interviewFlow: { interviewSteps } } }`
When positionService parses it
Then the title reads from `data.interviewFlow.positionName`
And columns read from `data.interviewFlow.interviewFlow.interviewSteps`
And no "undefined" title or zero columns appear for a valid position.

### Scenario D — Unordered array is sorted (edge)
Given interviewSteps arrive out of order (orderIndex not monotonic in the array)
When columns render
Then they are ordered by ascending orderIndex, not by raw array order.

### Scenario E — Fetch failure does not crash (error)
Given `GET /position/:id/interviewflow` fails or returns 404
When the view renders
Then the shell (title area + back control from HU-1) stays mounted without crashing
And no columns are rendered.
(Rich loading/error/empty states are HU-5; HU-2 only guarantees no crash.)

## 3. Technical context

Exists (consume, do not change — backend is a non-goal):
- Route `GET /position/:id/interviewflow` (`backend/src/routes/positionRoutes.ts:7`).
- Response is double-nested (`positionController.ts:18`). Frontend must unwrap:
  title = `data.interviewFlow.positionName`;
  steps = `data.interviewFlow.interviewFlow.interviewSteps` (each `{ id, name, orderIndex }`).
- `frontend/src/services/candidateService.js` — base URL and service style to mirror.

To create:
- `frontend/src/services/positionService.ts` — `getInterviewFlow(id: number)`; native `fetch`
  against `http://localhost:3010/position/${id}/interviewflow`; unwraps nesting; returns
  `{ positionName: string; steps: { id: number; name: string; orderIndex: number }[] }` sorted
  ascending by orderIndex (keep the sort in one place).
- Types `InterviewStep`/`InterviewFlowResponse` alongside the service or in `frontend/src/types/`.
- `frontend/src/components/PositionDetail.tsx` — extends the HU-1 shell: on mount call
  `positionService.getInterviewFlow(id)`; render `positionName` as title; render one column per step
  (react-bootstrap `Row`/`Col`, matching `Positions.tsx`) with `step.name` as header.
- `frontend/src/components/PositionDetail.test.tsx` — RTL: mock `positionService.getInterviewFlow`,
  render under `MemoryRouter` at `/positions/1`, assert title text and ordered column headers.

## 4. Non-goals
- No candidate cards inside columns — HU-3.
- No drag & drop — HU-4.
- No backend changes; if JSON shape differs from the S10 brief, adapt the mapping in frontend.
- No rich loading/error/empty UI — HU-5 (HU-2 only guarantees "does not crash").
- No new HTTP dependency; use native `fetch` (axios is absent from the manifest).

## 5. Labels and estimate
- Labels: `area:frontend`, `type:feature`, `data-fetch`.
- Size: **S** — one service with response unwrap + one column layout sorted by orderIndex; depends on HU-1 shell.

## INVEST
Independent: partial — depends on HU-1 (shell + `/positions/:id` route). Negotiable, Valuable,
Estimable (S), Small (≤ half day), Testable (5 RTL/service scenarios). Passes; sequence after HU-1.
