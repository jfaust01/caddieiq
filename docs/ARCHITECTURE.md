# Architecture — CaddieIQ

This document is the technical reference for CaddieIQ: how the system is
structured, which technologies it uses, and the conventions every contribution
follows. It reflects the current state of the codebase, including the database,
authentication, and data-provider layers that are now implemented.

---

## Folder Structure

```
caddieiq/
├── app/
│   ├── (app)/                  # Authenticated route group (wrapped in AppShell)
│   │   ├── dashboard/          # Account command center
│   │   ├── analytics/          # Performance insight
│   │   ├── rankings/           # Model-driven leaderboards
│   │   ├── players/            # Player universe
│   │   ├── tournaments/        # Events, fields, results
│   │   ├── courses/            # Course profiles
│   │   ├── models/             # Model Lab
│   │   ├── settings/           # Workspace & account
│   │   ├── help/               # Guides & support
│   │   ├── layout.tsx          # AppShell + session gate
│   │   ├── loading.tsx         # Route-level loading boundary
│   │   └── error.tsx           # Route-level error boundary
│   ├── (auth)/                 # Public auth route group
│   │   ├── login/
│   │   └── register/
│   ├── api/auth/[...all]/       # Better Auth HTTP handler
│   ├── globals.css             # Tailwind v4 + design tokens
│   ├── layout.tsx              # Root layout, providers, fonts
│   ├── not-found.tsx
│   └── global-error.tsx
├── features/                   # Domain feature views (one folder per domain)
├── components/
│   ├── ui/                     # shadcn/ui primitives (Base UI)
│   ├── layout/                 # AppShell, sidebar, top nav, user menu
│   ├── shared/                 # Cross-feature building blocks
│   ├── cards/                  # Stat/among reusable cards
│   └── charts/                 # ECharts wrappers
├── lib/
│   ├── auth.ts                 # Better Auth server config
│   ├── auth-client.ts          # Better Auth React client
│   ├── session.ts              # Server-side session helpers
│   ├── prisma.ts               # Prisma client singleton (Neon adapter)
│   ├── providers/              # Data-provider framework (see below)
│   └── generated/prisma/       # Generated Prisma client (not hand-edited)
├── prisma/
│   ├── schema.prisma           # Database schema (source of truth)
│   └── migrations/             # Versioned SQL migrations
├── constants/                  # Site config and navigation
├── providers/                  # React context providers (theme, query, …)
├── types/                      # Shared TypeScript types
├── validators/                 # Zod schemas
├── proxy.ts                    # Next.js 16 middleware (route protection)
└── docs/                       # Project documentation
```

The guiding rule: **thin routes, rich features.** Files in `app/**/page.tsx` are
entry points that resolve params and render a feature view; domain logic lives in
`features/` and `lib/`.

---

## Technology Stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI runtime | React 19.2 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Components | shadcn/ui on Base UI |
| Icons | lucide-react |
| Data fetching / cache | TanStack Query |
| Tables | TanStack Table |
| Charts | ECharts (via echarts-for-react) |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 (`prisma-client` generator + Neon adapter) |
| Auth | Better Auth (email + password) |
| Notifications | Sonner |
| Theming | next-themes (light/dark) |
| Animation | Framer Motion |
| Analytics | Vercel Analytics |

---

## Database Overview

The database is PostgreSQL on Neon, accessed through a Prisma client singleton
(`lib/prisma.ts`) backed by the `@prisma/adapter-neon` driver. The schema in
`prisma/schema.prisma` is the single source of truth; the client is generated
into `lib/generated/prisma` and is never hand-edited. Full entity detail lives in
[DATABASE.md](./DATABASE.md) and [ERD.md](./ERD.md).

**Conventions:**

- Primary keys are `String @id @default(cuid())` — never auto-increment integers.
- Every model carries `createdAt` and `updatedAt` audit fields.
- Soft deletes (`deletedAt`) are used only where they add value (e.g. players,
  courses, tournaments).
- Table names map to snake_case plurals via `@@map`.
- Foreign keys and common lookup columns are explicitly indexed.

**Domain groups:**

- **Identity & billing:** `User`, `Profile`, `Subscription` (+ Better Auth
  `Session`, `Account`, `Verification`).
