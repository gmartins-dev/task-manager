Task Manager Monorepo

Scripts
- Root:
  - `pnpm -r install` — install all workspace deps
  - `pnpm dev` (alias of `pnpm run dev:stack`) — boot MySQL (Docker), backend (4000) and frontend (5173)
  - `pnpm run dev:down` — stop the MySQL container
  - Backend only: `pnpm --filter backend dev`
  - Frontend only: `pnpm --filter frontend dev`
  - Run tests: `pnpm --filter backend test`, `pnpm --filter frontend test -- --run`

Environment
- Start MySQL with `docker compose up -d`
- In `backend/` copy `.env.example` → `.env` and configure:
  - `DATABASE_URL` for the main DB
  - `SHADOW_DATABASE_URL` (root user) so Prisma Migrate can create a shadow database
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`
- In `frontend/` copy `.env.example` → `.env` and set `VITE_API_URL` (defaults to `http://localhost:4000`)
- Run database setup:
  - `pnpm --filter backend prisma migrate dev` (creates migrations & syncs schema)
  - `pnpm --filter backend prisma generate` (if you need to regenerate the client)

Implementation Highlights
- Backend: Express (TS), Prisma (MySQL) with task status enum, due date support, filtering and sorting APIs, JWT auth with rotating refresh tokens, Zod validation, Jest + Supertest coverage for critical flows.
- Frontend: Vite + React (TS), Tailwind + shadcn/ui components, Zustand auth store with token persistence, React Query for data fetching, forms built with React Hook Form + Zod, Vitest + Testing Library.
- Features: projects CRUD, task CRUD with status management, due date sorting, status filters, responsive UI, guarded routes with automatic token refresh.
- See `REQUIREMENTS.md` and `task-guide*.md` for detailed specification and remaining backlog ideas.
