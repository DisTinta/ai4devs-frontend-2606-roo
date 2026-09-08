# Show Spec Working — view-process-in-columns

- Date: 2026-09-08
- Change: view-process-in-columns
- Interface: React frontend (`/positions/:id`) against live backend `GET /position/:id/interviewflow`.

## Demonstrated

| Scenario | Interaction | Result | Matches spec | Evidence |
|---|---|---|---|---|
| Happy path title | Navigate `/positions/1` | h2 title "Senior Full-Stack Engineer" (positionName) | Yes | `./2026-09-08-demo-happy-path-position-1.png` |
| Columns render in order | Navigate `/positions/1` | 3 level-3 headings: "Initial Screening" → "Technical Interview" → "Manager Interview" (ascending orderIndex) | Yes | `./2026-09-08-demo-happy-path-position-1.png` |
| Column count follows the data | Navigate `/positions/2` (flow has 0 steps) | Title "Data Scientist", 0 columns rendered; `/positions/1` shows 3 → count tracks the data | Yes (3 vs 0 live; 5 and 1 covered by unit tests) | `./2026-09-08-demo-count-follows-data-position-2.png` |
| Fetch failure keeps shell mounted | Navigate `/positions/999` (backend 404) | Shell mounted (back control + "Posición 999"), no columns, "Posición no encontrada.", no crash | Yes | `./2026-09-08-demo-failure-position-999.png` |
| Response unwrapping | Backend `GET /position/1/interviewflow` | Double-nested payload consumed; title + steps resolved correctly on screen | Yes | live backend response below |
| Unordered array is sorted | — | Not exercised live (seed order == orderIndex order); proven by unit test `positionService.test.ts` | Covered by unit test | — |

## Evidence

Backend contract (verbatim):
```
GET http://localhost:3010/position/1/interviewflow
{"interviewFlow":{"positionName":"Senior Full-Stack Engineer","interviewFlow":{"id":1,"description":"Standard development interview process","interviewSteps":[{"id":1,...,"name":"Initial Screening","orderIndex":1},{"id":2,...,"name":"Technical Interview","orderIndex":2},{"id":3,...,"name":"Manager Interview","orderIndex":2}]}}}
```

Playwright accessibility snapshots:
```
/positions/1 → heading[2] "Senior Full-Stack Engineer"; heading[3] "Initial Screening", "Technical Interview", "Manager Interview"; link "Volver a posiciones"
/positions/2 → heading[2] "Data Scientist"; no heading[3]; link "Volver a posiciones"
/positions/999 → heading[2] "Posición 999"; paragraph "Posición no encontrada."; link "Volver a posiciones"; console: 2× 404 for /position/999/interviewflow (expected, no uncaught exception)
```

Screenshots (under this `reports/` folder):
- `./2026-09-08-demo-happy-path-position-1.png`
- `./2026-09-08-demo-count-follows-data-position-2.png`
- `./2026-09-08-demo-failure-position-999.png`

## State
- Before: `Position`=2 rows, `InterviewStep`=3 rows (seeded baseline). pos1=3 steps, pos2=0 steps.
- After: `Position`=2 rows, `InterviewStep`=3 rows — unchanged.
- Restored: yes / no changes needed — all interactions were read-only GETs. Dev servers stopped; Postgres left up.

## Not demonstrated
- "Unordered array is sorted" was not exercised live because the seed data already arrives in
  ascending `orderIndex`. The sort is proven by the unit test `positionService.test.ts`
  ("sorts steps by ascending orderIndex regardless of array order").
- Live column counts of exactly 5 and 1 were not reproduced (seed offers 3 and 0). Those exact
  counts are covered by `PositionDetail.flow.test.tsx` (5-step and single-step cases).

## Handoff
The change is **demonstrably working**: the position title, the ordered columns, the data-driven
column count, and the no-crash failure path were all exercised against the running frontend + backend
with real seed data. Remaining spec scenarios (sort of an unordered array; exact 5/1 counts) are
covered by the unit suite. No screenshot was left at the repository root.
