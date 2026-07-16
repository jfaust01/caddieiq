# System Health

An **internal, admin-only diagnostics surface** that answers one question for
each background subsystem:

> _"Is data flowing — and if not, exactly why, in a way I can act on?"_

It exists because the platform's governing rule is **never fabricate data**: when
a surface is empty, that emptiness is either correct (nothing to show yet) or a
real failure, and the two must be told apart at a glance. System Health makes the
distinction explicit and live, so an off-season empty weather table is never
mistaken for a broken pipeline — and a genuinely broken pipeline is never hidden
behind a plausible-looking blank.

Today it covers the **Weather** ingestion pipeline. It is designed to grow one
section per subsystem (imports, geolocation, odds, …) using the same pattern.

---

## Access

- Route: `/admin/system-health`, rendered `force-dynamic` (read live every
  request, never cached).
- **ADMIN only.** The page re-reads the session user's role from the database
  via `isCurrentUserAdmin()` — it is never trusted from the client. Non-admins
  receive a **404, not a 403**, so the route's existence is not disclosed, and it
  is intentionally absent from all navigation.

---

## What it reports (Weather)

Everything below is read **live and honestly** — no value is cached, estimated,
or fabricated. Source: `lib/system-health/weather-health.ts`
(`getWeatherHealthReport()`), rendered by `SystemHealthView`.

### Status overview

Five tiles, each with a traffic-light tone:

| Tile          | Answers                                              | Source                                             |
| ------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **Scheduler** | Is the cron wired and able to authorize?             | `vercel.json` crons + `CRON_SECRET` presence       |
| **Provider**  | Does the forecast provider respond right now?        | live `probeWeatherProvider()` (latency + periods)  |
| **Stored data** | How much forecast data exists?                     | `weather_snapshots` / `weather_periods` counts     |
| **Last run**  | Did the most recent import run succeed?              | newest `ImportRun` where `entity = "weather"`      |
| **Next run**  | When does the importer fire next?                    | computed from the daily cron expression (UTC)      |

### Forecast-window throughput

A compact strip summarizing the current forecast window (real counts only):

- **Forecast window** — the ~5-day horizon the importer covers.
- **Eligible events** — tournaments inside the window (what should be covered).
- **Imported** — eligible events that have a stored snapshot (`imported/eligible`).
- **Skipped (unlocated)** — eligible events with no usable venue coordinates.
- **Avg import time** — mean duration of *stored* per-tournament imports over the
  last 7 days, from `weather_import_logs`, with the sample size. `—` when nothing
  has been stored recently, never a fabricated number.

### Forecast-window coverage

A per-event table of every tournament inside the horizon, each showing its host
venue and one of: **Forecast loaded** (ok), **Awaiting import** (warn), or
**Host not located** (error). When the window is empty, the table is replaced by
an explicit explanation naming the nearest upcoming event and how far out it is —
so an empty window reads as expected off-season behavior, not a failure.

### Recent import runs

The last ten `ImportRun` rows (newest first) with considered / stored / skipped /
failed counts and the run summary or error. A zero-consideration run is annotated
with its reason.

---

## Two layers of import history

System Health draws on **both** weather import history tables, which serve
different granularities:

- **`ImportRun`** (aggregate) — one row per import *execution*: totals, status,
  duration, summary. Powers "Last run", "Next run", and the recent-runs table.
- **`weather_import_logs`** (per tournament) — one row per tournament *considered*
  in a run, with its `STORED` / `SKIPPED` / `FAILED` result, forecast-eligibility,
  provider response, rows written, skip reason, and duration. Powers the
  throughput stats (imported / skipped / avg duration) and, on the tournament
  page, the per-event "last import" metadata and the `weather-import-failed`
  status. See [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md).

---

## Architecture

```
/admin/system-health (force-dynamic, ADMIN-gated)
        │  isCurrentUserAdmin()  → notFound() for non-admins
        ▼
getWeatherHealthReport()                         server-only
        │  parallel, all live:
        ├─ readSchedulerConfig()      ← vercel.json crons
        ├─ probeWeatherProvider()     ← live provider ping
        ├─ counts                     ← weather_snapshots / weather_periods
        ├─ recent ImportRun rows      ← entity = "weather"
        ├─ forecastable tournaments   ← inside the ~5-day window
        ├─ nearest upcoming event     ← to explain an empty window
        └─ stored-import duration agg ← weather_import_logs (7d)
        ▼
   WeatherHealthReport  →  SystemHealthView (pure presentational)
```

- **`lib/system-health/weather-health.ts`** — `server-only`. Assembles the live
  report; the only place these diagnostics are gathered. `nextRunFromCron()`
  computes the next fire time for the daily cron with no dependencies.
- **`features/admin/system-health/system-health-view.tsx`** — pure
  presentational. Every empty state carries an explanation; nothing is hidden.

---

## Honesty guarantees

- Every value is **read live on each request** — the page is `force-dynamic` and
  nothing is cached.
- **Empty states are explained, never hidden.** An empty forecast window names
  the nearest event and why it is out of range; a never-run importer says so and
  how to trigger it.
- Counts and durations come from **real rows** (`weather_snapshots`,
  `weather_import_logs`, `ImportRun`). "Avg import time" shows `—` rather than a
  fabricated figure when there is no recent sample.
- The provider tile is a **live ping**, so it reflects reachability now, not a
  cached assumption.

See also: [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md),
[COURSE_GEOLOCATION.md](./COURSE_GEOLOCATION.md),
[DATA_CATALOG.md](./DATA_CATALOG.md).
