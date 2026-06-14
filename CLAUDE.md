# CLAUDE.md — my.kpefk.com.ua

> Persistent instruction file for Claude Code working in this repository as an AI pair programmer / maintainer.

***

## 1. Project summary

**MyKPEFK Frontend** is a Next.js 16 (App Router) + React 19 client application for the KPEFK LNTU college management system.

**Key stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query v5 · Zustand v5 · TanStack Form · Zod v4 · Axios

**Backend dependency:** all data and authentication come from the MyKPEFK NestJS backend (`backend.kpefk.com.ua`). The frontend has no database, no server-side rendering of protected data, and no middleware auth gate.

**Architectural shape:**
- App Router with two route groups: `(auth)` (public) and `(pages)` (protected, client-guarded)
- All data fetching is **client-side** via TanStack Query + Axios
- No server actions, no route handlers, no `fetch()` in server components
- Auth state in Zustand (`lib/stores/auth.store.ts`), persisted to `sessionStorage` (user only)
- Feature-based directory structure: `features/{feature}/api`, `components`, `types`

***

## 2. Core architecture rules

- **API calls go through `lib/api/client.ts` only.** Use `apiGet`, `apiPost`, `apiPatch`, `apiDelete`. Do not add raw `axios` or `fetch` calls elsewhere.
- **All endpoint strings live in `lib/api/endpoints.ts`.** Add new paths to the `ENDPOINTS` constant — never hardcode path strings in feature files.
- **Feature co-location is the rule.** API hooks, components, and types for a feature belong in `features/{feature}/`. Shared UI primitives go to `components/ui/`.
- **Do not duplicate `components/ui/` primitives.** Use existing shadcn components; add new ones only via the `shadcn` CLI.
- **Frontend types must stay aligned with backend DTOs.** When the backend changes a response shape, update `features/{feature}/types/index.ts`.
- **Do not duplicate business logic across pages.** If logic repeats in two places, it belongs in a shared hook or a feature `api/` hook.

***

## 3. Next.js 16 conventions

- **App Router** — all routing is under `app/`.

- **Server components by default.** `app/(pages)/*/page.tsx` files MUST be server
  components — never add `'use client'` to a page file. If a page needs interactivity,
  extract only the interactive part into `features/{feature}/components/{Feature}Client.tsx`
  and render it from the server page.

- **`'use client'` placement rule.** The directive belongs exclusively in leaf-level
  feature components that directly use: `useState`, `useReducer`, `useEffect`, `useRef`,
  `useContext`, browser APIs (`window`, `document`, `localStorage`, `sessionStorage`),
  or event handler props (`onClick`, `onChange`, etc.). If none of these apply — the
  component does NOT need `'use client'`.

- **Metadata lives in `page.tsx` only.** Every `app/(pages)/*/page.tsx` exports
  `metadata: Metadata`. The title value MUST be a short label with NO suffix —
  the root `app/layout.tsx` has `title.template: '%s | MyKPEFK'` which appends
  the suffix automatically.

  ✅ Correct:  `title: 'Академічні групи'`
  ❌ Wrong:    `title: 'Академічні групи | MyKPEFK'`  ← causes double suffix in browser tab

- **No `layout.tsx` for metadata only.** A nested `layout.tsx` is justified only when
  a group of routes shares actual UI (a secondary sidebar, a sub-navigation bar, etc.).
  Never create a `layout.tsx` whose sole purpose is to export `metadata`.

- **`(pages)/layout.tsx` is a client component** — it calls `useMe()` on mount to verify the session and redirects to `/sign-in` on failure. This is the auth gate for all protected pages.
- **No `middleware.ts`.** Auth protection is entirely client-side.
- **No server actions.** No `'use server'` directive anywhere in the codebase.
- **No route handlers** (`app/api/` does not exist).
- **Security headers** are set in `next.config.ts` via `headers()` — do not remove them.
- **Dynamic routes:** `/profile/[id]` for user profiles by ID.

***

## 4. UI / component rules

- **shadcn/ui** is the component system. Primitives live in `components/ui/`. Do not rewrite them — extend or compose them.
- **`cn()`** from `lib/utils.ts` is the standard for conditional class merging (`clsx` + `tailwind-merge`). Always use it — never concatenate Tailwind classes with string interpolation.
- **Dashboard layout components** (`Sidebar`, `Header`, `DashboardShell`, `AuthGuard`) live in `components/dashboard/`. They are shared across all `(pages)` routes.
- **Feature-specific components** go in `features/{feature}/components/`. Keep them focused — one table, one detail sheet, one dialog.
- **Avoid large page-level JSX.** Pages should compose feature components, not contain inline UI logic.
- **Theme:** `next-themes` with `class` strategy is wired in `providers.tsx`. Use `dark:` Tailwind variants for theme-responsive styles.
- **Icons:** `lucide-react` only — do not import from other icon libraries.

