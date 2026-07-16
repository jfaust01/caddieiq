# Database Health Checklist

This document describes the expected state of major tables in CaddieIQ's database, including what should be populated, what is event-driven, and what is expected to be empty during different parts of the season.

## Always Populated Tables

These tables should always have data:

### `users`
- **Expected state:** Populated with application users
- **Grows:** Continuously as new accounts sign up
- **Should never be empty:** No
- **Audit fields:** `createdAt`, `updatedAt`
- **Soft deletes:** No

### `tours`
- **Expected state:** Contains PGA, LIV, LPGA, Korn Ferry, DP World tours
- **Count:** Typically 5-10 records
- **Should never be empty:** Yes (foundational data)
- **Audit fields:** `createdAt`, `updatedAt`
- **Soft deletes:** No

### `courses`
- **Expected state:** 200+ golf courses from major tournaments
- **Populated by:** Course import pipeline
- **Should never be empty:** Yes (foundation for tournaments)
- **Audit fields:** `createdAt`, `updatedAt`
- **Soft deletes:** Yes (`deletedAt`)
- **Data quality checks:**
  - No orphaned records (courses without venues)
  - Coordinates present for forecast-eligible courses
  - Names and locations valid

## Event-Driven Tables

These tables grow as events occur during the season:

### `tournaments`
- **Source:** Tournament import pipeline
- **When populated:** As tournaments are scheduled and imported
- **Expected pattern:** Growing throughout the year as new tournaments are added
- **Soft deletes:** Yes (`deletedAt`)
- **Related:** Each tournament should link to a course
- **Data quality checks:**
  - Verify `courseId` linkage
  - Check `startDate` and `endDate` are valid
  - Ensure tournaments have courses with coordinates (for weather)

### `players`
- **Source:** Player import pipeline
- **When populated:** As player data is imported
- **Expected pattern:** Thousands of players across all tours
- **Status:** ACTIVE, INACTIVE, INJURED, RETIRED
- **Audit fields:** `createdAt`, `updatedAt`
- **Soft deletes:** Yes (`deletedAt`)
- **Data quality checks:**
  - All players have names
  - Tour assignment (`tourId`) is set
  - Nationality is populated

### `rounds`
- **Source:** Tournament API as tournaments progress
- **When populated:** During and after each tournament
- **Expected pattern:** New records created for each tournament round
- **Status:** SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED
- **Audit fields:** `createdAt`, `updatedAt`
- **Soft deletes:** No
- **Related:** Links to tournament

### `playerRounds`
- **Source:** Scorecard data from tournaments
- **When populated:** As players complete rounds
- **Expected pattern:** Populated during and after tournaments
- **Related:** Links player + round + scores
- **Status:** CONFIRMED, ALTERNATE, WITHDRAWN, DISQUALIFIED, CUT, FINISHED
- **Audit fields:** `createdAt`, `updatedAt`

## Enrichment & Intelligence Tables

These tables are populated by background pipelines:

### `courseCharacteristics`
- **Source:** Course enrichment pipeline
- **When populated:** After courses are imported
- **Expected state:** One characteristic record per course (or growing to match courses)
- **Status:** RUNNING (if script has executed) or EMPTY (if not yet run)
- **Data:**
  - `coordinateConfidence`: EXACT or APPROXIMATE
  - `shotImportanceWeights`: Weights for each shot type
  - For many courses this will be NULL (intentionally - not fabricated)
- **Coverage goal:** Eventually 100% of active courses

### `weatherSnapshots` & `weatherPeriods`
- **Source:** OpenWeather API via import pipeline
- **When populated:** Automatically as tournaments enter the 6-day forecast window
- **Expected state:** 
  - **During tournament week:** Snapshots and periods for upcoming tournaments
  - **Off-season:** May be empty if no tournaments within forecast window
- **Fresh data:** Timestamps should be recent (captured today or yesterday)
- **Expected patterns:**
  - Each snapshot has 15-40 associated periods (5-day forecast, 3-hour intervals)
  - Older snapshots gradually age out as tournaments complete
  - One snapshot per tournament (replaces previous snapshot on re-import)

### `dfsSalaries`
- **Source:** DFS provider APIs
- **When populated:** Daily or before tournament weeks
- **Expected state:** Current salaries for players across DFS sites
- **Related:** Should match active players and tournament fields
- **Data freshness:** Update frequency depends on provider

### `oddsEvents` & `oddsQuotes`
- **Source:** Odds provider APIs
- **When populated:** Before and during tournaments
- **Expected state:** Event odds, player odds, tournament props
- **Related:** Should align with active tournaments and tournament fields
- **Data freshness:** Updates frequently (odds change constantly)

### `bettingEvents` & `bettingMarkets`
- **Purpose:** Future use for live betting tracking
- **Status:** Reserved for future features
- **Expected state:** May be empty during current season

### `fantasyProjections`
- **Purpose:** Future AI/ML generated projections
- **Status:** Reserved for future features
- **Expected state:** May be empty during current season

## Import Pipeline Status Indicators

### `importRuns`
- **What it tracks:** History of all data imports
- **Expected pattern:** 
  - Regular entries from `course`, `player`, `tournament` imports
  - Status: SUCCESS (complete), PARTIAL (with failures), FAILURE (error)
- **How to check:**
  ```sql
  SELECT DISTINCT ON (entity) entity, status, "completedAt"
  FROM "importRuns"
  ORDER BY entity, "completedAt" DESC;
  ```

### `weatherImportLogs`
- **What it tracks:** Details of weather import attempts per tournament
- **Expected pattern:**
  - STORED (success)
  - SKIPPED (tournament outside forecast window or coordinates missing)
  - FAILED (API error or other issue)
