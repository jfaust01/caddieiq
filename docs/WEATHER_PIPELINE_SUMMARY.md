# Weather Intelligence Pipeline: Summary & Action Items

## Current State

**Status:** ❌ **NOT OPERATIONAL** — Empty tables

**Root Cause:** `OPENWEATHER_API_KEY` environment variable is not set

**Impact:** 
- `weather_snapshots` table: empty
- `weather_periods` table: empty  
- `weather_import_logs` table: empty
- Tournament Weather Intelligence cards: unavailable

---

## Why Weather Tables Are Empty

The Weather Intelligence pipeline is **architecturally complete and well-tested**, but fails at the first step because the OpenWeather API key is not configured.

### Pipeline Block 1: Configuration

```
OpenWeatherClient.fromEnv()
  → loadOpenWeatherConfig()
    → validateOpenWeatherConfig()
      → checks: process.env.OPENWEATHER_API_KEY
      → NOT SET → throws AuthenticationError
      → Pipeline stops
```

**This is intentional and correct behavior.** The system refuses to proceed without valid credentials rather than fabricating data.

### Why This Isn't a Bug

The empty tables indicate proper error handling, not a failure:

✅ **Good:** No data when API key is missing (honest, prevents fabrication)  
❌ **Bad:** Fabricated forecasts when credentials are unavailable (dishonest)

The weather import pipeline is **deliberately defensive**: it only stores real data fetched from OpenWeather, and it halts cleanly if the API key is missing.

---

## How to Fix It (3 Steps)

### Step 1: Get an OpenWeather API Key

1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Generate an API key (free tier includes 5-day forecast)
4. Copy the key

### Step 2: Set the Environment Variable

**Development:**
```bash
export OPENWEATHER_API_KEY="your-api-key-here"
```

**Or in `.env.local`:**
```
OPENWEATHER_API_KEY=your-api-key-here
```

**Vercel (production):**
Set via Vercel Dashboard → Project Settings → Environment Variables

### Step 3: Verify and Trigger Import

```bash
# Test the pipeline
node --env-file-if-exists=/vercel/share/.env.project \
  scripts/test-weather-pipeline.mts

# Or trigger via API
curl -X POST http://localhost:3000/admin/api/weather/refresh \
  -H "Content-Type: application/json" \
  -d '{"tournamentId": "tournament-123"}'
```

---

## What Happens When API Key Is Set

### Automatic: Daily Scheduled Imports

The system will run a weather import daily that:

1. **Selects tournaments** within 6-day forecast window (upcoming & in-progress)
2. **Skips tournaments** without host courses or coordinates
3. **Fetches forecasts** from OpenWeather for venue coordinates
4. **Stores snapshots** in `weather_snapshots` (1 per tournament)
5. **Stores periods** in `weather_periods` (5-40 entries per snapshot, 3-hour buckets)
6. **Audits everything** in `weather_import_logs` (per-tournament log entry)

### Manual: Admin Refresh

Admins can trigger manual refreshes via the Tournament detail page → "Refresh Weather" button, which:
- Bypasses freshness checks (forces a new fetch)
- Writes a real import log entry
- Updates the tournament page immediately

### Result

- **weather_snapshots:** 1 row per imported tournament
  - Stores: tournament ID, course ID, coordinates, capture time, forecast validity window
  
- **weather_periods:** 5-40 rows per snapshot
  - Stores: temperature, wind, precipitation, humidity, clouds, pressure, visibility, condition
  - All fields nullable (only stored when provider supplied them)
  
- **weather_import_logs:** 1 row per import attempt (per tournament)
  - Stores: whether it was stored/skipped/failed, reason, # of periods, duration

---

## Verification Checklist

Once the API key is set:

- [ ] `OPENWEATHER_API_KEY` environment variable is set
- [ ] Run `test-weather-pipeline.mts` script
- [ ] Script reports: "Provider is healthy"
- [ ] At least 1 tournament is in the forecast window
- [ ] That tournament has a course with coordinates
- [ ] Script reports: "Weather data was imported and persisted"
- [ ] `weather_snapshots` table has 1+ rows
- [ ] `weather_periods` table has 5-40 rows
- [ ] `weather_import_logs` table shows `result='STORED'`
- [ ] Tournament page displays Weather Intelligence section with forecast

---

## Table of Contents

- **`docs/WEATHER_INTELLIGENCE_PIPELINE.md`** — Complete architecture guide
  - Component details, schema, error handling, extending/monitoring
  
- **`scripts/test-weather-pipeline.mts`** — Diagnostic script
  - Verifies API key, probes provider, tests import
  
- **`lib/imports/weather-import.ts`** — Import pipeline code
  - Tournament selection, API calls, data normalization
  
- **`lib/providers/weather/client.ts`** — OpenWeather client
  - Authentication, rate limiting, retry logic
  
- **`lib/repositories/weather-repository.ts`** — Database layer
  - Snapshot & period persistence, audit logging
  
- **`features/tournaments/services/weather-actions.ts`** — Server action
  - Admin refresh endpoint, security checks

---

## Key Design Principles

✅ **Never fabricate data** — Only store what OpenWeather provides  
✅ **All fields nullable** — Temperature=NULL if provider didn't send it  
✅ **Idempotent imports** — Safe to re-run without duplicates  
✅ **Honest logging** — Every import writes an audit trail explaining why  
✅ **Clear error messages** — Missing API key throws with actionable guidance  
✅ **No silent failures** — Empty tables only when API key is missing or all tournaments are out of forecast window

---

## Next Steps

1. Set `OPENWEATHER_API_KEY` in your environment
2. Run the diagnostic script to verify
3. Data will start flowing into the three weather tables
4. Tournament pages will display Weather Intelligence

**Questions?** Check `docs/WEATHER_INTELLIGENCE_PIPELINE.md` for the complete technical reference.
