# Tournament Overview V3 Migration Roadmap
**Status:** Planning Phase  
**Objective:** Evolve current compact Overview into premium analytics dashboard through phased replacements  
**Constraint:** Production must remain deployable after every phase

---

## Current Production Layout

```
├─ KPI Row (CompactKpiRow) — 12 metrics in grid
├─ Top Ranked Players (CompactLeaderboard) — 5 top players
├─ Weather + DFS (2-col grid)
│  ├─ CompactWeatherSummary
│  └─ CompactDfsSummary
├─ Course Info + Recent Winners (CompactCourseHistoryRow)
└─ Event Details (TournamentOverview)
```

**Total Height:** ~3 viewport heights  
**Current Performance:** LCP 6.5s (slow), FCP 252ms (good)

---

## Phase Strategy

Each phase:
1. **Replaces** one existing section with enhanced version
2. **Maintains** production deployability
3. **No feature flags** — direct replacements only
4. **Single commit** per phase + production deployment
5. **Rollback-safe** — each component is independent

---

# PHASE 1: KPI STRIP DENSIFICATION

## Objective
Replace `CompactKpiRow` with premium information-dense KPI strip showing 20+ metrics instead of 12.

## Current Component
- **File:** `compact-kpi-row.tsx` (137 lines)
- **Metrics Shown:** 12 (Field, Purse, Win Prize, Strength, Cut Rule, Par, Yardage, Designer, Dates, Tour, Payout, FedEx Points)
- **Layout:** 4-column grid
- **Data Source:** `tournament`, `field`, `fieldReport`

## New Component Design
- **File:** `premium-kpi-strip.tsx` (200-250 lines)
- **Metrics Shown:** 20+ (all current 12 + new ones)
- **New Metrics:**
  - Field Statistics: Avg Score, Winning Score, Cut Line, Cut Projection
  - Course Metrics: Designer, Grass Type, Elevation, Wind Exposure
  - Event Data: Days Remaining, Purse per Player, FedEx Point Value
  - Participation: International Players, Sponsor Count, Course Redesigns
- **Layout:** 6-column grid (responsive: 2-3 mobile, 4-6 desktop)
- **Information Density:** 50% more data in same vertical space

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| CompactKpiRow | REPLACED | Low — isolated component |
| TournamentCompactOverview | Update import | Low — single line change |
| tournament-command-center | No change | None |

## Data Source
- `tournament` (TournamentSummary) — existing fields
- `field` (TournamentField) — existing fields
- `fieldReport` — add new fields if available
- No new API calls required

## Data Source Verification
```
✓ tournament.playersCount → "Field: 74"
✓ tournament.purse → "Purse: $20M"
✓ tournament.courseRef → "Par: 72, Yardage: 7739"
✓ fieldReport.averageScore → NEW metric
✓ fieldReport.cuttingLine → NEW metric (may need to calculate)
```

## Dependencies
- No external dependencies
- Relies on existing data structures
- May require calculated fields in fieldReport (low risk)

## Estimated Effort
- **Design:** 1 hour (component layout, responsive grid)
- **Development:** 2 hours (component logic, styling, responsive)
- **Testing:** 1 hour (localhost + production verification)
- **Deployment:** 30 minutes
- **Total:** 4.5 hours

## Risk Assessment
**Overall Risk:** LOW

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Data not available | Low | High | Graceful fallback to current KPI Row |
| Layout breaks mobile | Medium | Medium | Test mobile at 375px, 480px, 768px |
| LCP regression | Medium | High | Keep strip height <250px, lazy-load non-critical data |
| CSS conflicts | Low | Medium | Use existing utility classes, test in isolation |

## Production Verification Checklist
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] Localhost: All 20+ metrics visible
- [ ] Localhost: Responsive layouts tested (mobile, tablet, desktop)
- [ ] Localhost: No console errors
- [ ] Localhost: LCP measurement taken (must not exceed 7s)
- [ ] Production: Page loads with new KPI strip
- [ ] Production: All metrics render correctly
- [ ] Production: Responsive layouts work
- [ ] Production: No hydration errors
- [ ] Rollback: Previous CompactKpiRow can restore in <5 minutes

