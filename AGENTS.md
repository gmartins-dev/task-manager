# AGENTS.md

This file guides AI agents and contributors working in this repository. It defines code conventions, structure, and guardrails for a full‑stack app using:

- React (Vite), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query, Zustand, Vitest, React Testing Library
- Node.js (Express), TypeScript, Prisma ORM, MySQL, JWT auth, REST APIs, Jest (+ Supertest)

If more specific rules exist in nested `AGENTS.md` files (e.g., `frontend/AGENTS.md`, `backend/AGENTS.md`), they take precedence for their directories.

## Repo Layout (expected)

- `frontend/` — Vite + React (TS) app, Tailwind, shadcn/ui, RHF + Zod, TanStack Query, Zustand.
- `backend/` — Express (TS) API server, Prisma + MySQL, JWT auth, Zod validation.
- `prisma/` — Prisma schema and migrations (if not embedded in `backend/`).

Adapt these rules if the actual layout differs, but keep the same intent and structure.

## Engineering Principles

- TypeScript‑first: Prefer `.ts`/`.tsx`. Use JSDoc types if JS is unavoidable.
- SOLID, Clean Code: Small, composable modules; single responsibility; dependency inversion at module boundaries.
- Consistent UI and design system: Centralize tokens and primitives; reuse shadcn/ui components.
- Separation of concerns: UI, state, data fetching, and validation are distinct layers.
- Security: Never commit secrets. Minimize token exposure; prefer httpOnly cookies for refresh tokens.
- Tests: Add/maintain tests for changed logic. Prefer unit tests nearest the code + integration tests for critical flows.

## Tooling and Runtimes

- Node 18+ (LTS). Package manager: `pnpm` preferred, else `npm`/`yarn`.
- MySQL 8+. Local DB via Docker is recommended (see `docker-compose.yml`).
- Lint/format: ESLint + Prettier (respect existing configs).

## Environment Variables (expected)

- Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `PORT`, `CORS_ORIGIN`.
- Frontend: `VITE_API_URL` (base URL to backend). Avoid leaking secrets into client bundles.

## Conventions: General

- Naming: `kebab-case` for files, `PascalCase` for components/types, `camelCase` for vars/functions.
- Exports: Prefer named exports; avoid default exports for shared modules.
- Error handling: Centralized handlers; never throw raw errors across HTTP boundaries.
- Validation: Use Zod schemas at boundaries (HTTP, config, forms). Align frontend and backend schemas when possible.
- Accessibility: Follow WAI‑ARIA; ensure keyboard navigation; color‑contrast compliant.
- Responsiveness: Mobile‑first with Tailwind breakpoints; test on small, medium, large widths.

## Testing

- Frontend: Vitest + React Testing Library. Test behavior, not implementation details.
- Backend: Jest + Supertest. Favor fast unit tests + a few integration tests. Consider a separate test DB/schema.

## Agent Guardrails

- Do not change environment management or secrets without explicit instruction.
- Keep changes scoped; avoid cross‑cutting refactors unless requested.
- Update or add tests for modified logic. Do not lower coverage without reason.
- Prefer creating/using feature folders over monolithic modules.
- If conventions differ from this file, update the nearest `AGENTS.md` and call it out in PR notes.

## Quickstart (indicative; adapt to actual scripts)

- Frontend: `pnpm --filter frontend dev | build | test`
- Backend: `pnpm --filter backend dev | build | test`
- Prisma: `pnpm --filter backend prisma migrate dev && prisma generate`

Refer to `frontend/AGENTS.md` and `backend/AGENTS.md` for scoped details.
