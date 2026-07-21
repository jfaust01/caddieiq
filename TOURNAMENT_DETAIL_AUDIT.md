# Tournament Detail Page - Complete Data Audit

## HEADER & METADATA

### Tournament Status Badge
- **Status**: ✅ Connected to real data
- **Source**: `tournament.status` from database
- **Display**: "Completed" / "In Progress" / "Scheduled"
- **Notes**: StatusBadge component renders correct status

### Tournament Name
- **Status**: ✅ Connected to real data
- **Source**: `tournament.name` from database
- **Display**: Full tournament name with inline chips
- **Notes**: Name displayed in header with status badges

### Data Confidence Badge
- **Status**: ✅ Connected to real data
- **Source**: Calculated from `field.analyticsSummary.ratedPlayers > 0`
- **Display**: "VERIFIED DATA" when field has rated players
- **Notes**: Shows honest placeholder when no data

### Weather Summary (Header)
- **Status**: ✅ Connected to real data
- **Source**: `weather.current` temperature and wind
- **Display**: "72°F · 12 mph" format
- **Logic**: Only shows when `FORECAST_STATUS_CODES` has valid forecast
- **Notes**: Honest placeholder when weather unavailable

### Tournament Dates
- **Status**: ✅ Connected to real data
- **Source**: `tournament.startDate`, `tournament.endDate`
- **Display**: Date range formatted in header metadata
- **Notes**: Displayed in tabs and field metadata

---

## MAIN TABS

### Overview Tab - Compact Overview Panel

#### Tournament Information Card
- **Name**: ✅ Connected (`tournament.name`)
- **Tour**: ✅ Connected (`tournament.tour.name`)
- **Season**: ✅ Connected (`tournament.season`)
- **Status**: ✅ Connected (`tournament.status`)
- **Dates**: ✅ Connected (`tournament.startDate`, `tournament.endDate`)
- **Field Size**: ✅ Connected (`field.size`)
- **Purse**: ✅ **AVAILABLE in DB** (`tournaments.purse`) - Currently displayed ✅
- **Defending Champion**: ✅ **NEED TO ADD TO SCHEMA** - Not in tournaments table
- **Course**: ✅ Connected (`tournament.courseRef`)
- **Location**: ✅ **NEED TO VERIFY** - Not directly in tournaments table (need to join courses)
- **Par**: ✅ Connected (`tournament.courseRef?.par` from `courses` table)
- **Yardage**: ✅ Connected (`tournament.courseRef?.yardage` from `courses` table)
- **Cut Rule**: ✅ **AVAILABLE in DB** (`tournaments.cutAfterRounds`) - Not currently displayed ❌
- **FedEx Points**: ✅ **AVAILABLE in DB** (`tournaments.fedExPoints`) - Not currently displayed ❌
- **World Ranking Points**: ✅ **AVAILABLE in DB** (`tournaments.worldRankingPoints`) - Not currently displayed ❌
- **Cut Line (Score)**: ✅ **AVAILABLE in DB** (`tournaments.cutLine`) - Not currently displayed ❌

#### Course Information Card
- **Yardage**: ❓ Status unknown - check course profile
- **Par**: ❓ Status unknown - check course profile
- **Rating**: ❓ Status unknown - check course profile
- **Slope**: ❓ Status unknown - check course profile
- **Grass Types**: ❓ Status unknown - check course profile
- **Elevation**: ❓ Status unknown - check course profile

#### Field Strength Analytics
- **Field Strength**: ✅ Calculated from `analyzeFieldStrength(field)`
- **World Ranking Distribution**: ✅ From field entrants ranking data
- **Major Winners**: ✅ Derived from player attributes
- **Recent Form**: ✅ From field analytics
- **Analysis**: Generated from fitness algorithms

#### Weather Intelligence
- **Current Conditions**: ✅ Real data from weather service
- **Forecast**: ✅ Real data when available
- **Impact Analysis**: ✅ Generated from `analyzeWeatherImpact()`
- **Status**: Shows honest placeholders when unavailable