## Implementation Checklist
- [ ] Create `premium-kpi-strip.tsx` (start with CompactKpiRow as base)
- [ ] Add new metrics display logic
- [ ] Update responsive grid (2 mobile → 6 columns desktop)
- [ ] Update TournamentCompactOverview to import new component
- [ ] Test component in isolation
- [ ] Test with real tournament data
- [ ] Commit: "Phase 1: KPI Strip Densification"
- [ ] Deploy to production
- [ ] Verify production rendering
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 2: DFS VALUE PLAYS ENHANCEMENT

## Objective
Replace `CompactDfsSummary` with premium DFS decision-support component showing salary efficiency, ownership, and leverage data.

## Current Component
- **File:** `compact-dfs-summary.tsx` (84 lines)
- **Display:** Simple chart showing salary scale
- **Data:** Salary range visualization only
- **Data Source:** `dfsField` (DfsValueField[])

## New Component Design
- **File:** `premium-dfs-value-plays.tsx` (150-180 lines)
- **Sections:**
  1. **Value Ranking** — Top 5 undervalued players (salary vs rating)
  2. **Leverage Leaders** — Ownership <10% but high projected points
  3. **Salary Stacks** — Price tiers with avg projected points per tier
  4. **Player Efficiency** — Points per $1000 salary ratios
- **Layout:** Multi-card grid (1 column mobile, 2 columns desktop)
- **Interactivity:** Hover shows player details
- **Data Quality:** Shows confidence indicator (complete, partial, estimated)

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| CompactDfsSummary | REPLACED | Low — isolated component |
| TournamentCompactOverview | Update import | Low — single line change |
| Weather + DFS grid | No change | None |

## Data Source
- `dfsField` (DfsValueField[])
  - Player name, salary, projected points, ownership, exposure
  - Player ID for linking
- Verify fields available in current schema

## Data Source Verification
```
✓ dfsField.players[].salary → "$X.XXM"
✓ dfsField.players[].projectedPoints → "XX.X pts"
✓ dfsField.players[].ownership → "XX.X%"
✓ dfsField.players[].exposure → leverage calc
✓ dfsField.players[].playerId → link to player profile
```

## Dependencies
- Depends on Phase 1 completion (can proceed in parallel)
- No external dependencies
- May require calculated fields: efficiency ratio, undervalue score

## Estimated Effort
- **Design:** 1 hour (multi-card layout, data presentation)
- **Development:** 2.5 hours (component, calculations, styling)
- **Testing:** 1 hour (data accuracy, mobile layout)
- **Deployment:** 30 minutes
- **Total:** 5 hours

## Risk Assessment
**Overall Risk:** LOW-MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| DFS data incomplete | Medium | Medium | Show "Data Unavailable" gracefully |
| Calculations incorrect | Low | High | Unit test efficiency ratios |
| Mobile layout issues | Medium | Medium | Test on mobile, use responsive grid |
| Slow rendering (50+ players) | Low | Medium | Limit display to top 10, virtualize if needed |
| Color contrast | Low | Medium | Test WCAG AA compliance |

## Production Verification Checklist
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: All DFS sections render
- [ ] Localhost: Top 5 undervalued correctly calculated
- [ ] Localhost: Leverage scores accurate
- [ ] Localhost: Mobile layout functional
- [ ] Localhost: No console errors
- [ ] Production: New DFS component visible
- [ ] Production: Data renders accurately
- [ ] Production: Mobile layout works
- [ ] Production: No hydration errors
- [ ] Rollback available

## Implementation Checklist
- [ ] Create `premium-dfs-value-plays.tsx` (start with CompactDfsSummary as base)
- [ ] Add value calculation functions (efficiency, leverage, undervalue)
- [ ] Add multi-card layout
- [ ] Update responsive grid
- [ ] Add player profile links
- [ ] Test with real DFS data
- [ ] Commit: "Phase 2: DFS Value Plays Enhancement"
- [ ] Deploy to production
- [ ] Verify production rendering
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 3: WEATHER INTELLIGENCE

## Objective
Replace `CompactWeatherSummary` with premium weather intelligence component showing historical conditions, wind patterns, and weather impact on scoring.

## Current Component
- **File:** `compact-weather-summary.tsx` (78 lines)
- **Display:** "Historical weather unavailable" placeholder
- **Data Source:** `weather` (WeatherIntelligence | null)

