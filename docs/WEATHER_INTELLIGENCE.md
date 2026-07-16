# Weather Intelligence Engine

The **single authoritative source** of an event's playing conditions:

> _"What weather will this tournament be played in, how does it change round to
> round and wave to wave, and how sure are we?"_

It is the realization of the **Wind** model in [MODELS.md](./MODELS.md) §2.5,
generalized to the full weather picture (wind, temperature, rain, and their
combined effect on scoring). Like every event-specific model, it resolves the
tournament and host course it describes from the shared **Tournament Context
Engine** and reads its forecast from one place, so no two surfaces can disagree
about the conditions or how confident they are.

It follows the platform's governing rule (see [MODELS.md](./MODELS.md)):
**never fabricate conditions.** With no imported forecast — no API key, no
venue coordinates, or an event outside the provider's horizon — the engine
returns an explicit `unavailable` profile with a machine-readable reason. It
never invents a temperature, a wind speed, or a rain chance.

---

## Why it exists

Wind and weather are among the largest event-level drivers of scoring, yet they
are the easiest thing to fake — a plausible-looking "12 mph SW, 20% rain" reads
as real whether or not any forecast backs it. The engine exists to make weather
a **first-class, verifiable signal family** with the same discipline as ratings:

1. **One forecast, one confidence.** The hero chip, the round-by-round table,
   and the wave analysis all derive from a single stored snapshot graded by a
   single pure function. They cannot drift apart.
2. **Honest degradation.** Every field is nullable end to end — a period the
   provider gave no rain probability for reports "no signal", not `0%`. A thin
   or stale snapshot lowers confidence rather than masquerading as certainty.
3. **Reusable by future models.** Wind Fit, DFS Value, and the tournament
   Overall Rating's Family E modifier all consume this family instead of
   re-deriving conditions from a raw feed.

---

## The intelligence object

```ts
type WeatherIntelligence = {
  status: "available" | "unavailable"
  statusReport: WeatherStatusReport      // lifecycle state (see Weather Status Engine)
  confidence: WeatherConfidence          // verified | partial | unavailable
  venue: WeatherVenue | null             // host course + coordinates
  current: WeatherPeriodSignals | null   // nearest forecast period, normalized
  family: WeatherSignalFamily | null     // rounds, timelines, waves, summary
  provenance: WeatherProvenance | null   // source, capture time, coverage
  gaps: WeatherGap[]                      // machine-readable reasons
  detail: string                         // plain-English, safe to render
}
```

`status` answers "is there a usable forecast object?" while **`statusReport`**
answers the higher-level, timing-aware question "what should the UI say right
now?" — the two are distinct, and every surface reads `statusReport` to decide
what to render (see the next section).

An **available** profile carries verified provider facts only, normalized into
US-friendly units (°F, mph, %) with severity bands. An **unavailable** profile
carries `gaps` and a `detail` string that is safe to show directly.

### Confidence is the ceiling

`confidence` is the most important field: it is the **maximum certainty any
consumer may present**, and it is itself capped by the Tournament Context
Engine's confidence for the event.

| Confidence     | Meaning                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `verified`     | Fresh snapshot (recent capture) that **covers every scheduled round**           |
| `partial`      | A real snapshot, but stale and/or missing coverage for one or more rounds       |
| `unavailable`  | No usable snapshot — nothing to present                                         |

The rule lives in one pure function (`gradeConfidence`): a forecast older than
the freshness window, or one whose periods do not span every round, degrades to
`partial`; no periods at all is `unavailable`. Forecast age and round coverage
are the two axes, mirroring the "doubly uncertain" caution in MODELS.md §2.5 —
weather confidence must reflect both data volume **and** forecast volatility.

---

## The Weather Status Engine

`confidence` grades a forecast that exists. The **Weather Status Engine**
(`status.ts`) answers the prerequisite question the UI actually asks: _"what
state is weather in for this event, and why?"_ It replaces the old single,
misleading **"Awaiting import"** string — which was shown for completed events
too — with a truthful status computed from five plain facts:

1. the event's **timing** relative to now (`future` / `current` / `past`),
2. whether the venue has **usable coordinates**,
3. whether a **forecast snapshot** exists,
4. the **outcome of the last import attempt** (did it fail?), and
5. whether the connected **provider supports historical** weather.

It is a **pure function** (`computeWeatherStatus`, no I/O), so the tournament
page, the hero chip, and System Health all read the same classification and can
never disagree. The critical honesty fix: the connected provider (OpenWeather)
serves **forecast weather only**, so a *completed* event is never "awaiting
import" — it is explicitly **historical weather unavailable**.

### Status matrix

Each code maps 1:1 to a row here. `refreshEligible` gates the admin
**Refresh Weather** control; `awaitingImport` is the _only_ state whose copy may
say the event is waiting on an import.

