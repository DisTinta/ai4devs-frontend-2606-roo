## Why

Today the position board silently swallows the in-between moments: while the flow and candidates
requests are pending the recruiter sees a bare shell, a failed fetch leaves an empty area with no
explanation, and a position with zero candidates looks identical to a network error. HU-1/2/3 only
guaranteed "no crash" and explicitly deferred the rich states to HU-5. This change gives the recruiter
clear feedback for every data-readiness state so they never face a blank screen or wonder whether the
system failed.

## What Changes

- **Joint loading:** while either `getInterviewFlow` or `getCandidates` is pending, the view shows a
  single loading indicator and renders no columns, empty or error messages yet; the board renders only
  once both resolve.
- **Error with granular retry:** a failed request shows a react-bootstrap `Alert` with a "Retry"
  control (never a blank area). A flow failure is a board-level error (no columns); a candidates
  failure is an error in the candidates area. "Retry" re-issues **only** the failed request(s); on
  success the normal view renders.
- **Empty list:** when candidates resolve to `[]`, the view shows an explicit "no candidates" message
  and still renders one column per stage, each with a placeholder.
- **Empty column stays a drop target:** the placeholder sits inside the dnd-kit droppable so an empty
  column remains a valid HU-4 drop target (a card can be dropped onto it).
- **"0 candidates" is never "network error":** the empty case shows the empty message only; the
  failure case shows the error+retry message only; the two are never conflated and the content area is
  never left blank without feedback.

## Capabilities

### New Capabilities
- `position-board-states`: the position board's data-readiness presentation — joint loading, error
  with granular retry, empty-list messaging, and the empty-column drop target — layered over the
  existing HU-2/HU-3 flow and candidates fetches.

### Modified Capabilities
<!-- none. The existing "no crash" requirements in position-interview-flow and position-candidates
     remain valid and are realized (not contradicted) by this new capability, which they already
     defer to as HU-5. -->

## Impact

- **Frontend code:** `frontend/src/components/PositionDetail.tsx` (per-fetch status tracking for flow
  and candidates, joint loading, error+retry, empty message, empty-column placeholder inside the
  droppable). `PositionDetail` test extensions.
- **No backend, API, dependency or data changes.** Reuses the already-installed `react-bootstrap`
  (`Spinner`, `Alert`, `Button`) and the existing `positionService` fetches.
- **Interacts with HU-4:** the empty-column placeholder must keep the column's dnd-kit droppable
  mounted so it still accepts drops.
- **Privacy/auth/logging:** none — pure presentation over data already fetched.
- **Depends on:** HU-1/2/3 (view + fetches); coordinates with HU-4 (drop targets).
