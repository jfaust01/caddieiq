# Database Health Dashboard

## Overview

The Database Health Dashboard is a production-ready operational dashboard at `/admin/database-health` that provides instant visibility into the entire platform's database health. It's designed to answer critical operational questions in under 30 seconds without needing to access Neon SQL or run manual queries.

**Key Goal:** Platform founders and operators can understand the entire database health state at a glance.

## Access

- **Route:** `/admin/database-health`
- **Location:** Admin > Operations > Database Health
- **Auth:** Admin-only (404 for non-admins to hide page existence)
- **Refresh:** Live on every request (never cached)

## Overall Health Score

The dashboard displays a single health percentage (0-100%) calculated from multiple factors:

### Health Score Calculation

The score is weighted based on:
- **Import Success (40%):** Successful imports vs. failures in the recent period
- **Table Population (40%):** Expected tables have data; unexpected empty tables don't penalize
- **Pipeline Health (20%):** Active pipelines are running and not stalled

### Status Levels

- **Healthy (90-100%):** All systems operational, no critical warnings
- **Warning (70-89%):** Minor issues present (stale data, missing coordinates, etc.)
- **Critical (0-69%):** Serious issues requiring immediate attention

The status is derived from:
- Health percentage
- Count of critical warnings
- Presence of failed tables or stalled imports

## Dashboard Sections

### 1. Health Overview

**Top card displaying:**
- Current status badge (Healthy, Warning, Critical)
- Health percentage with visual progress bar
- Generated timestamp (UTC)

Color coding:
- Green: Healthy
- Amber: Warning
- Red: Critical

### 2. Key Performance Indicator (KPI) Cards

Three metrics displayed:

#### Total Rows
- **Value:** Sum of all rows across major tables
- **Hint:** Number of tables contributing to the count
- **Purpose:** Understand overall data volume

#### Last Import
- **Value:** How recently any import ran
- **Hint:** Last successful import time
- **Purpose:** Track import pipeline activity

#### Failed Imports (24h)
- **Value:** Number of failed import runs
- **Hint:** Average import duration (if available)
- **Purpose:** Spot import pipeline problems

### 3. System Warnings Panel

Displays all active warnings with three severity levels:

#### Critical (Red)
- **Examples:**
  - No tournaments found during peak season
  - Database connectivity issues
  - Major data integrity problems
- **Action:** Requires immediate investigation

#### Warning (Amber)
- **Examples:**
  - Courses missing coordinates (prevents weather forecasting)
  - Stale player data (>5 days old)
  - Recent import failures
  - Low data coverage
- **Action:** Should be addressed soon

#### Info (Blue)
- **Examples:**
  - Routine maintenance notifications
  - Scheduled maintenance windows
- **Action:** Informational only

Each warning includes:
- Title and description
- Root cause explanation
- Suggested corrective action

### 4. Table Health Panel

Searchable, filterable table showing every database table's status.

#### Columns

| Column | Purpose |
|--------|---------|
| Table Name | PostgreSQL table identifier |
| Rows | Current row count |
| Status | Health status (see Status Rules) |
| Purpose | Why this table exists |
| Expected | Is data expected in this table? |
| Last Updated | Most recent timestamp |
| Health | Health score (0-100%) |

#### Status Rules

Tables are assigned status based on content and expected state, **not** simply by emptiness:

| Status | Applies When | Example |
|--------|--------------|---------|
| **Healthy** | Table has data and is functioning normally | `courses` with 205 rows |
| **Waiting** | Table should populate soon but hasn't yet | `weatherSnapshots` before tournament week |
| **Expected Empty** | Table is correctly empty based on season | `weatherSnapshots` during off-season |
| **Import Pending** | Awaiting import pipeline run | `players` on first deployment |
| **Unused** | Reserved for future features | Unimplemented enrichment tables |
| **Future Feature** | Feature not yet released | Experimental tables |
| **Error** | Data quality issue requiring investigation | `courses` with missing coordinates |
| **Critical** | Severe problem blocking operations | Essential table completely empty |

