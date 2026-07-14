# Database — CaddieIQ (Planned)

This document describes the **planned** data model for CaddieIQ. No database is
provisioned yet and no SQL exists in the repository. The target platform is
PostgreSQL (Neon). This is a design reference — schemas will be finalized during
Phase 2 (Data). See [ROADMAP.md](./ROADMAP.md).

---

## Conventions

These conventions apply to every table when the schema is implemented.

| Convention | Rule |
| --- | --- |
| **Primary keys** | UUID `id` per row. |
| **Timestamps** | `created_at` and `updated_at` on every table. |
| **Ownership** | User-owned rows carry a `user_id` foreign key and are scoped by it in every query. |
| **Naming** | `snake_case` columns; singular concept, plural table names. |
| **Soft references** | Foreign keys are indexed; deletes cascade or restrict deliberately per relationship. |
| **Money & metrics** | Stored as precise numeric types, never floats where accuracy matters. |

---

## Entity Overview

```
Users ─┬─< Models ─┬─< ModelWeights
       │           └─< SavedModels
       ├─< Backtests
       └─< Subscriptions

Tours ─< Tournaments ─┬─< Rounds >─ Players
                      └─ Courses ─< Weather

Players ─< Statistics
Tournaments ─< Rankings >─ Models
Tournaments ─< Odds >─ Players
```

---

## Planned Tables

### Users

Accounts and workspace ownership.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `email` | text | Unique login identifier. |
| `name` | text | Display name. |
| `workspace_name` | text | Label for the user's workspace. |
| `role` | text | `user` \| `admin`. |
| `created_at` / `updated_at` | timestamp | |

### Players

The player universe.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `full_name` | text | Player name. |
| `country` | text | ISO country code. |
| `tour_id` | uuid | FK → Tours (primary tour). |
| `world_ranking` | int | Current official ranking. |
| `status` | text | `active` \| `inactive`. |
| `created_at` / `updated_at` | timestamp | |

### Tours

Professional golf tours (e.g. PGA, DP World).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `name` | text | Tour name. |
| `abbreviation` | text | Short code. |
| `region` | text | Geographic region. |

### Courses

Course profiles and characteristics.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `name` | text | Course name. |
| `location` | text | City / region. |
| `par` | int | Course par. |
| `yardage` | int | Total yardage. |
| `grass_type` | text | Greens/fairway surface. |
| `attributes` | jsonb | Elevation, difficulty, and other profile data. |

### Tournaments

Events on a tour.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `name` | text | Event name. |
| `tour_id` | uuid | FK → Tours. |
| `course_id` | uuid | FK → Courses. |
| `start_date` / `end_date` | date | Event window. |
| `status` | text | `upcoming` \| `live` \| `completed`. |
| `field` | jsonb | Entry list / field metadata. |

### Rounds

Per-player, per-round scoring within a tournament.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `tournament_id` | uuid | FK → Tournaments. |
| `player_id` | uuid | FK → Players. |
| `round_number` | int | 1–4 (or playoff). |
| `score` | int | Strokes. |
| `to_par` | int | Relative to par. |
| `hole_data` | jsonb | Optional hole-by-hole detail. |

### Statistics

Derived and raw player performance metrics.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `player_id` | uuid | FK → Players. |
| `metric` | text | e.g. `sg_total`, `driving_accuracy`. |
| `value` | numeric | Metric value. |
| `period` | text | Season / rolling window the stat covers. |
| `context` | jsonb | Course-fit or condition context. |

### Models

User-defined predictive models.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `user_id` | uuid | FK → Users (owner). |
| `name` | text | Model name. |
| `description` | text | Optional summary. |
| `scoring_logic` | jsonb | How weighted inputs combine into a score. |
| `status` | text | `draft` \| `active` \| `archived`. |
| `version` | int | Incremented on significant edits. |

### ModelWeights

Individual weighted inputs belonging to a model.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `model_id` | uuid | FK → Models. |
| `input_key` | text | The statistic/feature being weighted. |
| `weight` | numeric | Relative weight. |
| `direction` | text | `positive` \| `negative`. |

### SavedModels

User-favorited or bookmarked models (including from the future marketplace).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `user_id` | uuid | FK → Users. |
| `model_id` | uuid | FK → Models. |
| `saved_at` | timestamp | |

### Rankings

Output of a model run against a tournament field.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `model_id` | uuid | FK → Models. |
| `tournament_id` | uuid | FK → Tournaments. |
| `player_id` | uuid | FK → Players. |
| `rank` | int | Position in the ranked list. |
| `score` | numeric | Computed model score. |
| `generated_at` | timestamp | Run timestamp. |

### Weather

Course conditions and forecasts.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `course_id` | uuid | FK → Courses. |
| `tournament_id` | uuid | FK → Tournaments (nullable). |
| `observed_at` | timestamp | Time of reading/forecast. |
| `wind_speed` | numeric | |
| `precipitation` | numeric | |
| `temperature` | numeric | |
| `conditions` | jsonb | Additional forecast detail. |

### Odds

Sportsbook lines for comparison against model output.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `tournament_id` | uuid | FK → Tournaments. |
| `player_id` | uuid | FK → Players. |
| `market` | text | e.g. `outright`, `top_10`. |
| `price` | numeric | Decimal/American odds. |
| `source` | text | Sportsbook identifier. |
| `captured_at` | timestamp | |

### Backtests

Historical validation runs for a model.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `user_id` | uuid | FK → Users. |
| `model_id` | uuid | FK → Models. |
| `range_start` / `range_end` | date | Period tested. |
| `accuracy` | numeric | Headline accuracy metric. |
| `results` | jsonb | Detailed per-event breakdown. |
| `status` | text | `queued` \| `running` \| `complete` \| `failed`. |

### Subscriptions

Billing and entitlement state.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `user_id` | uuid | FK → Users. |
| `tier` | text | `free` \| `pro` \| `premium`. |
| `status` | text | `active` \| `past_due` \| `canceled`. |
| `provider_customer_id` | text | Billing provider reference (e.g. Stripe). |
| `current_period_end` | timestamp | Renewal boundary. |

---

## Indexing & Performance Notes

- Index all foreign keys and high-cardinality filter columns (`player_id`,
  `tournament_id`, `model_id`, `user_id`).
- Time-series tables (`rounds`, `statistics`, `odds`, `weather`) should be indexed
  on their timestamp/period columns for range queries.
- `rankings` should have a composite index on `(model_id, tournament_id)` for fast
  retrieval of a specific run.
- Consider materialized views or derived tables for expensive aggregate analytics.
