## Context

See proposal.md — Why. HU-1 delivers the `PositionDetail.tsx` shell and the `/positions/:id` route;
HU-2 extends that shell with data. The backend route `GET /position/:id/interviewflow`
(`backend/src/routes/positionRoutes.ts:7`) already exists and is a non-goal to change. Two facts
shape the approach:

- The response is **double-nested** (`positionController.ts:18` wraps a value that already contains
  `positionName` + `interviewFlow`): title = `data.interviewFlow.positionName`,
  steps = `data.interviewFlow.interviewFlow.interviewSteps`.
- `axios` is **not** in `frontend/package.json`; `candidateService.js` was already migrated to native
  `fetch` against base URL `http://localhost:3010` (see `docs/adr/20260908-frontend-http-native-fetch.md`).

## Goals / Non-Goals

**Goals:**
- Isolate the network call and the response-unwrap + sort in one service module, so the component
  receives a flat, typed, already-sorted shape.
- Keep TypeScript typing across the network boundary (`.ts` service, `.tsx` component).

**Non-Goals:**
- No candidate cards (HU-3), no drag & drop (HU-4), no rich loading/error/empty UI (HU-5).
- No backend change; no new HTTP dependency.

## Decisions

- **Native `fetch` over axios.** Axios is absent from the manifest and the no-new-deps non-goal
  stands; `candidateService.js` already sets the native-fetch precedent. Alternative (add axios)
  rejected — undeclared dependency, contradicts the ADR.
- **Unwrap + sort live in the service, not the component.** `getInterviewFlow(id)` returns
  `{ positionName: string; steps: { id: number; name: string; orderIndex: number }[] }` sorted
  ascending by `orderIndex`. Keeps the double-nesting quirk and the ordering rule in one place; the
  component stays a pure renderer. Alternative (sort in JSX) rejected — spreads the quirk across
  layers and is harder to test.
- **Types alongside the service.** `InterviewStep` / `InterviewFlowResponse` declared with the
  service (or `frontend/src/types/`), mirroring existing service style.
- **Columns via react-bootstrap `Row`/`Col`.** Matches `Positions.tsx`; no new UI kit.
- **Failure = no crash, no columns.** On rejected fetch / 404 the component catches, leaves the shell
  mounted and renders zero columns. Full error UI deferred to HU-5.
- **Test at the network boundary.** `PositionDetail.test.tsx` mocks `positionService.getInterviewFlow`
  and asserts observable behavior (title text, ordered column headers) under `MemoryRouter` at
  `/positions/1`, per frontend-standards §4.

## Unspecified behaviour accepted (`/verify-against-spec` block 2–3)

Human gate after conformance check. These items are **not** missing requirements and are **not**
added to `specs/position-interview-flow/spec.md`.

1. **AND clause on unwrap (Scenario: Response unwrapping) is happy-path path correctness**, not
   runtime validation of malformed payloads. For a well-formed nested response, unwrap yields a
   defined `positionName` and the mapped `interviewSteps` list. Guarding against an `undefined`
   title or forcing a non-empty steps array on corrupt HTTP 200s is out of scope (defer to HU-5 or
   a later hardening change). Absent tests for those corrupt cases are intentional.
2. **Fetch failure title fallback** keeps the HU-1 shell: `Posición ${id}` when `flow` is null.
   Spec only requires the shell mounted and no columns.
3. **Failure/content messaging via `mockPositions` / `isKnown`** ("en construcción" /
   "no encontrada") remains HU-1 residual until HU-5 owns rich error/empty UI. Spec does not define
   that copy.
4. **Extra backend step fields** (`interviewFlowId`, `interviewTypeId`) are stripped in
   `positionService`; the UI contract stays `id` / `name` / `orderIndex`.
5. **`mb-4` on columns** and **`useEffect` cleanup (`active`)** are presentation / React hygiene,
   not product requirements.

## Risks / Trade-offs

- **Backend JSON shape differs from the S10 brief** → the unwrap is centralized in the service, so a
  shape change is a one-place edit; the component is unaffected.
- **HU-1 shell not yet merged** → HU-2 depends on it (INVEST: partial independence). Sequence HU-2
  after HU-1; if the shell contract shifts, revisit the component wiring only.
- **Native `fetch` has no interceptors/base-instance** → acceptable at this scale; base URL is a
  local constant mirroring `candidateService.js`.
