# Phase 17.3B: Projection Engine Input Audit

**Status**: Complete Input Classification  
**Date**: 2026-07-20  
**Auditor**: v0 AI Assistant  
**Target**: Tournament Command Center & Model Lab

---

## 1. PRODUCTION PROJECTION ENGINE INPUTS

The Tournament Command Center fetches data from 12 primary service methods. Every input to the projection and display engines is classified below.

### **Fetching Layer** (tournament-command-center.tsx, lines 104-117)

```typescript
const [
  field,                    // getTournamentField()
  fieldReport,             // getFieldReport()
  fieldNews,               // getFieldNews()
  courseProfile,           // courseService.getCourseIntelligence()
  courseAnalytics,         // courseService.getCourseAnalyticsById()
  fitBoard,                // getFieldFitBoard()
  weather,                 // getWeatherIntelligence()
  odds,                    // getOddsIntelligence()
  skillLeaderboards,       // getSkillLeaderboards()
  dfsField,                // getDfsValueField()
  isAdmin,                 // isCurrentUserAdmin()
  rounds,                  // getRoundsByTournament()
] = await Promise.all([...])
```

---

## 2. DEFINITIVE DEPENDENCY LIST

### **2.1 Player Identity (3 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Player Name | tournament_fields.playerName | String | playerId | N/A | UI display in leaderboards |
| Player ID | Players.id (canonical) | UUID | player_id | N/A | All joins, rankings, features |
| Player Number | tournament_fields.playerNumber | Integer | tournamentId + playerId | N/A | Scoreboard display |

**Dependency Path**:
- Source: `tournamentService.getTournamentField()` → `FieldRepository.getByTournament()`
- Mapper: `mapFieldEntrant()` transforms raw TournamentField into FieldEntrant
- Classification: **REQUIRED FOR REPLAY** ✓

---

### **2.2 Tournament Metadata (7 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Tournament ID | tournaments.id | UUID | tournament_id | N/A | All joins |
| Tournament Name | tournaments.name | String | tournament_id | N/A | UI header |
| Start Date | tournaments.startDate | DateTime | tournament_id | N/A | Eligibility window |
| End Date | tournaments.endDate | DateTime | tournament_id | N/A | Eligibility window |
| Status | tournaments.status | Enum | tournament_id | N/A | Display mode (COMPLETED vs LIVE) |
| Format | tournaments.format | Enum | tournament_id | N/A | Scoring rules |
| Lock DateTime | tournaments.lock_datetime | DateTime | tournament_id | N/A | **CUTOFF FOR HISTORICAL DATA** |

**Dependency Path**:
- Source: `tournamentService.getTournamentByIdCached()` → `TournamentRepository.findDetailById()`
- Mapper: `mapTournamentSummary()` transforms raw tournament row
- Classification: **REQUIRED FOR REPLAY** ✓

---

### **2.3 Historical Statistics (5 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Field Strokes Gained | analyticsService | Decimal | playerId | valid_from ≤ lock_datetime | Model scoring |
| Field Driving Distance | analyticsService | Decimal | playerId | valid_from ≤ lock_datetime | Model scoring |
| Field Approach | analyticsService | Decimal | playerId | valid_from ≤ lock_datetime | Model scoring |
| Field Putting | analyticsService | Decimal | playerId | valid_from ≤ lock_datetime | Model scoring |
| Field Around Green | analyticsService | Decimal | playerId | valid_from ≤ lock_datetime | Model scoring |

**Dependency Path**:
- Source: `analyticsService` → reads from player_analytics view or historical features table
- Used in: Model Lab ranking calculator `compositeFor()` function
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ❌ NO HISTORICAL STORE YET - only live/current data

---

### **2.4 Rolling Form (3 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Recent Finishes | PlayerIntelligence | Array<Finish> | playerId | recent (4-week window) | Field strength calc |
| Win Rate | PlayerIntelligence | Decimal | playerId | rolling season | Feature score |
| Consistency | PlayerIntelligence | Decimal | playerId | rolling season | Feature score |