- **How to check:**
  ```sql
  SELECT result, COUNT(*) FROM "weatherImportLogs"
  GROUP BY result;
  ```

## Typical Season Progression

### Pre-Season (Off-Season)
```
✓ users (populated)
✓ tours (populated)
✓ courses (populated from imports)
✓ courseCharacteristics (populated from enrichment)
⊘ tournaments (few or empty if next season hasn't started)
⊘ players (populated, but may be inactive status)
⊘ rounds (empty - no active tournaments)
⊘ playerRounds (empty)
⊘ weatherSnapshots (empty - no tournaments to forecast)
~ dfsSalaries (may be stale)
~ oddsEvents (may be stale or empty)
```

### Early Season (First Tournaments)
```
✓ users (populated)
✓ tours (populated)
✓ courses (populated)
✓ courseCharacteristics (populated)
→ tournaments (growing - new tournaments added)
✓ players (populated, active status)
→ rounds (growing - new tournaments have rounds)
→ playerRounds (growing - players complete rounds)
→ weatherSnapshots (growing - tournaments enter forecast window)
→ weatherPeriods (growing with snapshots)
✓ dfsSalaries (updated for current week)
✓ oddsEvents (current tournament odds)
```

### Peak Season (Multiple Tournaments Weekly)
```
✓ All tables actively growing/updating
→ rounds (many in progress or completed)
→ playerRounds (large number from multiple tournaments)
→ weatherSnapshots (active snapshot for current week)
→ weatherPeriods (updated forecasts for current + next week)
✓ dfsSalaries (multiple slates per week)
✓ oddsEvents (updated constantly)
```

### Post-Tournament
```
→ rounds (transitioned to COMPLETED)
→ playerRounds (final scores recorded)
⊘ weatherSnapshots (replaced with next tournament's snapshot)
⊘ weatherPeriods (aged out)
~ dfsSalaries (stale until next tournament)
~ oddsEvents (waiting for next tournament)
```

## Data Quality Expectations

### Courses
- ✓ Should have: name, city, country, coordinates (lat/lon)
- ✓ Should not: be duplicated, be orphaned
- ⚠️ May not have: characteristics (OK if enrichment hasn't run yet)
- ⚠️ May be: deleted (soft-deleted with `deletedAt` set)

### Tournaments
- ✓ Should have: name, start/end dates, course link
- ✓ Should not: be orphaned (all should have courseId)
- ✓ May or may not: have rounds (depends on tournament status)
- ⚠️ May be: canceled (status = CANCELED)

### Players
- ✓ Should have: first name, last name, tour, status
- ✓ Should not: be missing key fields
- ⚠️ May have: NULL coordinates (if no GPS data available)
- ⚠️ May be: INACTIVE, INJURED, RETIRED

### Weather Data
- ✓ Should have: valid coordinates, condition, temperature
- ✓ Should not: have stale data (should be recent if tournament is upcoming)
- ⚠️ May be: empty during off-season (expected and OK)
- ✓ May be: APPROXIMATE coordinates (city-level, not course-level)

## Health Check Queries

Run these queries regularly to verify database health:

### Quick Health Check
```bash
psql $DATABASE_URL < scripts/sql/database-health.sql
```

### Full Diagnostics
```bash
# Weather status
psql $DATABASE_URL < scripts/sql/check-weather.sql

# Course data
psql $DATABASE_URL < scripts/sql/check-courses.sql

# Tournament data
psql $DATABASE_URL < scripts/sql/check-tournaments.sql

# Player data
psql $DATABASE_URL < scripts/sql/check-players.sql

# Import status
psql $DATABASE_URL < scripts/sql/check-imports.sql
```

## Common Issues & Solutions

### Issue: Weather tables empty during tournament week
**Expected?** No - if a tournament is within 6 days and has coordinates, should have weather
**Check:**
```sql
-- Verify tournaments exist in forecast window
SELECT COUNT(*) FROM tournaments 
WHERE "startDate" BETWEEN NOW() AND NOW() + INTERVAL '6 days'
AND "courseId" IS NOT NULL AND "deletedAt" IS NULL;

-- Check if weather snapshots exist
SELECT COUNT(*) FROM "weatherSnapshots";

-- Check import logs for errors
SELECT * FROM "weatherImportLogs" 
ORDER BY "createdAt" DESC LIMIT 10;
```

### Issue: Course characteristics coverage is low
**Expected?** No - after enrichment runs, should be high
**Check:**
```sql
-- Verify enrichment has run
SELECT * FROM "importRuns" 
WHERE entity = 'course_characteristics' 
ORDER BY "completedAt" DESC;

-- See which courses are missing
SELECT c.id, c.name FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE cc.id IS NULL AND c."deletedAt" IS NULL;
```

### Issue: Import runs failing repeatedly
**Expected?** No - should be SUCCESS or PARTIAL, not FAILURE
**Check:**
```sql
-- See recent failures
SELECT * FROM "importRuns" 
WHERE status = 'FAILURE' 
ORDER BY "completedAt" DESC LIMIT 5;

-- Check partial runs with high failure rate
SELECT * FROM "importRuns" 
WHERE status = 'PARTIAL' 
AND ROUND(100.0 * "recordsFailed" / "recordsProcessed", 1) > 10
ORDER BY "completedAt" DESC;
```

## Related Documentation

- `docs/DATABASE_DIAGNOSTICS.md` — Detailed SQL query guide
- `scripts/sql/` — Reusable diagnostic SQL scripts
- `docs/WEATHER_INTELLIGENCE_PIPELINE.md` — Weather import details
- `docs/COURSE_INTELLIGENCE_PIPELINE.md` — Course enrichment details