| Code                        | When                                                       | Tone     | Forecast shown? | Refreshable |
| --------------------------- | ---------------------------------------------------------- | -------- | --------------- | ----------- |
| `forecast-not-yet-available`| Future event beyond the ~5-day horizon                     | neutral  | no              | no          |
| `awaiting-forecast-import`  | Inside the window, located, no snapshot yet                | info     | no              | **yes**     |
| `forecast-available`        | Future event inside the window, snapshot loaded            | positive | **yes**         | yes         |
| `live-forecast`             | Event in progress, snapshot loaded                         | positive | **yes**         | yes         |
| `weather-import-failed`     | Eligible event whose last import attempt failed            | warning  | no              | **yes**     |
| `historical-unavailable`    | Completed event; provider has no historical weather        | neutral  | no              | no          |
| `historical-available`      | Completed event with historical weather (future provider)  | positive | **yes**         | no          |
| `coordinates-unavailable`   | Venue has no usable coordinates                            | warning  | no              | no          |
| `provider-unavailable`      | Forecast provider currently unreachable                    | warning  | no              | no          |

The `WeatherStatusReport` carries a render-ready `label`, `description`, and
`tone` alongside the code, so surfaces render honest copy without re-deriving
it. The tournament page shows the forecast body **only** for the three
"Forecast shown?" rows; every other state renders the status placeholder, so a
completed event can never display last week's stale forecast.

---

## Signal families

Once a snapshot is available, the engine derives four independent views, each
built from the same periods but answering a different question:

- **Current conditions** (`current`) — the nearest forecast period: temperature,
  feels-like, wind speed/gust/direction, rain probability, humidity, cloud, and
  a golf-relevant severity band per signal.
- **Round-by-round** (`family.rounds`) — periods bucketed into local days and
  mapped to practice / round-1..N using the tournament schedule, each with a
  daytime-hours summary (playable-window wind and rain, not 3am noise).
- **Wind & rain timelines** (`family.windTimeline`, `family.rainTimeline`) — the
  ordered daytime series that drive the inline sparkline-style bars, so a user
  sees when conditions spike, not just a daily average.
- **Tee-time (wave) edge** (`family.waves`) — morning vs. afternoon comparison
  per round, flagging which wave draws the calmer or wetter side of the day and
  by how much. This is the round-and-wave granularity MODELS.md §2.5 lists as a
  Wind enhancement.

Every derived value is `null` when its underlying signal was absent, so a
partial feed produces a partial — never padded — picture.

---

## Architecture

```
Tournament Page ─ tournamentService.getWeatherIntelligence(id)
                        │  (React cache, per request)
                        ▼
        getWeatherIntelligenceService()          server-only
                        │  reads snapshot + venue/schedule
                        ▼
             WeatherRepository (Prisma)  ── weather_snapshots / weather_periods
                        │
                        ▼
        buildWeatherIntelligence()   ← PURE: signals → characteristics →
                        │               waves → confidence. No I/O. Unit-tested.
                        ▼
               WeatherIntelligence  → Tournament Page, (Wind Fit, DFS, …)


OpenWeather API ─ WeatherClient ─ importWeather() ─ WeatherRepository.replaceSnapshot()
   (rate-limited, retrying, timeout-guarded)         (atomic per-tournament replace)
```

- **`lib/weather-intelligence/`** — the pure engine. `signals.ts` (unit
  conversion + per-period severity), `characteristics.ts` (daytime aggregation),
  `waves.ts` (morning/afternoon edge), `intelligence.ts` (round mapping +
  confidence + assembly), `status.ts` (the Weather Status Engine — lifecycle
  classification), `types.ts`. No I/O; safe to import anywhere.
- **`lib/weather-intelligence/service.ts`** — `server-only`. Loads the stored
  snapshot and the tournament's venue/schedule, feeds the pure core, returns the
  profile. Wrapped in React `cache` so `generateMetadata` + page share one read.
- **`lib/providers/weather/`** — the OpenWeather client (`client.ts`), config
  and env resolution (`config.ts`), and raw response types (`types.ts`).
- **`lib/imports/weather-import.ts`** — the importer: fetches a forecast per
  in-horizon tournament that has a linked host course with coordinates, maps it
  to the repository input, and atomically replaces that tournament's snapshot.
- **`lib/repositories/weather-repository.ts`** — the only weather DB access:
  transactional `replaceSnapshot`, a venue/schedule reader, and read paths for
  the engine.

### Data model

Two tables (see [DATA_CATALOG.md](./DATA_CATALOG.md)):

- **`weather_snapshots`** — one row per tournament (`@unique tournamentId`):
  venue coordinates, UTC offset, capture time, forecast bounds, period count,
  source. Re-importing replaces it.
- **`weather_periods`** — the 3-hour forecast buckets for a snapshot. Every
  measurement column is nullable; a value is stored only when the provider
  supplied it, so the engine degrades on real gaps instead of reading a
  fabricated zero.
- **`weather_import_logs`** — one row per tournament *considered* on each import,
  with its `result` (`STORED` / `SKIPPED` / `FAILED`), forecast-eligibility,
  provider response, rows written, period count, skip reason, and duration. The
  per-event audit trail behind the aggregate `ImportRun`.

---

## The importer

`runWeatherImport(tournamentIds?)` is idempotent and honest by construction:

