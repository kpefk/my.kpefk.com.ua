# MyKPEFK — Frontend

> Client application for the enterprise educational management system of KPEFK LNTU

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Project overview

**MyKPEFK** is the frontend of the information system for Kovel Industrial and Economic Vocational College of Lutsk NTU (KPEFK LNTU). It is built with Next.js 16 (App Router) and React 19.

The application provides authenticated access to college management data: students, teachers, academic groups, classrooms, curricula, teacher load, and electives. It communicates exclusively with the [MyKPEFK backend](../backend.kpefk.com.ua) via a session-cookie–based REST API. Authentication is handled client-side — session checks happen via API on every protected page mount. There is no `middleware.ts`.

---

## Main features

- **Authentication** — sign in, sign up (student), Google OAuth entry point, two-factor authentication (2FA), password recovery
- **Dashboard** — overview page with summary cards
- **Students** — searchable/filterable table, detail sheet, manual EDBO sync trigger
- **Teachers** — searchable/filterable table, detail sheet, qualification upgrades, manual EDBO sync trigger
- **Academic groups** — group table, detail sheet, curator assignment, manual EDBO sync trigger
- **Classrooms** — table, detail/editor sheet, photo management with drag-and-drop reordering, classroom passport PDF
- **Academic plans (Curriculum)** — specialties, educational programs, curricula with versioning, sections, components, terms, time budget, academic calendar, group curriculum assignments, working curricula with teacher assignment
- **Teacher load** — load summary by working curriculum and by teacher, subject assignment generation, lesson assignment management, order confirmation workflow
- **Electives** — elective block seasons, offerings catalog, student selection workflow (voluntary + assigned), admin management with auto-assign, group stats, enrollment lists, annual campaigns with progress tracking
- **User management** (admin) — create users, view/edit user details, link to student/teacher profiles
- **Profile** — own profile page with change-password; public profile by ID (`/profile/[id]`)
- **Entrance** — EDBO admission campaign API integration
- **Educational programs** — view and manage educational programs linked to specialties
- **Settings, schedule, grades, assignments** — routes exist; some pages currently use mock data

---

