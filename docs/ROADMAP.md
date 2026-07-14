# Roadmap — CaddieIQ

This roadmap organizes delivery into sequential phases. Each phase builds on the
last: foundation before data, data before models, models before analytics and
AI. Status reflects the current release (v0.1.0).

**Legend:** ✅ Complete · 🚧 In progress · ⬜ Planned

---

## Phase 1 — Foundation ✅

The navigable application shell and design system.

- ✅ Next.js 16 App Router project with TypeScript (strict).
- ✅ Tailwind v4 design tokens and theming (light/dark via next-themes).
- ✅ shadcn/ui component library (Base UI) installed and themed.
- ✅ App shell: sidebar, top nav, footer, command palette, breadcrumbs.
- ✅ All primary routes scaffolded with feature views and empty states.
- ✅ Providers: TanStack Query, theme, tooltip, toaster.
- ✅ Project documentation (`docs/`).

## Phase 2 — Data ⬜

Persist and serve real golf data.

- ⬜ Provision PostgreSQL (Neon) and typed data-access layer.
- ⬜ Implement core schema: players, tournaments, courses, rounds, statistics.
- ⬜ Ingestion for tour schedule, fields, and results.
- ⬜ Wire Players, Tournaments, and Courses views to live data.
- ⬜ Authentication (email + password) and per-user workspaces.

## Phase 3 — Model Builder ⬜

Let users define and save custom models.

- ⬜ Model definition schema (inputs, weights, scoring logic).
- ⬜ Model Builder UI with live preview.
- ⬜ Model evaluation engine → generate rankings from a field.
- ⬜ Save, edit, duplicate, and version models.

## Phase 4 — Analytics ⬜

Turn model output into insight.

- ⬜ Performance dashboards (accuracy, trends, hit rates).
- ⬜ Model comparison views.
- ⬜ ECharts-based visualizations wired to real metrics.
- ⬜ Rankings powered by live model runs.

## Phase 5 — AI ⬜

Conversational and generative assistance.

- ⬜ AI insights layer (Vercel AI SDK + AI Gateway).
- ⬜ Natural-language model explanations.
- ⬜ Suggested weight adjustments from backtest results.
- ⬜ Narrative tournament previews and anomaly detection.

## Phase 6 — Backtesting ⬜

Validate models against history.

- ⬜ Historical data store sufficient for multi-season replay.
- ⬜ Backtest runner and job orchestration.
- ⬜ Accuracy breakdowns and confidence metrics.
- ⬜ Backtest results integrated into the Analytics surface.

## Phase 7 — Marketplace ⬜

A community ecosystem for models.

- ⬜ Publish and share models.
- ⬜ Subscribe to community models.
- ⬜ Ratings, performance transparency, and discovery.
- ⬜ Revenue sharing for model authors.

## Phase 8 — Premium ⬜

Monetization and paid tiers.

- ⬜ Subscription billing (Stripe).
- ⬜ Tier gating (unlimited models, advanced backtesting, live odds, priority refresh).
- ⬜ Weather and live odds feeds.
- ⬜ Export and programmatic access entitlements.

## Phase 9 — Future: Mobile App ⬜

- ⬜ Companion mobile experience for picks and live tracking.
- ⬜ Push notifications for model runs and event updates.

## Phase 10 — Future: Public API ⬜

- ⬜ Authenticated public API for models and rankings.
- ⬜ API keys, rate limiting, and usage metering.
- ⬜ Developer documentation and SDKs.

---

## Phase Summary

| Phase | Name | Status |
| --- | --- | --- |
| 1 | Foundation | ✅ Complete |
| 2 | Data | ⬜ Planned |
| 3 | Model Builder | ⬜ Planned |
| 4 | Analytics | ⬜ Planned |
| 5 | AI | ⬜ Planned |
| 6 | Backtesting | ⬜ Planned |
| 7 | Marketplace | ⬜ Planned |
| 8 | Premium | ⬜ Planned |
| 9 | Mobile App (future) | ⬜ Planned |
| 10 | Public API (future) | ⬜ Planned |
