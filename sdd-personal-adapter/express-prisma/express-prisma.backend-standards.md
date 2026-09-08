---
description: Backend development standards for Express + Prisma — layered architecture, validation, persistence, API design and testing.
globs: ["backend/**/*.{ts,js}"]
alwaysApply: true
---

# Backend Standards — Express + Prisma

## 1. Technology stack

- **Express** 4 on Node.js, TypeScript in `backend/`.
- **Prisma** 5 against PostgreSQL (Docker Compose service `db` only).
- **Validation** in `backend/src/application/validator.ts` (and callers in services).
- **Jest** + **ts-jest** — unit tests colocated next to the code (`*.test.ts`).
- **ESLint** + **Prettier** present; there is no `lint` npm script — format with Prettier.
- API docs: `backend/api-spec.yaml` + Swagger UI wired in the app.

## 2. Layered architecture

A vertical slice is implemented in this order, in these locations:

1. `backend/src/**/**.test.ts` — failing test first (human-authored or supervised).
2. `backend/src/application/validator.ts` (or extend it) — shape of external input.
3. `backend/src/domain/models/<Entity>.ts` — domain entity (today also persists via Prisma).
4. `backend/src/application/services/<name>Service.ts` — use-case / business orchestration.
5. `backend/src/presentation/controllers/<name>Controller.ts` — validate/delegate/serialise HTTP.
6. `backend/src/routes/<name>Routes.ts` — register the route on the Express router.

Dependency direction intended: routes → controllers → services → domain. Do not reverse it.

**AS-IS gotcha:** there is no `infrastructure/` package. Domain models under `domain/models` instantiate `PrismaClient` and run queries. Do not invent a new persistence layer unless the ticket explicitly asks for that refactor. When adding behaviour, follow the existing pattern unless the change is scoped to extract persistence.

## 3. Hard rules

- Business orchestration lives in `backend/src/application/services`. **Never** put use-case logic in routes.
- Controllers do three things: read the request, call a service, write the response. No Prisma in controllers.
- Application services must not import `express` or know HTTP status codes; throw domain/application errors.
- Every external input crosses validation before persistence.
- Listings that return API data must be intentional about fields (no silent dump of internal rows when serialising for HTTP).
- Prefer explicit TypeScript types on public service methods; avoid new `any` when you can type the DTO.
- File names: camelCase for services/controllers (`candidateService.ts`); domain classes PascalCase.

## 4. Validation

- Shared rules live in `backend/src/application/validator.ts`.
- Closed sets of domain values are declared once and reused.
- Validation error messages are part of the API contract with the client.

## 5. Persistence

- Schema and history: `backend/prisma/schema.prisma` and `backend/prisma/migrations/`.
- Never edit a migration already applied on the shared base branch: create a new one.
- Runtime needs Postgres up (`docker compose up -d`) and `DATABASE_URL` in `backend/.env` (never commit secrets).
- After schema changes: `npx --prefix backend prisma generate`, then migrate.
- Seed: `backend/prisma/seed.ts` when the README flow requires sample data.
- Transactions when one use case writes more than one aggregate that must stay consistent.

## 6. API design

- Routes under Express routers in `backend/src/routes/`, mounted from `backend/src/index.ts`.
- Backend listens on **port 3010** in local dev.
- Keep response shapes consistent with existing endpoints; check `backend/api-spec.yaml` before inventing a new shape.
- CORS is enabled for the local frontend.

## 7. Testing

- Runner: Jest (`npm --prefix backend test`). Filter: `npm --prefix backend test -- <pattern>`.
- Existing unit tests **mock** `@prisma/client` / PrismaClient. They do **not** require Docker.
- Arrange-Act-Assert with the three blocks separated and commented.
- Do not turn the Stop-hook `CMD_TEST` into an integration suite that needs a live database without an explicit project decision.
- If you add true integration tests against Postgres, keep them in a separate command and document that Docker must be up.

## 8. Definition of done for a backend change

- Tests for the new behaviour exist and were seen failing before implementation.
- Controllers stay free of Prisma and business branching.
- Migrations (if any) are new files only; `/migration-review` mindset for destructive SQL.
- `npx --prefix backend tsc --noEmit` clean for touched types when practical.
- No secrets or `.env` contents in commits, prompts, or docs.
