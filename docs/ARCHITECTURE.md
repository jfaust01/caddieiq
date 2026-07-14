# Architecture — CaddieIQ

This document describes the technical architecture of CaddieIQ: the layers that
make up the system, how they interact, what is implemented today, and what is
planned. It is the reference for how new code should fit into the whole.

---

## Overview

CaddieIQ is a server-rendered Next.js 16 application using the App Router. The
current codebase is a fully realized **presentation and structure layer** — all
routes, navigation, and the component system exist and are navigable. Data
persistence, authentication, and model computation are designed here but not yet
built.

```
┌──────────────────────────────────────────────────────────┐
│                        Client (React 19)                   │
│   Route pages → Feature views → Shared/UI components       │
│   Providers: Theme · TanStack Query · Tooltip · Toaster    │
└──────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────┐
│                Next.js App Router (Server)                 │
│   Server Components · Route handlers · Server Actions      │
└──────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────┐
│              Services & Data Access (planned)              │
│   Auth · Query/Mutation services · Model engine            │
└──────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────┐
│      Database (planned, Postgres) · External feeds         │
│      Odds · Weather · Tour data · Background jobs           │
└──────────────────────────────────────────────────────────┘
```

---

## Application Layers

### Frontend

The frontend is organized into three cooperating layers:

| Layer | Location | Responsibility |
| --- | --- | --- |
| **Routes** | `app/(app)/**/page.tsx` | Thin entry points. Resolve params and render a feature view. |
| **Feature views** | `features/<domain>/` | Domain-specific composition and presentation logic. |
| **Components** | `components/` | Reusable UI: `ui/` primitives, `shared/`, `layout/`, `charts/`, etc. |

Routing highlights:

- The `(app)` route group wraps every authenticated page in `AppShell`
  (`components/layout/app-shell.tsx`), which provides the sidebar, top nav, and
  footer.
- `loading.tsx` and `error.tsx` provide route-level loading and error boundaries.
- Navigation is data-driven from `constants/navigation.ts`, so adding a route to
  the sidebar is a config change, not a layout rewrite.

Rendering strategy:

- Default to **React Server Components**. Pages and static presentation render on
  the server.
- Promote to **Client Components** (`'use client'`) only when interactivity,
  browser APIs, or client state (TanStack Query, forms, charts) is required.

### Backend

The backend runs inside Next.js on Vercel. It has two primary surfaces:

- **Server Actions** — the preferred path for mutations (form submissions, model
  edits, workspace updates).
- **Route Handlers** — for webhooks, third-party callbacks, and any public/JSON
  API surface (planned).

Today there is no persistent backend logic; mutations are local/optimistic. The
structure is in place to introduce server actions and services incrementally.

### Database

**Planned.** The target is a PostgreSQL database (Neon) accessed through a typed
data-access layer. The full planned schema — players, tournaments, courses,
rounds, statistics, models, rankings, backtests, subscriptions, and more — is
documented in [DATABASE.md](./DATABASE.md). No ORM or schema is wired up yet.

Principles for when the database lands:

- All queries that touch user-owned data must be scoped by the authenticated
  user id.
- Use parameterized queries; never interpolate untrusted input.
- Keep data access behind services rather than calling the database directly from
  components.

### Authentication

**Planned.** CaddieIQ will use email + password authentication as the default.
Sessions gate the entire `(app)` route group. Until auth is implemented, all
routes render as if a single workspace is active.

Planned responsibilities:

- Session creation, validation, and refresh.
- Route protection at the `(app)` layout boundary.
- Associating every model, ranking, and setting with an owning user.

### API

Two categories of API are anticipated:

| API | Purpose | Status |
| --- | --- | --- |
| **Internal** | Server actions and route handlers used by the app. | Partially scaffolded |
| **Public** | Programmatic access to models and rankings for premium users. | Planned (future) |

### Server Actions

Server actions are the canonical way to mutate data. Guidelines:

- Co-locate actions with their feature or in a dedicated `actions/` module per
  feature.
- Validate all input with the matching Zod schema from `validators/` before
  touching any service.
- Return typed results; surface errors to the UI via toast (Sonner) or inline
  form errors.
- Revalidate affected data using Next.js caching APIs after a successful mutation.

### Services

Services encapsulate business logic and data access so that routes, actions, and
components stay thin. Planned services include:

- **Data services** — read/write access for each domain (players, tournaments,
  courses, models).
- **Model engine** — evaluates a model definition (inputs + weights + scoring) and
  produces rankings.
- **Backtesting service** — replays models against historical data and computes
  accuracy metrics.
- **Ingestion services** — pull external odds, weather, and tour data on a
  schedule.

### Future AI Layer

The AI layer will sit alongside services and consume the same data model. Planned
capabilities:

- Natural-language explanations of model behavior and outputs.
- Suggested weight adjustments based on backtest performance.
- Narrative tournament previews and anomaly detection.

It will be built on the Vercel AI SDK and the AI Gateway, kept isolated so model
computation and AI features can evolve independently.

### Future Data Pipeline

A scheduled ingestion pipeline will keep the database current:

- **Sources:** tour results, player statistics, course data, weather, and betting
  odds.
- **Cadence:** batch refreshes between events, higher-frequency updates during
  live tournaments (premium: priority refresh).
- **Mechanism:** scheduled jobs / cron writing into normalized tables, with
  derived statistics computed downstream.

---

## Design Principles

| Principle | What it means in practice |
| --- | --- |
| **Server-first** | Default to Server Components; opt into the client only when needed. |
| **Thin routes, rich features** | Pages compose; logic lives in features and services. |
| **Separation of concerns** | UI, domain logic, and data access are distinct layers. |
| **Type safety end-to-end** | Strict TypeScript, shared `types/`, and Zod validation. |
| **Design-system discipline** | Build from tokens and existing components, never ad-hoc styles. |
| **Progressive enhancement** | Features degrade gracefully with empty and loading states. |
| **Incremental adoption** | New capabilities (DB, auth, AI) slot in without rewrites. |
| **Accessibility by default** | Semantic HTML and ARIA are requirements, not extras. |