- It only fetches for tournaments that have a **linked host course with
  VERIFIED coordinates** and fall inside the provider's useful forecast horizon.
  Coordinates are supplied and vouched for by the **Course Geolocation Engine**
  (see [COURSE_GEOLOCATION.md](./COURSE_GEOLOCATION.md)); the venue reader
  surfaces a coordinate only when its `coordinateConfidence = VERIFIED`. Events
  with no venue or no verified coordinates are **skipped, not fetched for a
  fabricated or approximate location**.
- The client is **timeout-guarded, retrying, and rate-limited**, and it fails
  loudly when `OPENWEATHER_API_KEY` is absent rather than returning stub data.
- Each tournament's snapshot is replaced **atomically** (delete + insert in one
  transaction), so a reader never sees a half-written forecast.
- **Every considered tournament writes a `weather_import_logs` row** — `STORED`,
  `SKIPPED` (with a machine-readable `skippedReason`), or `FAILED` (with the
  provider/error message) — capturing forecast-eligibility, rows written, period
  count, and per-tournament duration. This granular audit trail sits beneath the
  aggregate `ImportRun` and is the source of truth for a tournament's "last
  successful import", whether its last attempt failed (drives the
  `weather-import-failed` status), and System Health's throughput stats. Audit
  logging is best-effort and never breaks an import.
- Run it **after** the tournament import, course linking, and
  `runCourseGeolocation`, so each event has a verified venue to locate a
  forecast for. A course still `UNKNOWN` produces the Tournament Page's
  "Awaiting course coordinates" state rather than any weather.

Until a key is set and an import has run, the entire surface reports
`unavailable` — which is the correct, honest state, not a bug.

---

## Consumers

### Tournament Page — Weather Intelligence section

`tournamentService.getWeatherIntelligence(id)` resolves the profile; the
`TournamentWeatherIntelligence` card renders it, keyed off `statusReport.code`:

- **Forecast states** (`forecast-available`, `live-forecast`,
  `historical-available`) → the full section: current conditions, round-by-round
  table, wind and rain timelines, and the tee-time wave edge, badged by
  `confidence`.
- **Every other state** → the honest **status placeholder** whose headline, body,
  and tone come straight from `statusReport` — "Forecast not yet available",
  "Historical weather unavailable", "Import failed", "Awaiting course
  coordinates", etc. No conditions are drawn, and a completed event never shows a
  stale forecast.

The page **hero** weather chip reads its one-line summary from the same profile,
falling back to the `statusReport.label` (e.g. "Historical weather unavailable")
rather than a blanket "Awaiting import" — so the header and the section always
agree on the true state.

### Admin — Refresh Weather

Admins (session role `ADMIN`, re-read from the database — never trusted from the
client) see a **Refresh Weather** control and an import-metadata line on the
weather card. The control calls a server action that re-verifies admin, runs the
importer for that single tournament, `revalidatePath`s the page, and reports the
real outcome. The metadata line shows the **last successful import**, the **last
attempt and its result**, and any skip reason — all from `weather_import_logs`,
never fabricated. Non-admins see none of this and the extra query never runs for
them.

### Future consumers

Wind Fit (MODELS.md §2.5 as a Family E modifier), DFS Value, and the tournament
Overall Rating read this family instead of the raw feed, inheriting its
`verified / partial / unavailable` confidence and never inflating it.

---

## Adding weather to a new surface

1. Call `tournamentService.getWeatherIntelligence(id)` — do **not** read the
   snapshot or hit the provider yourself.
2. Gate on `status` / `confidence`; treat `confidence` as your ceiling.
3. On `partial` / `unavailable`, degrade using `gaps` / `detail` — never
   fabricate the missing conditions.

---

## Honesty guarantees

- The profile is built from **verified provider facts only**; the pure engine
  never invents a period, and the importer never fetches for a guessed location.
- Every signal is nullable end to end — an absent field reads as "no signal",
  never a default `0`.
- `unavailable` is a first-class state with machine-readable `gaps`, not an
  empty object a caller might misread as "calm and clear".
- The **Weather Status Engine** guarantees the UI's copy matches reality: a
  completed event reads "historical weather unavailable" (never "awaiting
  import"), a too-far-out event reads "forecast not yet available", and only a
  genuinely eligible, un-imported event is ever shown as awaiting a forecast.
- Import history is **audited per tournament** (`weather_import_logs`); the
  "last import" metadata and failure status are read from real rows, so a skip
  is never presented as a success and a stale forecast is never re-shown.
- Confidence is derived by one pure, tested function from forecast **age** and
  **round coverage**, and is capped by the Tournament Context Engine — so the
  whole page agrees on one event, one forecast, and one confidence.

See also: [SYSTEM_HEALTH.md](./SYSTEM_HEALTH.md),
[TOURNAMENT_CONTEXT_ENGINE.md](./TOURNAMENT_CONTEXT_ENGINE.md),
[COURSE_INTELLIGENCE.md](./COURSE_INTELLIGENCE.md), [MODELS.md](./MODELS.md),
[DATA_CATALOG.md](./DATA_CATALOG.md).
