Gerenciador de Tarefas Monorepo
===============================

Aplicação moderna de gerenciamento de tarefas construída com React, Node.js, Prisma e MySQL.  
Usuários autenticam via JWT, organizam projetos e administram tarefas em tabela ou kanban com drag-and-drop.

Conteúdo
--------
- [Recursos](#recursos)
- [Stack Tecnológico](#stack-tecnológico)
- [Primeiros Passos](#primeiros-passos)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Visão Geral da API](#visão-geral-da-api)
- [Testes](#testes)
- [Limitações e Próximos Passos](#limitações-e-próximos-passos)

Recursos
--------
- **Autenticação**
  - Registro e login com JWT (access token + refresh httpOnly).
  - Atualização automática de token e logout.
- **Projetos**
  - Criação e listagem de projetos pessoais.
- **Tarefas**
  - CRUD completo (criar, visualizar, editar, excluir).
  - Campos obrigatórios: título, descrição, status (pendente / em andamento / concluída) e data de entrega.
  - Kanban com arrastar e soltar para mover tarefas entre status.
  - Visualização em tabela com navegação rápida, suporte a teclado, filtro por status e ordenação por data.
  - Modal de detalhes para editar ou remover tarefas.
- **UX aprimorada**
  - Tema claro/escuro com preferência do usuário (detecção automática + persistência).
  - Layout responsivo (desktop, tablet, mobile).
  - Atualizações otimizadas ao mover cartões no kanban.

Stack Tecnológico
-----------------
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS 3, shadcn/ui, Zustand, TanStack Query, React Hook Form + Zod, @dnd-kit.
- **Backend**: Node 18, Express, TypeScript, Prisma ORM, MySQL, validação com Zod, JWT (access + refresh).
- **Ferramentas**: pnpm workspaces, Vitest + Testing Library (frontend), Jest + Supertest (backend), Docker Compose para MySQL.

Primeiros Passos
----------------
### Pré-requisitos
- Node.js 18+
- pnpm 8+
- Docker (para o MySQL local)

### 1. Instale as dependências
```bash
pnpm -r install
```

### 2. Suba o banco de dados
```bash
docker compose up -d
```

### 3. Configure as variáveis de ambiente
- `backend/.env`
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

### 4. Rodar migrações e gerar o client Prisma
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

Para desligar o banco: `pnpm run dev:down`.

Scripts Disponíveis
-------------------
Executados a partir da raiz do monorepo:

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Sobe MySQL + backend (ts-node-dev) + frontend (Vite) |
| `pnpm run dev:db` / `pnpm run dev:down` | Inicia ou encerra apenas o MySQL |
| `pnpm --filter backend dev` | Executa o servidor backend |
| `pnpm --filter frontend dev` | Executa o servidor frontend |
| `pnpm --filter backend build` / `pnpm --filter frontend build` | Build de produção |
| `pnpm --filter backend test` | Testes backend (Jest + Supertest) |
| `pnpm --filter frontend test -- --run` | Testes frontend (Vitest + RTL) |

Estrutura do Projeto
--------------------
```
task-manager/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Wires Express app
│   │   ├── index.ts            # Bootstrap do servidor
│   │   ├── config/             # Env schema + Prisma client
│   │   ├── modules/            # Módulos de domínio (auth, projetos, tasks)
│   │   └── middlewares/        # validate, authenticate, error handler
│   └── prisma/schema.prisma
├── frontend/
│   ├── src/
│   │   ├── main.tsx            # Bootstrap React + providers
│   │   ├── router.tsx          # Rotas privadas/públicas
│   │   ├── shell/              # Layout principal
│   │   ├── components/         # UI shadcn + ThemeToggle
│   │   ├── routes/             # Páginas (login, register, projects, project)
│   │   └── stores/             # Zustand auth store
│   └── index.css               # Tailwind base + tokens de tema
├── docker-compose.yml
├── README.md
└── pnpm-workspace.yaml
```

Visão Geral da API
------------------
Base URL: `http://localhost:4000`

- `POST /auth/register` / `POST /auth/login` → `{ user, accessToken }` + refresh cookie.
- `POST /auth/refresh` → emite novo access token / refresh cookie.
- `POST /auth/logout` → limpa cookie.
- `GET /projects` → lista projetos do usuário.
- `POST /projects` → cria projeto.
- `GET /projects/:id` → detalhes do projeto com tarefas.
- `PATCH /projects/:id` / `DELETE /projects/:id`.
- `GET /projects/:projectId/tasks` → suporta `?status=` e `sort=dueDateAsc|dueDateDesc`.
- `POST /projects/:projectId/tasks`.
- `PATCH /projects/tasks/:id` → atualiza título, descrição, status, due date.
- `DELETE /projects/tasks/:id`.

Todas as rotas (exceto auth) exigem `Authorization: Bearer <accessToken>` e o cookie de refresh enviado pelo backend.

Testes
------
- Backend: `pnpm --filter backend test`.
- Frontend: `pnpm --filter frontend test -- --run` (cobre autenticação; testar views de projeto/tarefa é próximo passo).

Limitações e Próximos Passos
----------------------------
- Ampliar cobertura de testes frontend (kanban/tabela).
- Implementar ordenação persistente dentro das colunas do kanban.
- Paginação ou carregamento incremental para listas extensas.
- Adicionar rate limiting / logging no backend.
- Ajustes de acessibilidade (ARIA para drag handles, etc.).