#### Key Tables Reference

**Always Populated:**
- `users` (application users)
- `tours` (PGA, LIV, LPGA, etc.)
- `courses` (200+ golf courses)

**Event-Driven (expected to grow):**
- `tournaments` (populated as scheduled)
- `players` (populated by import pipeline)
- `rounds` (populated during tournaments)
- `playerRounds` (scorecard data)

**Enrichment (populate after import):**
- `courseCharacteristics` (course intelligence)
- `weatherSnapshots` (forecasts for upcoming events)
- `weatherPeriods` (individual forecast blocks)

**Time-Limited (populated by schedule):**
- `dfsSalaries` (released 3 days before tournament)

**Empty Explanations:**
Every empty table carries an explicit explanation in a notes section below the table, so there's zero ambiguity about why it's empty.

#### Filters

- **Status Filter:** Select one or more statuses to narrow the view
- **Search:** Find tables by name or purpose

### 5. Import Pipelines Section

Displays cards for each import pipeline with current status and metrics.

#### Pipeline Cards

Each card shows:
- **Pipeline Name** (Players, Courses, Tournaments, Weather, etc.)
- **Status Badge** (color-coded)
- **Last Run Time** (e.g., "2 hours ago")
- **Duration** (last run in seconds)
- **Rows Imported** (from last successful run)
- **Errors** (count, if any)
- **Refresh Button** (for manually triggerable pipelines)

#### Supported Pipelines

1. **Players** (Manual Refresh: Yes)
   - Status: Latest import status
   - Purpose: Player roster and career data
   
2. **Courses** (Manual Refresh: Yes)
   - Status: Latest import status
   - Purpose: Golf course data
   
3. **Tournaments** (Manual Refresh: Yes)
   - Status: Latest import status
   - Purpose: Tournament schedules
   
4. **Weather** (Manual Refresh: Yes)
   - Status: Latest import status
   - Purpose: OpenWeather forecasts
   
5. **DFS Salaries** (Manual Refresh: No)
   - Status: Latest import status
   - Purpose: DraftKings salary data
   
6. **Rankings** (Manual Refresh: No)
   - Status: Latest import status
   - Purpose: Player rankings

#### Manual Refresh

Pipelines that support manual refresh display a "Refresh" button. Clicking it:
- Submits a request to the import service
- Does not block the page
- Updates on next page reload

## Expected Table Populations

### By Season

#### Off-Season (October-December)
- `users`, `tours`, `courses`: Fully populated
- `tournaments`: Empty or sparse (minimal scheduling)
- `players`: Fully populated
- `weatherSnapshots`: May be empty (no tournaments in forecast window)
- `dfsSalaries`: Empty
- `courseCharacteristics`: Partially populated (from enrichment pipeline)

#### Peak Season (January-September)
- All core tables: Fully populated
- `tournaments`: Growing as schedule published
- `weatherSnapshots`: Populated for upcoming events
- `dfsSalaries`: Populated 3 days before tournament
- `playerRounds`: Growing as tournaments progress

### Health Expectations

| Table | Min Rows (Healthy) | Status if Empty | Notes |
|-------|-------------------|-----------------|-------|
| `users` | 1+ | Critical | Application cannot function |
| `tours` | 5+ | Critical | Foundational data |
| `courses` | 200+ | Critical | Foundation for tournaments |
| `tournaments` | 0+ | Expected/Waiting | Off-season may be empty |
| `players` | 1000+ | Import Pending | Awaiting import pipeline |
| `weatherSnapshots` | 0+ | Waiting/Expected Empty | Depends on tournament schedule |
| `dfsSalaries` | 0+ | Expected Empty | Released week-of |
| `courseCharacteristics` | 200+ | Import Pending | Requires enrichment pipeline |

## Common Scenarios

### Scenario: "Is the database healthy right now?"

1. Open Dashboard
2. Check Overall Health Score at top
3. If green/90%+, answer is YES
4. If amber/70-89%, check System Warnings for specific issues
5. If red/Critical, check System Warnings for root causes

