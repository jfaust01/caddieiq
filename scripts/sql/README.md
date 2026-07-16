# Database Diagnostic SQL Scripts

This directory contains reusable SQL scripts for inspecting CaddieIQ's database health and state.

## Quick Start

All scripts use PostgreSQL with quoted camelCase identifiers (e.g., `"createdAt"`, `"startDate"`).

### Running Scripts

```bash
# Connect to your database and run a script
psql $DATABASE_URL < scripts/sql/database-health.sql

# Or use Prisma
npx prisma db execute --stdin < scripts/sql/database-health.sql

# Or directly with node
node -e "const db = require('db-lib'); db.execute(fs.readFileSync('scripts/sql/database-health.sql', 'utf8'))"
```

## Available Scripts

### `database-health.sql`
Overall database health report including:
- Row counts for all major tables
- Import status by entity
- Latest import runs
- Weather pipeline status
- Course intelligence coverage
- Data freshness metrics

**Runtime:** ~1-2 seconds

```bash
psql $DATABASE_URL < scripts/sql/database-health.sql
```

### `check-weather.sql`
Weather pipeline diagnostics:
- Total snapshots and periods
- Recent weather data (last 10)
- Periods overview (count, avg temp, avg humidity, wind speed)
- Weather condition distribution
- Import log status and failures
- Tournament weather coverage

**Use when:** Debugging weather import issues or verifying forecast data

```bash
psql $DATABASE_URL < scripts/sql/check-weather.sql
```

### `check-courses.sql`
Course and characteristics diagnostics:
- Total courses (active/deleted)
- Course characteristics coverage
- Missing data analysis (coordinates, characteristics, location info)
- Recent courses (last 20)
- Coordinates distribution by region
- Data freshness (update timestamps)

**Use when:** Verifying course imports or enrichment pipeline

```bash
psql $DATABASE_URL < scripts/sql/check-courses.sql
```

### `check-tournaments.sql`
Tournament and venue diagnostics:
- Tournament overview (by status and format)
- Upcoming tournaments (next 30 days)
- Venue linkage (courses linked to tournaments)
- Format and status distribution
- Season timeline
- Tournament weather coverage

**Use when:** Verifying tournament imports or checking scheduling

```bash
psql $DATABASE_URL < scripts/sql/check-tournaments.sql
```

### `check-players.sql`
Player and status diagnostics:
- Total players (by status and handedness)
- Players by tour
- Players by nationality (top 20)
- Missing data (names, tour, nationality)
- Status distribution
- Import status for player imports

**Use when:** Verifying player imports or checking player statuses

```bash
psql $DATABASE_URL < scripts/sql/check-players.sql
```

### `check-imports.sql`
Import pipeline diagnostics:
- Import run summary (all entities)
- Success/failure/partial breakdown
- Records processed/inserted/updated/failed
- Import timing and performance
- Failed and partial imports (with failures)
- Import trends (last 30 days)

**Use when:** Investigating import failures or monitoring pipeline health

```bash
psql $DATABASE_URL < scripts/sql/check-imports.sql
```

## Column Name Reference

All scripts use correctly quoted identifiers for camelCase fields:

| Prisma Field | SQL Identifier | Table |
|---|---|---|
| `createdAt` | `"createdAt"` | All tables |
| `updatedAt` | `"updatedAt"` | All tables |
| `deletedAt` | `"deletedAt"` | Soft-delete tables |
| `startDate` | `"startDate"` | tournaments, events |
| `endDate` | `"endDate"` | tournaments, events |
| `courseId` | `"courseId"` | tournaments |
| `firstName` | `"firstName"` | players |
| `lastName` | `"lastName"` | players |
| `tourId` | `"tourId"` | players |

See `docs/DATABASE_DIAGNOSTICS.md` for complete reference.

## Common Diagnostic Tasks

### Check Overall Health
```bash
psql $DATABASE_URL < scripts/sql/database-health.sql
```

### Verify Course Import
```bash
psql $DATABASE_URL < scripts/sql/check-courses.sql
# Look for:
# - course_characteristics coverage
# - courses_with_coordinates count
# - recent import in "Latest imports" section
```

### Verify Tournament Import
```bash
psql $DATABASE_URL < scripts/sql/check-tournaments.sql
# Look for:
# - Upcoming tournaments in next section
# - venue linkage (all should have courseId)
# - recent tournament import status
```

### Check Weather Data
```bash
psql $DATABASE_URL < scripts/sql/check-weather.sql
# Look for:
# - total_snapshots > 0 (if tournaments within 6-day window)
# - recent snapshots (latest_snapshot_date is today/yesterday)
# - import log status (look for STORED results)
```

### Investigate Import Failures
```bash
psql $DATABASE_URL < scripts/sql/check-imports.sql
# Look for:
# - failed_runs count per entity
# - failure_percent > 0 (indicates issues)
# - Recent failures in "Last 20 import runs" section
```

### Monitor Data Freshness
```bash
# From database-health.sql - see DATA_FRESHNESS section
# Timestamps should be recent (depending on import frequency)
```

## Important Notes

### Quoted Identifiers
All camelCase fields **must** be quoted in raw SQL:
- ✓ Correct: `SELECT "createdAt" FROM users`
- ✗ Incorrect: `SELECT createdAt FROM users`

PostgreSQL is case-sensitive for quoted identifiers and converts unquoted identifiers to lowercase.

### Connection String
Use the `DATABASE_URL` environment variable:
```bash
echo $DATABASE_URL
```

Should output: `postgresql://user:pass@host:port/dbname`

### Performance
- `database-health.sql` — Fast (~1-2s)
- `check-*.sql` scripts — Fast (~1-3s each)
- All scripts use efficient COUNT queries or indexed lookups

## Customizing Scripts

To use these scripts as templates for custom queries:

1. Copy a script to a new file: `custom-diagnostic.sql`
2. Follow the same pattern:
   - Quote all camelCase fields
   - Use clear section headers
   - Include multiple perspectives on the data

## Related Documentation

- `docs/DATABASE_DIAGNOSTICS.md` — Complete SQL guide with examples
- `docs/DATABASE_HEALTH_CHECKLIST.md` — Expected table states by season
- `docs/WEATHER_INTELLIGENCE_PIPELINE.md` — Weather import details
- `docs/COURSE_INTELLIGENCE_PIPELINE.md` — Course enrichment details