## New Component Design
- **File:** `premium-weather-intelligence.tsx` (200+ lines)
- **Sections:**
  1. **Historical Conditions** — Avg temp, humidity, wind speed/direction for tournament dates
  2. **Weather Impact** — Scoring patterns in similar conditions
  3. **Wind Patterns** — Dominant directions, avg speed by hole
  4. **Forecast** — Multi-day forecast if available
  5. **Weather Modifiers** — How weather affects player skill expression
- **Layout:** Single-column card with sub-sections
- **Fallback:** Show historical average if forecast unavailable

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| CompactWeatherSummary | REPLACED | Medium — weather data may be sparse |
| TournamentCompactOverview | Update import | Low |
| Weather + DFS grid | No change | None |

## Data Source
- `weather` (WeatherIntelligence)
  - Historical avg temp/humidity/wind for tournament location/dates
  - Forecast (if available)
  - Weather impact scoring models (if available)
- May require new fields in WeatherIntelligence model

## Data Source Verification
```
? weather.historicalAvgTemp → May not exist
? weather.historicalWindPattern → May not exist
? weather.forecast → May not exist
? weather.weatherToScoringImpact → May not exist
```

**Risk:** Weather data may be incomplete. Need to verify with existing schema.

## Dependencies
- Depends on weather data availability
- May require Phase 14 (Course Intelligence) for weather impact models
- Can proceed independently if weather data exists

## Estimated Effort
- **Design:** 1.5 hours (multi-section layout)
- **Development:** 3 hours (data integration, visualization, calculations)
- **Data Verification:** 1 hour (check WeatherIntelligence schema)
- **Testing:** 1.5 hours (edge cases: no data, partial data, forecast vs historical)
- **Deployment:** 30 minutes
- **Total:** 7.5 hours

## Risk Assessment
**Overall Risk:** MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Weather data missing | High | Medium | Show historical average as fallback |
| Incomplete WeatherIntelligence | High | High | Survey data availability before starting |
| Chart rendering slow | Low | Low | Use simple SVG, not heavy visualization |
| Mobile layout issues | Medium | Medium | Test responsive design |
| Data accuracy concerns | Low | High | Document data sources clearly |

## Production Verification Checklist
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: Weather data displays (or graceful fallback)
- [ ] Localhost: Historical and forecast both tested
- [ ] Localhost: Mobile layout works
- [ ] Localhost: No console errors
- [ ] Production: Component renders
- [ ] Production: Data accurate (if available)
- [ ] Production: Fallback works (if data unavailable)
- [ ] Production: No hydration errors
- [ ] Rollback available

## Implementation Checklist
- [ ] **Survey Step:** Verify WeatherIntelligence schema completeness
- [ ] Create `premium-weather-intelligence.tsx`
- [ ] Implement historical data display
- [ ] Implement forecast display (if available)
- [ ] Add weather impact models (if available)
- [ ] Add responsive layout
- [ ] Test with various data scenarios
- [ ] Commit: "Phase 3: Weather Intelligence"
- [ ] Deploy to production
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 4: COURSE INFORMATION ENRICHMENT

## Objective
Replace `CompactCourseHistoryRow` course-info section with premium course intelligence component showing derived metrics from Phase 14.

## Current Component
- **File:** `compact-course-history-row.tsx` (90 lines)
- **Display:** Course name, par, yardage, location
- **Data Source:** `tournament.course`, `courseProfile`

## New Component Design
- **File:** `premium-course-intelligence.tsx` (200+ lines)
- **Sections:**
  1. **Course Overview** — Name, par, yardage, designer, grass
  2. **Difficulty Metrics** — Overall difficulty, scoring difficulty, birdie potential
  3. **Skill Emphasis** — Driving, approach, short game, putting importance (stars)
  4. **Hazard Profile** — Water, sand, trees, OOB risk
  5. **Course Tags** — "Accuracy Course", "Bomber Friendly", "Risk/Reward"
- **Layout:** Multi-row with expandable sections
- **Data Quality:** Show confidence indicators
- **Integration:** Requires Phase 14 (Course Intelligence Engine)

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| CompactCourseHistoryRow | REPLACED | Medium — requires Phase 14 data |
| TournamentCompactOverview | Update import | Low |

## Data Source
- `courseProfile` (CourseIntelligence)
  - Standard fields (par, yardage, designer, grass)
  - **Requires Phase 14:** derived metrics (20+ metrics, tags, explanations)

