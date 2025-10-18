Gerenciador de Tarefas Monorepo

Scripts
- Raiz:
  - `pnpm -r install` - instala todas as dependencias do workspace
  - `pnpm dev` (atalho para `pnpm run dev:stack`) - sobe MySQL (Docker), backend (4000) e frontend (5173)
  - `pnpm run dev:down` - encerra o container do MySQL
  - Backend: `pnpm --filter backend dev`
  - Frontend: `pnpm --filter frontend dev`
  - Testes: `pnpm --filter backend test`, `pnpm --filter frontend test -- --run`

Ambiente
- Inicie o MySQL com `docker compose up -d`
- Em `backend/` copie `.env.example` para `.env` e configure:
  - `DATABASE_URL` (banco principal)
  - `SHADOW_DATABASE_URL` (usuario root) para permitir o shadow database do Prisma Migrate
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`
- Em `frontend/` copie `.env.example` para `.env` e ajuste `VITE_API_URL` (padrao `http://localhost:4000`)
- Execute a preparacao do banco:
  - `pnpm --filter backend prisma migrate dev`
  - `pnpm --filter backend prisma generate` (se precisar regerar o client)

Destaques da Implementacao
- Backend: Express (TypeScript), Prisma (MySQL) com enum de status, data limite obrigatoria, filtros e ordenacao, autenticacao JWT com refresh rotativo, validacao Zod, testes Jest + Supertest.
- Frontend: Vite + React (TypeScript), Tailwind + componentes shadcn/ui, autenticacao com Zustand persistida, React Query para dados, formularios com React Hook Form + Zod, Vitest + Testing Library.
- Funcionalidades: CRUD de projetos, CRUD de tarefas com status, filtro por status, ordenacao por data de entrega, UI responsiva e rotas protegidas com refresh automatico.
- Consulte `REQUIREMENTS.md` e `task-guide*.md` para detalhes completos e proximos passos sugeridos.
