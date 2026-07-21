# Database Health Dashboard - Visual Guide

## Dashboard Layout

The enhanced Database Health dashboard now includes two new columns that provide immediate visibility into data ownership and sync status.

### Table Structure

```
┌────────────────────────┬─────────────────────┬──────────────────┬───────┬────────┬─────────────────────┬──────────┬──────────────┬────────┐
│ Table Name             │ Provider            │ Sync State       │ Rows  │ Status │ Purpose             │ Expected │ Last Updated │ Health │
├────────────────────────┼─────────────────────┼──────────────────┼───────┼────────┼─────────────────────┼──────────┼──────────────┼────────┤
│ users                  │ 🟨 CaddieIQ         │ ⚙️ Not Generated  │ 3     │ Healthy│ User accounts       │ ✓        │ Just now     │ 100%   │
│ tournaments            │ 🟦 SportsDataIO     │ ✅ Synced        │ 52    │ Healthy│ Tournament events   │ ✓        │ 1h ago       │ 100%   │
│ courses                │ 🟩 GolfCourseAPI    │ ⏳ Awaiting Import│ 0     │ Waiting│ Golf courses        │ ○        │ —            │ 50%    │
│ player_rankings        │ 🟦 SportsDataIO     │ ✅ Synced        │ 3,500 │ Healthy│ Player world ranking│ ✓        │ 2h ago       │ 100%   │
│ tournament_course_map  │ 🟪 Multiple Prov    │ ⚠️ Pending Verif  │ 42    │ Waiting│ Tournament-course   │ ✓        │ —            │ 75%    │
│ course_intelligence    │ 🟨 CaddieIQ         │ ⚙️ Not Generated  │ 0     │ Waiting│ Course analysis     │ ○        │ —            │ 50%    │
└────────────────────────┴─────────────────────┴──────────────────┴───────┴────────┴─────────────────────┴──────────┴──────────────┴────────┘
```

## Provider Badges

### 🟦 SportsDataIO (Blue)
**When you see this badge**, the data comes from SportsDataIO API.

**Tooltip on hover:**
> Tournament schedules, players, fantasy scoring, statistics, rankings, odds and news.

**Common tables:**
- tournaments
- players
- player_rankings
- player_statistics
- news_articles
- betting_events

**Expected Sync State:** ✅ Synced

---

### 🟩 GolfCourseAPI (Green)
**When you see this badge**, the data comes from GolfCourseAPI.

**Tooltip on hover:**
> Golf courses, holes, tees, yardages, GPS coordinates, course metadata and specifications.

**Common tables:**
- courses
- course_holes
- course_tees
- tee_hole_yardages
- course_coordinates
- playing_conditions

**Expected Sync State:** ⏳ Awaiting Import (until course import runs)

---

### 🟨 CaddieIQ (Gold/Amber)
**When you see this badge**, the data is generated internally by CaddieIQ.

**Tooltip on hover:**
> Data generated internally by CaddieIQ from imported provider data.

**Common tables:**
- Users
- Rounds
- Courses Intelligence
- Player Intelligence
- Golfer Ratings
- Saved Lineups
- User Favorites

**Expected Sync State:** ⚙️ Not Generated (until logic runs) → ✅ Synced

---

### 🟪 Multiple Providers (Purple)
**When you see this badge**, the data combines multiple sources.

**Tooltip on hover:**
> Data merged from multiple providers during tournament-to-course matching.

**Common tables:**
- tournament_course_mappings
- weather_snapshots
- odds_events

**Expected Sync State:** Varies (depends on upstream sources)

---

## Sync State Indicators

### ✅ Synced (Green)
**What it means:** Data is successfully imported and up-to-date.

**When you see it:**
- SportsDataIO tables that have been imported
- Tables with recent row updates
- Data is ready to use

**Action needed:** None - data is flowing correctly

**Example:**
```
players                    🟦 SportsDataIO     ✅ Synced        15,200 rows    Healthy
```

---

### ⏳ Awaiting Import (Blue)
**What it means:** Data provider is available, but import hasn't run yet.

**When you see it:**
- GolfCourseAPI tables before course import
- New tables that haven't been imported
- Data is available but not yet populated

**Action needed:** 
- Run the course import from "Administrative Actions" section
- Check import logs if import is stalled

**Example:**
```
courses                    🟩 GolfCourseAPI    ⏳ Awaiting Import 0 rows        Waiting
course_holes               🟩 GolfCourseAPI    ⏳ Awaiting Import 0 rows        Waiting
```

