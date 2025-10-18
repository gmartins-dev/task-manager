# 🧩 Codex Guide – Task Manager Fullstack App (React + Vite + pnpm + shadcn/ui)

Este documento fornece instruções detalhadas para o **OpenAI Codex CLI**, a fim de criar e configurar automaticamente uma aplicação fullstack para gerenciamento de tarefas (to-do app) com **React (Vite)**, **Node.js**, **Prisma** e **MySQL**, utilizando **pnpm** como gerenciador de pacotes e **Tailwind + shadcn/ui** para a interface.

---

## ⚙️ OBJETIVO

Desenvolver uma aplicação web para controle de tarefas com:

* Autenticação JWT
* CRUD completo de tarefas
* Filtro e ordenação por status e data de vencimento
* Interface responsiva com Tailwind + shadcn/ui
* Backend em Node.js + Prisma + MySQL
* Frontend em React (Vite) + TypeScript + React Query + Zustand
* Códigos limpos, modulares e tipados (TypeScript em toda a stack)

---

## 🏗️ 1. ESTRUTURA DE PASTAS

```
/task-manager
  /backend
  /frontend
  README.md
```

---

## 🔧 2. CONFIGURAÇÃO BACKEND (Node.js + Express + Prisma)

1. Criar o projeto backend:

   ```bash
   mkdir backend && cd backend
   pnpm init
   pnpm add express cors dotenv prisma @prisma/client bcrypt jsonwebtoken zod
   pnpm add -D typescript ts-node-dev @types/node @types/express @types/jsonwebtoken
   npx prisma init
   ```

2. Atualizar `prisma/schema.prisma` com:

   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id        Int      @id @default(autoincrement())
     name      String
     email     String   @unique
     password  String
     tasks     Task[]
     createdAt DateTime @default(now())
   }

   model Task {
     id          Int      @id @default(autoincrement())
     title       String
     description String?
     status      Status   @default(PENDING)
     dueDate     DateTime
     userId      Int
     user        User     @relation(fields: [userId], references: [id])
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

   enum Status {
     PENDING
     IN_PROGRESS
     DONE
   }
   ```

3. Rodar as migrações:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Estrutura recomendada:

   ```
   src/
    ├─ app.ts
    ├─ server.ts
    ├─ prisma/client.ts
    ├─ routes/{auth,task}.ts
    ├─ controllers/{authController,taskController}.ts
    ├─ middleware/authMiddleware.ts
    ├─ utils/jwt.ts
   ```

5. Implementar:

   * **Auth:** registro e login com `bcrypt` + `JWT`
   * **Middleware:** `verifyToken`
   * **Tasks:** CRUD completo, filtragem por `status` e `userId`

6. Exemplo de rota protegida:

   ```ts
   router.get('/', verifyToken, async (req, res) => {
     const tasks = await prisma.task.findMany({ where: { userId: req.userId } });
     res.json(tasks);
   });
   ```

---

## 🎨 3. FRONTEND (React + Vite + Tailwind + shadcn/ui)

1. Criar o projeto com Vite:

   ```bash
   mkdir frontend && cd frontend
   pnpm create vite . --template react-ts
   pnpm add axios react-query react-hook-form zod zustand tailwindcss @radix-ui/react-icons
   pnpm dlx shadcn-ui@latest init
   npx tailwindcss init -p
   ```

2. Estrutura base:

   ```
   src/
     api/client.ts
     store/useAuthStore.ts
     components/{TaskForm,TaskCard,Navbar}.tsx
     pages/{Login,Register,Dashboard,TaskDetail}.tsx
     hooks/useTasks.ts
     lib/zodSchemas.ts
   ```

3. Configurar shadcn/ui:

   ```bash
   pnpm shadcn add button card input textarea dialog select
   ```

   * Utilizar componentes `Card`, `Button`, `Dialog` e `Input` para compor a UI.
   * Customizar via Tailwind conforme necessidade.

4. Implementar autenticação JWT:

   * Armazenar token no `localStorage`.
   * Adicionar Axios interceptor para injetar o token.
   * Criar `PrivateRoute` para proteger páginas autenticadas.

5. Funcionalidades principais:

   * CRUD de tarefas.
   * Filtro por status e ordenação por data.
   * Layout responsivo (mobile-first).

---

## 🧪 4. TESTES (Opcional)

* Backend: Jest + Supertest.
* Frontend: Vitest + React Testing Library.

---

## 📄 5. README.md

Incluir:

* Setup backend e frontend.
* Variáveis `.env` e instruções.
* Scripts `pnpm dev`, `pnpm build`, `pnpm start`.
* Estrutura do projeto e tecnologias usadas.
* Link para repositório público.

---

## 🚀 6. EXECUÇÃO

```bash
# Backend
cd backend
pnpm dev

# Frontend
cd frontend
pnpm dev
```

Acessar: `http://localhost:5173`

---

## 💎 7. OPCIONAL

* Testes automatizados.
* Docker Compose com MySQL.
* Deploy (Render + Vercel).
* Documentação Swagger.

---

## ✅ CONCLUSÃO

O projeto deve:

* Usar **pnpm** em toda a stack.
* Ser totalmente em **React (Vite)**, não Next.js.
* Usar **Tailwind + shadcn/ui** para UI.
* Seguir boas práticas SOLID e Clean Code.
* Ser totalmente em **TypeScript**.
* Garantir responsividade e uma UI consistente.
* Conter README completo e pronto para execução.