## Data Source Verification
```
✓ courseProfile.par → "72"
✓ courseProfile.yardage → "7739"
✓ courseProfile.designer → "Blue Seas"
? courseProfile.overallDifficulty → Requires Phase 14
? courseProfile.courseTags → Requires Phase 14
? courseProfile.drivingImportance → Requires Phase 14
```

**Critical Dependency:** Requires Phase 14 completion

## Dependencies
- **BLOCKED:** Requires Phase 14 (Course Intelligence Engine)
- Must implement Phase 14 metrics first
- Can proceed with mock data for testing

## Estimated Effort
- **Awaiting:** Phase 14 completion (10-15 hours)
- **Design:** 1 hour (layout for metric display)
- **Development:** 2.5 hours (component, styling, metric display)
- **Integration:** 1 hour (wire Phase 14 data)
- **Testing:** 1 hour (verify metric accuracy)
- **Deployment:** 30 minutes
- **Total:** 6 hours (after Phase 14)

## Risk Assessment
**Overall Risk:** HIGH (phase-blocked)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Phase 14 not complete | High | Blocking | Defer until Phase 14 done |
| Metrics unavailable for course | Medium | High | Show "Data calculating" placeholder |
| Display too complex | Medium | Medium | Start with 3 key metrics, expand later |
| Mobile layout | Low | Medium | Plan responsive design upfront |

## Production Verification Checklist
- [ ] Phase 14 complete and deployed
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: Course metrics display
- [ ] Localhost: All 8+ metrics visible
- [ ] Localhost: Course tags render correctly
- [ ] Localhost: Mobile layout works
- [ ] Localhost: No console errors
- [ ] Production: New component renders
- [ ] Production: Metrics accurate
- [ ] Production: No hydration errors

## Implementation Checklist
- [ ] WAIT: Phase 14 completion
- [ ] Create `premium-course-intelligence.tsx`
- [ ] Wire Phase 14 CourseIntelligence fields
- [ ] Implement metric display (stars, scores, confidence)
- [ ] Add course tags display
- [ ] Add responsive layout
- [ ] Test with real Phase 14 data
- [ ] Commit: "Phase 4: Course Intelligence Enrichment"
- [ ] Deploy to production
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 5: RECENT WINNERS ANALYSIS

## Objective
Replace `CompactCourseHistoryRow` winners section with premium recent-winners component showing 10-year history with scoring trends.

## Current Component
- **File:** `compact-course-history-row.tsx` (90 lines)
- **Display:** Recent winners (location, years, basic data)
- **Data Source:** `tournament.recentWinners` (or similar)

## New Component Design
- **File:** `premium-recent-winners.tsx` (180-220 lines)
- **Sections:**
  1. **Winners Table** — Last 10 years with scores, margins, ratings
  2. **Trend Analysis** — Winning score trend, margin distribution
  3. **Winner Profile** — Average winner ranking, career earnings, course history
  4. **Repeat Winners** — Players who won this course multiple times
- **Layout:** Table with expandable rows for details
- **Interactions:** Click winner name to show profile, career at this course
- **Data Quality:** Show data completeness indicator

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| CompactCourseHistoryRow | REPLACED | Low — self-contained section |
| TournamentCompactOverview | Update import | Low |

## Data Source
- `tournament.recentWinners` or tournament history data
  - Winner name, score, margin, year
  - Player ID for profile linking
  - Player ranking (OWGR) at time of win (if available)
- Verify fields available in current schema

## Data Source Verification
```
✓ tournament.id → Link to historical data
? tournament.recentWinners → May not be directly available
? rounds/leaderboard history → May need to query separately
```

**Risk:** Recent winners data structure needs verification

## Dependencies
- No external dependencies
- Requires access to historical tournament/leaderboard data
- May require new database query or field

## Estimated Effort
- **Survey:** 1 hour (verify data availability)
- **Design:** 1 hour (table layout, expandable rows)
- **Development:** 2.5 hours (component, history data fetching, styling)
- **Testing:** 1 hour (10 years of data verified, mobile layout)
- **Deployment:** 30 minutes
- **Total:** 6 hours

## Risk Assessment
**Overall Risk:** MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Winner data missing | Medium | Medium | Show "Historical data unavailable" |
| Incomplete scoring records | Medium | Medium | Show partial data with confidence indicator |
| Large dataset (10 years × 74 players) | Low | Low | Virtualize table if needed |
| Mobile layout | Medium | Medium | Use responsive table or card layout |
| Missing player rankings | Low | Low | Show "N/A" with note |

