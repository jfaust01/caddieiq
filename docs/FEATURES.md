# Features — CaddieIQ

This document catalogs planned features organized by module. It maps directly to
the application's navigation and route structure. Status reflects the current
release (v0.1.0).

**Legend:** ✅ Implemented · 🚧 In progress · ⬜ Planned · ⭐ Premium

Each module corresponds to a feature folder in `features/` and a route in
`app/(app)/`.

---

## Dashboard

Route: `/dashboard` · Feature: `features/dashboard`

| Feature | Status |
| --- | --- |
| Overview metric cards (models, players, accuracy, runs) | ✅ (placeholder data) |
| Performance summary panel | ✅ (empty state) |
| Recent activity feed | ✅ (empty state) |
| Get-started guidance | ✅ |
| Live metrics wired to real data | ⬜ |
| Personalized model & pick highlights | ⬜ |

## Players

Route: `/players` · Feature: `features/players`

| Feature | Status |
| --- | --- |
| Player universe view | ✅ (scaffold) |
| Search and filtering | ⬜ |
| Player detail profiles (form, history, course fit) | ⬜ |
| Player statistics and trends | ⬜ |
| Add/track players to workspace | ⬜ |

## Tournaments

Route: `/tournaments` · Feature: `features/tournaments`

| Feature | Status |
| --- | --- |
| Tournaments view | ✅ (scaffold) |
| Schedule and upcoming events | ⬜ |
| Field / entry lists | ⬜ |
| Event context (course, conditions) | ⬜ |
| Live and completed event states | ⬜ |

## Courses

Route: `/courses` · Feature: `features/courses`

| Feature | Status |
| --- | --- |
| Courses view | ✅ (scaffold) |
| Course profiles (par, yardage, surface) | ⬜ |
| Playing conditions | ⬜ |
| Course-fit insights | ⬜ |

## Models

Route: `/models` · Feature: `features/models`

| Feature | Status |
| --- | --- |
| Models view | ✅ (scaffold) |
| Model Builder (inputs, weights, scoring logic) | ⬜ |
| Live model preview | ⬜ |
| Save / edit / duplicate models | ⬜ |
| Model versioning | ⬜ |
| Unlimited models | ⬜ ⭐ |

## Analytics

Route: `/analytics` · Feature: `features/analytics`

| Feature | Status |
| --- | --- |
| Analytics view | ✅ (scaffold) |
| Performance trend charts (ECharts) | ⬜ |
| Model comparison | ⬜ |
| Accuracy and hit-rate breakdowns | ⬜ |

## Rankings

Route: `/rankings` · Feature: `features/rankings`

| Feature | Status |
| --- | --- |
| Rankings view | ✅ (scaffold) |
| Model-driven leaderboards for a field | ⬜ |
| Rank vs. odds comparison | ⬜ ⭐ |
| Export rankings | ⬜ ⭐ |

## AI

Route: TBD · Layer: future AI services

| Feature | Status |
| --- | --- |
| Natural-language model explanations | ⬜ ⭐ |
| Suggested weight adjustments | ⬜ ⭐ |
| Narrative tournament previews | ⬜ ⭐ |
| Anomaly / edge detection | ⬜ ⭐ |

## Backtesting

Route: TBD (surfaced within Models/Analytics) · Layer: backtesting service

| Feature | Status |
| --- | --- |
| Historical backtest runner | ⬜ |
| Multi-season backtests | ⬜ ⭐ |
| Accuracy and confidence metrics | ⬜ |
| Backtest result visualizations | ⬜ |

## Billing

Route: TBD (within Settings) · Layer: subscriptions

| Feature | Status |
| --- | --- |
| Subscription tiers (free / pro / premium) | ⬜ |
| Checkout and plan management (Stripe) | ⬜ |
| Entitlement / tier gating | ⬜ |
| Invoices and billing history | ⬜ |

## Settings

Route: `/settings` · Feature: `features/settings`

| Feature | Status |
| --- | --- |
| Settings view | ✅ |
| Workspace form (name, description) with Zod validation | ✅ |
| Notification preferences | ✅ |
| Account management | ⬜ |
| Theme preference (light/dark/system) | ✅ (via theme toggle) |

## Admin

Route: TBD · Access: `admin` role

| Feature | Status |
| --- | --- |
| Data ingestion monitoring | ⬜ |
| User and subscription management | ⬜ |
| Model marketplace moderation | ⬜ |
| System health and job status | ⬜ |

---

## Cross-Cutting

Features that span all modules.

| Feature | Status |
| --- | --- |
| App shell (sidebar, top nav, footer) | ✅ |
| Command palette | ✅ |
| Breadcrumbs | ✅ |
| Light / dark theming | ✅ |
| Empty, loading, and error states | ✅ |
| Toast notifications (Sonner) | ✅ |
| Authentication and per-user workspaces | ⬜ |
| Marketplace (publish / subscribe to models) | ⬜ ⭐ |
