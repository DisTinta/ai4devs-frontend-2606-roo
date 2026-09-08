# HU-5 — Estados de carga, error y vacío

**Épica:** Vista Position — Kanban de candidatos  
**Origen:** forma de trabajo del enunciado (carga, error, vacío) + kanban usable

## Historia

**Como** reclutador  
**quiero** saber qué está pasando cuando los datos no están listos o no hay candidatos  
**para** no quedarme ante una pantalla en blanco ni dudar si el sistema falló.

## Criterios de aceptación

- [ ] Mientras se cargan el flujo y/o los candidatos se muestra un **indicador de carga**.
- [ ] Si alguna petición necesaria falla, se muestra un **mensaje de error** con opción de **reintentar**.
- [ ] Si la posición **no tiene candidatos**, se muestra un **mensaje explícito** de lista vacía **y** se mantienen las columnas del proceso (estructura del kanban), cada una con un placeholder que indique que no hay candidatos en esa fase.
- [ ] Una columna sin candidatos (habiendo o no candidatos en otras) muestra un **placeholder** y **sigue aceptando** que se suelten tarjetas sobre ella (cuando HU-4 esté implementada).
- [ ] No se deja una zona de contenido totalmente vacía sin feedback en ninguno de los casos anteriores.

## Non-goals

- No diseñar un sistema global de toasts del producto más allá de lo necesario en esta vista.
- No confundir “0 candidatos en total” con “error de red”: mensajes distintos.

## Contexto técnico

- Coordinar estados de HU-2 (flujo) y HU-3 (candidatos): carga conjunta o en cascada, pero UX coherente.
- El placeholder de columna vacía es compatible con drop targets de HU-4.

## Estimación

**S** — estados UI sobre la vista ya montada.

---

<!-- The section below is an AI-generated enrichment draft. Review against the real system before accepting. -->

# [enhanced] HU-5 — Loading, error and empty states

## Reality map

### Exists
- `frontend/package.json:16` — `react-bootstrap ^2.10.2` → `Spinner`, `Alert`, `Button` for loading/error/retry.
- `frontend/package.json` — `bootstrap ^5.3.3`, `react-bootstrap-icons ^1.11.4`.
- `frontend/src/components/PositionDetail.tsx` — mount point for the states (HU-1/2/3/4 `to-create`).
- `frontend/src/services/positionService.ts` — `getInterviewFlow` / `getCandidates` (HU-2/3 `to-create`); their results/failures drive the states.
- `@testing-library/react` + `jest-dom` + `user-event` — test infra. No existing frontend test.

### To create
- Per-fetch state in `PositionDetail.tsx` (`idle/loading/success/error`) for flow + candidates — `to-create`. **Joint loading** (single indicator until both resolve). Spinner while loading; `Alert` + Retry on error; explicit empty message + columns-with-placeholder when `candidates=[]`.
- **Retry** mechanism — re-invokes only the failed fetch(es), `to-create`.
- Empty-column placeholder (inline or component) that remains a valid HU-4 drop target (dnd-kit droppable mounted with 0 cards) — `to-create`.
- `PositionDetail.test.tsx` extensions — loading→spinner; error→message+retry re-fetch; empty→message+N columns+placeholders; distinguish "0 candidates" vs "network error" — `to-create`.

### Ticket examples checked
- The ticket cites no concrete routes/paths → nothing to verify as FOUND/NOT FOUND. States sit over the fetches already mapped in HU-2/HU-3.

## 1. User story

As a recruiter, I want to know what is happening when the data is not ready or there are no candidates,
so that I am not left facing a blank screen nor unsure whether the system failed.

## 2. Acceptance criteria

### Scenario A — Loading indicator (happy path)
Given I open `/positions/1` and both the interview flow and candidates requests are pending
When the view renders (joint loading)
Then a single loading indicator is shown
And no columns or "empty"/"error" messages are shown yet.

### Scenario B — Error with retry (error)
Given the flow and/or candidates request fails (rejects or non-2xx)
When the failure is handled
Then an error message is shown with a "Retry" control (not a blank content area)
And clicking "Retry" re-issues only the failed request(s); on success the normal view renders.

### Scenario C — Empty list keeps the board (edge)
Given the flow loads with steps ["Applied","Technical"] and the candidates request resolves to `[]`
When the view renders
Then an explicit "no candidates" message is shown
And both columns still render, each with a placeholder indicating no candidates in that stage.

### Scenario D — Empty column stays a drop target (edge)
Given one column has candidates and another has none
When the view renders
Then the empty column shows a placeholder
And it remains a valid drop target (HU-4): a card can be dropped onto it once HU-4 is implemented.

### Scenario E — "0 candidates" is not "network error" (error/edge)
Given candidates resolves to `[]` (success) versus candidates rejects (failure)
When each case renders
Then the empty case shows the empty message (never the error message)
And the failure case shows the error+retry message (never the empty message)
And in neither case is the content area left blank without feedback.

## 3. Technical context

Frontend only (no backend). Extends `PositionDetail.tsx` over the HU-2/HU-3 fetches:
- Track fetch status for `getInterviewFlow` and `getCandidates` (`positionService.ts`). **Joint
  loading**: show one `Spinner` while either is pending; render the board only once both resolve.
- On error, show a react-bootstrap `Alert` with a `Button` "Retry" that re-invokes only the failed
  request(s) (flow failure → board-level error, no columns; candidates failure → error in the
  candidates area with retry). Keep the two messages distinct from the empty message (non-goal:
  never conflate "0 candidates" with "network error").
- Empty: when candidates resolve to `[]`, render the columns from the flow, each with a placeholder;
  the placeholder sits inside the dnd-kit droppable so the column still accepts drops (HU-4).
- Tests (`PositionDetail.test.tsx`, RTL/`user-event`, service mocked): spinner during pending;
  error+retry triggers a re-fetch; empty renders message + N columns + placeholders; `[]` vs reject
  render different messages.

## 4. Non-goals
- No global product-wide toast system beyond what this view needs.
- No conflating "0 candidates total" with "network error" — distinct messages.
- No backend changes.
- No per-card move error UI — that rollback/error belongs to HU-4.

## 5. Labels and estimate
- Labels: `area:frontend`, `type:feature`, `ux`, `resilience`.
- Size: **S** — loading/error/empty states over the already-mounted view; depends on HU-1/2/3, interacts with HU-4.

## INVEST
Independent: partial — depends on HU-1/2/3 (view + fetches) and coordinates with HU-4 (drop targets).
Negotiable, Valuable, Estimable (S), Small (≤ half day), Testable (5 RTL scenarios). Passes.

## Resolved decisions
- **Joint loading**: one indicator until both flow and candidates resolve, then full render.
- **Granular retry**: "Retry" re-issues only the failed request(s); flow failure = board-level error,
  candidates failure = candidates-area error.

> ⚠️ These acceptance criteria are a first draft generated by AI. Review them against the real system before accepting them: the model does not know the legacy integration that breaks on Mondays, nor the business rule that only one person remembers.