***

## 5. State and data-fetching rules

- **TanStack Query** manages all remote server state. Use `useQuery` for reads, `useMutation` for writes.
- **Query keys** are defined as factory functions in `features/{feature}/api/index.ts` (e.g. `authKeys.me()`). Follow this pattern for new features.
- **`staleTime: Infinity`** is set for `useMe()` (session check) — it should not refetch on every window focus. Other queries use the global default of 60 seconds.
- **`retry: false`** is set for 401 responses in the global QueryClient config (`providers.tsx`). Do not add retry logic to individual queries for auth errors.
- **Mutations report errors via `sonner` toast** — this is the global `onError` handler in QueryClient. Do not add duplicate `toast.error()` calls in component `onError` callbacks unless you need custom messaging.
- **Zustand** manages auth client state only: `user`, `isLoading`, `isTwoFactorRequired`. It does not manage server data.
- **Auth store** canonical location: `lib/stores/auth.store.ts`. The `store/auth.store.ts` path also exists — both currently export the same store.
- **Loading and error states:** use skeleton components (`components/ui/skeleton.tsx`) for loading, and surface errors via `sonner` or inline error UI. Do not leave loading states unhandled.

***

## 6. Styling rules

- **Tailwind CSS v4** — no `tailwind.config.js`. Config is via `postcss.config.mjs`.
- **Use `cn()` for all class composition.** Never use string concatenation or template literals for Tailwind classes.
- **Follow shadcn conventions for component variants** — use `class-variance-authority` (`cva`) if building a component with multiple visual states.
- **`tailwind-merge` is already in `cn()`** — no need to call it separately.
- **Do not mix arbitrary inline styles with Tailwind** unless there is no Tailwind equivalent.

***

## 7. Change workflow for Claude Code

**Before making any edit:**
- [ ] Read the relevant feature files: `api/index.ts`, `components/`, `types/index.ts`
- [ ] Check which route renders the feature (`app/(pages)/*/page.tsx`)
- [ ] Confirm whether the component is a server or client component
- [ ] Confirm which `ENDPOINTS` key maps to the API call being changed
- [ ] Check if a similar pattern already exists elsewhere in the codebase

**Making changes:**
- State a short plan before writing code
- Prefer small, targeted changes over large rewrites
- Do not introduce new dependencies without explicit request
- Do not reorganize directory structure without explicit request

**After changes:**
- Briefly state: which files changed, what the behavior change is, any edge cases or risks

***

## 8. What not to do

- **Do not add raw `axios` or `fetch` calls outside `lib/api/client.ts`.** New API calls go through `apiGet` / `apiPost` / etc.
- **Do not hardcode API path strings.** Add to `ENDPOINTS` in `lib/api/endpoints.ts`.
- **Do not add a `middleware.ts`** without an explicit request — the current auth pattern is intentionally client-side.
- **Do not convert server components to client components** just for convenience.
- **Do not add `'use client'` to `page.tsx` files.** Extract interactive logic into a
  `features/{feature}/components/{Feature}Client.tsx` component instead and keep the page as a server component.
- **Do not hardcode `| MyKPEFK` in metadata titles.** The root layout template handles
  the suffix — adding it manually produces `Title | MyKPEFK | MyKPEFK` in the browser tab.
- **Do not create `layout.tsx` for metadata alone.** Metadata belongs in `page.tsx`.
  `layout.tsx` is for shared UI only.
- **Do not add server actions** (`'use server'`) — this pattern is not used anywhere in the codebase.
- **Do not bypass the `cn()` helper** for Tailwind class composition.
- **Do not add a second state library** (Redux, Jotai, etc.) — Zustand + TanStack Query covers all current needs.
- **Do not silently change UX behavior** (redirects, toast messages, loading states) without noting it in the summary.
- **Do not invent architecture** (repositories, service layer classes, etc.) that is not present in the codebase.
- **Do not touch `components/ui/`** directly unless adding a new shadcn component — these are generated/managed by the shadcn CLI.

***

## 9. Practical checklist

```
[ ] Read feature files: api/, components/, types/
[ ] Confirm server vs. client component boundary
[ ] page.tsx is a Server Component — no 'use client' on the file
[ ] metadata.title is a short label, NO '| MyKPEFK' suffix
[ ] Interactive logic extracted to features/{feature}/components/{Feature}Client.tsx
[ ] No layout.tsx created solely for metadata
[ ] Confirm ENDPOINTS key for any API path
[ ] Check if a similar pattern already exists
[ ] State a short plan before writing
[ ] Make minimal, targeted changes
[ ] Do not add new dependencies without need
[ ] Summarize: files changed, behavior change, risks
```