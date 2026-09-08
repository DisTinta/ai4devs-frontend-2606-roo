# Map a candidate to its kanban column by interview-step id, not by name

## Status
Accepted

## Context and problem
The Position kanban (epic "Vista Position — Kanban de candidatos", HU-3) places each candidate card
in the column of its current interview stage. Two payloads feed the board:

- `GET /position/:id/interviewflow` returns the stages, each with a numeric `id`, a `name`, and an
  `orderIndex` (`backend/src/application/services/positionService.ts:36`).
- `GET /position/:id/candidates` returns, per candidate,
  `{ fullName, currentInterviewStep, averageScore, id, applicationId }`, where `currentInterviewStep`
  is the stage **name string** (`positionService.ts:25`, `app.interviewStep.name`).

With only a name on the candidate side, the column match is done by string equality against
`interviewSteps[].name`. That is fragile: two stages sharing a name (or differing by casing/whitespace)
make the placement ambiguous, and HU-4 (moving a candidate) already needs the numeric stage id to call
the stage-update endpoint. Matching by name in HU-3 and then by id in HU-4 means two different join
keys for the same relationship.

Relevant fact from the schema: `Application.currentInterviewStep` is itself an `Int` foreign key to
`InterviewStep.id` (`backend/prisma/schema.prisma:133,137`). The numeric stage id is therefore already
in the database; the candidates projection simply does not expose it today — it only projects the
related step's `name`.

## Options considered
* **A — Keep matching by stage name** (current behaviour). No backend change, but ambiguous on
  duplicate/inconsistent names and inconsistent with HU-4's id-based update.
* **B — Match by numeric stage id.** Expose the stage id the DB already holds by adding one additive
  field to the candidates projection, and key the column mapping on it.

## Decision
We choose **Option B — match by numeric stage id** because:
* Ids are unique and stable; names are not (epic open risk #4).
* The id already exists in the database (`Application.currentInterviewStep` FK); exposing it is an
  additive, non-breaking projection change, not a new concept.
* It gives HU-3 (placement) and HU-4 (stage update) a single, consistent join key.

Concretely, the candidates projection gains an additive field carrying the numeric stage id
(e.g. `currentInterviewStepId: app.currentInterviewStep`). The existing `currentInterviewStep` name
string stays for display. The frontend keys each card's column on the id, falling back gracefully when
no column matches.

## Consequences
* The backend candidates contract changes (additively). This extends the epic's sanctioned backend
  work beyond the single `PUT /candidates/:id/stage` exception (T-3b): HU-3's original non-goal "no
  backend contract change" is revised to allow this additive field. Documented here so the change is
  not mistaken for scope creep.
* Existing consumers of `GET /position/:id/candidates` are unaffected (field is added, none removed).
* Naming hazard, called out for implementers: the DB column `Application.currentInterviewStep` is the
  numeric id, while the projected field `currentInterviewStep` is the name string. The new field must
  be named unambiguously (`currentInterviewStepId`).
* HU-3 and HU-4 share the id join key; the name-matching fallback becomes a defensive path only.
