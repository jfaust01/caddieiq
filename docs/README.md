# CaddieIQ

> Build Better Models. Make Better Picks.

CaddieIQ is a professional golf analytics and custom model-building platform for
serious handicappers, DFS players, and betting analysts. It gives users a
structured workspace to explore player, tournament, and course data, assemble
their own predictive models from weighted inputs, and turn those models into
rankings and picks.

This document is the entry point for engineers joining the project. It explains
what we are building, the technology we use, how the repository is organized,
and how to extend the codebase safely.

---

## Table of Contents

- [What CaddieIQ Is](#what-caddieiq-is)
- [Mission](#mission)
- [Goals](#goals)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Development Workflow](#development-workflow)
- [Extending the Project](#extending-the-project)
- [Documentation Index](#documentation-index)

---

## What CaddieIQ Is

CaddieIQ is a data-driven decision platform for professional golf. Instead of
shipping a single black-box prediction engine, CaddieIQ gives analysts the tools
to build, tune, and validate **their own** models. The platform centralizes the
data (players, tournaments, courses, conditions) and provides the model builder,
analytics, and backtesting surfaces needed to turn that data into confident
picks.

The current codebase is the **application foundation**: a fully designed,
navigable Next.js application with all primary routes, a component system, and a
consistent design language. Data layers, model computation, authentication, and
billing are planned and documented but not yet implemented.

## Mission

Give independent golf analysts the same modeling and data infrastructure that
was previously only available to well-funded syndicates — in a fast, transparent,
and self-serve product.

## Goals

| Goal | Description |
| --- | --- |
| **Transparency** | Every pick traces back to inputs, weights, and logic the user controls. |
| **Speed** | A responsive workspace that makes exploring data and iterating on models effortless. |
| **Trust** | Backtesting and clear performance metrics so users can validate models before relying on them. |
| **Extensibility** | A codebase that scales cleanly as data pipelines, AI, and marketplace features are added. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI Runtime | [React 19](https://react.dev) |
| Language | [TypeScript 5.7](https://www.typescriptlang.org) (strict) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first `@theme`) |
| Components | [shadcn/ui](https://ui.shadcn.com) built on [Base UI](https://base-ui.com) |
| Icons | [lucide-react](https://lucide.dev) |
| Data & Server State | [TanStack Query](https://tanstack.com/query) |
| Tables | [TanStack Table](https://tanstack.com/table) |
| Charts | [Apache ECharts](https://echarts.apache.org) via `echarts-for-react` |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| Hosting | [Vercel](https://vercel.com) |

> **Planned:** A PostgreSQL database (Neon) with an authentication layer, server
> actions for mutations, and background jobs for data ingestion and model runs.
> See [ARCHITECTURE.md](./ARCHITECTURE.md) and [DATABASE.md](./DATABASE.md).

## Repository Structure

```
caddieiq/
├── app/                      # Next.js App Router
│   ├── (app)/                # Authenticated app route group
│   │   ├── dashboard/        # Route pages (thin — render feature views)
│   │   ├── analytics/
│   │   ├── rankings/
│   │   ├── players/
│   │   ├── tournaments/
│   │   ├── courses/
│   │   ├── models/
│   │   ├── settings/
│   │   ├── help/
│   │   ├── layout.tsx        # Wraps routes in the AppShell
│   │   ├── loading.tsx       # Route-level loading UI
│   │   └── error.tsx         # Route-level error boundary
│   ├── layout.tsx            # Root layout (fonts, metadata, providers)
│   ├── not-found.tsx
│   └── global-error.tsx
├── features/                 # Feature modules (one folder per domain)
│   ├── dashboard/            # e.g. dashboard-view.tsx
│   ├── analytics/
│   ├── models/
│   └── ...
├── components/
│   ├── ui/                   # shadcn/ui primitives (generated)
│   ├── layout/               # App shell, sidebar, top nav, footer
│   ├── navigation/           # Breadcrumbs, command palette
│   ├── shared/               # Cross-feature building blocks
│   ├── cards/                # Stat and feature cards
│   ├── charts/               # ECharts wrapper
│   └── feedback/             # Loaders, error states
├── constants/                # Static config (site, navigation)
├── hooks/                    # Reusable React hooks
├── lib/                      # Utilities (e.g. cn)
├── providers/                # Client-side context providers
├── types/                    # Shared TypeScript types
├── validators/               # Zod schemas
└── docs/                     # You are here
```

Key conventions:

- **Route pages are thin.** Each `page.tsx` imports and renders a view from
  `features/`. Business/presentation logic lives in the feature module, not the
  route.
- **`components/ui` is generated.** Treat it as managed by the shadcn CLI; avoid
  hand edits that will be overwritten.
- **Shared, reusable UI lives in `components/shared`.** Feature-specific UI lives
  inside that feature's folder.

## Development Workflow

```bash
# Install dependencies (pnpm is the project package manager)
pnpm install

# Start the dev server
pnpm dev

# Type-check and lint
pnpm lint

# Production build
pnpm build
```

The app runs at [http://localhost:3000](http://localhost:3000). This repository
is linked to a [v0](https://v0.app) project and to Vercel — every merge to `main`
deploys automatically.

## Extending the Project

CaddieIQ is developed through a prompt-driven workflow on top of v0 and GitHub.
When writing prompts or PRs that extend the project:

1. **Respect the layering.** Put data logic in server actions/services, domain
   UI in `features/`, and generic UI in `components/`.
2. **Follow existing patterns.** Mirror the structure of an existing feature
   (e.g. `features/players`) rather than inventing a new one.
3. **Keep route pages thin.** New pages should compose feature views.
4. **Type everything.** Add shared types to `types/` and validation to
   `validators/`.
5. **Document as you go.** Update the relevant file in `docs/` and add an entry
   to [CHANGELOG.md](./CHANGELOG.md).
6. **Do not break the design system.** Use design tokens and existing
   components; see [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## Documentation Index

### 🏗️ Architecture Documentation (Phase 15.3A - NEW)

Comprehensive platform architecture documentation created during Phase 15.3A audit:

| Document | Purpose | Read Time |
| --- | --- | --- |
| [**ARCHITECTURE_AUDIT_SUMMARY.md**](./ARCHITECTURE_AUDIT_SUMMARY.md) | 📌 **START HERE** — Executive summary of the architecture audit, key findings, and next steps | 10 min |
| [Platform_Architecture.md](./Platform_Architecture.md) | High-level system overview, 7-layer architecture, technology stack, feature modules | 15 min |
| [Folder_Ownership.md](./Folder_Ownership.md) | Responsibility and dependency guide for every folder; what belongs where | 20 min |
| [Architecture_Rules.md](./Architecture_Rules.md) | Layer responsibilities, database rules, business logic patterns, error handling, code review checklist | 30 min |
| [Domain_Inventory.md](./Domain_Inventory.md) | Catalog of 14 business domains with maturity, dependencies, roadmap | 30 min |
| [External_Integrations.md](./External_Integrations.md) | Complete reference for 6 external data providers, failure handling, monitoring | 30 min |
| [Architecture_Findings.md](./Architecture_Findings.md) | Audit results: 18 issues identified by severity, remediation roadmap | 30 min |
| [Architecture_Diagram.md](./Architecture_Diagram.md) | 13 visual diagrams (Mermaid + ASCII) of system, flows, dependencies | 15 min |

**Quick Start:** New to CaddieIQ? Read ARCHITECTURE_AUDIT_SUMMARY.md (10 min) → Platform_Architecture.md (15 min) → Folder_Ownership.md (20 min).

---

### 📚 Original Documentation

| Document | Purpose |
| --- | --- |
| [PRD.md](./PRD.md) | Product vision, users, and requirements. |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery plan and status. |
| [DATABASE.md](./DATABASE.md) | Planned data model and tables. |
| [FEATURES.md](./FEATURES.md) | Planned features by module. |
| [MODELS.md](./MODELS.md) | Ranking and rating model specification. |
| [TOURNAMENT_CONTEXT_ENGINE.md](./TOURNAMENT_CONTEXT_ENGINE.md) | The Tournament Context Engine: the shared source of event context. |
| [TOURNAMENT_FIELD_INTELLIGENCE.md](./TOURNAMENT_FIELD_INTELLIGENCE.md) | Tournament Field Intelligence: the official-field lifecycle, commitment deadline, and awaiting/confirmed messaging. |
| [COURSE_INTELLIGENCE.md](./COURSE_INTELLIGENCE.md) | The Course Intelligence Engine: the normalized course profile. |
| [COURSE_FIT_MODEL.md](./COURSE_FIT_MODEL.md) | The Course Fit Model: player-vs-course fit scoring. |
| [COURSE_GEOLOCATION.md](./COURSE_GEOLOCATION.md) | The Course Geolocation Engine: verified venue coordinates from a swappable geocoder. |
| [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md) | The Weather Intelligence Engine: per-event conditions, forecast, and wave edge. |
| [PLAYER_SKILL_INTELLIGENCE.md](./PLAYER_SKILL_INTELLIGENCE.md) | The Player Skill Intelligence Engine: normalized golf-skill ratings, field leaderboards, and the Course Fit skill source. |
| [DFS_VALUE_MODEL.md](./DFS_VALUE_MODEL.md) | The DFS Value Model: the flagship composite fusing every signal family with real DraftKings salary into salary-adjusted value. |
| [DATA_COVERAGE.md](./DATA_COVERAGE.md) | The internal Data Coverage Dashboard: admin-only, honest coverage diagnostics. |
| [DATA_CATALOG.md](./DATA_CATALOG.md) | What external data is actually available (SportsDataIO tier reality), its fidelity, and where it lands. |
| [DATA_INTEGRITY.md](./DATA_INTEGRITY.md) | Data integrity audit: per-pipeline findings, the import-run history audit trail, and the rankings architecture. |
| [PLATFORM_DATA_INVENTORY.md](./PLATFORM_DATA_INVENTORY.md) | Every database table classified by owner, population method, and reconciled health — the zero-ambiguity record of why each table holds the data it does. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute and ship changes. |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Engineering conventions. |
| [CHANGELOG.md](./CHANGELOG.md) | Release history. |
