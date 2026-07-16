# Platform Data Inventory — CaddieIQ

**Purpose:** eliminate all ambiguity about the database. After reading this
document, an engineer knows — for every one of the platform's **31 tables** —
why it exists, who owns it, what feeds it, whether it should currently hold
data, and if it is empty, exactly why that is correct (or which pipeline
failed).

This document is not hand-maintained trivia. It is the human-readable twin of a
code registry — [`lib/data-coverage/inventory.ts`](../lib/data-coverage/inventory.ts) —
that the admin **Data Coverage → Platform Inventory** panel renders live against
real row counts. The classifications here and on that panel are always the same
because they come from the same source.

- Live counts snapshot: **2026-07** data-integrity audit.
- Health verdicts are derived by reconciling each table's designed intent with
  its live row count. Nothing here is guessed.

---

## Ownership taxonomy

Every table has exactly one owner:

| Owner | Meaning |
| --- | --- |
| **SportsDataIO** | Populated by a SportsDataIO import pipeline. |
| **The Odds API** | Populated by the Odds import pipeline. |
| **OpenWeather** | Populated by the weather import pipeline. |
| **Manual Enrichment** | Authored/curated by hand; no automated importer. |
| **System** | Reference data or operational bookkeeping owned by the platform. |
| **Intelligence Engine** | Produced by a derived-analytics engine. |
| **Decision Model** | Produced by a user/decision model run. |
| **Analytics** | Produced by aggregate analytics. |
| **Application** | Written by ordinary in-app user actions. |

> Note: no table is currently owned by **Intelligence Engine**, **Decision
> Model**, or **Analytics**. Those engines exist in code but read from the tables
> below rather than persisting their own tables yet. `course_characteristics` is
> their nearest input and is owned by **Manual Enrichment** until an enrichment
> pipeline ships.

## Health taxonomy

| Health | Meaning |
| --- | --- |
| **Healthy** | Holds the data it should. |
| **Waiting** | Legitimately empty now; fills through normal usage or an unmet dependency. |
| **Future** | Schema reserved for an unbuilt sprint; no writer exists yet. |
| **Provider Limited** | Empty/partial only because the current provider tier blocks the values. |
| **Obsolete** | No longer required; slated to remove/merge/replace. |
| **Broken** | Should hold data now, but the owning pipeline failed. |

---

## Summary

| Health | Count | Tables |
| --- | --- | --- |
| Healthy | 12 | users, sessions, accounts, tours, nationalities, players, player_season_statistics, courses, tournaments, tournament_courses, tournament_fields, dfs_salaries, odds_events, odds_quotes, import_runs, player_tour_histories, news_articles |
| Waiting | — | (empty auth/reference tables + dependency-gated feeds, see rows below) |
| Future | 4 | subscriptions, rounds, player_rounds, round_statistics, course_characteristics |
| Provider Limited | 4 | betting_events, betting_markets, betting_outcomes, fantasy_projections |
| Obsolete | 0 | — |
| Broken | 0 | — |

> The exact per-bucket counts are computed live on the dashboard (a table's
> bucket depends on whether it currently has rows). The table below is the
> authoritative per-table record; treat the dashboard tiles as the live tally.

**Bottom line:** there are **no broken tables** and **no obsolete tables**. Every
empty table is empty for a documented, expected reason — either it fills through
normal usage, it is reserved for a future sprint, or it is blocked by the
SportsDataIO trial tier. The one previously-obsolete table (`player_rankings`)
was removed in the 2026-07 audit.

---

## Every table

### Application & Auth

#### `users` — Users
- **Purpose:** Account identity and role (admin vs. member).
- **Owner:** Application · **Populated by:** Better Auth email + password sign-up.
- **Dependencies:** none.
- **Expected state:** ≥ 1 row once in use. **Current:** 1. **Health: Healthy.**

#### `profiles` — Profiles
- **Purpose:** Extended app-specific user preferences on top of the auth account.
- **Owner:** Application · **Populated by:** app write on profile completion.
- **Dependencies:** `users`.
- **Expected state:** one row per onboarded user. **Current:** 0.
- **Health: Waiting.** No user has completed a profile yet; created on demand.

#### `subscriptions` — Subscriptions
- **Purpose:** Billing tier and entitlement per user.
- **Owner:** Application · **Populated by:** app write once billing is wired.
- **Dependencies:** `users`.
- **Expected state:** empty until billing is enabled. **Current:** 0.
- **Health: Future.** No payment-provider integration in this sprint.

