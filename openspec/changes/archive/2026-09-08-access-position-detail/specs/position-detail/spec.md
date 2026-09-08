## Purpose

Lets a recruiter open a position's detail view addressed by the position id, reachable both from the
positions list and by a direct URL, with a back control returning to the list and a no-crash
fallback for unknown ids.

## ADDED Requirements

### Requirement: Navigate to a position's detail from the list

The system SHALL allow the recruiter to open a position's detail view from the positions list by
activating the "Ver proceso" control on a position card. The system SHALL address the detail view by
the position's stable id at the route `/positions/:id`.

#### Scenario: Click "Ver proceso" navigates to the detail route

- **WHEN** the recruiter is on `/positions` with the list rendered and clicks "Ver proceso" on the
  card whose id is `1`
- **THEN** the app navigates to `/positions/1`
- **AND** the detail view renders and shows that id (a heading containing "1")

### Requirement: Deep-link and reload access to a detail view

The system SHALL render the detail view for the id taken from the route param when `/positions/:id`
is opened directly, without a prior list render, and SHALL NOT redirect away from that route.

#### Scenario: Open a detail URL directly

- **WHEN** the recruiter opens `/positions/2` directly by URL on a fresh load
- **THEN** the detail view for id `2` renders from the route param
- **AND** no redirect to `/positions` or `/` occurs

### Requirement: Back control returns to the list

The detail view SHALL present a back control to the left of the title that returns the recruiter to
the positions list at `/positions`.

#### Scenario: Activate the back control

- **WHEN** the recruiter is on `/positions/3` and activates the back control
- **THEN** the app navigates to `/positions`
- **AND** the positions list is shown again

### Requirement: Global structure preserved across navigation

Moving between `/positions` and `/positions/:id` SHALL change only the inner content region and SHALL
NOT add or remove any global chrome (navbar/footer/layout).

#### Scenario: No global chrome change between routes

- **WHEN** the recruiter moves between `/positions` and `/positions/:id`
- **THEN** no global navbar/footer/layout is added or removed by this behavior
- **AND** only the inner content region changes

### Requirement: No-crash fallback for an unknown id

When `/positions/:id` is opened with an id absent from the known positions, the detail view SHALL
still render its shell (title and back control) without crashing and SHALL show a neutral
"position not found" message in the content region. The back control SHALL still return to
`/positions`.

#### Scenario: Open a detail URL for an unknown id

- **WHEN** the recruiter opens `/positions/does-not-exist`
- **THEN** the detail view renders the shell (title and back control) without crashing
- **AND** a neutral "position not found" message is shown in the content region
- **AND** the back control still returns to `/positions`