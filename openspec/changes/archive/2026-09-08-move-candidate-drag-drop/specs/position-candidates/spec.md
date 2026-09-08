## ADDED Requirements

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
