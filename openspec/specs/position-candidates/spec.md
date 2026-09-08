## Purpose

Lets a recruiter see, on a position's kanban board, each candidate as a card inside the column of
their current interview stage, with the candidate's average score shown over 5, so they can tell at a
glance where every candidate is in the process.

## Requirements

### Requirement: Candidates contract exposes the numeric stage id

The `GET /position/:id/candidates` response SHALL carry, per candidate, the numeric id of the
candidate's current interview stage as `currentInterviewStepId`, in addition to the existing
`currentInterviewStep` name string. The addition SHALL be additive: no existing field is removed or
renamed, so existing consumers stay unaffected. The value SHALL be the `Application.currentInterviewStep`
foreign key already stored in the database.

#### Scenario: Candidate item includes the numeric stage id

- **WHEN** a client requests `GET /position/:id/candidates` for a position that has candidates
- **THEN** each returned candidate object includes `currentInterviewStepId` as a number equal to the
  candidate application's current interview-step id
- **AND** it also still includes `currentInterviewStep` (the stage name string), `fullName`,
  `averageScore`, `id` and `applicationId`

### Requirement: Fetch a position's candidates

The system SHALL fetch a position's candidates from `GET /position/:id/candidates` and expose them to
the board as a flat list of typed candidates, without unwrapping (the response is a flat array, not a
`{ candidates }` envelope). Each client-side candidate SHALL retain `id`, `applicationId` and
`currentInterviewStepId` even when those fields are not displayed, so a later stage-change action can
address the stage by numeric id.

#### Scenario: Candidates are fetched and typed for the board

- **WHEN** the recruiter opens `/positions/:id` for a position that has candidates
- **THEN** the system requests `GET /position/:id/candidates`
- **AND** each candidate is available to the board with `fullName`, `averageScore`,
  `currentInterviewStep`, `currentInterviewStepId`, `id` and `applicationId` retained

### Requirement: Candidate card shows name and average score over 5

The system SHALL render each candidate as a card showing the candidate's `fullName` and its
`averageScore` both as a number and as a visual over a fixed maximum of 5. The visual SHALL clamp and
round the score into the range 0–5. A score of `0` SHALL render as zero filled (e.g. 0 of 5), never as
"N/A", "sin dato" or an empty state.

#### Scenario: Card renders name and score as number and visual

- **WHEN** a candidate with `fullName` "Ada Lovelace" and `averageScore` 4 is rendered as a card
- **THEN** the card shows the text "Ada Lovelace"
- **AND** the card shows the score 4 as a number and as a visual filled to 4 of a maximum of 5

#### Scenario: Score of zero renders as zero, not as missing data

- **WHEN** a candidate with `averageScore` 0 is rendered as a card
- **THEN** the card shows 0 (e.g. 0 filled of 5)
- **AND** it does not show "N/A", "sin dato" or an empty/placeholder state

### Requirement: Place each card in the column matching its stage id

The system SHALL place each candidate card in the interview-stage column whose step `id` equals the
candidate's `currentInterviewStepId`. Matching SHALL be by numeric id, not by stage name.

#### Scenario: Card lands in the column of its stage id

- **WHEN** the loaded flow has steps with id 10 "Applied" and id 11 "Technical", and a candidate
  "Ada Lovelace" has `currentInterviewStepId` 11
- **THEN** the "Ada Lovelace" card renders inside the "Technical" (id 11) column
- **AND** it does not render inside the "Applied" (id 10) column

### Requirement: Unknown stage id does not break the board

When a candidate's `currentInterviewStepId` matches none of the loaded flow's step ids, the board
SHALL NOT crash. The unmatched candidate SHALL be handled by a single documented fallback — either
placed in a dedicated "Sin fase" bucket or omitted with a discreet `console.warn` — applied
consistently.

#### Scenario: Candidate with an unknown stage id is handled without crashing

- **WHEN** the loaded flow has steps with ids 10 and 11, and a candidate has `currentInterviewStepId`
  99
- **THEN** the board renders without crashing
- **AND** the candidate is handled by the documented fallback (a "Sin fase" bucket or omitted with a
  discreet console warning), consistently with every other unmatched candidate

### Requirement: Candidate fetch failure keeps the board mounted

