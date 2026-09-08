# Show Spec Working — access-position-detail

Live browser demonstration via Playwright MCP against the running dev server
(`http://localhost:3000`, HTTP 200 on `/positions`). Frontend-only change; no persistent
data touched.

## Demonstrated

| Scenario | Interaction | Result | Matches spec | Evidence |
|---|---|---|---|---|
| Click "Ver proceso" navigates to the detail route | On `/positions`, click "Ver proceso" on card id 1 | URL → `/positions/1`, heading "Posición 1", back control present | Yes | [scenario1](./2026-09-08-show-scenario1-detail-id-1.png) |
| Open a detail URL directly (deep-link) | Navigate directly to `/positions/2` | Detail for id 2 renders ("Posición 2"), URL stays `/positions/2`, no redirect | Yes | snapshot below |
| Activate the back control | On `/positions/3`, activate back control | URL → `/positions`, positions list ("Posiciones") shown again | Yes | snapshot below |
| No global chrome change between routes | Move between `/positions` and `/positions/:id` | No `banner`/`navigation`/`contentinfo` landmark on either route; only inner content region changes | Yes | snapshots below |
| Open a detail URL for an unknown id | Navigate to `/positions/does-not-exist` | Shell renders without crash (title + back control), "Posición no encontrada" in content region, back control → `/positions` | Yes | [scenario5](./2026-09-08-show-scenario5-unknown-id.png) |

## Evidence

### Scenario 1 — click "Ver proceso" id 1
`/positions` list rendered; card id 1 link `/url: /positions/1`. After click:
- Page URL: `http://localhost:3000/positions/1`
- Snapshot: `link "Volver a posiciones" (/url: /positions)`, `heading "Posición 1" [level=2]`,
  `paragraph: Detalle de la posición en construcción.`

### Scenario 2 — deep link `/positions/2`
- Page URL: `http://localhost:3000/positions/2` (unchanged, no redirect)
- Snapshot: `heading "Posición 2" [level=2]`, back control `/url: /positions`.

### Scenario 3 — back control on `/positions/3`
- Detail snapshot: `heading "Posición 3"`, back control `/url: /positions`.
- After clicking back: Page URL `http://localhost:3000/positions`, `heading "Posiciones" [level=2]`
  with the three cards.

### Scenario 4 — no global chrome
Across `/positions` and every `/positions/:id` snapshot, no `banner`, `navigation`, or
`contentinfo` landmark appears. Only the inner content region differs between list and detail.

### Scenario 5 — unknown id `/positions/does-not-exist`
- Page URL: `http://localhost:3000/positions/does-not-exist` (no crash, no redirect)
- Snapshot: `link "Volver a posiciones" (/url: /positions)`, `heading "Posición does-not-exist"`,
  `paragraph: Posición no encontrada.`
- Clicked back control → Page URL `http://localhost:3000/positions`.

## State
- Before: dev server up, HTTP 200 on `/positions`. No database or persistent store involved
  (mock positions live in `Positions.tsx`).
- After: no file/data mutation from the demonstration (navigation + clicks only).
- Restored: yes — nothing to undo; browser closed.

## Not demonstrated
None. All five scenarios exercised against the real UI.

---
**Handoff:** change is **demonstrably working**. All five spec scenarios pass against the running
app. No screenshot left at the repository root — captures saved under
`openspec/changes/access-position-detail/reports/`. Browser closed.