---

### ⚠️ Pending Verification (Amber)
**What it means:** Import is ready but requires admin verification before processing.

**When you see it:**
- Tournament course mappings waiting for verification
- Data that needs manual review
- Reconciliation needed between systems

**Action needed:**
- Review pending items in mapping verification
- Approve or reject mappings
- Run import after verification completes

**Example:**
```
tournament_course_mappings  🟪 Multiple        ⚠️ Pending Verif  42 rows        Waiting
```

---

### ⚙️ Not Generated (Gray)
**What it means:** Generated data hasn't been created yet.

**When you see it:**
- Intelligence tables (course_intelligence, player_intelligence)
- Ratings (golfer_ratings)
- User-generated content (saved_lineups, user_favorites)

**Action needed:**
- None initially (data is created when needed)
- If stuck: Check if upstream tables are populated
- May need to run rebuild jobs from "Administrative Actions"

**Example:**
```
course_intelligence        🟨 CaddieIQ         ⚙️ Not Generated  0 rows        Waiting
golfer_ratings             🟨 CaddieIQ         ⚙️ Not Generated  0 rows        Waiting
```

---

### ❌ Error (Red)
**What it means:** An error occurred during import or generation.

**When you see it:**
- Failed imports
- API connection errors
- Database constraint violations

**Action needed:**
- Check the error message in the explanation section
- Review import logs
- Contact support if persistent

**Example:**
```
courses                    🟩 GolfCourseAPI    ❌ Error          0 rows        Error
```

---

## Workflow Examples

### Scenario 1: New Installation
```
Initial state after fresh database:
users                      🟨 CaddieIQ         ⚙️ Not Generated  0 rows        Expected Empty
tournaments                🟦 SportsDataIO     ✅ Synced         52 rows        Healthy
courses                    🟩 GolfCourseAPI    ⏳ Awaiting Import 0 rows        Waiting
tournament_course_mappings 🟪 Multiple        ⚠️ Pending Verif  52 rows        Waiting

What to do:
1. Run course import (GolfCourseAPI data)
2. Wait for sync state → Awaiting Import → Synced
3. Review and verify tournament course mappings
4. System will auto-generate intelligence after verification
```

### Scenario 2: Investigating Missing Data
```
Problem: "Why are courses empty?"

Check dashboard:
courses                    🟩 GolfCourseAPI    ⏳ Awaiting Import 0 rows        Waiting

Answer: Data hasn't been imported yet!
Action: Click "Import Golf Courses" button in admin actions

After import:
courses                    🟩 GolfCourseAPI    ✅ Synced         2,156 rows     Healthy
```

### Scenario 3: Checking Sync Status
```
Daily admin check:
All SportsDataIO tables (🟦) should show: ✅ Synced
All GolfCourseAPI tables (🟩) should show: ✅ Synced
All CaddieIQ tables (🟨) should show: ⚙️ Not Generated or ✅ Synced

If any show ⏳ or ⚠️:
- Check "Last Updated" timestamp
- Review logs in "Import Pipelines" section
- Investigate sync state notes in dashboard
```

---

## At-a-Glance Status Guide

### Healthy System
✅ All SportsDataIO tables: ✅ Synced  
✅ All GolfCourseAPI tables: ✅ Synced  
✅ CaddieIQ tables: ⚙️ Not Generated or ✅ Synced  
✅ Dashboard overall status: "Healthy"

### Needs Attention
⚠️ Any table with ⏳ Awaiting Import (older than 24h)  
⚠️ Any table with ⚠️ Pending Verification (older than pending reason)  
⚠️ Any table with ❌ Error  

### Performance Indicators
- 🟦 SportsDataIO sync time: Usually < 2 hours
- 🟩 GolfCourseAPI sync time: Usually < 1 hour
- 🟨 CaddieIQ generation time: Usually < 30 minutes

---

## Tips for Administrators

1. **Daily Check (5 minutes)**
   - Scan provider column for consistency
   - Check sync states (all should be ✅ or ⚙️)
   - Look for any ❌ errors

2. **New Data Import**
   - Watch for ⏳ Awaiting Import state
   - Click relevant import button
   - Monitor for ✅ Synced confirmation

3. **Troubleshooting**
   - Provider column → Know which system to investigate
   - Sync state column → Know what to do next
   - Tooltips → Quick reference without documentation

4. **Configuration Changes**
   - Table provider changed? Update table-config.ts
   - Sync workflow changed? Update TABLE_CONFIG
   - Changes apply immediately on next report generation