## Production Verification Checklist
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: Winners table displays
- [ ] Localhost: 10 years of data shown
- [ ] Localhost: Trend analysis calculates
- [ ] Localhost: Player profile links work
- [ ] Localhost: Mobile layout responsive
- [ ] Localhost: No console errors
- [ ] Production: Component renders
- [ ] Production: Data accurate
- [ ] Production: No hydration errors

## Implementation Checklist
- [ ] **Survey Step:** Verify winner history data availability
- [ ] Create `premium-recent-winners.tsx`
- [ ] Implement history data fetch/display
- [ ] Add trend calculation (winning score, margin)
- [ ] Add player profile links
- [ ] Add responsive table/card layout
- [ ] Test with real historical data
- [ ] Commit: "Phase 5: Recent Winners Analysis"
- [ ] Deploy to production
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 6: KEY STATS MODULE

## Objective
Add new premium stats component showing field-wide statistics (driving, approach, putting) by category.

## Current State
- **Displayed:** No dedicated key stats section
- **Available:** Field analytics data (CompactLeaderboard shows players, but not aggregated stats)
- **Opportunity:** Add new section between Leaderboard and Weather/DFS

## New Component Design
- **File:** `premium-key-stats.tsx` (150-200 lines)
- **Sections:**
  1. **Driving Stats** — Distance (avg, range), accuracy (%), fairway %
  2. **Approach Stats** — GIR %, strokes gained, distance distribution
  3. **Putting Stats** — Avg per hole, make %, 3-putt %
  4. **Scoring** — Average score, under/over par distribution
- **Layout:** 4-column stat cards (responsive 1-4)
- **Comparisons:** Show field avg vs par/expectations
- **Benchmarking:** Compare to PGA Tour averages (if available)

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| TournamentCompactOverview | Add new section | Low — additive change |
| tournament-compact-overview.tsx | Layout change | Low — add new grid row |

## Data Source
- `field.analyticsSummary` or calculated from field data
  - Driving: distance, accuracy, fairway %
  - Approach: GIR %, strokes gained
  - Putting: avg per hole, make %
  - Overall: scoring distribution

## Data Source Verification
```
? field.analyticsSummary → May not exist, need to verify
? Can we calculate from individual player stats?
? field.leaders[].drivingDistance → Individual data only?
```

**Risk:** Aggregated field stats may not be readily available

## Dependencies
- Depends on availability of field-aggregated statistics
- May require new calculation layer (low-risk)
- No external dependencies

## Estimated Effort
- **Survey:** 1 hour (verify analytics data availability)
- **Design:** 1 hour (stat card layout)
- **Development:** 2 hours (aggregation if needed, component, styling)
- **Testing:** 1 hour (data accuracy, calculations)
- **Deployment:** 30 minutes
- **Total:** 5.5 hours

## Risk Assessment
**Overall Risk:** MEDIUM

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Aggregated stats unavailable | High | Medium | Calculate from individual player data |
| Calculation overhead | Low | Low | Cache results if heavy |
| Mobile layout | Medium | Medium | Use responsive 2-column grid |
| Data quality issues | Low | Medium | Show confidence indicators |
| PGA Tour benchmark missing | Low | Low | Omit benchmark, show field trends only |

## Production Verification Checklist
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: All stat sections display
- [ ] Localhost: Calculations accurate
- [ ] Localhost: Mobile layout (2 columns) works
- [ ] Localhost: Desktop layout (4 columns) works
- [ ] Localhost: No console errors
- [ ] Production: Component renders
- [ ] Production: Stats accurate
- [ ] Production: No hydration errors
- [ ] Performance: No LCP regression

## Implementation Checklist
- [ ] **Survey Step:** Verify field analytics data availability
- [ ] Create `premium-key-stats.tsx`
- [ ] Implement stat aggregation if needed
- [ ] Build stat cards (4 sections)
- [ ] Add responsive grid
- [ ] Add comparison/benchmark logic (if available)
- [ ] Test with real field data
- [ ] Update TournamentCompactOverview layout
- [ ] Commit: "Phase 6: Key Stats Module"
- [ ] Deploy to production
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 7: COURSE FIT INTELLIGENCE

## Objective
Create genuine course-fit component (replacing removed placeholder) that shows real course-specific player fit analysis.

