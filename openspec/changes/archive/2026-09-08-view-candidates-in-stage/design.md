## Context

See `proposal.md` — Why. HU-1 delivered the detail shell/route and HU-2 the interview-stage columns
(`position-interview-flow`), rendered by `PositionDetail.tsx` from `getInterviewFlow`. The columns are
empty. Two payloads feed the board:

- `GET /position/:id/interviewflow` — steps, each `{ id, name, orderIndex }`, already unwrapped and
  order-sorted by `positionService.getInterviewFlow` (double-nested source; consume the flat shape).
- `GET /position/:id/candidates` — a **flat array** (no `{ candidates }` envelope, unlike interviewflow)
  where each item today is `{ fullName, currentInterviewStep (name string), averageScore, id,
  applicationId }` from `positionService.ts`.

Constraints: React 18 + CRA + react-bootstrap; native `fetch` (no axios); services own network,
components render; RTL v13 tests (`userEvent.click`, no `setup()`) under `MemoryRouter`, mocked at the
service boundary; base URL `http://localhost:3010`. The stage→column join key is the numeric stage id
per [ADR 20260908](../../../docs/adr/20260908-map-candidate-to-stage-by-id.md).

## Goals / Non-Goals

**Goals:**
- One consistent join key (numeric stage id) shared by HU-3 placement and HU-4 stage update.
- Keep the backend change minimal and additive; keep `PositionDetail` a near-pure renderer with
  fetching/grouping isolated and testable.
- Deterministic, documented handling of the two edge paths (unknown stage id, failed fetch).

**Non-Goals:**
- No drag & drop (HU-4). No rich loading/empty/error UI (HU-5) — only "no crash".
- No DB score-range constraint; "over 5" is a presentation decision, clamped/rounded in the card.
- The card need not display `id` / `applicationId` / `currentInterviewStepId`, only retain them.

## Decisions

**D1 — Backend surfaces the id additively, one line.** Add
`currentInterviewStepId: app.currentInterviewStep` to the candidates projection in
`backend/src/application/services/positionService.ts`; keep `currentInterviewStep` (name). The FK
already holds the id, so this is a pure exposure, non-breaking. *Alternative:* match by name on the
frontend (Option A in the ADR) — rejected: ambiguous on duplicate/whitespace-differing names and
inconsistent with HU-4's id-based update. *Naming hazard:* the DB column
`Application.currentInterviewStep` is the numeric id while the projected `currentInterviewStep` is the
name — the new field is named `currentInterviewStepId` to disambiguate.

**D2 — `getCandidates(id)` in the existing `positionService.ts`, returning `Candidate[]` directly.**
No unwrap (flat array); throw on `!response.ok` so the component's `.catch` drives the no-crash path,
mirroring `getInterviewFlow`. *Alternative:* a separate `candidateService`
— rejected: the resource is position-scoped and the HU explicitly extends the HU-2 service.

**D3 — `Candidate` type retains ids.** `{ fullName: string; currentInterviewStepId: number;
currentInterviewStep: string; averageScore: number; id: number; applicationId: number }`. The three
ids are kept on the client model even though unshown, so HU-4 can issue the stage PUT by numeric id.

**D4 — Grouping by id lives in `PositionDetail`, cards render in the matching column.** After both
fetches resolve, group candidates by `currentInterviewStepId` (e.g. a `Map<number, Candidate[]>`) and,
when mapping `flow.steps`, render that step's group inside its `Col`. Grouping by id (not by array
index or name) is what makes placement robust to duplicate names.

**D5 — Unknown stage id → omit + discreet `console.warn` (one documented fallback).** Chosen over a
"Sin fase" bucket to keep the board strictly the flow's columns and avoid a phantom stage; the warn
preserves diagnosability. Applied uniformly to every unmatched candidate. This is the single fallback
the spec's "consistent" clause requires — do not mix strategies.

**D6 — Score visual: a 0–5 dot/pip row plus the numeric value.** Clamp and round `averageScore` into
0–5 for the visual; always render the number too. `0` yields 0 filled pips (still 5 pips shown), never
an empty/placeholder state. Follows the react-bootstrap `Card` style used in `Positions.tsx`.

**D7 — Independent fetches, independent failures.** Candidates and interviewflow are fetched
separately; a candidates failure leaves the HU-2 columns mounted (empty), matching the spec's
no-crash-only guarantee. No coupling that would let one failure blank the other.

## Risks / Trade-offs

- **Backend contract change read as scope creep** → mitigated: sanctioned and documented in
  ADR 20260908; strictly additive; backend tests updated to pin the new field.
- **Omit-on-unknown-id silently hides a candidate** → mitigated: discreet `console.warn` keeps it
  diagnosable; the case is an inconsistent-data signal, not a normal state, and is explicitly one of
  the two documented options.
- **Score rounding hides fractional scores** (e.g. 3.5 → visual 4) → accepted: the number is always
  shown alongside, so the visual is an aid, not the source of truth; "over 5" is a product decision
  with no DB range.
- **RTL v13 quirk** (no `userEvent.setup()`) → mitigated: tests call `userEvent`/`getByRole`
  directly and mock the service, per `docs/project-context.md`.

## Migration Plan

Additive only; no data migration, no rollback steps. If the backend field must be reverted, the
frontend match simply finds no id and every candidate falls into the D5 fallback — degraded but not
crashing. Ship order: backend field + backend tests first, then frontend service/type, card, and
placement, each TDD.
