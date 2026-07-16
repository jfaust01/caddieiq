# Database Diagnostics Guide

## Overview

CaddieIQ uses PostgreSQL with Prisma ORM. The schema uses **camelCase field names in Prisma models**, which require **quoted identifiers** in raw SQL queries due to PostgreSQL's case-sensitivity rules.

## Naming Conventions

### Prisma Models vs PostgreSQL Tables

Prisma models use **camelCase** field names:
```typescript
model User {
  id        String   @id
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

In PostgreSQL, these map to:
- **Table name:** `users` (via `@@map("users")`)
- **Column names:** `id`, `email`, `"createdAt"`, `"updatedAt"` (camelCase fields **must be quoted**)

### Why Quoted Identifiers?

PostgreSQL folds unquoted identifiers to **lowercase**. Without quotes:
- ✗ `SELECT createdAt FROM users;` → PostgreSQL looks for lowercase `createdat` → ERROR
- ✓ `SELECT "createdAt" FROM users;` → PostgreSQL looks for exact `createdAt` → OK

## SQL Query Examples

### Basic Pattern

Always quote camelCase column names in raw SQL:

```sql
-- ✓ CORRECT
SELECT id, email, "createdAt", "updatedAt" FROM users;

-- ✗ INCORRECT
SELECT id, email, createdAt, updatedAt FROM users;
```

### Common Queries

**Count rows in a table:**
```sql
SELECT COUNT(*) as "count" FROM users;
```

**Filter by date field:**
```sql
SELECT id, email, "createdAt" FROM users 
WHERE "createdAt" > NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

**Inspect soft-deleted records:**
```sql
SELECT id, email, "deletedAt" FROM courses
WHERE "deletedAt" IS NOT NULL;
```

**Check for orphaned records:**
```sql
SELECT t.id, t.name, c.id as "courseId"
FROM tournaments t
LEFT JOIN courses c ON t."courseId" = c.id
WHERE c.id IS NULL AND t."deletedAt" IS NULL;
```

## Column Name Reference

### User & Auth Tables
- `users` → id, email, emailVerified, name, image, role, **createdAt**, **updatedAt**
- `profiles` → id, userId, **preferredName**, **timezone**, **createdAt**, **updatedAt**
- `subscriptions` → id, userId, tier, status, **expiresAt**, **createdAt**, **updatedAt**
- `sessions` → id, userId, **expiresAt**, **createdAt**, **updatedAt**

### Golf Data Tables
- `tournaments` → id, name, **courseId**, **startDate**, **endDate**, status, format, **createdAt**, **updatedAt**, **deletedAt**
- `courses` → id, name, city, **stateProvince**, country, latitude, longitude, **createdAt**, **updatedAt**, **deletedAt**
- `players` → id, firstName, lastName, **handedness**, status, **tourId**, **createdAt**, **updatedAt**, **deletedAt**
- `rounds` → id, **tournamentId**, **playerRoundId**, **roundNumber**, status, **createdAt**, **updatedAt**

### Import & Event Tables
- `import_runs` → id, entity, status, **recordsProcessed**, **recordsInserted**, **recordsUpdated**, **recordsFailed**, **startedAt**, **completedAt**, **createdAt**, **updatedAt**
- `weather_import_logs` → id, **tournamentId**, result, **forecastEligible**, **durationMs**, **createdAt**, **updatedAt**
- `weather_snapshots` → id, **tournamentId**, **courseId**, latitude, longitude, **capturedAt**, **createdAt**, **updatedAt**
- `weather_periods` → id, **snapshotId**, **periodStart**, **periodEnd**, condition, temperature, humidity, windSpeed, **createdAt**, **updatedAt**

## Frequently Used Diagnostic Queries

### Database Health Check

```sql
-- Count total rows per major table
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL SELECT 'players', COUNT(*) FROM players
UNION ALL SELECT 'weather_snapshots', COUNT(*) FROM "weatherSnapshots"
UNION ALL SELECT 'weather_periods', COUNT(*) FROM "weatherPeriods"
UNION ALL SELECT 'import_runs', COUNT(*) FROM "importRuns"
ORDER BY table_name;
```

### Last Import Run Status

```sql
SELECT 
  entity, 
  status, 
  "recordsInserted", 
  "recordsUpdated", 
  "recordsFailed",
  "completedAt"
FROM "importRuns"
ORDER BY "completedAt" DESC
LIMIT 10;
```

### Weather Pipeline Status

```sql
SELECT 
  COUNT(*) as total_snapshots,
  COUNT(DISTINCT "tournamentId") as tournaments_with_weather,
  MAX("capturedAt") as latest_snapshot
FROM "weatherSnapshots";

SELECT 
  COUNT(*) as total_periods,
  AVG("temperature") as avg_temp,
  MAX("periodEnd") as latest_period_end
FROM "weatherPeriods";
```

### Tournaments Eligible for Weather Import (Next 6 Days)

```sql
SELECT 
  id, 
  name, 
  "startDate",
  "courseId",
  (NOW() + INTERVAL '6 days')::date as forecast_horizon
FROM tournaments
WHERE "startDate" >= NOW()::date 
  AND "startDate" <= (NOW() + INTERVAL '6 days')::date
  AND "deletedAt" IS NULL
ORDER BY "startDate";
```

### Course Intelligence Status

```sql
SELECT 
  c.id,
  c.name,
  c.city,
  cc.id as "hasCharacteristics",
  cc."coordinateConfidence"
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL
ORDER BY c.name;
```

