# Weather Intelligence Pipeline Audit & Diagnostic

## Current Status: ❌ NOT OPERATIONAL

The Weather Intelligence pipeline is architecturally complete but **does not populate weather data** because the OpenWeather API key is not configured in the environment.

### Root Cause

**Missing `OPENWEATHER_API_KEY` environment variable**

The pipeline fails at the first step when trying to initialize the OpenWeatherClient:

```typescript
// lib/providers/weather/config.ts
export function loadOpenWeatherConfig(overrides: OpenWeatherConfigInput = {}): OpenWeatherConfig {
  return validateOpenWeatherConfig({
    apiKey: overrides.apiKey ?? process.env.OPENWEATHER_API_KEY ?? null,  // ← null when env var missing
    // ...
  })
}
```

This throws an `AuthenticationError` immediately:

```
"OpenWeather is not configured: set the OPENWEATHER_API_KEY environment variable."
```

---

## Pipeline Architecture

The Weather Intelligence pipeline is a 10-step flow designed to fetch 5-day/3-hour forecasts from OpenWeather and persist them honestly — **never fabricating data**.

### Step-by-Step Flow

```
1. Tournament Selection
   ↓ (auto or explicit)
   2. Venue Lookup → Course Coordinates
   ↓ (skip if no coordinates)
   3. OpenWeather API Request
   ↓ (skip if no 5-day window)
   4. Data Normalization → WeatherPeriodInput[]
   ↓ (skip if 0 periods)
   5. Atomic Replace Snapshot
   ↓ (includes WeatherSnapshot + WeatherPeriod records)
   6. Audit Log Entry (WeatherImportLog)
```

### Entry Points

#### 1. Manual Refresh (Admin-Only)
- **UI:** Tournament detail page → "Refresh Weather" button (admin only)
- **Server Action:** `refreshTournamentWeather()` in `weather-actions.ts`
- **Security:** Re-checks admin role on server for every call
- **Behavior:** Forces a fetch (bypasses freshness guard), writes import log, revalidates page

#### 2. Automatic Scheduled Import
- **Trigger:** Daily cron job (via `runWeatherImport()`)
- **Selection:** Tournaments within 6-day forecast window
- **Behavior:** Respects freshness intervals, writes aggregate ImportRun + per-tournament logs

#### 3. Programmatic
- **Function:** `importWeather(options)` in `lib/imports/weather-import.ts`
- **Usage:** Called by `runWeatherImport()`, testable directly
- **Options:**
  - `tournamentIds?: string[]` — explicit tournaments
  - `minRefreshIntervalMs?` — freshness guard
  - `importRunId?` — links to aggregate ImportRun record

---

## Each Component

### Configuration & Authentication
**File:** `lib/providers/weather/config.ts`

```typescript
// Required environment variable
process.env.OPENWEATHER_API_KEY  // Must be set to a valid OpenWeather API key
```

- **Configuration fields:**
  - `apiKey` — API authentication (required; throws if missing)
  - `baseUrl` — REST base URL (default: `https://api.openweathermap.org/data/2.5`)
  - `timeoutMs` — per-request timeout (default: 10,000ms)
  - `maxRetries` — retry attempts for transient failures (default: 2)
  - `minRequestIntervalMs` — client-side rate limit (default: 250ms)

- **Validation:** Pure function (`validateOpenWeatherConfig`) — testable without environment

### OpenWeather Client
**File:** `lib/providers/weather/client.ts`

- **Endpoint:** `/data/2.5/forecast`
- **Parameters:**
  - `lat`, `lon` — venue coordinates
  - `units=metric` — Celsius/m/s
  - `appid` — API key (redacted from logs)

- **Responsibilities:**
  - Fetch authenticated 5-day/3-hour forecast
  - Enforce client-side min request interval
  - Retry transient failures (5xx, 429) with backoff
  - Map failures to shared error taxonomy

- **Non-responsibilities:**
  - Does NOT normalize, grade, or persist data
  - Returns raw, typed OpenWeather envelope

### Weather Import Pipeline
**File:** `lib/imports/weather-import.ts`

**Main function:** `importWeather(options): Promise<WeatherImportSummary>`

#### Tournament Selection Logic

