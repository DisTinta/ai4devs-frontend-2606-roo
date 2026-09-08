---
description: What this project is, the real commands, and the things an agent cannot infer from the code.
alwaysApply: true
---

# Project Context — ai4devs-frontend-2606-roo

> Under 200 lines. English for technical artifacts. Never paste `.env` secrets here.

## What this is

LTI Talent Tracking: recruiters manage positions and candidates. Monorepo with a React CRA frontend and an Express + Prisma + PostgreSQL backend (AI4Devs S10 practice repo).

## S10 exercise backlog (read before enrich / OpenSpec)

Current delivery epic and stories live under `user-stories/`. Agents and OpenSpec changes **must** read these before inventing scope:

- **Epic (source of truth for scope, risks, API decisions):** `user-stories/00-epic-position-kanban.md`
- **User stories (one file each):** `user-stories/HU-01-*.md` … `user-stories/HU-06-*.md`
- **Exercise brief:** `user-stories/exercise-brief.md`

When enriching or proposing a change, open the epic first, then the specific HU file. Do not treat chat history as a substitute for those paths.

## Runtime topology

Docker Compose runs **only Postgres** (`db`). Frontend and backend run on the host with npm.

Startup order (local):

1. From repo root: `docker compose up -d` (needs root `.env` with `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` — do not print values).
2. Backend: ensure `backend/.env` has `DATABASE_URL`; then `npx --prefix backend prisma generate` and migrations as needed.
3. API: `npm --prefix backend run dev` → **http://localhost:3010**
4. UI: `npm --prefix frontend start` → **http://localhost:3000**

Without all three (DB + API + UI), browser demos and Playwright checks will fail. **Unit tests do not need Docker** (Prisma is mocked).

## Commands

Verified against this repository. If a command is not listed, do not invent one.

- Database: `docker compose up -d` / `docker compose down` (never `down -v` unless a human explicitly asks to wipe volumes)
- Backend dev: `npm --prefix backend run dev`
- Backend build: `npm --prefix backend run build` then `npm --prefix backend start`
- Backend tests: `npm --prefix backend test`
- Backend test filter: `npm --prefix backend test -- <pattern>`
- Backend types: `npx --prefix backend tsc --noEmit`
- Backend format file: `npx --prefix backend prettier --write <path>`
- Prisma generate: `npx --prefix backend prisma generate`
- Prisma migrate (deploy): `npx --prefix backend prisma migrate deploy`
- Prisma migrate (local create/apply): `npx --prefix backend prisma migrate dev` — human-supervised
- Frontend install/start: `npm --prefix frontend install` / `npm --prefix frontend start`
- Frontend build: `npm --prefix frontend build`
- Frontend tests: `npm --prefix frontend test`
- No backend `npm run lint` script exists.

## Testing

- Backend Jest + ts-jest; tests live next to sources under `backend/src/**/*.test.ts`.
- Current suite mocks `@prisma/client` — tests run without Postgres. Stop hook uses `CMD_TEST` (`KIT_SKIP_STOP_TESTS=0`).
- Frontend Jest via the frontend package. `frontend/jest.config.js` (jsdom, babel-jest + `babel-preset-react-app`, CSS→`identity-obj-proxy`, `src/setupTests.ts` for jest-dom) — added in `access-position-detail`; the `test` script had referenced it before the file existed. `@testing-library/user-event` is **v13** (no `userEvent.setup()`; call `userEvent.click(...)` directly). RTL tests render components under `MemoryRouter`.
- Do not convert `CMD_TEST` into a live-DB integration suite without an explicit decision.

## Branch and ticket conventions

- Branch naming: `feature/<ticket-id>`
- Ticket id format: short slug or course id (e.g. `S10-positions-filter`)
- Base branch: `main` (or the repo default if different)

## Operational constraints

- Never commit **new** `.env` contents, tokens, or PII. (Exception: the existing tracked `.env` and `backend/.env` are intentional AI4Devs S10 exercise fixtures — see Gotchas. Do not treat them as a leak, but do not add new secrets either.)
- Do not edit anything under `openspec/` as output of implementation (it is workflow input once OpenSpec is initialised).
- Do not add dependencies without justifying them in the PR.
- Do not force-push. Ever.
- Do not edit migrations already applied on the base branch: create a new one.
- Do not run `docker compose down -v` or `prisma migrate reset` unless a human explicitly requests destructive reset.
- Prefer fixing behaviour inside existing layers; do not invent `packages/` or Vite without a ticket.
- **Mandatory course log:** keep `prompts/prompts-CRN.md` updated with **significant curated prompts** for the exercise (not the full chat transcript). Each entry: `### Prompt N — …`, the prompt in a fenced code block, a short result note, optional **Por qué funcionó.**, and **Ajuste humano.** for what was changed or rejected. Cover install/adaptation, findings/fixes, and process rules; skip small back-and-forth.

## Gotchas

- Root `package.json` is minimal; real apps live under `frontend/` and `backend/`.
- Compose does **not** start Node processes — only Postgres.
- Domain models under `backend/src/domain/models` currently own Prisma calls (no separate infrastructure folder).
- Frontend services hard-code `http://localhost:3010` in places — keep that consistent in local work.
- The positions list is a **mock** (`mockPositions` in `Positions.tsx`) with hard-coded `id`s (1–3); there is no `GET /positions` list endpoint. `/positions/:id` addresses the detail view by that mock id. A later HU can swap the id source behind the same route.
- Frontend services use the **native `fetch` API**, not axios (axios is not installed; see `docs/adr/20260908-frontend-http-native-fetch.md`). `candidateService.js` was migrated from an undeclared axios import to `fetch`.
- `GET /position/:id/interviewflow` is **double-nested**: title at `data.interviewFlow.positionName`, steps at `data.interviewFlow.interviewFlow.interviewSteps`. `positionService.getInterviewFlow` unwraps it and sorts steps by `orderIndex`; consume that, do not re-parse the raw shape.
- `GET /position/:id/candidates` is a **flat array** (no `{ candidates }` envelope, unlike interviewflow). Each item carries `currentInterviewStepId` (numeric stage id, added per ADR 20260908) plus `currentInterviewStep` (stage name), `averageScore`, `id`, `applicationId`. Place cards in columns by the numeric `currentInterviewStepId`, not by name (stage names can repeat).
- **`.env` credentials are exercise fixtures:** `.env` and `backend/.env` (DB_USER, DB_PASSWORD, DATABASE_URL) are tracked since the Initial commit on purpose — AI4Devs S10 gave them; this is a practice repo, not production. No untracking/rotation needed.
- `PUT /candidates/:id/stage` is an **additive alias** of `PUT /candidates/:id` (HU-4) — same controller/service, clearer verb for the kanban stage move. Both routes stay; body is `{ applicationId, currentInterviewStep }` where `currentInterviewStep` is the numeric destination step id.
- Drag-and-drop uses **`@dnd-kit/core`** (see ADR 20260908 — dnd-kit). Its pointer drag cannot run in jsdom, so `PositionDetail.dnd.test.tsx` mocks `@dnd-kit/core` to capture the `onDragEnd` handler and the data each card registers, then synthesizes drops. Real drag is covered by the Playwright E2E, not the unit suite.
- OpenSpec may still need `openspec init` after the harness install.
- Kit skills/agents are copies under `.claude` / `.cursor` when symlinks are unavailable: edit `ai-specs/` and run `.claude\sync-artifacts.ps1` to propagate.
