## Purpose

Gives the recruiter clear feedback for every data-readiness state of the position board — loading,
error (with retry), and empty — so the view is never a blank screen and a position with no candidates
is never mistaken for a failure.

## Requirements

### Requirement: Joint loading indicator until both fetches resolve

While either the interview-flow fetch (`getInterviewFlow`) or the candidates fetch (`getCandidates`)
is still pending, the board SHALL show a single loading indicator and SHALL NOT render any columns,
empty message, or error message yet. The board SHALL render only once both requests have resolved.

#### Scenario: Both requests pending shows one loading indicator

- **WHEN** the recruiter opens `/positions/1` and both the interview-flow and candidates requests are
  pending
- **THEN** a single loading indicator is shown
- **AND** no columns, "empty" message, or "error" message are shown yet

### Requirement: Failed fetch shows an error with granular retry

When a request rejects or returns a non-2xx status, the board SHALL show an error message with a
"Retry" control and SHALL NOT leave a blank content area. A flow failure SHALL be presented as a
board-level error with no columns; a candidates failure SHALL be presented as an error in the
candidates area. Activating "Retry" SHALL re-issue only the failed request(s); on success the normal
view SHALL render.

#### Scenario: Error message offers Retry instead of a blank area

- **WHEN** the interview-flow and/or candidates request fails (rejects or non-2xx)
- **THEN** an error message with a "Retry" control is shown (not a blank content area)

#### Scenario: Retry re-issues only the failed request

- **WHEN** the candidates request failed, the flow succeeded, and the recruiter activates "Retry"
- **THEN** only the candidates request is re-issued (the flow is not re-fetched)
- **AND** on a successful retry the normal board renders

### Requirement: Empty candidates list keeps the columns with placeholders

When the candidates request resolves to an empty array `[]` (a success, not a failure), the board
SHALL show an explicit "no candidates" message and SHALL still render one column per interview stage,
each column showing a placeholder indicating no candidates in that stage.

#### Scenario: Empty list renders message plus columns with placeholders

- **WHEN** the flow loads with steps ["Applied", "Technical"] and the candidates request resolves to
  `[]`
- **THEN** an explicit "no candidates" message is shown
- **AND** both columns still render, each with a placeholder indicating no candidates in that stage

### Requirement: Empty column remains a valid drop target

A column with no candidates SHALL render its placeholder inside the column's dnd-kit droppable, so the
empty column remains a valid drop target for a dragged card (HU-4).

#### Scenario: A card can be dropped onto an empty column

- **WHEN** one column has candidates and another has none, and the view renders
- **THEN** the empty column shows a placeholder
- **AND** the empty column remains a valid drop target: a card can be dropped onto it

### Requirement: An empty list is never presented as an error

The board SHALL keep the empty state and the error state distinct: a candidates result of `[]`
(success) SHALL show the empty message and never the error message, and a candidates failure SHALL
show the error+retry message and never the empty message. In neither case SHALL the content area be
left blank without feedback.

#### Scenario: Empty success and failure render different feedback

- **WHEN** the candidates request resolves to `[]`
- **THEN** the empty "no candidates" message is shown and the error message is not
- **WHEN** the candidates request instead rejects
- **THEN** the error+retry message is shown and the empty message is not
- **AND** in neither case is the content area left blank without feedback