```typescript
// Auto: upcoming & in-progress within 6-day window
const horizon = new Date(Date.now() + DEFAULT_HORIZON_DAYS * 86_400_000)  // 6 days
const tournaments = await prisma.tournament.findMany({
  where: {
    deletedAt: null,
    status: { not: "CANCELED" },
    startDate: {
      lte: horizon,
      gte: new Date(Date.now() - 5 * 86_400_000),  // Also past 5 days (ongoing events)
    },
  },
})
```

**Selection criteria:**
- Not soft-deleted
- Not canceled
- Start date within ±5 days to +6 days from now

**Why 6 days?** OpenWeather's free tier provides ~5 days of forecast. Using 6 days as the window ensures events entering the forecast range on the next daily run are picked up.

#### Per-Tournament Processing

For each tournament:

1. **Lookup venue** → course coordinates & timezone
   - Skip if no host course linked
   - Skip if course has no coordinates

2. **Fetch forecast** from OpenWeather
   - Request 5-day/3-hour forecast for venue coordinates
   - Skip (with reason) if fetch fails
   - Catches: auth error, rate limit (429), timeout, malformed response

3. **Normalize periods** → WeatherPeriodInput[]
   - Map each OpenWeather 3-hour bucket
   - All fields optional (nullable) — only store values present in provider response
   - Skip if 0 usable periods returned

4. **Atomic replace snapshot**
   - One snapshot per tournament (keyed by tournamentId)
   - Deletes prior periods atomically when replacing
   - Records inserted vs. updated in audit log

5. **Audit logging**
   - Writes per-tournament `WeatherImportLog` entry
   - Captures: tournament, course, coordinates, eligibility, provider response, duration

#### Error Handling

| Failure | Action | Logged As |
|---------|--------|-----------|
| Tournament not found | Record log entry, continue | `FAILED` |
| No host course | Record skip reason | `SKIPPED` |
| No coordinates | Record skip reason | `SKIPPED` |
| Existing snapshot too fresh | Skip, respect interval | `SKIPPED` |
| API authentication error | Record failure reason | `FAILED` |
| API rate limit (429) | Retry with backoff | (internal) |
| API timeout | Retry with backoff | `FAILED` |
| No usable periods in response | Record skip reason | `SKIPPED` |
| Snapshot persist error | Record failure reason | `FAILED` |

### Weather Repository
**File:** `lib/repositories/weather-repository.ts`

**Key methods:**

- `findWeatherVenueById(tournamentId)` → WeatherVenueRow
  - Joins tournament + course + coordinates + timezone
  - Returns null if not found
  
- `getCapturedAt(tournamentId)` → Date | null
  - Timestamp of prior snapshot
  - Used for freshness check
  
- `replaceSnapshot(snapshot)` → RepositoryResult
  - Atomically replace snapshot + periods (deletes prior periods)
  - Idempotent: safe to re-run
  - Returns `{ outcome: "inserted" | "updated" }`
  
- `createImportLog(input)` → Promise<void>
  - Per-tournament audit trail
  - Captures why snapshot was skipped/failed
  - Never throws

### Database Schema

#### WeatherSnapshot
```sql
CREATE TABLE weather_snapshots (
  id               STRING PRIMARY KEY,
  tournamentId     STRING UNIQUE NOT NULL,  -- One snapshot per tournament
  courseId         STRING,                   -- Host course
  source           STRING DEFAULT 'openweather',
  latitude         FLOAT NOT NULL,           -- Venue coordinates
  longitude        FLOAT NOT NULL,
  utcOffsetSeconds INT DEFAULT 0,            -- Timezone for bucketing
  capturedAt       TIMESTAMP DEFAULT now(),  -- Capture time (drives age)
  forecastStart    TIMESTAMP,                -- Min forecast time
  forecastEnd      TIMESTAMP,                -- Max forecast time
  periodCount      INT DEFAULT 0,            -- Signal: coverage
  createdAt        TIMESTAMP DEFAULT now(),
  updatedAt        TIMESTAMP DEFAULT now(),
  
  @@index([tournamentId])
  @@map("weather_snapshots")
)
```

