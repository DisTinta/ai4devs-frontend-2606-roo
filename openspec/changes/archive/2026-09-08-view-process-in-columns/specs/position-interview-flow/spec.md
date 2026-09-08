## Purpose

Lets a recruiter viewing a position see its name and the interview pipeline rendered as one ordered
column per interview stage, giving context on how the hiring process is shaped.

## ADDED Requirements

### Requirement: Fetch a position's interview flow

The system SHALL retrieve a position's interview flow from the backend route
`GET /position/:id/interviewflow` and expose it to the UI as a flat shape: a `positionName` string
and a list of interview steps, each with `id`, `name`, and `orderIndex`.

Because the backend response is double-nested, the system SHALL read the title from
`data.interviewFlow.positionName` and the steps from
`data.interviewFlow.interviewFlow.interviewSteps`.

#### Scenario: Response unwrapping

- **WHEN** the backend returns `{ interviewFlow: { positionName, interviewFlow: { interviewSteps } } }`
- **THEN** the resolved title reads from `data.interviewFlow.positionName`
- **AND** the resolved steps read from `data.interviewFlow.interviewFlow.interviewSteps`
- **AND** no `undefined` title or empty step list is produced for a valid position.

### Requirement: Interview steps are ordered by orderIndex

The system SHALL order interview steps by ascending `orderIndex`, independent of the order they
arrive in the backend array.

#### Scenario: Unordered array is sorted

- **WHEN** `interviewSteps` arrive with `orderIndex` not monotonically increasing in the array
- **THEN** the steps are presented in ascending `orderIndex` order, not raw array order.

### Requirement: Position title is shown

The position detail view SHALL show the `positionName` as the title at the top of the view once the
interview flow is fetched.

#### Scenario: Happy path title

- **WHEN** the recruiter opens `/positions/1` and the flow is fetched
- **THEN** the position title (`positionName`) is shown at the top of the view.

### Requirement: One column per interview stage

The position detail view SHALL render exactly one column per interview step, with the step `name` as
the column header, and no fixed or client-invented columns. The column count SHALL follow the data.

#### Scenario: Columns render in order

- **WHEN** a flow returns steps with `orderIndex` `[2:"Technical", 0:"Applied", 1:"Screening"]`
- **THEN** exactly 3 columns render with headers in ascending order: "Applied", "Screening", "Technical".

#### Scenario: Column count follows the data

- **WHEN** the flow has 5 steps
- **THEN** exactly 5 columns render
- **AND** a flow with 1 step renders exactly 1 column.

### Requirement: Fetch failure does not crash the view

When the interview-flow fetch fails or returns 404, the view SHALL keep the HU-1 shell (title area
and back control) mounted without crashing and SHALL render no columns. Rich loading/error/empty
states are out of scope (HU-5).

#### Scenario: Fetch failure keeps the shell mounted

- **WHEN** `GET /position/:id/interviewflow` fails or returns 404
- **THEN** the shell stays mounted without crashing
- **AND** no columns are rendered.
