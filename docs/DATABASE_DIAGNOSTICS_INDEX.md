# Database Diagnostics Index

Quick reference for database diagnostics documentation and tools.

## 📚 Documentation

### Main Guides

1. **`docs/DATABASE_DIAGNOSTICS.md`** (445 lines)
   - Complete SQL query guide
   - Column name reference with quoted identifiers
   - Frequently used diagnostic queries
   - Common inspection patterns
   - Utilities and tools

2. **`docs/DATABASE_HEALTH_CHECKLIST.md`** (317 lines)
   - Expected table states by season
   - Event-driven vs always-populated tables
   - Import pipeline status indicators
   - Typical season progression
   - Common issues and solutions

## 🔧 SQL Scripts

All scripts use properly quoted camelCase identifiers. Run with:
```bash
psql $DATABASE_URL < scripts/sql/[script].sql
```

### Health & Overview

- **`database-health.sql`** (98 lines)
  - Overall database health report
  - Row counts, import status, data freshness
  - **Use:** Quick health check (1-2 seconds)

### Diagnostics by Topic

- **`check-weather.sql`** (100 lines)
  - Weather snapshots and periods
  - Import log status
  - Condition distribution
  - **Use:** Debug weather imports

- **`check-courses.sql`** (122 lines)
  - Course overview and characteristics coverage
  - Missing data analysis
  - Geographic distribution
  - **Use:** Verify course imports

- **`check-tournaments.sql`** (143 lines)
  - Tournament overview and scheduling
  - Venue linkage verification
  - Status and format distribution
  - **Use:** Verify tournament imports

- **`check-players.sql`** (154 lines)
  - Player overview and status distribution
  - By tour and nationality
  - Missing data check
  - **Use:** Verify player imports

- **`check-imports.sql`** (146 lines)
  - Import run history and statistics
  - Success/failure/partial breakdown
  - Performance metrics
  - **Use:** Monitor import pipeline health

### Total Coverage
- **1,743 lines** of diagnostic documentation and SQL

## 📊 Quick Diagnostics Workflow

### Step 1: Overall Health
```bash
psql $DATABASE_URL < scripts/sql/database-health.sql
```
**Shows:** Table counts, latest imports, data freshness

### Step 2: Focused Investigation
Based on what you find in Step 1:

**If courses look empty:**
```bash
psql $DATABASE_URL < scripts/sql/check-courses.sql
```

**If tournaments are missing:**
```bash
psql $DATABASE_URL < scripts/sql/check-tournaments.sql
```

**If weather data is stale/missing:**
```bash
psql $DATABASE_URL < scripts/sql/check-weather.sql
```

**If imports are failing:**
```bash
psql $DATABASE_URL < scripts/sql/check-imports.sql
```

**If player statuses look wrong:**
```bash
psql $DATABASE_URL < scripts/sql/check-players.sql
```

### Step 3: Deep Dive
For specific SQL queries, see `docs/DATABASE_DIAGNOSTICS.md`

## 🎯 Common Scenarios

### "My weather data is empty"
1. Run: `check-weather.sql`
2. Check: Are tournaments within 6-day forecast window?
3. Check: Do tournaments have courses with coordinates?
4. See: `docs/WEATHER_INTELLIGENCE_PIPELINE.md`

### "Course enrichment didn't run"
1. Run: `check-courses.sql`
2. Check: `courseCharacteristics` row count
3. Check: `check-imports.sql` for course_characteristics run
4. See: `docs/COURSE_INTELLIGENCE_PIPELINE.md`

### "Imports are failing"
1. Run: `check-imports.sql`
2. Look for: FAILURE status or high failure rate
3. Check recent runs: Last 20 import runs
4. Investigate: Error details in `importRuns` table

### "Data looks stale"
1. Run: `database-health.sql`
2. Check: DATA_FRESHNESS section
3. Check: Last import timestamp for each entity
4. Verify: Import pipeline is running

### "Tournaments don't have courses"
1. Run: `check-tournaments.sql`
2. Look for: "TOURNAMENTS WITHOUT COURSE LINK" section
3. Run: Manual verification/linkage
4. Verify: Weather eligibility after linking

## 📋 Table Reference

### Key Metrics by Table

| Table | Expected Count | Season Timing | Query |
|---|---|---|---|
| `courses` | 200+ | Always | `check-courses.sql` |
| `tournaments` | 0-100+ | Grows during season | `check-tournaments.sql` |
| `players` | 1000+ | Always | `check-players.sql` |
| `weatherSnapshots` | Variable | When forecasting | `check-weather.sql` |
| `importRuns` | Growing | Continuous | `check-imports.sql` |

### Always Quoted in SQL

These camelCase fields **must** use quotes:
- `"createdAt"`, `"updatedAt"`, `"deletedAt"`
- `"startDate"`, `"endDate"`
- `"courseId"`, `"tourId"`, `"userId"`, etc.
- `"firstName"`, `"lastName"`
- `"snapshotId"`, `"tournamentId"`, etc.

Example: `SELECT "createdAt" FROM courses WHERE "deletedAt" IS NULL`

## 🔗 Related Documentation

- `docs/WEATHER_INTELLIGENCE_PIPELINE.md` — Weather import architecture
- `docs/COURSE_INTELLIGENCE_PIPELINE.md` — Course enrichment details
- `docs/DATABASE.md` — Original database documentation
- `scripts/sql/README.md` — SQL scripts guide

## ✅ Success Criteria

Future database investigations should:
- ✓ Use existing diagnostic scripts instead of writing custom SQL
- ✓ Reference the health checklist for expected states
- ✓ Take < 2 minutes to run full diagnostics
- ✓ Produce clear, actionable results
- ✓ Require minimal manual SQL writing

---

**Last Updated:** July 16, 2026  
**Sprint:** Database Diagnostics (No schema changes)  
**Status:** ✓ Complete - Ready for use