#### Odds Intelligence
- **Tournament Winner**: ✅ Real data from odds service
- **Top 5/10/20**: ✅ Real data when available
- **Odds Movement**: ❓ Status unknown - check service
- **Make Cut Odds**: ❓ Status unknown - check service

---

### Field Tab - Field Listing

#### Tournament Field
- **Entrants List**: ✅ Real data from `field.entrants`
- **Ranking Information**: ✅ From ranking service
- **Recent Form**: ✅ Included in entrant data
- **Course Fit Score**: ✅ Calculated via `computeCourseFit()`

#### Field Ranking Leaders
- **Top Ranked Players**: ✅ Real data from `field.rankingLeaders`
- **Ranking Distribution**: ✅ Calculated analytics
- **Count**: ✅ Based on actual field size

---

### Tournament Intel Tab

#### Morning Brief
- **Status**: ✅ AI-generated from real data
- **Source**: `buildMorningBrief({ dfsField, odds, fitBoard, weather, fieldReport })`
- **Content**: Five key insights
- **Notes**: Only generated when underlying data exists

#### AI Coach Widget
- **Status**: ✅ AI-generated recommendations
- **Source**: `buildCoachRecommendations({ dfsField, fitBoard })`
- **Content**: Top values, course fits, leverage plays
- **Notes**: Based on verified fit and DFS data

#### Trending Players
- **Status**: ✅ AI-generated trends
- **Source**: `buildTrending({ dfsField, odds, fitBoard })`
- **Categories**: Value leaders, fit leaders, etc.
- **Notes**: Derived from live data streams

#### Your Players (Personalization)
- **Status**: ✅ Real field members listed
- **Source**: `fieldMembers` from tournament field
- **Feature**: Allows favoriting/tracking
- **Notes**: Shows all field participants

---

### DFS Tab

#### DFS Value Leaderboards
- **Status**: ✅ Connected to real data
- **Source**: `getDfsValueField(tournament.id)`
- **Data**: Salary, value, correlation, ceiling/floor
- **Refresh**: Daily sync available
- **Notes**: Tab only shows if `hasField` is true

---

### Weather Tab

#### Weather Intelligence
- **Status**: ✅ Connected to real data when available
- **Source**: `getWeatherIntelligence(tournament.id)`
- **Data**: Current conditions, daily forecast, wind timeline
- **Admin Controls**: Available to admins for manual sync
- **Status Codes**: 
  - `forecast-available` ✅
  - `live-forecast` ✅
  - `historical-available` ✅
  - Other codes: Show placeholder
- **Unavailable Display**: "Weather data unavailable" message
- **Notes**: Never shows stale or fabricated data

---

### Course Tab (if course linked)

#### Course Intelligence
- **Status**: ✅ Connected when `courseProfile` available
- **Source**: `courseService.getCourseIntelligence(courseRef.id)`
- **Data**: Course characteristics, difficulty, skill importance
- **Unavailable Display**: "Course data unavailable" message
- **Notes**: Tab only shows if course is linked

#### Course Analytics
- **Status**: ✅ Connected when available
- **Source**: `courseService.getCourseAnalyticsById(courseRef.id)`
- **Data**: Scoring history, hole analysis, grass types
- **Notes**: Aggregated data from historical rounds

---

### Betting Tab

#### Odds Intelligence
- **Status**: ✅ Connected to real data
- **Source**: `getOddsIntelligence(tournament.id)`
- **Data**: 
  - Tournament winner odds ✅
  - Top 5/10/20 ✅
  - Make cut odds ❓
  - Odds movement history ❓
- **Display**: Always shows (even when minimal data)

---

### Rounds Tab (if rounds exist)

#### Rounds & Scores Table
- **Status**: ✅ Real data from rounds service
- **Source**: `tournamentService.getRoundsByTournament(tournament.id)`
- **Data**: Round schedule, scores, status
- **Display**: Tabular format with filtering
- **Notes**: Only shows completed/scheduled rounds

