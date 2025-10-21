Gerenciador de Tarefas Monorepo
===============================

Aplicacao moderna de gerenciamento de tarefas construida como monorepo (frontend + backend). Os usuarios autenticam via JWT, organizam projetos e administram tarefas em tabela ou kanban com drag-and-drop otimizado.

Conteudo
--------
- [Visao Geral](#visao-geral)
- [Recursos Principais](#recursos-principais)
- [Stack Tecnologico](#stack-tecnologico)
- [Primeiros Passos](#primeiros-passos)
- [Scripts Disponiveis](#scripts-disponiveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Deploy em Producao (Railway + Vercel)](#deploy-em-producao-railway--vercel)
- [Testes](#testes)

Visao Geral
-----------
- Frontend React hospedado na Vercel: https://task-manager-frontend-three-woad.vercel.app
- Backend Express + Prisma hospedado na Railway: https://backend-production-84dd.up.railway.app
- Banco de dados MySQL via Railway.

Recursos Principais
-------------------
- **Autenticacao**
  - Registro e login com JWT (access token + refresh httpOnly).
  - Refresh automatico quando expira o access token.
  - Logout limpa o cookie de refresh.
- **Projetos**
  - CRUD de projetos pessoais e listagem paginada via cards.
- **Tarefas**
  - CRUD completo com titulo, descricao, status (PENDING, IN_PROGRESS, COMPLETED) e data de entrega.
  - Kanban com arrastar e soltar; mover a tarefa muda o status com atualizacao otimista.
  - Tabela com filtro por status, ordenacao por data e suporte a teclado.
  - Dialogs para criacao, edicao e remocao.
- **UX**
  - Tema claro/escuro com preferencia do usuario e persistencia local.
  - Layout responsivo (desktop, tablet, mobile).
  - Mensagens em portugues do Brasil conforme guardrails.

Stack Tecnologico
-----------------
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS 3, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, @dnd-kit.
- **Backend**: Node 20, Express, TypeScript, Prisma ORM, MySQL 8, validacao com Zod, JWT (access + refresh).
- **Ferramentas**: pnpm workspaces (pnpm 10), Vitest + Testing Library (frontend), Jest + Supertest (backend), Docker Compose para MySQL local, Railway (backend + DB) e Vercel (frontend).

Primeiros Passos
----------------
### Pre-requisitos
- Node.js 20.x (via `engines`).
- pnpm 10.x (`corepack enable pnpm` e `corepack use pnpm@10` se necessario).
- Docker (opcional, usado para o MySQL local).

### 1. Instalar dependencias
```bash
pnpm -r install
```

### 2. Subir banco de dados local (opcional)
```bash
docker compose up -d
```

### 3. Configurar variaveis de ambiente
- `backend/.env` (exemplo para desenvolvimento local)
  ```
  DATABASE_URL="mysql://app:app@localhost:3306/task_manager"
  SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/task_manager_shadow"
  JWT_SECRET="substitua"
  JWT_REFRESH_SECRET="substitua"
  NODE_ENV="development"
  PORT="4000"
  CORS_ORIGIN="http://localhost:5173"
  ```
- `frontend/.env`
  ```
  VITE_API_URL=http://localhost:4000
  ```
- Para testar o frontend local contra o backend em producao, edite `frontend/.env.development` para `https://backend-production-84dd.up.railway.app`.

### 4. Rodar migracoes e gerar Prisma Client
```bash
pnpm --filter backend prisma migrate dev
pnpm --filter backend prisma generate
```

### 5. Iniciar todo o stack (backend + frontend + DB)
```bash
pnpm dev
```
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Para desligar o banco: `pnpm run dev:down`.

Scripts Disponiveis
-------------------
Executados a partir da raiz do monorepo:

| Comando | Descricao |
| --- | --- |
| `pnpm dev` | Sobe MySQL (Docker), backend (`ts-node-dev`) e frontend (Vite) |
| `pnpm run dev:db` / `pnpm run dev:down` | Inicia ou encerra apenas o MySQL |
| `pnpm --filter backend dev` | Executa o backend em modo desenvolvimento |
| `pnpm --filter frontend dev` | Executa o frontend |
| `pnpm --filter backend build` | Compila o backend (tsc) |
| `pnpm --filter frontend build` | Compila o frontend (tsc + vite build) |
| `pnpm --filter backend prisma migrate deploy` | Aplica migracoes em producao |
| `pnpm --filter backend test` | Testes backend (Jest + Supertest) |
| `pnpm --filter frontend test -- --run` | Testes frontend (Vitest + RTL) |

Estrutura do Projeto
--------------------
```
task-manager/
├─ backend/
│  ├─ src/
│  │  ├─ app.ts             # Express app (CORS, rotas, middlewares)
│  │  ├─ index.ts           # Bootstrap do servidor
│  │  ├─ config/            # Env schema, Prisma client
│  │  ├─ modules/           # Auth, projects, tasks
│  │  └─ middlewares/       # validate, authenticate, error handler
│  └─ prisma/schema.prisma
├─ frontend/
│  ├─ src/
│  │  ├─ main.tsx           # Monta React + providers
│  │  ├─ router.tsx         # Rotas publicas/privadas
│  │  ├─ shell/             # Layout principal
│  │  ├─ components/        # UI shadcn, ThemeToggle etc.
│  │  ├─ routes/            # Paginas (login, register, projects, project)
│  │  ├─ features/          # Dominios (projects list, project board)
│  │  └─ stores/            # Zustand auth store
│  └─ index.css             # Tailwind base + tokens
├─ docker-compose.yml
├─ README.md
└─ pnpm-workspace.yaml
```

API
---
Base local: `http://localhost:4000`
Base producao: `https://backend-production-84dd.up.railway.app`

- `POST /auth/register` / `POST /auth/login` -> `{ user, accessToken }` + cookie refresh.
- `POST /auth/refresh` -> novo access token (requer cookie httpOnly).
- `POST /auth/logout` -> remove cookie.
- `GET /projects` -> lista projetos do usuario logado.
- `POST /projects` -> cria projeto.
- `GET /projects/:id` -> detalhes com tarefas.
- `PATCH /projects/:id` / `DELETE /projects/:id`.
- `GET /projects/:projectId/tasks` -> aceita `?status=` e `sort=dueDateAsc|dueDateDesc`.
- `POST /projects/:projectId/tasks`.
- `PATCH /projects/tasks/:id` -> atualiza titulo, descricao, status, due date.
- `DELETE /projects/tasks/:id`.
- `GET /health` -> health check.

Todas as rotas autenticadas exigem header `Authorization: Bearer <accessToken>` e o cookie de refresh para manter a sessao.

Deploy em Producao (Railway + Vercel)
-------------------------------------
- **Backend (Railway)**
  - Variaveis obrigatorias: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `PORT=8080`, `CORS_ORIGIN="https://task-manager-frontend-three-woad.vercel.app, http://localhost:5173"`.
  - `railway.toml` compila (`pnpm build`) e executa migracoes (`pnpm prisma migrate deploy`) antes de iniciar.
- **Frontend (Vercel)**
  - Root Directory: `frontend`.
  - Node version: `20.x`.
  - Build command: `pnpm build` (Install command `pnpm install --no-frozen-lockfile`).
  - Variaveis: `VITE_API_URL=https://backend-production-84dd.up.railway.app`.
  - Recomenda-se redeploy com cache limpo apos alterar envs.
- **Teste local contra producao**: atualize `frontend/.env.development` com a URL do backend na Railway.

Testes
------
- Backend: `pnpm --filter backend test`.
- Frontend: `pnpm --filter frontend test -- --run`.
- Proximo passo: adicionar testes E2E ou de interacao para drag-and-drop e tabela.
