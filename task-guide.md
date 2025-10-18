Task Guide

This guide outlines initial tasks to build the project to meet REQUIREMENTS.md.

1) Monorepo Setup
- Add root package.json (private), pnpm-workspace.yaml
- Folders: `frontend/`, `backend/`, `prisma/` (within backend)
- Add shared editorconfig, eslint/prettier base configs

2) Backend (Express + Prisma + MySQL)
- Initialize TypeScript config, build scripts
- Add Zod-based env loader, Prisma client singleton
- Modules: auth (register/login/refresh/logout), projects, tasks
- Middlewares: error handler, auth guard, validation
- REST routes with pagination/filter
- Jest + Supertest test setup and sample tests

3) Frontend (Vite + TS + Tailwind + shadcn/ui)
- Configure Tailwind and base design tokens
- Create QueryClient and Providers (Query + Theme + Router + Auth)
- API client with auth header and refresh handling
- Pages: Login/Register, Projects list, Project detail (tasks), Profile
- RHF + Zod forms (login/register/project/task)
- Vitest + RTL setup and sample tests

4) Dev Experience
- .env.example files (frontend/backend)
- Docker compose for MySQL
- NPM scripts for dev/build/test

5) Hardening & Polish
- Access/refresh token flows, 401 handling in frontend
- Input validation and error normalization
- Responsive layout checks (sm/md/lg/xl)