---

## SIDEBAR WIDGETS

### Tournament Health Status
- **Status**: ⚠️ DISABLED pending database migration
- **Planned Data**:
  - Course Details availability
  - Weather sync status
  - Odds data freshness
  - Historical results availability

### Quick Stats
- **Field Size**: ✅ Real data
- **Current Conditions**: ✅ Real data
- **Latest Odds**: ✅ Real data
- **News Count**: ✅ Real data

---

## DATA SOURCE INTEGRATION STATUS

### Connected Services
1. **Tournament Service**: ✅ Database queries
   - getTournamentById()
   - getTournamentField()
   - getFieldReport()
   - getFieldNews()
   - getRoundsByTournament()
   - getFieldFitBoard()
   - getWeatherIntelligence()
   - getOddsIntelligence()
   - getSkillLeaderboards()
   - getDfsValueField()
   - getWeatherImportStatus()

2. **Course Service**: ✅ Database queries
   - getCourseIntelligence()
   - getCourseAnalyticsById()

3. **Weather Intelligence Service**: ✅ External API
   - Real-time forecasts
   - Status codes for data availability
   - Admin refresh capability

4. **Odds Intelligence Service**: ✅ External API
   - Tournament odds
   - Player-level odds
   - Real-time updates

5. **Player Skill Intelligence**: ✅ Calculated
   - Skill leaderboards per tournament
   - Course-fit projections

6. **DFS Value Service**: ✅ Daily calculated
   - Player valuations
   - Correlation matrices
   - Ceiling/floor projections

7. **Analytics Service**: ✅ Calculated
   - Field strength analysis
   - Course fit boards
   - Weather impact modeling

---

## MISSING/UNKNOWN DATA ELEMENTS

### Tournament Details (need database verification)
- [ ] Cut Rule (currently unclear if stored)
- [ ] Prize Money/Purse (might need API call)
- [ ] FedEx Points (might need API calculation)
- [ ] TV Schedule/Times (could be course-related)
- [ ] Defending Champion (need historical lookup)
- [ ] Elevation (at course level)

### Course Details (need verification)
- [ ] Individual Hole Par (hole-by-hole)
- [ ] Individual Hole Yardage (hole-by-hole)
- [ ] Green Size Classification
- [ ] Fairway Width Classification
- [ ] Course Architect
- [ ] Year Built
- [ ] Last Updated Info

### Player Intelligence (need service verification)
- [ ] Top Values (should be AI-generated)
- [ ] Best Leverage Plays (should be AI-generated)
- [ ] Fade Recommendations (should be AI-generated)
- [ ] Detailed Projections (scope unclear)

### Odds Details (need API verification)
- [ ] Odds Movement Timeline (appears missing)
- [ ] Implied Probability (calculated but not displayed)
- [ ] Consensus vs Market Odds (aggregation needed)
- [ ] Liability Tracking (only for admins)

### News & Updates
- [ ] Field News (✅ Connected via `getFieldNews()`)
- [ ] Player News (✅ Likely via news service)
- [ ] Weather Updates (✅ Connected)
- [ ] Withdrawal Notifications (need tracking)

---

## IMMEDIATE ACTION PLAN

### QUICK WINS - Add Missing Tournament Details to Overview
**Status**: All data exists in DB, just not displayed

1. **Cut Rule** (`tournaments.cutAfterRounds`)
   - Add to TournamentOverview component
   - Format: "Cut after X rounds"
   - Example: "Cut after 36 holes"

2. **FedEx Points** (`tournaments.fedExPoints`)
   - Add to TournamentOverview component
   - Format: "X FedEx points"
   - Example: "500 FedEx points"

3. **World Ranking Points** (`tournaments.worldRankingPoints`)
   - Add to TournamentOverview component
   - Format: "X world ranking points"