**Time to answer:** < 10 seconds

### Scenario: "Why is courseCharacteristics empty?"

1. Open Dashboard
2. Scroll to Table Health Panel
3. Search for "courseCharacteristics"
4. Read explanation: "Run course enrichment pipeline - see docs/COURSE_CHARACTERISTICS_ENRICHMENT.md"
5. Follow the linked documentation

**Time to answer:** < 20 seconds

### Scenario: "Did imports run today?"

1. Open Dashboard
2. Check KPI cards section
3. Look at "Last Import" timestamp
4. Check "Failed Imports (24h)" count
5. Scroll to Import Pipelines and review individual statuses

**Time to answer:** < 15 seconds

### Scenario: "Are all tournaments loaded for this week?"

1. Open Dashboard
2. Check `tournaments` table in Table Health Panel
3. If row count is > 0 and status is "Healthy", YES
4. If row count is 0, check Status explanation

**Time to answer:** < 20 seconds

## Architecture

### Data Layer

`lib/system-health/database-health.ts` exports:
- `getDatabaseHealthReport()` - Main async function returning complete report
- All TypeScript interfaces for the report structure
- Helper functions for health calculations

### Component Layer

All components are client-renderable (with proper async handling):

- `database-health-view.tsx` - Main page layout
- `health-overview.tsx` - Top health card
- `kpi-cards.tsx` - Key performance indicators
- `system-warnings-panel.tsx` - Warnings with severity
- `table-health-panel.tsx` - Searchable/filterable table
- `import-pipelines.tsx` - Pipeline cards grid

### Page Layer

`app/(app)/admin/database-health/page.tsx`:
- Admin auth check
- Fetches report server-side
- Renders view component
- Never cached (force-dynamic)

## Data Freshness

- **Report Generated:** Every request (live data)
- **Cache Policy:** None (force-dynamic)
- **Query Complexity:** O(n) where n = number of import runs in last 7 days
- **Typical Response Time:** 200-500ms

## Future Enhancements

### Phase 2 (Future)
- Real-time updates via WebSocket
- Historical trends and charts
- Custom alert thresholds
- Export reports as PDF/CSV
- Webhook notifications for critical alerts

### Phase 3 (Future)
- Predictive analytics (forecast when tables will be empty)
- Data quality scoring per table
- Automatic corrective actions
- Integration with incident management systems

## Troubleshooting

### "Dashboard shows Critical but I don't see an obvious problem"

1. Read System Warnings section carefully - they contain root causes
2. Check individual table explanations for context
3. Review import pipeline statuses
4. Open related documentation (WEATHER_INTELLIGENCE_PIPELINE, COURSE_CHARACTERISTICS_ENRICHMENT, etc.)

### "A table shows 'Error' status"

This typically means:
- The table has data but quality issue detected (e.g., missing coordinates)
- The table is supposed to have data but doesn't
- An import failed to complete properly

**Action:** Check the table's explanation and suggested action in the warnings panel.

### "Import Pipelines section shows nothing"

This means no import runs have been recorded. This is expected on:
- Brand new deployments
- After a database reset
- If no imports have been attempted yet

**Action:** Manually trigger imports via quick action buttons (if available) or check import service logs.

## Related Documentation

- [DATABASE_DIAGNOSTICS.md](./DATABASE_DIAGNOSTICS.md) - SQL diagnostic queries
- [DATABASE_HEALTH_CHECKLIST.md](./DATABASE_HEALTH_CHECKLIST.md) - Expected table states by season
- [WEATHER_INTELLIGENCE_PIPELINE.md](./WEATHER_INTELLIGENCE_PIPELINE.md) - Weather import details
- [COURSE_CHARACTERISTICS_ENRICHMENT.md](./COURSE_CHARACTERISTICS_ENRICHMENT.md) - Course enrichment pipeline
- [IMPORT_HEALTH.md](./IMPORT_HEALTH.md) - General import pipeline health
