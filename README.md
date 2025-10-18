Task Manager Monorepo

Scripts
- Root:
  - `pnpm -r install` to install all deps
  - `pnpm dev` (or `pnpm run dev:stack`) to start MySQL, backend (4000) and frontend (5173) together
  - `pnpm run dev:down` to stop the MySQL container when you are done
  - Backend only: `pnpm --filter backend dev`
  - Frontend only: `pnpm --filter frontend dev`
  - Tests: `pnpm --filter backend test`, `pnpm --filter frontend test`

Environment
- Start MySQL via `docker compose up -d`
- Copy `.env.example` to `.env` in `backend/`, set `DATABASE_URL` and JWT secrets
- Copy `frontend/.env.example` to `frontend/.env`
- Run `pnpm --filter backend prisma generate` and `pnpm --filter backend prisma migrate dev`

Notes
- Backend: Express (TS), Prisma (MySQL), JWT auth with httpOnly refresh cookie, Zod validation, Jest + Supertest tests
- Frontend: React (Vite TS), Tailwind, Query, Zustand, RHF + Zod, Vitest + RTL tests
- See REQUIREMENTS.md and task-guide.md for scope and tasks
