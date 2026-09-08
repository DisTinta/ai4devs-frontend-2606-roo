## Why

Recruiters opening a position at `/positions/:id` (HU-1 shell) see no structure of the hiring
pipeline. They need the position name and one column per interview stage to have context on how the
process is shaped, which is the foundation the later Kanban stories (candidate cards, drag & drop)
build on.

## What Changes

- Add a frontend service `positionService.ts` with `getInterviewFlow(id)` that calls the existing
  backend route `GET /position/:id/interviewflow` using **native `fetch`** (no new HTTP dependency;
  axios is absent from the manifest — mirrors the `candidateService.js` convention).
- Unwrap the backend's **double-nested** response so the frontend exposes a flat, typed shape:
  title from `data.interviewFlow.positionName`, steps from
  `data.interviewFlow.interviewFlow.interviewSteps`.
- Return interview steps **sorted ascending by `orderIndex`** in one place (the service).
- Extend the HU-1 `PositionDetail.tsx` shell: fetch on mount, render `positionName` as the title,
  and render exactly one column per interview step (react-bootstrap `Row`/`Col`) with `step.name`
  as the header.
- On fetch failure/404 the shell stays mounted without crashing and renders no columns (rich
  loading/error/empty UI is out of scope — HU-5).

## Capabilities

### New Capabilities
- `position-interview-flow`: fetch a position's interview flow and render its stages as ordered
  columns in the position detail view.

### Modified Capabilities
<!-- None. HU-1's position-detail shell is consumed, not respecified here. -->

## Impact

- **New code:** `frontend/src/services/positionService.ts` (+ `InterviewStep` /
  `InterviewFlowResponse` types), `frontend/src/components/PositionDetail.test.tsx`.
- **Modified code:** `frontend/src/components/PositionDetail.tsx` (extends the HU-1 shell).
- **Backend:** none — consumes `GET /position/:id/interviewflow`
  (`backend/src/routes/positionRoutes.ts:7`) as-is.
- **Dependencies:** none added; native `fetch`.
- **Depends on:** HU-1 (position detail shell + `/positions/:id` route).
- **Privacy/auth:** none — interview-flow metadata only, no personal data.
