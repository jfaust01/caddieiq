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

| Document | Purpose |
| --- | --- |
| [PRD.md](./PRD.md) | Product vision, users, and requirements. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, layers, and principles. |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery plan and status. |
| [DATABASE.md](./DATABASE.md) | Planned data model and tables. |
| [FEATURES.md](./FEATURES.md) | Planned features by module. |
| [MODELS.md](./MODELS.md) | Ranking and rating model specification. |
| [COURSE_INTELLIGENCE.md](./COURSE_INTELLIGENCE.md) | The Course Intelligence Engine: the normalized course profile. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute and ship changes. |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Engineering conventions. |
| [CHANGELOG.md](./CHANGELOG.md) | Release history. |