#### `sessions` — Auth Sessions
- **Purpose:** Active login sessions.
- **Owner:** System · **Populated by:** Better Auth on login (expired rows pruned).
- **Dependencies:** `users`.
- **Expected state:** fluctuates with active logins. **Current:** 2. **Health: Healthy.**

#### `accounts` — Auth Accounts
- **Purpose:** Credential/provider records (password hash, OAuth links).
- **Owner:** System · **Populated by:** Better Auth on sign-up.
- **Dependencies:** `users`.
- **Expected state:** one per user credential. **Current:** 1. **Health: Healthy.**

#### `verifications` — Auth Verifications
- **Purpose:** Short-lived email/verification tokens.
- **Owner:** System · **Populated by:** Better Auth during verification flows.
- **Dependencies:** `users`.
- **Expected state:** transient, usually empty. **Current:** 0.
- **Health: Waiting.** Ephemeral tokens; empty is the normal resting state.

### Reference

#### `tours` — Tours
- **Purpose:** The professional tours (PGA, DP World) everything hangs off.
- **Owner:** System · **Populated by:** reference bootstrap.
- **Dependencies:** none.
- **Expected state:** small fixed set. **Current:** 2. **Health: Healthy.**

#### `seasons` — Seasons
- **Purpose:** Per-tour, per-year season records grouping tournaments/memberships.
- **Owner:** System · **Populated by:** intended per tour/year seed. The
  tournament importer links to a season **only when one already exists** and
  never fabricates rows.
- **Dependencies:** `tours`.
- **Expected state:** one row per tour per active year. **Current:** 0.
- **Health: Waiting.** No season-seeding step exists yet, so rows are absent.
  Tournaments still import correctly because the season link is optional.
  **Follow-up:** add a small season seed to populate this reference table — this
  is a documented gap, not a pipeline failure.

#### `nationalities` — Nationalities
- **Purpose:** Canonical country records for the player nationality filter.
- **Owner:** SportsDataIO · **Populated by:** the player import (derived/linked).
- **Dependencies:** `players`.
- **Expected state:** one per referenced country. **Current:** 6. **Health: Healthy.**

### Player domain

#### `players` — Players
- **Purpose:** The player universe.
- **Owner:** SportsDataIO · **Populated by:** player import.
- **Dependencies:** none.
- **Expected state:** thousands. **Current:** 6,275. **Health: Healthy.**

#### `player_tour_histories` — Player Tour Histories
- **Purpose:** Which tour(s) a player is/was a member of, and when.
- **Owner:** SportsDataIO · **Populated by:** player import when membership resolves.
- **Dependencies:** `players`, `tours`, `seasons`.
- **Expected state:** one+ membership row per resolvable player. **Current:** 8.
- **Health: Healthy (sparse).** Only memberships the provider exposed on the
  trial tier are linked, so this is far below the player count by design.

#### `player_season_statistics` — Player Season Statistics
- **Purpose:** Season-level metrics per player **and the authoritative OWGR
  (`worldRanking`)** — the single source of world ranking after the vestigial
  `player_rankings` table was removed.
- **Owner:** SportsDataIO · **Populated by:** statistics import.
- **Dependencies:** `players`.
- **Expected state:** one row per player per accessible season. **Current:** 1,225.
- **Health: Healthy.** Current season is real and complete. **Prior seasons are
  provider-limited** — the trial-tier key returns HTTP 401 for them.

#### `news_articles` — News Articles
- **Purpose:** Player and general golf news for context surfaces.
- **Owner:** SportsDataIO · **Populated by:** news import.
- **Dependencies:** `players`.
- **Expected state:** rolling recent set. **Current:** 2.
- **Health: Healthy (sparse).** The trial-tier news feed returns very few articles.

### Course domain

#### `courses` — Courses
- **Purpose:** Course profiles (name, location, par, coordinates) for tournaments
  and weather.
- **Owner:** SportsDataIO · **Populated by:** course import, enriched with
  verified coordinates by the geolocation pipeline.
- **Dependencies:** none.
- **Expected state:** hundreds; a subset with verified coordinates. **Current:** 205.
- **Health: Healthy.** Only a small subset carries **verified** coordinates so
  far — the geolocation pipeline improves this incrementally and it gates weather.

#### `course_characteristics` — Course Characteristics
- **Purpose:** Rich course-fit attributes (grass, green speed, shot-value
  importances) consumed by the Course Fit / Course Intelligence model.