When `GET /position/:id/candidates` fails or returns an error status, the board SHALL keep its
interview-stage columns mounted with no candidate cards and SHALL NOT crash. Rich loading, empty and
error presentation is out of scope here; the guarantee is only "no crash".

#### Scenario: Failed candidate fetch renders columns without cards

- **WHEN** the recruiter opens `/positions/:id` and `GET /position/:id/candidates` fails or returns a
  500
- **THEN** the interview-stage columns stay mounted
- **AND** no candidate cards are shown
- **AND** the view does not crash

### Requirement: Move a candidate to a new stage by dragging its card

The board SHALL let a recruiter move a candidate to a different interview stage by dragging the
candidate's card from its current column and dropping it on another stage column. On a drop onto a
different column, the system SHALL persist the change by calling `PUT /candidates/:id/stage` exactly
once, addressing the candidate by its numeric `id` and sending the destination column's numeric step
`id` as the new stage. On a successful response the card SHALL remain in the destination column.

#### Scenario: Dropping on another column persists the new stage

- **WHEN** candidate id `7` (applicationId `3`) sits in column "Applied" (step id 10), column
  "Technical" has step id 11, and the recruiter drags the card and drops it on "Technical"
- **THEN** `PUT /candidates/7/stage` is called exactly once with body
  `{ applicationId: 3, currentInterviewStep: 11 }`
- **AND** on a `200` response the card stays in the "Technical" column

### Requirement: Stage move is applied optimistically

The board SHALL move the card into the destination column immediately on drop, before the
`PUT /candidates/:id/stage` response arrives. The visible move SHALL NOT be gated on a spinner or on
the network round-trip.

#### Scenario: Card appears in the destination column before the response

- **WHEN** the backend response to the move is slow or still pending and the recruiter drops the card
  on "Technical"
- **THEN** the card appears in the "Technical" column immediately, before the response arrives

### Requirement: Failed stage move rolls back and surfaces an error

When `PUT /candidates/:id/stage` returns an error status (for example `400`, `404` or `500`) or the
request fails at the network level, the board SHALL return the card to its original column and SHALL
show an error message to the recruiter.

#### Scenario: Error response returns the card to its original column

- **WHEN** the card was moved optimistically from "Applied" to "Technical" and
  `PUT /candidates/7/stage` returns `400`, `404`, `500`, or network-fails
- **THEN** the card returns to its original "Applied" column
- **AND** an error message is shown to the recruiter

### Requirement: Dropping on the same column is a no-op

When a candidate card is dropped on the same column it already occupies, the board SHALL NOT issue any
`PUT /candidates/:id/stage` request and SHALL leave the board unchanged.

#### Scenario: Same-column drop issues no request

- **WHEN** the card is in "Applied" and the recruiter drops it back on "Applied"
- **THEN** no `PUT /candidates/:id/stage` request is issued
- **AND** nothing on the board changes

### Requirement: A candidate is locked while its move is in flight

While a move request for a given candidate card is in flight, that card SHALL NOT be movable again
until the request settles (resolves or fails). Other candidate cards SHALL remain movable during that
time.

#### Scenario: In-flight card cannot be moved again

- **WHEN** a move request for card `7` is in progress and the recruiter tries to drag card `7` again
  before it resolves
- **THEN** card `7` cannot be moved again until its request settles
- **AND** other candidate cards remain movable

### Requirement: Stage-change endpoint exposed additively at PUT /candidates/:id/stage

The backend SHALL expose `PUT /candidates/:id/stage`, bound to the same stage-update behavior as the
existing `PUT /candidates/:id`, where `:id` is the candidate id and the request body is
`{ applicationId, currentInterviewStep }` with `currentInterviewStep` being the numeric destination
step id. The addition SHALL be additive: the existing `PUT /candidates/:id` route and its behavior
SHALL remain unchanged, so existing consumers stay unaffected.

#### Scenario: New route updates the candidate's stage

- **WHEN** a client sends `PUT /candidates/7/stage` with body
  `{ applicationId: 3, currentInterviewStep: 11 }`
- **THEN** the response is `200` and the candidate application's current interview step is updated to
  `11`
- **AND** the existing `PUT /candidates/7` route continues to accept the same body and behave as before

#### Scenario: Invalid body is rejected

- **WHEN** a client sends `PUT /candidates/7/stage` with a body missing or malforming `applicationId`
  or `currentInterviewStep`
- **THEN** the response is `400` and no stage change is persisted