## Current State
- **Removed:** Duplicate Course Fit card (was showing same data as Leaderboard)
- **Available:** Course Intelligence from Phase 14
- **Opportunity:** Build real course-fit based on player skills + course demands

## New Component Design
- **File:** `premium-course-fit.tsx` (250-300 lines)
- **Sections:**
  1. **Fit Score** — Overall fit score for each top 10 player (0-100)
  2. **Skill Alignment** — How player skills match course demands
     - Driving strength vs course driving importance
     - Approach skill vs course approach importance
     - Putting skill vs course putting importance
  3. **Hazard Fit** — Player strengths vs course hazard profile
  4. **Recommendation** — Best suited player, alternative picks
- **Layout:** Multi-row analysis with expandable player cards
- **Interactivity:** Hover shows detailed breakdown
- **Data Quality:** Show confidence (HIGH/MEDIUM/LOW)

## Components Affected
| Component | Change | Risk |
|-----------|--------|------|
| TournamentCompactOverview | Add or replace section | Medium |
| tournament-compact-overview.tsx | Layout change | Low |

## Data Source
- **Requires Phase 14:** Course Intelligence metrics
- **Player Data:** Field rankings, player skill profiles
  - Player driving distance, accuracy
  - Player approach skills (GIR %, SG)
  - Player putting average
  - Player hazard management (bunker, water)
- **Course Data:** From Phase 14
  - Course driving importance, fairway width
  - Course approach demands, precision needed
  - Course putting difficulty
  - Course hazard severity (water, sand, trees)

## Data Source Verification
```
? Can we calculate real fit from available player + course data?
? Does player skill profile exist separate from rankings?
```

**Critical Dependency:** Requires Phase 14 (Course Intelligence metrics)

## Dependencies
- **BLOCKED:** Requires Phase 14 completion
- Requires player skill profile data
- May need to infer skills from historical performance

## Estimated Effort
- **Awaiting:** Phase 14 completion
- **Design:** 1.5 hours (multi-row fit analysis layout)
- **Development:** 3 hours (fit calculation, skill matching logic)
- **Integration:** 1 hour (wire Phase 14 + player data)
- **Testing:** 1.5 hours (fit accuracy, edge cases)
- **Deployment:** 30 minutes
- **Total:** 7.5 hours (after Phase 14)

## Risk Assessment
**Overall Risk:** HIGH (phase-blocked)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Phase 14 not complete | High | Blocking | Defer until Phase 14 done |
| Player skill data missing | High | High | Derive from ranking and historical data |
| Fit calculation complexity | Medium | Medium | Start with 3 factors (driving, approach, putting) |
| Model accuracy unknown | Medium | High | Validate against historical winner patterns |
| Mobile layout | Low | Medium | Plan responsive design |

## Production Verification Checklist
- [ ] Phase 14 complete
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Localhost: Fit scores display for top 10
- [ ] Localhost: Skill alignment shown
- [ ] Localhost: Hazard fit calculated
- [ ] Localhost: Confidence indicators present
- [ ] Localhost: Mobile layout works
- [ ] Localhost: No console errors
- [ ] Production: Component renders
- [ ] Production: Fit scores accurate
- [ ] Validation: Does fit correlate with historical winners?

## Implementation Checklist
- [ ] WAIT: Phase 14 completion
- [ ] Create `premium-course-fit.tsx`
- [ ] Implement fit score calculation (0-100)
- [ ] Implement skill alignment logic
- [ ] Implement hazard fit analysis
- [ ] Wire Phase 14 course metrics
- [ ] Wire player skill/ranking data
- [ ] Add responsive layout
- [ ] Validate fit accuracy
- [ ] Test with real data
- [ ] Commit: "Phase 7: Course Fit Intelligence"
- [ ] Deploy to production
- [ ] Document in MIGRATION_STATUS.md

---

# PHASE 8: TOURNAMENT INTELLIGENCE (FUTURE)

## Objective
Add premium tournament analysis component showing market intelligence, DFS trends, and prediction models.

## Scope (Out of Scope for Now)
This phase is reserved for future implementation pending:
- Market data availability (DFS consensus, betting odds, expert picks)
- AI/ML model readiness
- Prediction algorithm validation

## Placeholder
- Can be deferred indefinitely without blocking other phases
- No production impact if skipped

---