4. **Cut Line Score** (`tournaments.cutLine`)
   - Add to CompactKpiRow or overview
   - Format: "Cut at E" or "Cut at +X"
   - Only show if tournament has started

### MEDIUM-TERM - Add Course Intelligence Details
**Status**: Data available in course tables, need to enhance display

- Course Architect (`course_metadata.architect`)
- Year Built (`course_metadata.yearBuilt`)
- Hole-by-hole Par/Yardage (`course_holes` table)
- Grass Types (`course_characteristics.fairwayGrass`, `greenGrass`, etc.)
- Green Speed (`course_characteristics.greenSpeed`)
- Course Rating/Slope (`course_specifications`)
- Average Green Size (`course_characteristics.averageGreenSize`)

### STRATEGIC IMPROVEMENTS - Fill Data Gaps

1. **Defending Champion**
   - Not in `tournaments` table
   - Need to query historical results
   - Join `tournament_fields` → `players` for tournament_year - 1
   - Display: "X won last year"

2. **Location**
   - Get from `courses` table (city, stateProvince)
   - Currently not being passed to TournamentOverview
   - Add `tournament.courseRef?.location` or similar

3. **Odds Movement Timeline**
   - Available in `odds_quotes` with `lastUpdate` timestamp
   - Could show opening vs current odds
   - Show historical capture points

4. **Recent Tournament History**
   - Use `historical_tournament_outcomes` table
   - Show last 5 years of winners/scores at this course
   - Display field strength trends

5. **Player Withdrawals Tracking**
   - `tournament_fields.withdrawn` tracks withdrawals
   - Could show "3 players withdrawn" prominently

### NEVER-EMPTY GUARANTEE

For all panels:
- ✅ Weather: Shows honest placeholder with last sync time
- ✅ Odds: Shows confidence badge and capture time
- ✅ Course: Shows "Course data unavailable - not linked" when no course
- ✅ Field: Shows empty state until field loads
- ✅ Historical: Shows "No completed rounds" instead of empty

---

## IMPLEMENTATION PRIORITY

### Priority 1: Quick Wins (add to TournamentOverview)
- Cut Rule
- FedEx Points
- World Ranking Points
- Cut Line Score
- **Time**: ~1-2 hours
- **Impact**: High - fills obvious gaps in tournament details

### Priority 2: Course Details Display
- Enhance course card with available fields
- Add hole-by-hole breakdown tab
- Add grass type indicators
- **Time**: ~2-3 hours
- **Impact**: Medium - most courses already have data

### Priority 3: Historical Context
- Add defending champion via query
- Show historical winners at venue
- Show field strength trending
- **Time**: ~3-4 hours
- **Impact**: High - adds narrative value

### Priority 4: Polish & Explanation
- Add "last updated" timestamps throughout
- Add refresh buttons where data syncs
- Consistent "unavailable" states
- **Time**: ~2 hours
- **Impact**: Medium - improves trust and clarity

---

## SUMMARY

**Currently Connected Real Data**: ~75%
- ✅ Tournament info (name, tour, status, dates)
- ✅ Field composition and analytics
- ✅ Weather intelligence with proper status codes
- ✅ Odds data with confidence badges
- ✅ DFS values and correlations
- ✅ Player rankings and ratings
- ✅ Course basics (when available)

**Available but Not Displayed**: ~15%
- Cut rule (in DB, not shown)
- FedEx/world ranking points (in DB, not shown)
- Cut line score (in DB, not shown)
- Course details (in DB, limited display)
- Historical results (in DB, not shown)
- Defending champion (needs query, not shown)

**Requires Additional Work**: ~10%
- Odds movement timeline (data exists, needs aggregation)
- Player projections enhancement (service exists, limited display)
- Field withdrawals prominence (data exists, minor display)

**Next Steps**: 
1. Add missing tournament detail fields to TournamentOverview
2. Display cut rule, FedEx points, world ranking points, cut line
3. Enhance course intelligence display
4. Add historical context layers
5. Ensure every panel has proper unavailable state with explanation