#### WeatherPeriod
```sql
CREATE TABLE weather_periods (
  id                  STRING PRIMARY KEY,
  snapshotId          STRING NOT NULL,       -- Foreign key
  forecastTime        TIMESTAMP NOT NULL,    -- Forecast validity (UTC)
  temperatureC        FLOAT,                 -- All fields nullable
  feelsLikeC          FLOAT,
  windSpeedMs         FLOAT,
  windGustMs          FLOAT,
  windDeg             INT,                   -- 0=N, 90=E, 180=S, 270=W
  precipProbability   FLOAT,                 -- 0..1
  rainMm              FLOAT,
  humidity            INT,                   -- 0..100
  cloudCover          INT,                   -- 0..100
  pressureHpa         INT,
  visibilityM         INT,
  conditionCode       INT,                   -- OpenWeather code (e.g. 500)
  conditionLabel      STRING,                -- "Rain", "Clear", etc.
  createdAt           TIMESTAMP DEFAULT now(),
  
  @@index([snapshotId])
  @@index([forecastTime])
  @@map("weather_periods")
)
```

#### WeatherImportLog
```sql
CREATE TABLE weather_import_logs (
  id               STRING PRIMARY KEY,
  importRunId      STRING,                   -- Aggregate run (optional)
  tournamentId     STRING NOT NULL,
  tournamentName   STRING NOT NULL,          -- Denormalized (stable history)
  courseId         STRING,
  courseName       STRING,
  latitude         FLOAT,
  longitude        FLOAT,
  forecastEligible BOOLEAN DEFAULT false,    -- Was eligible to fetch?
  providerResponse STRING,                   -- "200 · 40 periods" or error
  result           STRING,                   -- "STORED" | "SKIPPED" | "FAILED"
  skippedReason    STRING,                   -- Why skipped
  rowsInserted     INT DEFAULT 0,            -- Snapshot rows created
  rowsUpdated      INT DEFAULT 0,            -- Snapshot rows replaced
  periodsWritten   INT DEFAULT 0,            -- Period rows written
  durationMs       INT,                      -- Import duration (ms)
  createdAt        TIMESTAMP DEFAULT now(),
  
  @@index([importRunId])
  @@index([tournamentId])
  @@map("weather_import_logs")
)
```

---

## Current State: Why Tables Are Empty

### 1. No API Key → Pipeline Cannot Start

```
OpenWeatherClient.fromEnv()
  ↓ (attempts to load config)
  loadOpenWeatherConfig()
    ↓ (reads process.env.OPENWEATHER_API_KEY)
    ❌ null or undefined
    ↓ (throws AuthenticationError)
```

**Result:** `importWeather()` throws before any tournament is even selected.

### 2. No Scheduled Trigger

Even if the API key were set, the pipeline needs an explicit trigger:
- No cron job scheduled to call `runWeatherImport()` daily
- No webhook/event calling `refreshTournamentWeather()` on a schedule
- Manual refresh requires admin UI access

### 3. No Tournaments in Forecast Window

Even if triggered, `resolveTournamentIds()` might select zero tournaments if:
- No upcoming tournaments exist in the database
- All upcoming events are >6 days away
- All upcoming events are without host courses or coordinates

---

## How to Get Weather Data Flowing

### Prerequisite: Set OpenWeather API Key