**Dependency Path**:
- Source: `getPlayerSkillIntelligenceService()` → player-skill-intelligence-service
- Used in: Tournament elevation analytics, field strength calculation
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.5 Course History (4 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Course Par | courses.par | Integer | course_id | static | Scoring context |
| Course Yardage | courses.yardage | Integer | course_id | static | Difficulty estimate |
| Course Elevation | courses.altitudeFt | Integer | course_id | static | Wind/ball roll impact |
| Course Timezone | courses.timezone (NEW) | String | course_id | static | Lock datetime conversion |

**Dependency Path**:
- Source: `courseService.getCourseIntelligence()` → CourseIntelligenceRepository
- Used in: Course fit calculation, elevation impact analysis
- Classification: **REQUIRED FOR REPLAY** ✓

---

### **2.6 Course Fit (8 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Player Strokes Gained at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Course-specific skill |
| Player Approach at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Course-specific skill |
| Player Putting at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Course-specific skill |
| Player Driving at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Course-specific skill |
| Player Around Green at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Course-specific skill |
| Fit Strength | course_fit_analytics.fit_strength | Enum | playerId + courseId | historical_depth≥3yrs | Confidence indicator |
| Historical Rounds at Course | player_course_history | Integer | playerId + courseId | all time | Sample size |
| Strokes vs Field at Course | course_fit_analytics | Decimal | playerId + courseId | historical_depth≥3yrs | Relative strength |

**Dependency Path**:
- Source: `buildFieldFitBoard()` + `computeCourseFit()` → reads from analytics engine
- Used in: Field Fit Board, course intelligence widget
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.7 OWGR Rankings (2 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Player OWGR Rank | historical_player_rankings | Integer | playerId | effective_date ≤ lock_datetime | Field ranking display |
| Player OWGR Points | historical_player_rankings | Decimal | playerId | effective_date ≤ lock_datetime | Seed indicator |

**Dependency Path**:
- Source: `rankingService` → reads from historical_player_rankings table
- Used in: Field ranking leaders, AI coach seeds
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.8 DataGolf Rankings (2 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Player DataGolf Rank | ranking_service (provider=datagolf) | Integer | playerId | effective_date ≤ lock_datetime | Model comparison |
| Player DataGolf Model Score | ranking_service (provider=datagolf) | Decimal | playerId | effective_date ≤ lock_datetime | Expected value calc |

**Dependency Path**:
- Source: `rankingService` → reads ranking records with provider='datagolf'
- Used in: AI coach recommendations, model lab comparison
- Classification: **OPTIONAL FOR REPLAY** (nice-to-have, not required for determinism)
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.9 DraftKings Salary (3 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Player DK Salary | dfs_salary_history | Integer | playerId | effective_date = lock_datetime | Value board |
| DK Salary Change | dfs_salary_history | Integer | playerId | day-over-day | Sentiment indicator |
| DK Ownership % | dfs_ownership_snapshots | Decimal | playerId | snapshot_timestamp ≈ lock_datetime | Popularity indicator |

**Dependency Path**:
- Source: `getDfsValueService()` → reads from dfs_salary_history + dfs_ownership_snapshots
- Used in: DFS Value Field widget, value plays board
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.10 Betting Market (4 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Win Odds | betting_odds_snapshots | Decimal | playerId | snapshot_timestamp ≈ lock_datetime | Model alignment |
| Over/Under Finish | betting_odds_snapshots | Decimal | playerId | snapshot_timestamp ≈ lock_datetime | Sentiment |
| Odds Movement | betting_odds_history | Decimal | playerId | last_24h_change | Sharp money signals |
| Implied Win Probability | betting_odds_snapshots (computed) | Decimal | playerId | snapshot_timestamp ≈ lock_datetime | Model input |

**Dependency Path**:
- Source: `getOddsIntelligenceService()` → reads from betting_odds_snapshots
- Used in: Odds intelligence widget, coaching recommendations
- Classification: **OPTIONAL FOR REPLAY** (nice-to-have, provides context)
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.11 Tee Time (3 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Tee Time (Local) | tournament_fields.teeTime | Time | playerId + tournamentId | fixed | Pairing display |
| Starting Hole | tournament_fields.startingHole | Integer | playerId + tournamentId | fixed | Course context |
| Player Entry Status | tournament_fields.status | Enum | playerId + tournamentId | valid_as_of ≤ lock_datetime | Confirmed/withdrew |

**Dependency Path**:
- Source: `tournamentService.getTournamentField()` → TournamentField.teeTime
- Used in: Leaderboard, pairing board, withdrawal tracking
- Classification: **REQUIRED FOR REPLAY** ✓

---

### **2.12 Weather (5 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Current Temperature | weather_forecast_snapshots | Decimal (°F) | tournament_id | forecast_time ≤ event_start | Round context |
| Wind Speed | weather_forecast_snapshots | Decimal (mph) | tournament_id | forecast_time ≤ event_start | Playing difficulty |
| Wind Direction | weather_forecast_snapshots | String | tournament_id | forecast_time ≤ event_start | Course-specific impact |
| Humidity | weather_forecast_snapshots | Decimal (%) | tournament_id | forecast_time ≤ event_start | Ball roll factor |
| Precipitation % | weather_forecast_snapshots | Decimal | tournament_id | forecast_time ≤ event_start | Course condition impact |

**Dependency Path**:
- Source: `tournamentService.getWeatherIntelligence()` → WeatherIntelligenceService
- Used in: Weather intelligence widget, elevation analytics
- Classification: **REQUIRED FOR REPLAY** ✓
- **Current Status**: ✓ Weather snapshots already stored for historical replay

---

### **2.13 Field Strength (4 inputs)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| Average OWGR | calculated from field | Decimal | tournamentId | as_of = lock_datetime | Quality metric |
| Median OWGR | calculated from field | Decimal | tournamentId | as_of = lock_datetime | Quality metric |
| % Top 50 Players | calculated from field | Decimal | tournamentId | as_of = lock_datetime | Elite presence |
| % Top 100 Players | calculated from field | Decimal | tournamentId | as_of = lock_datetime | Depth |

**Dependency Path**:
- Source: `analyticsService` + `rankingService` (OWGR) → computed during `analyzeFieldStrength()`
- Used in: Field strength display, coaching recommendations, model weighting
- Classification: **DERIVED** (computed from Player Identity + OWGR Rankings)
- **Current Status**: ✓ Can be derived from atomic inputs

---

### **2.14 Ownership (1 input - OPTIONAL)**

| Input | Source | Type | Keys | Temporal | Purpose |
|-------|--------|------|------|----------|---------|
| DFS Ownership % | dfs_ownership_snapshots | Decimal | playerId | snapshot_timestamp ≈ lock_datetime | User context only |

**Dependency Path**:
- Source: DraftKings API → dfs_ownership_snapshots
- Used in: User education only (not projection)
- Classification: **OPTIONAL** (context/educational, not required for determinism)
- **Current Status**: ❌ NO HISTORICAL STORE YET

---

### **2.15 Derived Features (COMPUTED, not sourced)**

These are **computed outputs**, not inputs, but included for completeness:

| Feature | Computation | Classification |
|---------|-----------|-----------------|
| Player Composite Score | `rankPopulationByModel()` weighted blend | DERIVED |
| Player Grade (A-F) | `letterGradeForScore()` mapping | DERIVED |
| Course Fit Strength | comparator against player's field average | DERIVED |
| Morning Brief | `buildMorningBrief()` aggregation | DERIVED |
| Tournament Story | `buildTournamentStory()` aggregation | DERIVED |
| Trending Players | `buildTrending()` filter | DERIVED |
| Coach Recommendations | `buildCoachRecommendations()` rules | DERIVED |
| Field Strength Analysis | `analyzeFieldStrength()` calculation | DERIVED |
| Weather Impact | `analyzeWeatherImpact()` correlation | DERIVED |
| Risk Factors | `identifyRiskFactors()` rules | DERIVED |

---

## 3. COMPLETE INPUT CLASSIFICATION SUMMARY

### **By Category**

| Category | Count | Required for Replay | Current Status |
|----------|-------|-------------------|-----------------|
| **Player Identity** | 3 | ✓ YES | ✓ Available (tournament_fields) |
| **Tournament Metadata** | 7 | ✓ YES | ✓ Available (tournaments table) |
| **Historical Statistics** | 5 | ✓ YES | ❌ NO STORE |
| **Rolling Form** | 3 | ✓ YES | ❌ NO STORE |
| **Course History** | 4 | ✓ YES | ✓ Available (courses) |
| **Course Fit** | 8 | ✓ YES | ❌ NO STORE |
| **OWGR Rankings** | 2 | ✓ YES | ❌ NO STORE |
| **DataGolf Rankings** | 2 | ◐ OPTIONAL | ❌ NO STORE |
| **DraftKings Salary** | 3 | ✓ YES | ❌ NO STORE |
| **Betting Market** | 4 | ◐ OPTIONAL | ❌ NO STORE |
| **Tee Time** | 3 | ✓ YES | ✓ Available (tournament_fields) |
| **Weather** | 5 | ✓ YES | ✓ Available (weather snapshots) |
| **Field Strength** | 4 | ✓ DERIVED | ✓ Computed on-the-fly |
| **Ownership** | 1 | ◐ OPTIONAL | ❌ NO STORE |
| **Derived Features** | 10 | ✓ DERIVED | ✓ Computed on-the-fly |
| | | | |
| **TOTALS** | **63** | **46 Required** | **8 Available** |

---

## 4. DATA GAPS FOR REPLAY

**Missing Historical Datasets** (must be imported to enable replay):

1. ❌ **Historical Player Statistics** (5 inputs)
   - Strokes Gained components (driving, approach, putting, around green)
   - Source: SportsDataIO, DataGolf, or PGA Tour API
   - Temporal: Last 3+ years for all players who appear in tournament_fields
   - Depth: Weekly updates during season

2. ❌ **Historical Rolling Form** (3 inputs)
   - Recent finishes, win rates, consistency metrics
   - Source: Computed from tournament outcomes + player rankings
   - Temporal: 4-week rolling windows as of lock_datetime
   - Depth: Requires historical tournament outcomes first

3. ❌ **Historical Course Fit** (8 inputs)
   - Per-player, per-course strokes gained comparisons
   - Source: Computed from player course history + global analytics
   - Temporal: 3+ years of historical data per player-course combo
   - Depth: Only for played combinations

4. ❌ **Historical OWGR Rankings** (2 inputs)
   - Player rank and points as of lock_datetime
   - Source: OWGR API or DataGolf (maintains historical archive)
   - Temporal: Weekly snapshots (Thursday release)
   - Depth: Last 5+ years

5. ❌ **Historical DraftKings Salaries** (3 inputs)
   - Player salary at lock_datetime
   - Source: DraftKings historical API or manual capture
   - Temporal: One snapshot per tournament (at lock_datetime)
   - Depth: Last 3+ years of tournaments

6. ❌ **Historical Betting Odds** (4 inputs)
   - Win odds, O/U, vig-adjusted probabilities
   - Source: Genius Sports, BetRivers API, or manual capture
   - Temporal: Multiple snapshots (pre-event closing lines, move tracking)
   - Depth: Last 3+ years

7. ❌ **Historical Ownership** (1 input - optional)
   - DFS ownership snapshots
   - Source: DraftKings historical API or manual capture
   - Temporal: Multiple snapshots during entry period
   - Depth: Last 3+ years

8. ✓ **Historical Tournament Outcomes** (prerequisite for #2, #3)
   - Final positions, scores, status (withdrew, disqualified)
   - Source: PGA Tour API, SportsDataIO
   - Temporal: Complete for every round
   - Depth: Last 5+ years (required as base for rolling form)

---

## 5. REQUIRED PROVIDER MAPPINGS

| Dataset | Primary Provider | Fallback | Frequency | Depth | License |
|---------|-----------------|----------|-----------|-------|---------|
| Player Statistics | SportsDataIO | DataGolf | Weekly | 3+ years | Licensed |
| OWGR Rankings | DataGolf | OWGR API | Weekly | 5+ years | Licensed |
| DraftKings Salary | DraftKings API | Manual | Per-tournament | 3+ years | Public API |
| Betting Odds | Genius Sports | BetRivers | Per-tournament | 3+ years | Licensed |
| Tournament Outcomes | SportsDataIO | PGA Tour API | Live | 5+ years | Licensed |
| Course Fit (derived) | Internal | - | Per-tournament | Computed | Internal |
| Rolling Form (derived) | Internal | - | Per-tournament | Computed | Internal |

---

## 6. AUDIT CONCLUSION

**Total Inputs to Production Engine**: 63  
**Classified as Required for Deterministic Replay**: 46  
**Currently Available in Database**: 8  
**Must Be Acquired**: 38  
**Optional Enhancements**: 7  

**Readiness for Historical Replay**: 🔴 **BLOCKED** (38 critical datasets missing)

Next phase: Build acquisition interfaces for the 38 missing datasets.