- **Owner:** Manual Enrichment · **Populated by:** manual authoring — no importer.
- **Dependencies:** `courses`.
- **Expected state:** empty until enrichment ships. **Current:** 0.
- **Health: Future.** The Course Intelligence model reads this, but nothing
  populates it in this sprint.

### Tournament domain

#### `tournaments` — Tournaments
- **Purpose:** Events on a tour — the spine of scheduling, fields, odds, weather.
- **Owner:** SportsDataIO · **Populated by:** tournament import.
- **Dependencies:** `tours`.
- **Expected state:** one row per tracked event. **Current:** 43. **Health: Healthy.**

#### `tournament_courses` — Tournament Courses
- **Purpose:** Join linking each tournament to its course(s).
- **Owner:** SportsDataIO · **Populated by:** course-linking step of tournament import.
- **Dependencies:** `tournaments`, `courses`.
- **Expected state:** ≥ 1 link per tournament. **Current:** 43. **Health: Healthy.**

#### `tournament_fields` — Tournament Fields
- **Purpose:** The entrant roster (field) per tournament.
- **Owner:** SportsDataIO · **Populated by:** field import.
- **Dependencies:** `tournaments`, `players`.
- **Expected state:** many entrants per event. **Current:** 3,855.
- **Health: Healthy.** A minority of entrants remain unmatched to players due to
  provider name mismatches.

### Round domain (future — Sprint 3.7 / 3.8)

#### `rounds` — Rounds
- **Purpose:** Per-round scheduling and status within a tournament.
- **Owner:** SportsDataIO · **Populated by:** a planned round-level importer.
- **Dependencies:** `tournaments`.
- **Expected state:** empty until round ingestion ships. **Current:** 0.
- **Health: Future.** Schema reserved; no importer writes it yet.

#### `player_rounds` — Player Rounds
- **Purpose:** One player's performance in one round — the anchor for future
  stats, DFS scoring, betting results, and model scores.
- **Owner:** SportsDataIO · **Populated by:** a planned round-level importer.
- **Dependencies:** `rounds`, `tournament_fields`.
- **Expected state:** empty until round ingestion ships. **Current:** 0.
- **Health: Future.** Anchor record reserved; no importer writes it yet.

#### `round_statistics` — Round Statistics
- **Purpose:** Raw per-round shot statistics (SG splits, GIR, putts) — a key
  input to Player Skill Intelligence.
- **Owner:** SportsDataIO · **Populated by:** a planned round-statistics importer.
- **Dependencies:** `player_rounds`.
- **Expected state:** empty until round ingestion ships. **Current:** 0.
- **Health: Future.** The Player Skill engine reads this, but the importer is not
  built yet.

### Betting & Fantasy (provider limited)

> These pipelines are fully built. On the current SportsDataIO **trial tier** the
> betting/fantasy endpoints 404 or return scrambled values, so the importers
> persist real structure with `available = false` and null values rather than
> fabricating data. Real values flow automatically once a production key is
> installed. **DFS salaries are the exception — they are genuinely real.**

#### `betting_events` — Betting Events
- **Owner:** SportsDataIO · **Depends on:** `tournaments`. **Current:** 0.
- **Health: Provider Limited.** Endpoint 404s / scrambles on the trial tier.

#### `betting_markets` — Betting Markets
- **Owner:** SportsDataIO · **Depends on:** `betting_events`. **Current:** 0.
- **Health: Provider Limited.** No events available ⇒ no markets.

#### `betting_outcomes` — Betting Outcomes
- **Owner:** SportsDataIO · **Depends on:** `betting_markets`. **Current:** 0.
- **Health: Provider Limited.** Values arrive scrambled; nothing real to persist.

#### `fantasy_projections` — Fantasy Projections
- **Owner:** SportsDataIO · **Depends on:** `tournaments`, `players`. **Current:** 0.
- **Health: Provider Limited.** Projections endpoint 404s / scrambles on the
  trial tier. (DFS salaries import separately and are real.)

#### `dfs_salaries` — DFS Salaries
- **Purpose:** Real DraftKings salary per player per slate — the flagship real
  DFS signal and the DFS Value model's core input.
- **Owner:** SportsDataIO · **Depends on:** `tournaments`, `players`.
- **Expected state:** thousands when events are slated. **Current:** 2,160.
- **Health: Healthy.** The one fully-real leg of the fantasy/betting family on
  the trial tier.

