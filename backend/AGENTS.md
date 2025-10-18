 # AGENTS.md (Backend Scope)
 
 Scope: Applies to everything under `backend/`.
 
 Stack: Node.js + Express (TypeScript), Prisma ORM, MySQL, JWT auth, REST APIs, Zod, Jest (+ Supertest).
 
 ## Folder Structure (expected)
 
 - `src/index.ts` — Server bootstrap (http listening only).
 - `src/app.ts` — Express app (middlewares, routes, error handling).
 - `src/config/` — Env parsing (Zod), constants, Prisma client singleton.
 - `src/modules/<domain>/` — Feature modules:
   - `router.ts` (Express Router)
   - `controller.ts`
   - `service.ts`
   - `repository.ts` (Prisma access)
   - `schemas.ts` (Zod request/response)
 - `src/middlewares/` — Auth, validation, error handling.
 - `src/utils/` — Helpers (crypto, dates, pagination).
 - `src/auth/` — JWT utils, password hashing, tokens, guards.
 - `tests/` — Unit and integration tests (Jest + Supertest).
 - `prisma/schema.prisma` — Prisma schema and migrations directory.
 
 ## Prisma & Database
 
 - Keep a single PrismaClient instance (singleton) to avoid connection storms.
 - Run migrations via `prisma migrate dev` in development; `migrate deploy` in CI/prod.
 - Use repositories to isolate data access and enable service‑level tests.
 - Prefer explicit `select`/`include` to control payload size and prevent overfetching.
 
 ## Env & Config
 
 - Parse env with Zod at startup; fail fast on invalid/missing vars.
 - Expected: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`.
 - Configure CORS minimally; allow only required origins and credentials if using cookies.
 
 ## Auth
 
 - Use short‑lived access tokens (Authorization: Bearer) and longer‑lived refresh tokens in httpOnly, secure cookies.
 - Hash passwords with bcrypt.
 - Middleware: `authenticate` (verifies access token), `authorize` (checks roles/permissions if applicable).
 - Refresh route rotates refresh tokens and revokes old ones when feasible.
 
 ## Validation & Errors
 
 - Validate request input with Zod at the router boundary. On failure, respond with 400 and structured error details.
 - Map domain/service errors to HTTP codes in a centralized error handler.
 - Never leak internal error stacks in production responses.
 
 ## REST Conventions
 
 - Use nouns and plural forms: `/users`, `/projects/:id/tasks`.
 - Proper status codes: 200/201/204 success; 400 validation; 401/403 auth; 404 not found; 409 conflict; 429 rate limit; 5xx server.
 - Support pagination (`page`, `limit`), filtering, sorting where appropriate.
 
 ## Testing
 
 - Jest for unit tests; Supertest for HTTP integration.
 - Use an isolated test database or transactional tests; clean state between tests.
 - Seed minimal fixtures per test; avoid cross‑test coupling.
 
 ## Observability
 
 - Logging: prefer pino for structured logs. Redact secrets.
 - Health: `/health` and `/ready` endpoints for liveness/readiness.
 
 ## Scripts (indicative)
 
 - `pnpm dev` — Start with ts‑node‑dev/nodemon.
 - `pnpm build` — Compile with `tsc`.
 - `pnpm start` — Run compiled server (`node dist/index.js`).
 - `pnpm test` — Run Jest.
 - `pnpm prisma <cmd>` — Prisma CLI (migrate, generate, studio).
 
 ## Agent Guardrails (Backend)
 
 - Do not commit generated Prisma files or `.env`.
 - Keep controller thin; business logic lives in services; DB logic in repositories.
 - Add/adjust tests when changing service/repository contracts or routes.
 - Avoid breaking API contracts; if necessary, version endpoints.
 