## Inspecting Import Pipelines

### Course Import

```sql
-- Last course import
SELECT entity, status, "recordsInserted", "recordsUpdated", "completedAt"
FROM "importRuns"
WHERE entity = 'course'
ORDER BY "completedAt" DESC
LIMIT 5;

-- Verify courses exist
SELECT COUNT(*) as total_courses FROM courses WHERE "deletedAt" IS NULL;
```

### Player Import

```sql
-- Last player import
SELECT entity, status, "recordsInserted", "recordsUpdated", "completedAt"
FROM "importRuns"
WHERE entity = 'player'
ORDER BY "completedAt" DESC
LIMIT 5;

-- Check player status distribution
SELECT status, COUNT(*) as count
FROM players
WHERE "deletedAt" IS NULL
GROUP BY status;
```

### Tournament Import

```sql
-- Last tournament import
SELECT entity, status, "recordsInserted", "recordsUpdated", "completedAt"
FROM "importRuns"
WHERE entity = 'tournament'
ORDER BY "completedAt" DESC
LIMIT 5;

-- Verify tournaments have courses
SELECT COUNT(*) as total_tournaments FROM tournaments WHERE "deletedAt" IS NULL;
SELECT COUNT(*) as tournaments_without_courses FROM tournaments 
WHERE "courseId" IS NULL AND "deletedAt" IS NULL;
```

### Weather Import

```sql
-- Last weather import run
SELECT 
  "tournamentId",
  result,
  "durationMs",
  "createdAt"
FROM "weatherImportLogs"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check for patterns in skipped/failed weather imports
SELECT 
  result,
  COUNT(*) as count,
  AVG("durationMs") as avg_duration_ms
FROM "weatherImportLogs"
GROUP BY result;
```

## Checking Row Counts

### Quick Table Overview

```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Empty Tables Check

```sql
SELECT tablename, 0 as row_count
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = pg_tables.tablename
  )
ORDER BY tablename;
```

## Inspecting Weather Data

### Weather Snapshot Details

```sql
SELECT 
  ws.id,
  ws."tournamentId",
  t.name as tournament_name,
  ws.latitude,
  ws.longitude,
  ws."capturedAt",
  COUNT(wp.id) as period_count
FROM "weatherSnapshots" ws
LEFT JOIN tournaments t ON ws."tournamentId" = t.id
LEFT JOIN "weatherPeriods" wp ON ws.id = wp."snapshotId"
GROUP BY ws.id, t.name
ORDER BY ws."capturedAt" DESC
LIMIT 20;
```

### Weather Periods Timeline

```sql
SELECT 
  ws."tournamentId",
  wp."periodStart",
  wp."periodEnd",
  wp.condition,
  wp.temperature,
  wp.humidity,
  wp."windSpeed"
FROM "weatherPeriods" wp
JOIN "weatherSnapshots" ws ON wp."snapshotId" = ws.id
ORDER BY wp."periodStart" DESC
LIMIT 50;
```

## Inspecting Tournaments

### Tournament Overview

```sql
SELECT 
  id,
  name,
  status,
  "startDate",
  "endDate",
  "courseId",
  format,
  "createdAt"
FROM tournaments
WHERE "deletedAt" IS NULL
ORDER BY "startDate" DESC
LIMIT 20;
```

### Tournament Venue Details

```sql
SELECT 
  t.id,
  t.name as tournament_name,
  c.name as course_name,
  c.city,
  c."stateProvince",
  c.country,
  t."startDate",
  t."endDate"
FROM tournaments t
LEFT JOIN courses c ON t."courseId" = c.id
WHERE t."deletedAt" IS NULL
ORDER BY t."startDate";
```

## Inspecting Players

### Player Status Distribution

```sql
SELECT 
  status,
  COUNT(*) as count
FROM players
WHERE "deletedAt" IS NULL
GROUP BY status;
```

### Recent Player Imports

```sql
SELECT 
  id,
  "firstName",
  "lastName",
  status,
  "handedness",
  "createdAt"
FROM players
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;
```

## Inspecting Courses

### Course with Characteristics

```sql
SELECT 
  c.id,
  c.name,
  c.city,
  c.latitude,
  c.longitude,
  cc."coordinateConfidence",
  cc."shotImportanceWeights"
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL
ORDER BY c.name;
```

### Courses Missing Data

```sql
-- Courses without coordinates
SELECT id, name, city FROM courses 
WHERE latitude IS NULL OR longitude IS NULL
AND "deletedAt" IS NULL;

-- Courses without characteristics
SELECT c.id, c.name FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE cc.id IS NULL AND c."deletedAt" IS NULL;
```

## Utilities

### Running Raw SQL

Use `psql` with the `DATABASE_URL`:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

Or use Prisma:

```bash
npx prisma db execute --stdin < query.sql
```

### Viewing Migration History

```bash
npx prisma migrate status
```

### Regenerating Prisma Client

```bash
npx prisma generate
```

## Related Documentation

- See `docs/DATABASE_HEALTH_CHECKLIST.md` for expected table states and what to expect during the season
- See `scripts/sql/` for reusable diagnostic SQL scripts
- See `docs/WEATHER_INTELLIGENCE_PIPELINE.md` for weather import details
- See `docs/COURSE_INTELLIGENCE_PIPELINE.md` for course characteristics enrichment