## Tech stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | ^16.2.9 | Framework (App Router) |
| [React](https://react.dev/) | 19.2.4 | UI library |
| [TypeScript](https://typescriptlang.org/) | ^5 | Language |
| [Tailwind CSS](https://tailwindcss.com/) | ^4 | Styling |
| [shadcn](https://ui.shadcn.com/) + Radix UI | ^4.8.0 | Component primitives |
| [TanStack Query](https://tanstack.com/query) | ^5 | Server state / data fetching |
| [Zustand](https://zustand.docs.pmnd.rs/) | ^5 | Client state (auth) |
| [TanStack Form](https://tanstack.com/form) | ^1 | Form state management |
| [Zod](https://zod.dev/) | ^4 | Schema validation |
| [Axios](https://axios-http.com/) | ^1 | HTTP client |
| [sonner](https://sonner.emilkowal.ski/) | ^2 | Toast notifications |
| [next-themes](https://github.com/pacocoursey/next-themes) | ^0.4 | Dark/light/system theme |
| [framer-motion](https://www.framer-motion.com/) | ^12 | Animations |
| [tw-animate-css](https://www.npmjs.com/package/tw-animate-css) | ^1.4 | Tailwind animation utilities |
| [@dnd-kit](https://dndkit.com/) | ^6/^10 | Drag-and-drop (photo reordering) |
| [lucide-react](https://lucide.dev/) | ^1 | Icons |
| [xlsx](https://www.npmjs.com/package/xlsx) | ^0.18.5 | Excel file parsing |
| npm | — | Package manager |

---

## Project structure

```
app/
├── (auth)/                 # Route group — public auth pages
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   ├── reset-password/
│   └── layout.tsx          # Minimal auth layout (no sidebar)
├── (pages)/                # Route group — protected dashboard pages
│   ├── dashboard/
│   ├── students/
│   ├── teachers/
│   ├── academic-groups/
│   ├── academic-plans/     # Curriculum management pages
│   │   └── [id]/
│   │       └── versions/
│   │           └── [versionId]/  # Structure, working curricula, group assignments
│   ├── classrooms/
│   ├── my-classroom/
│   ├── educational-programs/
│   ├── electives/
│   │   └── admin/          # Admin electives management
│   ├── teacher-load/
│   ├── profile/
│   │   ├── [id]/           # Dynamic route — profile by user ID
│   │   └── settings/       # User settings page
│   ├── users/
│   ├── schedule/
│   ├── grades/
│   ├── assignments/
│   ├── settings/
│   └── layout.tsx          # Client layout — fetches session, redirects if unauthenticated
├── layout.tsx              # Root layout — renders <Providers>
├── providers.tsx           # QueryClientProvider + ThemeProvider + Toaster
├── globals.css
├── error.tsx
└── not-found.tsx

features/                   # Feature modules (API hooks + components + types)
├── auth/
│   ├── api/                # useMe, useLogin, useLogout, useRegister
│   ├── components/         # Form components for auth pages
│   ├── schemas/            # Zod validation schemas
│   └── types/
├── students/
├── teachers/
├── groups/
├── classrooms/
├── admin/
├── users/
├── entrance/
├── academic-plans/         # Curriculum, versions, sections, components, terms, working curricula
├── electives/              # Elective blocks, seasons, offerings, selections
└── teacher-load/           # Load summaries, subject/lesson assignments

components/
├── ui/                     # shadcn/ui primitives (Button, Dialog, Sheet, Table, etc.)
├── dashboard/              # Shell layout: Sidebar, Header, DashboardShell, AuthGuard
├── auth-provider.tsx       # Auth context provider
├── academic-plans/         # Curriculum domain components
├── electives/              # Elective domain components
├── teacher-load/           # Teacher load domain components
├── educational-programs/   # Educational program components
├── classrooms/
├── students/
├── teachers/
├── academic-groups/
├── assignments/
├── grades/
├── my-classroom/
├── schedule/
├── settings/
├── common/                 # Shared business components
└── users/

lib/
├── api/
│   ├── client.ts           # Axios instance + typed wrappers + 401 refresh interceptor
│   └── endpoints.ts        # ENDPOINTS constant — all API path strings
├── services/               # Imperative service functions (used outside of React hooks)
├── stores/
│   └── auth.store.ts       # Zustand auth store (canonical location)
├── query/
│   └── client.ts           # QueryClient factory
├── types/
│   └── user-role.types.ts
├── types.ts                # Shared type definitions
├── academic-year.ts        # Academic year utility
├── mock-data.ts            # Mock data for pages in development
└── utils.ts                # cn() — clsx + tailwind-merge

store/
└── auth.store.ts           # Auth store also importable from this legacy path

types/
├── api.ts                  # ApiError class
└── index.ts

hooks/
└── use-require-auth.ts     # Redirect hook used by (pages)/layout.tsx

config/
└── index.ts
```

---

## Prerequisites

- **Node.js** >= 20
- **npm** (project has `package-lock.json`)
- **MyKPEFK backend** running and accessible — the app cannot authenticate or load data without it
- `NEXT_PUBLIC_API_URL` environment variable

---

## Environment setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the MyKPEFK backend API |

This is the only required frontend environment variable. Authentication is cookie-based — no tokens are stored in the frontend.

---

## Installation and local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint

# Type check (no dedicated script — run manually)
npx tsc --noEmit
```

The backend must be running at `NEXT_PUBLIC_API_URL` for auth and data to work.

---

## Routing and application structure

The app uses **Next.js 16 App Router** with two route groups:

| Group | Paths | Protection |
|-------|-------|------------|
| `(auth)` | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Public |
| `(pages)` | `/dashboard`, `/students`, `/teachers`, `/academic-plans`, `/teacher-load`, `/electives`, and all other pages | Session-guarded |

**Auth protection is client-side only.** There is no `middleware.ts`. The `(pages)/layout.tsx` is a `'use client'` component that calls `useMe()` on mount. If the API returns an error (no session), it calls `router.replace('/sign-in')` and renders a `<Preloader />` in the meantime. A separate `<AuthGuard>` component in `components/dashboard/` provides the same logic for cases where the layout needs to remain a server component.

Dynamic routes: `/profile/[id]` — loads a user profile by ID.

---

## API integration

All HTTP calls go through **`lib/api/client.ts`**:

- Single `axios` instance configured with `baseURL = NEXT_PUBLIC_API_URL` and `withCredentials: true`
- Typed wrappers: `apiGet<T>`, `apiPost<T>`, `apiPatch<T>`, `apiDelete<T>`
- **401 refresh interceptor:** on a 401 response, attempts `POST /auth/refresh` once; if that also fails, clears Zustand state and redirects to `/sign-in`
- **Error normalization:** all errors become `ApiError` instances (`lib/types/api.ts`) with `statusCode`, `message`, and optional `errors` array

**All endpoint strings** are in `lib/api/endpoints.ts` as `ENDPOINTS`. Never hardcode path strings in feature files.

**Data fetching is entirely client-side.** No server actions, no `fetch()` in server components. Features use TanStack Query hooks (`useQuery`, `useMutation`) in `features/{feature}/api/index.ts`.

### API endpoint namespaces

| Namespace | Path prefix | Description |
|-----------|-------------|-------------|
| `AUTH` | `/auth/` | Login, register, logout, profile, refresh |
| `PASSWORD_RECOVERY` | `/auth/password-recovery/` | Reset and new password |
| `TWO_FA` | `/auth/2fa/` | TOTP and email 2FA management |
| `USERS` | `/users/` | User profile, password change |
| `ADMIN` | `/admin/` | Admin user management |
| `CLASSROOMS` | `/classrooms/` | CRUD, photos, passport |
| `ENTRANCE` | `/entrance/` | EDBO admission campaign |
| `STUDENTS` | `/students/` | Student list |
| `GROUPS` | `/groups/` | Groups, curator assignment |
| `STAFF` | `/staff/` | Teachers, qualification upgrades |
| `ELECTIVES` | `/electives/` | Catalog, selections, admin management (v1 + v2 architecture), campaigns |
| `EDBO` | `/edbo/sync/` | Manual sync triggers |
| `CURRICULUM` | `/curricula/`, `/curriculum-versions/`, `/curriculum-sections/`, `/curriculum-components/`, `/working-curricula/`, etc. | Full curriculum domain |
| `TEACHER_LOAD` | `/teacher-load/` | Load summaries, subject/lesson assignments, confirmation |

---

## UI and styling

- **Tailwind CSS v4** — configured via `@tailwindcss/postcss`; no `tailwind.config.js` (config is inlined via `postcss.config.mjs`)
- **shadcn/ui** components in `components/ui/` are the source of all primitive UI (Button, Input, Dialog, Sheet, Table, Select, Badge, Skeleton, Checkbox, etc.)
- **`cn()`** (`lib/utils.ts`) — `clsx` + `tailwind-merge` — use for all conditional class composition
- **Dark/light/system theme** — `next-themes` with `class` attribute strategy; `ThemeProvider` in `providers.tsx`
- **Toast notifications** — `sonner`; `<Toaster>` rendered in `providers.tsx`; `toast.success()` / `toast.error()` used in mutations
- **Animations** — `framer-motion`
- **Icons** — `lucide-react`

---

## Development guidelines

- **Keep API calls in `lib/api/client.ts` wrappers.** Do not add raw `axios.get()` or `fetch()` calls in components or feature files.
- **Use `ENDPOINTS` for all paths.** Add new endpoints to `lib/api/endpoints.ts`, not inline strings.
- **Feature co-location.** API hooks, components, and types for a feature go in `features/{feature}/`. Shared UI primitives go in `components/ui/`.
- **Do not duplicate `components/ui/` primitives.** Use existing shadcn components; add new ones via `shadcn` CLI.
- **Keep types aligned with backend DTOs.** When the backend changes a response shape, update the corresponding `features/{feature}/types/index.ts`.
- **Avoid converting server components to client components** unless interactivity or browser APIs are required.
- **No large refactors without an explicit request.** Make focused, reviewable changes.

---

## Useful commands

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

---

## API documentation

The backend Swagger UI is available at `http://localhost:4000/docs` when the backend is running.

---

## Contact

- **Email**: [s.tymchenko@kpefk.com.ua](mailto:s.tymchenko@kpefk.com.ua)
- **Organization**: [KPEFK LNTU](https://kpefk.com.ua)

---

> This README reflects the current state of the repository. Keep it aligned with the actual codebase — if routing, API structure, or dependencies change, update the relevant sections here.
