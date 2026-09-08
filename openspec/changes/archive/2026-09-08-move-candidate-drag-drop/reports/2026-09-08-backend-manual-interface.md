# Manual Interface Testing Report

- Date: 2026-09-08
- Change: move-candidate-drag-drop
- Step: 7. Backend: Manual Interface Testing (AGENT EXECUTED)

## Environment
- Postgres via `docker compose` (already up), API on http://localhost:3010 (already running), verified with `GET /position/1/candidates` → 200.
- Baseline entity: candidate `id=1` (John Doe), `applicationId=1`, `currentInterviewStepId=2` (Technical Interview).
- Flow steps for position 1: `1` Initial Screening, `2` Technical Interview, `3` Manager Interview.

## Success path (and restore)
- `PUT /candidates/1/stage` body `{"applicationId":1,"currentInterviewStep":3}`
  → `HTTP 200`, `message: "Candidate stage updated successfully"`, persisted `currentInterviewStep: 3`.
  Verified via `GET /position/1/candidates`: candidate 1 now `currentInterviewStepId: 3` (Manager Interview).
- **Restore**: `PUT /candidates/1/stage` body `{"applicationId":1,"currentInterviewStep":2}`
  → `HTTP 200`. Verified candidate 1 back to `currentInterviewStepId: 2` (Technical Interview).

## Error cases
- Invalid body (missing `currentInterviewStep`): `PUT /candidates/1/stage` body `{"applicationId":1}`
  → `HTTP 400`, `{"error":"Invalid currentInterviewStep format"}`. No stage change persisted.
- Unknown application: `PUT /candidates/1/stage` body `{"applicationId":999999,"currentInterviewStep":2}`
  → `HTTP 404`, `{"message":"Application not found"}`.

## Data state verification
- Pre-test: candidate 1 → step 2.
- Post-test: candidate 1 → step 2 (mutation applied then reverted).
- State restored: Yes.

## Outcome
- Status: PASS — the additive `PUT /candidates/:id/stage` route persists the stage on success, rejects
  invalid input with 400, and returns 404 for an unknown application. State restored.
