Project Requirements

Goal: Implement a full-stack task manager with a modern, type-safe, secure stack.

Stack
- Frontend: React (Vite, TypeScript), Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Vitest, React Testing Library
- Backend: Node.js (Express, TypeScript), Prisma ORM, MySQL, JWT authentication, Zod validation, REST APIs, Jest + Supertest

Functional Requirements
- User authentication: register, login, refresh, logout
- Projects: CRUD projects owned by a user
- Tasks: CRUD tasks within a project; assign, mark complete, due dates, priority
- Filters: query by project, status, search text, date range
- Responsive UI: mobile-first; usable on phones and desktops
- Error handling: user-friendly UI errors and proper HTTP responses

Non-Functional Requirements
- Type-safety across stack (TypeScript, Zod validation)
- Secure auth: short-lived access token, httpOnly refresh cookie
- Performance: client-side caching with TanStack Query; minimal overfetching on server (Prisma selects)
- Accessibility: keyboard navigation, ARIA attributes, visible focus states
- Testing: unit + integration tests (frontend with Vitest/RTL, backend with Jest/Supertest)

Environment & Tooling
- Node 18+, pnpm preferred
- MySQL 8+ (Docker compose provided)
- .env management with examples for frontend/backend

Deliverables
- Monorepo with `frontend/` and `backend/`
- Backend Express API with modules for auth, projects, tasks
- Prisma schema and migration setup
- Frontend app with auth flow, project/task screens, and design system primitives
- Tests and scripts to run dev/build/test

