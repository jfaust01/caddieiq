# Roadmap — CaddieIQ

This roadmap sequences delivery into seven milestones. Each builds on the last:
foundation before data, data before the public application, the application
before the Model Lab, and models before AI, backtesting, and launch. Every
milestone lists its **Goals**, **Features**, and **Exit Criteria**.

**Legend:** ✅ Complete · 🚧 In progress · ⬜ Planned

| # | Milestone | Status |
| --- | --- | --- |
| 1 | Platform Foundation | ✅ Complete |
| 2 | Data Platform | 🚧 In progress |
| 3 | Public Application | ⬜ Planned |
| 4 | Model Lab | ⬜ Planned |
| 5 | AI | ⬜ Planned |
| 6 | Backtesting | ⬜ Planned |
| 7 | Public Launch | ⬜ Planned |

---

## Milestone 1 — Platform Foundation ✅

### Goals

Establish a production-grade technical foundation: a navigable application shell,
a persistent database, authentication, and the framework external data will plug
into. Everything the later milestones depend on is put in place here.

### Features

- Next.js 16 App Router project with strict TypeScript and Turbopack.
- Tailwind v4 design tokens with light/dark theming (next-themes).
- shadcn/ui (Base UI) component system, app shell, sidebar, top nav, and
  data-driven navigation.
- All primary routes scaffolded with feature views, loading, and error boundaries.
- PostgreSQL (Neon) with Prisma 7 and the full domain schema (players, tours,
  courses, tournaments, rounds, statistics, subscriptions).
- Better Auth email + password authentication, protected `(app)` routes, and an
  account-aware dashboard.
- Data-provider framework (`lib/providers/`) with shared contracts, a
  `BaseProvider`, standardized errors/logging, and scaffolded providers.
- Project documentation in `docs/`.

### Exit Criteria

- A user can register, log in, land on a protected dashboard, and sign out.
- The database schema is migrated and the Prisma client is generated and typed.
- The provider framework compiles and exposes a registry/factory for all planned
  sources.
- The app builds and type-checks with zero errors.

---

## Milestone 2 — Data Platform 🚧

### Goals

Fill the schema with real, current golf data by implementing concrete provider
ingestion and the services that persist and serve it.

### Features

- Concrete SportsDataIO, DataGolf, weather, and odds providers with credential
  injection from the environment.
- Normalizers mapping each source's payloads to CaddieIQ domain shapes.
- Import orchestration (jobs, scheduling, and retry) writing into normalized
  tables.
- Data-access services for players, tournaments, courses, and statistics.
- Import monitoring and provider health reporting.

### Exit Criteria

- Player, tournament, course, and round data for current events is ingested and
  queryable.
- Imports run on a schedule and record outcomes (processed/failed) with errors
  captured through the provider framework.
- Provider health is observable, and re-running an import is idempotent.

---

## Milestone 3 — Public Application ⬜

### Goals

Turn the scaffolded routes into a fully functional, data-backed product that
users can explore end to end.

### Features

- Players, Tournaments, and Courses views wired to live data with search,
  filtering, sorting, and pagination (TanStack Table).
- Rich detail pages: player profiles, tournament fields/results, and course
  characteristics.
- Dashboard populated with real account activity and data highlights.
- Settings for workspace and notification preferences backed by persistence.

### Exit Criteria

- Every primary navigation destination renders real data with no placeholder
  content.
- Users can find any player, tournament, or course through browse and search.
- All list and detail views handle empty, loading, and error states gracefully.

---

## Milestone 4 — Model Lab ⬜

### Goals

Deliver the core value proposition: let users build, save, and run custom models
that produce transparent rankings for a tournament field.

### Features

- Model definition schema (inputs, weights, scoring logic).
- Model Lab UI to select inputs, tune weights, and preview results live.
- Model evaluation engine that scores and ranks a field.
- Save, edit, duplicate, and version models per user.
- Rankings surface powered by live model runs.

### Exit Criteria

- A user can build a model, run it against an upcoming field, and view a ranked,
  explainable result.
- Models persist per user and can be edited, duplicated, and versioned.
- Rankings update when the underlying model or data changes.

---

## Milestone 5 — AI ⬜

### Goals

Layer conversational and generative assistance on top of user-built models —
transparent and grounded in the user's own data.

### Features

- AI insights layer built on the Vercel AI SDK and AI Gateway.
- Natural-language explanations of why a model ranks players as it does.
- Backtest-driven suggestions for weight adjustments.
- Narrative tournament previews and anomaly detection.

### Exit Criteria

- A user can ask why a player is ranked where they are and receive an explanation
  traceable to inputs and weights.
- AI suggestions reference concrete evidence and never mutate a model without the
  user's confirmation.
- AI features are isolated so model computation is unaffected by their evolution.

---

## Milestone 6 — Backtesting ⬜

### Goals

Let users validate models against history so edges are measured, not assumed.

### Features

- Historical data store sufficient for multi-season replay.
- Backtest runner with job orchestration over historical fields and results.
- Accuracy, hit-rate, and confidence metrics per model.
- Backtest results integrated into the Analytics surface and AI suggestions.

### Exit Criteria

- A user can backtest a model across past seasons and see accuracy metrics.
- Backtests are reproducible and complete within acceptable time bounds.
- Analytics and AI consume backtest output to inform comparisons and suggestions.

---

## Milestone 7 — Public Launch ⬜

### Goals

Harden the platform for a public, monetized release: billing, tiers, performance,
security, and operational readiness.

### Features

- Subscription billing (Stripe) with `FREE`, `PRO`, and `ELITE` tiers.
- Entitlement gating (model limits, advanced backtesting, live odds/weather,
  priority refresh, export).
- Admin Portal for user, subscription, and data-quality operations.
- Performance, accessibility, and security hardening across the app.
- Onboarding, help content, and support workflows.

### Exit Criteria

- Users can subscribe, upgrade, and downgrade, with entitlements enforced across
  the app.
- Administrators can manage users, subscriptions, and data health from the Admin
  Portal.
- The platform meets defined performance, accessibility, and security targets and
  is ready for public sign-ups.

---

## Beyond Launch

Sequenced after the seven milestones: the **Model Marketplace** (publish, discover,
and subscribe to community models with revenue sharing), a **mobile companion
app**, and an authenticated **public API** with keys, rate limiting, and usage
metering.
