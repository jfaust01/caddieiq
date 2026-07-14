# Product — CaddieIQ

> **Build Better Models. Make Better Picks.**

CaddieIQ is a professional golf analytics and custom model-building platform for
serious handicappers, bettors, and analysts. This document defines what the
product is, who it serves, and how it evolves.

---

## Product Vision

Golf is one of the most data-rich sports in the world, yet the tools available
to independent analysts are either shallow (basic stat pages) or locked inside
proprietary black boxes. CaddieIQ's vision is to put a **transparent,
professional-grade modeling engine** in the hands of every serious golf analyst
— a place where you can combine player form, course fit, conditions, and market
data into your own models, then measure those models honestly against history.

We believe the best pick is one you can explain. CaddieIQ is built so that every
ranking a user produces is traceable back to the inputs and weights that created
it.

## Mission

To give independent golf analysts the same caliber of modeling, backtesting, and
data infrastructure that professional betting syndicates use — delivered through
an interface that is fast, transparent, and genuinely enjoyable to use.

## User Personas

| Persona | Description | Primary Needs |
| --- | --- | --- |
| **The Serious Bettor** | Bets PGA/DP World events weekly and tracks results rigorously. | Course-fit modeling, live odds context, backtested edges, fast weekly workflow. |
| **The DFS Player** | Builds daily-fantasy lineups and needs projections across a full field. | Field-wide rankings, ownership/edge signals, rapid model iteration. |
| **The Data Analyst / Hobbyist** | Loves the numbers; builds models for the intellectual challenge. | Flexible inputs, transparent scoring, deep historical data, backtesting. |
| **The Content Creator** | Publishes picks and previews to an audience. | Explainable outputs, shareable rankings, narrative previews. |
| **The Administrator** | Internal operator maintaining data quality and users. | Data-source health, import monitoring, user and subscription management. |

## MVP Definition

The Minimum Viable Product is the smallest release that lets a user log in,
explore real tournament data, build a custom model, and produce a ranked field
for an upcoming event.

**In scope for MVP:**

- Email + password authentication with per-user workspaces.
- Core golf data (players, tournaments, courses, rounds, statistics) persisted
  and browsable.
- The Model Lab: define inputs, assign weights, and generate a ranked field.
- A dashboard summarizing the user's account and recent activity.
- Free-tier access with clearly defined limits.

**Explicitly out of scope for MVP:**

- AI explanations, backtesting, the model marketplace, billing, live odds/weather
  feeds, mobile apps, and the public API. These are sequenced in the
  [Roadmap](./ROADMAP.md).

## Primary Navigation

Navigation is data-driven from `constants/navigation.ts` and grouped by intent:

**Overview**

- **Dashboard** — the user's command center for models and picks.
- **Analytics** — performance trends and insight.
- **Rankings** — live leaderboards driven by the user's models.

**Data**

- **Players** — browse and manage the player universe.
- **Tournaments** — schedule, fields, and event context.
- **Courses** — course profiles and playing conditions.

**Build**

- **Models** — the Model Lab: design, tune, and deploy custom models.

**Secondary**

- **Settings** — workspace, preferences, and account.
- **Help** — guides, documentation, and support.

## Feature List

| Feature | Description | Status |
| --- | --- | --- |
| Authentication | Email + password auth, sessions, protected app routes. | Implemented |
| Account dashboard | Personalized summary of account, tier, and quick links. | Implemented |
| Player universe | Players, nationalities, tour history, and rankings. | Data model implemented |
| Tournament engine | Tournaments, venues, fields, rounds, and results. | Data model implemented |
| Course engine | Course profiles and characteristics that drive course fit. | Data model implemented |
| Statistics | Raw per-round statistics ingested from providers. | Data model implemented |
| Provider framework | Pluggable ingestion for SportsDataIO, DataGolf, weather, odds. | Framework scaffolded |
| Model Lab | Build, weight, and run custom models against a field. | Planned |
| Analytics | Accuracy, hit rates, and model comparison dashboards. | Planned |
| AI insights | Natural-language explanations and suggestions. | Planned |
| Backtesting | Replay models against historical seasons. | Planned |
| Marketplace | Publish, discover, and subscribe to community models. | Planned |
| Billing | Subscription tiers and entitlements. | Planned |

## Model Lab Overview

The Model Lab is the heart of CaddieIQ. It lets a user turn a point of view about
golf into a repeatable, measurable model.

A **model** is composed of:

1. **Inputs** — the signals the model considers (e.g. recent strokes-gained,
   course-fit metrics, driving distance/accuracy, putting, conditions, market
   odds).
2. **Weights** — how much each input matters, expressing the analyst's thesis.
3. **Scoring logic** — how weighted inputs combine into a single comparable score
   per player.

Running a model against a tournament **field** produces a **ranking**: an ordered
list of players with a transparent score. Because inputs and weights are explicit,
every ranking is fully explainable — the opposite of a black box. Models can be
saved, edited, duplicated, and versioned so users can iterate deliberately and
compare approaches over time.

## AI Philosophy

AI in CaddieIQ is an **assistant, not an oracle**. Our principles:

- **Transparency over magic.** AI explains and augments models the user built; it
  never silently replaces the user's judgment with a hidden model.
- **Grounded in the user's data.** Explanations and suggestions are derived from
  the same inputs, weights, and backtests the user can see.
- **Suggestive, not prescriptive.** AI proposes weight adjustments and highlights
  anomalies; the analyst always decides.
- **Accountable.** Every AI-assisted recommendation is traceable to the evidence
  behind it.

Planned capabilities include natural-language model explanations, backtest-driven
weight suggestions, narrative tournament previews, and anomaly detection — built
on the Vercel AI SDK and AI Gateway, isolated so model computation and AI features
evolve independently.

## Subscription Plans

CaddieIQ uses a three-tier model (`SubscriptionTier`: `FREE`, `PRO`, `ELITE`).
Statuses are tracked via `SubscriptionStatus` (`ACTIVE`, `TRIAL`, `PAST_DUE`,
`CANCELED`). Exact limits are finalized in the Premium milestone.

| Plan | Audience | Intended Entitlements |
| --- | --- | --- |
| **Free** | New and casual users | A limited number of saved models, core data access, standard refresh cadence. |
| **Pro** | Regular bettors and DFS players | Expanded model limits, full analytics, backtesting, faster data refresh. |
| **Elite** | Power users and professionals | Unlimited models, advanced backtesting, live odds and weather, priority refresh, export and programmatic access. |

Billing is not implemented yet; the subscription data model exists so the app can
reason about entitlements ahead of monetization.

## Future Features

- **Model Marketplace** — publish, discover, rate, and subscribe to community
  models, with performance transparency and revenue sharing for authors.
- **Live odds & weather feeds** — real-time market and conditions data as premium
  inputs.
- **Mobile companion app** — picks and live tracking with push notifications.
- **Public API** — authenticated programmatic access to models and rankings with
  API keys, rate limiting, and usage metering.
- **Collaboration** — shared workspaces and team modeling.