- **Tours & seasons:** `Tour`, `Season`.
- **Players:** `Player`, `Nationality`, `PlayerTourHistory`, `PlayerRanking`.
- **Courses:** `Course`, `CourseCharacteristic`.
- **Tournaments:** `Tournament`, `TournamentCourse`, `TournamentField`.
- **Play & stats:** `Round`, `PlayerRound`, `RoundStatistic`.

Schema changes are made in `schema.prisma` and applied with Prisma Migrate
(`pnpm db:migrate`); migrations are committed under `prisma/migrations/`.

---

## Authentication Overview

Authentication uses **Better Auth** with email + password and database-backed
sessions.

- `lib/auth.ts` is the load-bearing config: the Prisma adapter, a 7-day session,
  `nextCookies()`, and an environment-aware `baseURL`/`trustedOrigins` cascade
  (production, Vercel previews, the v0 runtime, and localhost in development).
- In development, cross-site cookie attributes (`sameSite: "none"`,
  `secure: true`) are set so the preview iframe retains the session.
- `app/api/auth/[...all]/route.ts` mounts the Better Auth HTTP handler.
- `lib/auth-client.ts` exposes the React client (`signIn`, `signUp`, `signOut`,
  `useSession`).
- `lib/session.ts` provides server-side helpers for reading the session in
  Server Components and actions.
- `proxy.ts` (Next.js 16 middleware) guards the `(app)` route group, redirecting
  anonymous users to `/login?redirect=…`, with server-side session checks as a
  backstop.

**Authorization** is role-based via `UserRole` (`USER`, `ADMIN`). There is no
row-level security in Postgres, so every query that touches user-owned data must
be explicitly scoped by the authenticated user id.

`BETTER_AUTH_SECRET` is required in every environment; `DATABASE_URL` (pooled)
and `DATABASE_URL_UNPOOLED` (for migrations) are provisioned by the Neon
integration.

---

## Provider Architecture

External data enters CaddieIQ through a pluggable provider framework in
`lib/providers/`. It defines *how* data sources connect and normalize, without
committing any credentials or network calls yet.

```
lib/providers/
├── shared/
│   ├── types.ts          # Provider, ImportJob, ImportResult, Normalizer, …
│   ├── errors.ts         # ProviderError + Authentication/RateLimit/Validation
│   ├── logger.ts         # ProviderLogger with a pluggable sink
│   ├── base-provider.ts  # Abstract BaseProvider (template method)
│   └── index.ts
├── sportsdataio/         # Player/tournament/stat data (scaffold)
├── datagolf/             # Rankings & advanced metrics (scaffold)
├── weather/              # Course conditions (scaffold)
├── odds/                 # Betting markets (scaffold)
└── index.ts              # providerRegistry + createProvider() factory
```

**Key design points:**

- Every provider implements the `Provider` contract: `connect`, `health`,
  `import`, `normalize`, `validate`, `disconnect`.
- `BaseProvider.import()` is a **template method**: it automatically logs
  Start → Success/Failure with duration and funnels every thrown value through
  `toProviderError`. Concrete providers only implement source-specific logic.
- A **normalizer** converts a source's raw payload into CaddieIQ domain shapes,
  keeping ingestion decoupled from persistence.
- `providerRegistry` + `createProvider(name)` let callers instantiate a provider
  by name without importing each class.

Concrete network calls, credential injection, scheduling, and persistence are
sequenced in the Data Platform milestone.

---

## Analytics Layer

The analytics layer turns raw statistics and model output into insight. It is
designed as a set of services that read from the normalized data model and feed
the Analytics and Rankings surfaces.

- **Statistics** are stored raw per round (`RoundStatistic`); derived metrics are
  computed downstream rather than overwriting source data.
- **Model evaluation** (planned) reads a model definition (inputs + weights +
  scoring) and produces a ranked field.
- **Backtesting** (planned) replays models across historical seasons and computes
  accuracy and confidence metrics.
- **Visualization** uses ECharts wrappers in `components/charts/`, driven by
  TanStack Query on the client and Server Components for initial loads.
- **Explainability** — the [Model Explainability Engine](./EXPLAINABILITY.md)
  (`lib/explainability/`) maps every model's output into one canonical
  `Explanation`, powering the "Why?" surfaces, the AI insight cards, and the
  admin debug view without recomputing any model.

