 # AGENTS.md (Frontend Scope)
 
 Scope: Applies to everything under `frontend/`.
 
 Stack: Vite + React + TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Vitest, React Testing Library.
 
 ## Folder Structure (expected)
 
 - `src/main.tsx` — App bootstrap.
 - `src/app/` — App shell, router, layout, providers.
 - `src/features/<name>/` — Feature folders (components, hooks, schema, api, tests).
 - `src/components/ui/` — shadcn/ui generated primitives (do not edit heavily).
 - `src/components/shared/` — Shared presentational components.
 - `src/routes/` — Route elements and lazy chunks.
 - `src/lib/` — Utilities (API client, query client, form helpers).
 - `src/hooks/` — Reusable React hooks.
 - `src/stores/` — Zustand stores (local/UI state only).
 - `src/api/` — API client wrappers and endpoint helpers.
 - `src/types/` — Shared TypeScript types.
 - `src/styles/` — Tailwind config glue, global CSS.
 - `src/__tests__/` or `*.test.tsx` — Unit/component tests.
 
 ## State and Data
 
 - Server state: Use TanStack Query for fetching, caching, and invalidation.
   - Co-locate queries/mutations in feature folders.
   - Key by resource + params; invalidate selectively.
 - UI/local state: Use Zustand. Avoid storing server data in Zustand.
 
 ## Forms and Validation
 
 - Use React Hook Form + Zod resolver.
 - Define Zod schemas per feature (`schema.ts`) and derive form types from schemas.
 - Show accessible error messages and mark invalid fields with ARIA attributes.
 
 ## API Client
 
 - Implement a thin fetch wrapper in `src/lib/api.ts` with:
   - `baseURL` from `import.meta.env.VITE_API_URL`.
   - JSON handling, error normalization, and auth header attachment when access token is present.
   - Include credentials when using httpOnly refresh cookies.
 - Keep endpoints typed with Zod-derived types where possible.
 
 ## Auth
 
 - Access token: keep in memory (module variable/Zustand) to avoid XSS‑prone storage.
 - Refresh token: httpOnly cookie sent by backend; refresh flow via a dedicated mutation.
 - Protect routes with a simple `RequireAuth` wrapper that checks auth state and triggers refresh when needed.
 
 ## UI/UX
 
 - Use shadcn/ui primitives and extend via `src/components/ui/` generators; keep branding and tokens centralized.
 - Styling with Tailwind: utility‑first, semantic class groups, responsive breakpoints.
 - Accessibility: keyboard focus states, ARIA labels, role semantics.
 - Responsiveness: Design mobile‑first; verify at sm/md/lg/xl.
 
 ## Testing
 
 - Vitest + RTL: Test behavior. Avoid asserting internal implementation details.
 - File names: `*.test.tsx` alongside the component or within feature folder.
 - Prefer queries by role/label/text, not test IDs.
 
 ## Performance
 
 - Code‑split routes with `React.lazy` and suspense boundaries.
 - Memoize expensive components and selectors; avoid unnecessary Zustand subscriptions.
 - Prefer query cache instead of refetch storms; set appropriate `staleTime`.
 
 ## Scripts (indicative)
 
 - `pnpm dev` — Start Vite dev server.
 - `pnpm build` — Build for production.
 - `pnpm test` — Run Vitest in watch/CI mode.
 - `pnpm lint` — Lint the codebase.
 
 ## Agent Guardrails (Frontend)
 
 - Do not introduce global CSS unless necessary; prefer component‑scoped styles.
 - Keep feature folders cohesive; avoid cross‑feature imports except via shared libs.
 - Update tests when altering component behavior or contracts.
 