### Odds (The Odds API)

#### `odds_events` — Odds Events
- **Purpose:** Betting events from The Odds API (independent of SportsDataIO).
- **Owner:** The Odds API · **Depends on:** `tournaments`.
- **Expected state:** one row per currently-priced event. **Current:** 2.
- **Health: Healthy (sparse).** Only events the books are actively pricing.

#### `odds_quotes` — Odds Quotes
- **Purpose:** Individual bookmaker price quotes, linked to players where possible.
- **Owner:** The Odds API · **Depends on:** `odds_events`, `players`.
- **Expected state:** many quotes per priced event. **Current:** 951.
- **Health: Healthy.** Real, multi-bookmaker quotes with a high player-link rate.

### Weather (OpenWeather)

#### `weather_snapshots` — Weather Snapshots
- **Purpose:** A point-in-time forecast pull for a tournament's host course.
- **Owner:** OpenWeather · **Populated by:** weather import for upcoming events
  with **verified** course coordinates.
- **Dependencies:** `tournaments` → `tournament_courses` → `courses.latitude`
  (verified) via **Course Geocoding**.
- **Expected state:** populates for upcoming events with verified host coords.
  **Current:** 0.
- **Health: Waiting.** Blocked upstream: upcoming events currently lack host
  courses with verified coordinates, so the import has nothing to fetch for.
  Advancing the geolocation pipeline unblocks it.

#### `weather_periods` — Weather Periods
- **Purpose:** Per-interval forecast rows (wind, temp, precipitation) in a snapshot.
- **Owner:** OpenWeather · **Populated by:** weather import (nested under snapshots).
- **Dependencies:** `weather_snapshots`.
- **Expected state:** multiple periods per snapshot. **Current:** 0.
- **Health: Waiting.** Depends entirely on `weather_snapshots`, itself waiting on
  verified course coordinates.

### Operations

#### `import_runs` — Import Runs
- **Purpose:** Append-only audit trail of every import execution (provider,
  status, row counts, errors).
- **Owner:** System · **Populated by:** every `runXImport()` via the run-recorder.
- **Dependencies:** none.
- **Expected state:** grows by one row per run. **Current:** 15. **Health: Healthy.**

---

## Key dependency chains

```
weather_periods
  depends on weather_snapshots
    depends on courses.latitude (VERIFIED)
      depends on Course Geocoding pipeline

dfs_value (model, not a table)
  depends on dfs_salaries (real)  ← Fantasy Import
  depends on player_season_statistics (real strokes-gained)

player_rankings (OWGR)
  now sourced from player_season_statistics.worldRanking
  (the standalone player_rankings table was REMOVED in the 2026-07 audit)

round_statistics → player_rounds → rounds → tournaments   (all Future)
```

## Empty-table verdicts at a glance

| Table | Should be empty today? | Why / which pipeline |
| --- | --- | --- |
| `profiles` | YES | No profile completed yet; app write on demand. |
| `subscriptions` | YES | Billing not wired (future). |
| `verifications` | YES | Ephemeral tokens. |
| `seasons` | YES | No season-seed step yet; link is optional. **Follow-up: add seed.** |
| `course_characteristics` | YES | Enrichment pipeline not built (future). |
| `rounds` / `player_rounds` / `round_statistics` | YES | Round ingestion is Sprint 3.7 / 3.8 (future). |
| `betting_events` / `betting_markets` / `betting_outcomes` | YES | SportsDataIO trial tier blocks values (provider limited). |
| `fantasy_projections` | YES | SportsDataIO trial tier blocks values (provider limited). |
| `weather_snapshots` / `weather_periods` | YES | Waiting on verified host-course coordinates. |

No empty table maps to a **failed** pipeline. Every zero has an expected cause.

---

## Where this lives in code

- **Registry (source of truth):** [`lib/data-coverage/inventory.ts`](../lib/data-coverage/inventory.ts)
- **Types:** [`lib/data-coverage/types.ts`](../lib/data-coverage/types.ts) (`PlatformInventory*`, `TableHealth`, `TableOwner`)
- **Live counts + reconciliation:** `buildInventory()` in [`lib/data-coverage/service.ts`](../lib/data-coverage/service.ts)
- **Dashboard panel:** `features/admin/data-coverage/inventory-panel.tsx` (Admin → Data Coverage → Platform inventory)

To add or reclassify a table, edit the registry — the dashboard and this
document's intent stay in lockstep because they share it.