---

## Admin Portal

The Admin Portal (planned) is gated to users with the `ADMIN` role and provides
internal operations tooling:

- **Data-source health** — status of each provider (`ProviderStatus`) and recent
  import jobs.
- **Import monitoring** — job outcomes, records processed/failed, and errors
  surfaced from the provider framework.
- **User & subscription management** — inspect accounts, roles, and tiers.
- **Data quality** — review and correct player, course, and tournament records.
- **Explainability debug** — `/admin/explainability` inspects the canonical
  `Explanation` any model produces for a chosen entity (rendered breakdown,
  deterministic narrative, and raw JSON). See
  [EXPLAINABILITY.md](./EXPLAINABILITY.md).

Access control reuses the existing role model; no separate admin auth system is
introduced.

---

## Coding Standards

Detailed rules live in [CODING_STANDARDS.md](./CODING_STANDARDS.md). The essentials:

- **Server-first.** Default to React Server Components; add `'use client'` only
  when interactivity, browser APIs, or client state require it.
- **Thin routes.** Pages compose feature views; they do not contain domain logic.
- **Type safety end-to-end.** Strict TypeScript, shared `types/`, and Zod
  validation at every input boundary.
- **Design-system discipline.** Build from tokens and existing components; no
  ad-hoc colors or one-off styles.
- **Scope every user query by user id.** There is no RLS; enforce ownership in
  application code.
- **Never hand-edit generated code** (`lib/generated/prisma`).

---

## Naming Conventions

| Kind | Convention | Example |
| --- | --- | --- |
| Files & folders | kebab-case | `account-summary.tsx` |
| React components | PascalCase | `AccountSummary` |
| Variables & functions | camelCase | `getSessionUser` |
| Types & interfaces | PascalCase | `ImportResult` |
| Constants | UPPER_SNAKE_CASE | `NOT_IMPLEMENTED` |
| Prisma models | PascalCase singular | `PlayerRound` |
| Database tables | snake_case plural (via `@@map`) | `player_rounds` |
| Prisma enums | PascalCase / UPPER_SNAKE members | `SubscriptionTier.FREE` |
| Routes | kebab-case segments | `/tournaments` |
| Zod schemas | camelCase with `Schema` suffix | `workspaceSchema` |

---

## Error Handling

- **UI boundaries.** Route-level `loading.tsx` and `error.tsx` in the `(app)`
  group, plus `app/not-found.tsx` and `app/global-error.tsx` at the root.
- **Forms.** Validate with Zod; surface field errors inline and unexpected
  failures via Sonner toasts.
- **Server actions.** Validate input before touching services; return typed
  results and never leak raw exceptions to the client.
- **Providers.** All failures are normalized to `ProviderError` (with
  `AuthenticationError`, `RateLimitError`, and `ValidationError` subclasses).
  `toProviderError` coerces unknown throwables; `notImplemented` marks scaffolded
  capabilities explicitly.
- **Principle.** Fail loudly in development, degrade gracefully in production,
  and always give the user an actionable next step.

---

## Logging Strategy

- **Provider logging** is standardized through `ProviderLogger` with a pluggable
  sink, so ingestion emits consistent Start/Success/Failure entries with timing
  and context.
- **Debug tracing** uses `console.log("[v0] …")` during development and is
  removed once an issue is resolved.
- **Structured context.** Log messages carry relevant identifiers (provider,
  job, resource) rather than opaque strings.
- **No secrets.** Credentials, tokens, and personal data are never logged.
- Production observability (aggregation, alerting) will attach to the same
  `ProviderLogger` sink as the platform matures.

---

## Testing Strategy

Testing is introduced progressively alongside the features it protects:

- **Unit tests** for pure logic — normalizers, the model evaluation engine,
  scoring, and validation schemas.
- **Integration tests** for data-access services and provider `import()` flows
  against a test database.
- **End-to-end tests** for critical user journeys (register → build model → view
  ranking, and auth/route protection), exercised in a real browser.
- **Type checking** (`tsc --noEmit`) and linting (`eslint`) run as the first line
  of defense on every change.

The provider framework is deliberately shaped for testability: the template-method
`BaseProvider` isolates source-specific logic, and normalizers are pure functions
that can be tested without network access.