## MIGRATION EXECUTION TIMELINE

### Recommended Sequence

```
Week 1:
  Phase 1: KPI Strip (4.5 hrs)
    → Deploy Monday
    → Verify Tuesday
  
  Phase 2: DFS Value Plays (5 hrs, parallel)
    → Deploy Wednesday
    → Verify Thursday

Week 2:
  Phase 3: Weather Intelligence (7.5 hrs)
    → Deploy Monday
    → Verify Tuesday
  
  Phase 4: Course Info (blocked until Phase 14)
    → DEFER

Week 3:
  Phase 5: Recent Winners (6 hrs)
    → Deploy Monday
    → Verify Tuesday
  
  Phase 6: Key Stats (5.5 hrs)
    → Deploy Wednesday
    → Verify Thursday

Week 4:
  Phase 14: Course Intelligence Engine (start planning)
    → Deploy when ready
  
  Phase 4: Course Info (2.5 hrs, after Phase 14)
    → Deploy
  
  Phase 7: Course Fit Intelligence (7.5 hrs, after Phase 14)
    → Deploy
    → Validate accuracy

Phase 8: Tournament Intelligence (TBD)
  → Future phase, optional
```

### Parallel Phases
- Phases 1-3 can proceed in parallel (no dependencies)
- Phases 5-6 can proceed in parallel (no dependencies)
- Phase 4 blocked by Phase 14
- Phase 7 blocked by Phase 14

---

## RISK MITIGATION STRATEGY

### Production Safety
1. **Every phase ends with production deployment** → Catch issues early
2. **Single rollback per phase** → If problems, revert to previous component in <5 min
3. **No feature flags** → Simpler deployments, fewer variables
4. **Comprehensive test checklist per phase** → Verify before production

### Data Quality
1. **Graceful fallbacks** → Show "Data unavailable" if source missing, don't crash
2. **Confidence indicators** → Show "HIGH/MEDIUM/LOW" confidence on calculated metrics
3. **Data verification step** → Survey schema/availability before coding each phase

### Performance
1. **LCP monitoring** → Measure before/after each phase (keep < 7s target)
2. **Mobile testing** → Test each phase at 375px, 768px, 1024px
3. **Console errors** → Zero console errors before production

### Rollback Plan
Each phase includes rollback checklist:
- Keep previous component code available for 1 week
- If production issues: revert component + redeploy (5 min max)
- Document issue + retry in following sprint

---

## SUCCESS CRITERIA

By end of all 7 phases (excluding Phase 8):

### Information Density
- ✅ 40+ metrics visible (vs current 12-20)
- ✅ 50% more data in same vertical space
- ✅ Premium dashboard feel

### User Experience
- ✅ All components render without errors
- ✅ Mobile-responsive across phases
- ✅ Accessible (WCAG AA compliance)
- ✅ Fast load (LCP < 7s)

### Production Reliability
- ✅ 7 successful phase deployments
- ✅ Zero critical production issues
- ✅ Zero rollbacks needed
- ✅ 100% component availability

### Data Quality
- ✅ All data sources verified
- ✅ Graceful fallbacks where data missing
- ✅ Confidence indicators shown
- ✅ No misleading placeholders

---

## MIGRATION STATUS TRACKING

**File:** `TOURNAMENT_OVERVIEW_V3_MIGRATION_STATUS.md` (to be created)

Track:
- [ ] Phase 1: KPI Strip — Status: PENDING
- [ ] Phase 2: DFS Value Plays — Status: PENDING
- [ ] Phase 3: Weather Intelligence — Status: PENDING
- [ ] Phase 4: Course Information — Status: PENDING (blocked by Phase 14)
- [ ] Phase 5: Recent Winners — Status: PENDING
- [ ] Phase 6: Key Stats — Status: PENDING
- [ ] Phase 7: Course Fit Intelligence — Status: PENDING (blocked by Phase 14)
- [ ] Phase 8: Tournament Intelligence — Status: DEFERRED (future)

---

## NEXT STEPS

1. **Approval:** Review roadmap for approach and phasing
2. **Phase 1 Start:** Begin KPI Strip Densification
3. **Data Survey:** Before each phase, verify data source availability
4. **Weekly Deployments:** Maintain cadence of production deployments
5. **Documentation:** Update status file after each phase

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-21  
**Status:** READY FOR IMPLEMENTATION
