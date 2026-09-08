# Frontend services use the native fetch API, not axios

## Status
Accepted

## Context and problem
The Position kanban needs new frontend service functions (`getInterviewFlow`, `getCandidates`,
`updateCandidateStage` in `frontend/src/services/positionService.ts`, introduced across HU-2/3/4) to
talk to the backend at `http://localhost:3010`.

The existing service `frontend/src/services/candidateService.js` imports **axios**, but axios is
**absent from `frontend/package.json` and not installed in `frontend/node_modules`** (verified). That
file is also **dead code**: nothing under `frontend/src` imports `candidateService`. So there is no
working axios anywhere in the app — only a broken import in an unused file.

This means adopting axios is **not** "just declare what's already there": it would require actually
installing a new runtime dependency (`npm install axios` + manifest entry). Base-standards §10 forbids
adding dependencies without justification and without verifying the package in the registry. For the
plain JSON GET/PUT calls this feature needs, that justification is thin.

Native `fetch` is available in the target runtime (React 18 on `react-scripts 5`, all supported
browsers in `browserslist`) with zero dependencies.

## Options considered
* **Native `fetch`** — no dependency to add or install; available everywhere the app runs; enough for
  the simple JSON GET/PUT calls this feature needs.
* **Install and adopt axios** — would require `npm install axios` plus a manifest entry (it is not
  installed today). Gives interceptors and terser syntax, none of which this feature needs. Only
  precedent is a dead, unimported file with a broken axios import.

## Decision
We choose **native `fetch`** for the new frontend services because:
* It adds no dependency; axios is not installed, so choosing it would mean introducing a brand-new
  runtime dependency for no functional need.
* The feature only makes plain JSON GET/PUT calls; axios's extra capabilities are not needed here.
* It keeps the new kanban services self-contained and easy to mock in tests.

New frontend service code uses `fetch`.

## Consequences
* There is **no live convention divergence**: the only axios user (`candidateService.js`) is dead code
  that nothing imports, with an import that would not even resolve (axios not installed). The "two
  styles" concern does not apply to running code.
* Callers must handle `fetch` semantics explicitly: a non-2xx response does **not** reject, so services
  check `response.ok` and throw, and parse JSON manually. This is wrapped once per service function.
* Separate cleanup (outside this epic): `candidateService.js` should be deleted or migrated to `fetch`,
  since its `axios` import is broken. Tracked as debt, not adopted as a reason to install axios.
* If a real future need appears (interceptors, global auth headers, upload progress), revisit — and if
  axios is then installed and adopted, supersede this record.
