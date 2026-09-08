# Show Spec Working — view-candidates-in-stage

- Date: 2026-09-08
- Change: view-candidates-in-stage
- Interfaces exercised: `GET /position/:id/candidates` (HTTP) and the `/positions/:id` board (browser, Playwright MCP).

## Demonstrated

| Scenario | Interaction | Result | Matches spec | Evidence |
|---|---|---|---|---|
| Candidates contract exposes the numeric stage id | `curl GET /position/1/candidates` | Flat array; each item has `currentInterviewStepId` (2,2,1) alongside `currentInterviewStep`, `averageScore`, `id`, `applicationId` | Yes | HTTP below |
| Fetch a position's candidates (typed, ids retained) | Board render on `/positions/1` consumes the array; ids carried to `CandidateCard key={applicationId}` | Cards render from the fetched array | Yes | `./2026-09-08-demo-happy-path-position-1.png` |
| Card shows name + score as number and visual over 5 | `/positions/1` | Jane Smith → "4" + `img "4 de 5"`; John Doe → "5" + `img "5 de 5"` | Yes | happy-path png |
| Score of 0 renders as zero, not missing data | `/positions/1` | Carlos García → "0" + `img "0 de 5"`, no "N/A"/"sin dato" | Yes | happy-path png |
| Place each card in the column matching its stage id | `/positions/1` | Carlos (id 1) in "Initial Screening"; John + Jane (id 2) in "Technical Interview" — two share the stage **name**, both placed by **id**; "Manager Interview" (id 3) empty | Yes | happy-path png |
| Unknown stage id does not break the board | Playwright route stubs `/position/1/candidates` → `[Real(id 2), Ghost(id 99)]`, flow real | 3 columns render (no crash), Real Candidate placed, Ghost omitted, `console.warn "Candidate 101 has an unknown stage id 99; omitting from the board."`, 0 page errors | Yes | `./2026-09-08-demo-unknown-stage-id-99-omitted.png` |
| Candidate fetch failure keeps the board mounted | Playwright route stubs `/position/1/candidates` → 500, flow real | Title + 3 columns mounted, no cards, back control present, **0 page errors** (the 2 console errors are the 500 network resource, not a crash) | Yes | `./2026-09-08-demo-candidates-fetch-500-columns-mounted.png` |

## Evidence

### Contract (HTTP)
```
$ curl -s http://localhost:3010/position/1/candidates
[{"fullName":"John Doe","currentInterviewStep":"Technical Interview","currentInterviewStepId":2,"averageScore":5,"id":1,"applicationId":1},
 {"fullName":"Jane Smith","currentInterviewStep":"Technical Interview","currentInterviewStepId":2,"averageScore":4,"id":2,"applicationId":3},
 {"fullName":"Carlos García","currentInterviewStep":"Initial Screening","currentInterviewStepId":1,"averageScore":0,"id":3,"applicationId":4}]

$ curl -s http://localhost:3010/position/1/interviewflow  # steps (id, name, orderIndex)
[(1, 'Initial Screening', 1), (2, 'Technical Interview', 2), (3, 'Manager Interview', 2)]
```

### Happy path (browser accessibility snapshot, `/positions/1`)
```
heading "Senior Full-Stack Engineer" [h2]
column "Initial Screening" [h3] → "Carlos García" | "0" + img "0 de 5"
column "Technical Interview" [h3] → "John Doe" | "5" + img "5 de 5"
                                    "Jane Smith" | "4" + img "4 de 5"
column "Manager Interview" [h3] → (empty)
```

### Unknown stage id (Playwright route interception, `/positions/1`)
```
route GET **/position/1/candidates -> 200 [Real(stepId 2), Ghost(stepId 99)]
=> { columnsRendered: 3, realPresent: true, ghostPresent: false,
     warnings: ["Candidate 101 has an unknown stage id 99; omitting from the board.", ...],
     console errors: 0 }
```

### Candidates fetch failure (Playwright route interception, `/positions/1`)
```
route GET **/position/1/candidates -> 500
=> { title: "Senior Full-Stack Engineer",
     columnHeadings: ["Initial Screening","Technical Interview","Manager Interview"],
     anyCard: false, backControlPresent: true, pageErrors: [] }
```

### Screenshots (under this reports/ folder)
- `./2026-09-08-demo-happy-path-position-1.png`
- `./2026-09-08-demo-unknown-stage-id-99-omitted.png`
- `./2026-09-08-demo-candidates-fetch-500-columns-mounted.png`

## State
- Before: candidates for position 1 = 3 records (John/Jane at step 2, Carlos at step 1); flow = 3 steps.
- After: identical — every interaction was read-only (GET) or client-side route interception; no write reached the API or DB.
- Restored: yes — nothing to restore (no create/update/delete performed). Route stubs live only in the browser session, now closed.

## Not demonstrated
- None. All six spec scenarios exercised against the real interface (HTTP + browser). The two data-dependent
  edge cases (unknown stage id, candidates fetch failure) were driven with Playwright route interception
  because the seed data contains no unmatched id and the live API does not fail on demand.

## Handoff
The change is **demonstrably working**: the additive backend field, score-over-5 rendering (including 0),
placement by numeric stage id (with two candidates sharing a stage name resolved by id), and both edge
paths (unknown id → omit + warn, fetch 500 → columns mounted, no crash) were all exercised against the
running system and match their spec `THEN` clauses. No screenshot was left at the repository root; all
evidence is under `openspec/changes/view-candidates-in-stage/reports/`.