1. Get an API key from [OpenWeather](https://openweathermap.org/api)
   - Free tier provides 5-day / 3-hour forecast
   - 60 calls/min, 1M calls/month

2. Set environment variable:
   ```bash
   export OPENWEATHER_API_KEY="sk_live_..."
   ```

3. Or set in `.env.local`:
   ```
   OPENWEATHER_API_KEY=sk_live_...
   ```

### Step 1: Verify Configuration

Test if the provider is healthy:

```typescript
import { probeWeatherProvider } from "@/lib/imports"

const health = await probeWeatherProvider()
console.log(health)
// {
//   ok: true,
//   status: 200,
//   latencyMs: 234,
//   periods: 40,
//   error: null
// }
```

Or via the Admin → System Health page (if visible).

### Step 2: Ensure Tournaments Exist in Forecast Window

Check which tournaments would be selected:

```typescript
import { importWeather } from "@/lib/imports"

const summary = await importWeather()
console.log({
  tournamentsConsidered: summary.tournamentsConsidered,
  notes: summary.notes,
})
```

If `tournamentsConsidered === 0`:
- Check `summary.emptyReason` for why
- Create a tournament with `startDate` within the next 6 days
- Ensure the tournament has a host course
- Ensure the course has coordinates (latitude, longitude)

### Step 3: Verify Course Coordinates

Courses need `latitude` and `longitude` set:

```sql
SELECT id, name, latitude, longitude FROM courses
WHERE deletedAt IS NULL
LIMIT 5;
```

If coordinates are NULL:
- Update the course with venue coordinates
- Or link the tournament to a different course that has coordinates

### Step 4: Manually Trigger Import

**Via Admin UI:**
- Tournament detail page → "Refresh Weather" button (visible to admins only)

**Programmatically:**
```typescript
import { runWeatherImport } from "@/lib/imports"

// Import all tournaments in forecast window
const summary = await runWeatherImport()

// Or specific tournament
const specific = await runWeatherImport(["tournament-id-123"])

console.log(summary)
// {
//   processed: 2,
//   updated: 2,
//   skipped: 0,
//   failed: 0,
//   summary: "2 snapshots (40 periods, 0 city-level); 0 no-course, 0 no-coords, 0 failed"
// }
```

### Step 5: Verify Data Was Persisted

```sql
-- Check snapshots
SELECT 
  id, tournamentId, periodCount, capturedAt
FROM weather_snapshots
ORDER BY capturedAt DESC
LIMIT 1;

-- Check periods
SELECT 
  COUNT(*) as total,
  MIN(forecastTime) as earliest,
  MAX(forecastTime) as latest
FROM weather_periods
WHERE snapshotId = 'snap_...'
ORDER BY forecastTime ASC;

-- Check import log
SELECT
  tournamentId, forecastEligible, result, periodsWritten
FROM weather_import_logs
ORDER BY createdAt DESC
LIMIT 5;
```

---

## Development Logging

The weather import pipeline records:

- **Tournament selection** → which tournaments were considered and why
- **Venue resolution** → coordinates found or skipped
- **API call** → request sent to OpenWeather
- **Provider response** → status, # of periods returned
- **Data transformation** → # of usable periods extracted
- **Snapshot creation** → inserted or updated
- **Import duration** → total time for tournament
- **Errors** → clear reason for any failure

Enable verbose logging:

```typescript
import { importWeather } from "@/lib/imports"
import { createImportLogger, consoleImportSink } from "@/lib/imports"

const logger = createImportLogger("weather", consoleImportSink)

const summary = await importWeather({
  // logger,  // (if supported in future)
})

summary.notes.forEach(note => console.log(`[weather] ${note}`))
```

Or check the `weather_import_logs` table for full audit trail.

---

## Success Criteria Met When

1. ✅ API key is configured and authenticated
2. ✅ At least one tournament exists in the forecast window
3. ✅ That tournament has a host course with coordinates
4. ✅ `runWeatherImport()` is called (manually or scheduled)
5. ✅ `weather_snapshots` table has 1+ rows with `periodCount > 0`
6. ✅ `weather_periods` table has 5–40 rows (3-hour buckets)
7. ✅ `weather_import_logs` table has result="STORED" entry
8. ✅ Tournament UI displays forecast under "Weather Intelligence"

---

## Extending & Monitoring

### Adding Scheduled Runs

Create a cron endpoint that calls:

```typescript
// app/api/cron/weather-import/route.ts
import { runWeatherImport } from "@/lib/imports"

export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const summary = await runWeatherImport()
    return Response.json({
      ok: true,
      summary,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
```

### Monitoring

Check aggregate stats:

```sql
SELECT
  COUNT(*) as total_imports,
  SUM(CASE WHEN result = 'STORED' THEN 1 ELSE 0 END) as stored,
  SUM(CASE WHEN result = 'SKIPPED' THEN 1 ELSE 0 END) as skipped,
  SUM(CASE WHEN result = 'FAILED' THEN 1 ELSE 0 END) as failed,
  AVG(durationMs) as avg_duration_ms,
  MAX(createdAt) as last_import
FROM weather_import_logs
WHERE createdAt > NOW() - INTERVAL '7 days';
```

---

## Diagnostic Checklist

- [ ] `OPENWEATHER_API_KEY` environment variable is set and valid
- [ ] `probeWeatherProvider()` returns `ok: true`
- [ ] At least one tournament exists with `startDate` in next 6 days
- [ ] That tournament's host course has `latitude` and `longitude` set
- [ ] `importWeather()` returns `stored > 0`
- [ ] `weather_snapshots` table has rows
- [ ] `weather_periods` table has rows
- [ ] `weather_import_logs` table shows `result='STORED'`
- [ ] Tournament page displays Weather Intelligence section
