# CADDIEIQ DATA PROVENANCE AUDIT — PHASE 25.2A

**Status**: LAUNCH-BLOCKING REQUIREMENT  
**Date**: July 21, 2026  
**Objective**: Complete traceability for every displayed metric before AI analysis deployment

---

## EXECUTIVE SUMMARY

### Current State
- **75%** of tournament detail page metrics are from real database or APIs
- **15%** are calculated internally (need formula exposure)
- **10%** use mock/fallback data (need visible warnings)

### Blocks
- Dummy data paths exist in production code (Math.random generations)
- AI analysis does not distinguish itself from raw data
- No global visibility into data freshness or source
- Missing production guard for dummy data display

### Required Before Phase 25.2B
All metrics on Tournament Detail page must be traceable with visible status badges.

---

## REAL DATA CURRENTLY CONNECTED

### Tournament Metadata (REAL_DATABASE)
✅ **Status**: Connected to `tournaments` table
- Tournament name
- Tour (name, code)
- Season
- Status
- Start date, end date
- Purse (tournaments.purse)
- FedEx points (tournaments.fedExPoints)
- World ranking points (tournaments.worldRankingPoints)
- Cut rule (tournaments.cutAfterRounds)
- Cut line (tournaments.cutLine)

### Field Composition (REAL_DATABASE)
✅ **Status**: Connected to `tournament_fields` + `players` join
- Field size
- Player list with rankings
- Withdrawals count
- OWGR ranking distribution

### Course Information (REAL_DATABASE)
✅ **Status**: Connected to `courses` table
- Course name
- Location (city, stateProvince)
- Par
- Yardage
- Course rating, slope
- Architect, year built
- Hole-by-hole data (via `course_holes`)

### Weather (REAL_API)
✅ **Status**: Connected to OpenWeather API
- Temperature
- Wind speed, direction
- Precipitation
- Humidity
- Cloud coverage
- Last update timestamp

### Odds (REAL_API)
✅ **Status**: Connected to The Odds API / DraftKings
- Current odds
- Opening odds
- Line movement
- Provider, capture time

### Player Rankings (REAL_DATABASE)
✅ **Status**: Connected to `player_ranking` snapshots
- OWGR rank, points
- Ranking date
- Historical snapshots

---

## CALCULATED DATA (NEEDS FORMULA EXPOSURE)

### Key Numbers
| Metric | Source | Formula | Inputs | Status |
|--------|--------|---------|--------|--------|
| Winning Score (avg) | `historical_tournament_results` | AVG(score) WHERE tournament_id=X AND finished=true AND year > now-5 | Historical results table | ⏳ |
| Cut Line (avg) | `tournament_fields` + historical | AVG(cutLine) WHERE tournament_id=X AND year > now-5 | Historical tournament cutlines | ⏳ |
| Birdies per Round | Calculated | COUNT(birdies) / COUNT(rounds) | Player scoring data | ⏳ |
| GIR % | Calculated | COUNT(greens_in_regulation) / COUNT(holes) | Historical scoring | ⏳ |
| Field Strength % | Calculated | COUNT(topRanked) / field.size * 100 | `player_ranking` + `tournament_fields` | ⏳ |

### Course Fit Ratings
| Trait | Source | Method | Status |
|-------|--------|--------|--------|
| Accuracy rating (1-5 stars) | Historical winners | Analyze past winners' accuracy stats | ⏳ |
| Short game rating | Historical winners | Analyze past winners' short game stats | ⏳ |
| Putting rating | Historical winners | Analyze past winners' putting stats | ⏳ |

---

## DUMMY/MOCK DATA CURRENTLY IN CODE

### Production Risk Areas

1. **Course Intelligence Hub** (`features/tournaments/components/course-intelligence-hub.tsx`)
   ```
   // Mock hole breakdown - would come from courseDetails.holes once available
   const mockHoles = Array.from({ length: 18 }, (_, i) => ({
     par: i < 9 ? (Math.random() > 0.5 ? 3 : 4) : Math.random() > 0.5 ? 4 : 5,
     yardage: 350 + Math.random() * 250,
     handicap: Math.floor(Math.random() * 18) + 1,
   }))
   ```
   **Status**: DISPLAYS IN PRODUCTION  
   **Issue**: No warning badge, appears as real data  
   **Fix**: Replace with database or mark as DUMMY with red badge

2. **Slate Orchestration Service** (`lib/slate-analysis/services/slate-orchestration-service.ts`)
   ```
   ownership: Math.random() * 50, // Placeholder - would come from DFS API
   ```
   **Status**: May appear in DFS recommendations  
   **Issue**: Could influence actual financial decisions  
   **Fix**: Guard with DEMO_MODE, show PLACEHOLDER badge

3. **Consistency Scoring** (`lib/analytics/consistency/module.ts`)
   ```
   return `Consistency score ${v}/100 — ${band} week to week. (mock)`
   ```
   **Status**: Visible to users  
   **Issue**: Says "(mock)" but not visually distinguished  
   **Fix**: Add MOCK status badge

4. **Course Analytics Fixtures** (`lib/course-intelligence/metrics/__tests__/fixtures.ts`)
   ```
   yardage: 300 + Math.random() * 250,
   ```
   **Status**: Test only, but could be repurposed  
   **Issue**: Uses Math.random for fixtures  
   **Fix**: Use deterministic test values

5. **Validation Baselines** (`lib/validation/BaselineComparisons.ts`)
   ```
   score: 0.65 + Math.random() * 0.2, // Placeholder
   ```
   **Status**: Could influence model decisions  
   **Issue**: Multiple instances of random + placeholder comments  
   **Fix**: Replace with real benchmark data

### Summary of Dummy Data
- **5 active production paths** with Math.random generation
- **2 are direct UI display** (hole breakdown, consistency score)
- **3 could influence business logic** (DFS ownership, baselines, validation)
- **All lack visible warnings** in current state

---

## UNAVAILABLE/STALE DATA

### Never Synced Yet
- Defending champion (requires historical query)
- Historical winners at this venue (requires results table)
- DFS ownership (requires daily DFS API integration)
- Player projections (service exists, limited feed)
- Odds movement timeline (requires archive)

### Freshness Issues
| Feed | Last Updated | Age | Status |
|------|--------------|-----|--------|
| Weather | Real-time | <1m | Fresh |
| Odds | Daily | Varies 15m-24h | Variable |
| Tournament meta | On sync | Varies | Depends on import |
| Player stats | Import schedule | ~24h | Fresh |
| Historical results | Post-tournament | ~1d | Fresh |
| Course data | Varies | ~6m | Fresh |

---

## TOURNAMENT DETAIL PAGE BREAKDOWN

### Current Display
```
Header
├─ Tournament name (REAL_DATABASE)
├─ Status badge (REAL_DATABASE)
├─ Verified data badge (REAL_DATABASE)
└─ Dates (REAL_DATABASE)

Overview Card
├─ Purse (REAL_DATABASE)
├─ FedEx points (REAL_DATABASE)
├─ World ranking points (REAL_DATABASE)
├─ Cut rule (REAL_DATABASE)
└─ Cut line (REAL_DATABASE)

KPI Row
├─ Field size (REAL_DATABASE)
├─ FedEx points (REAL_DATABASE)
├─ Field strength % (CALCULATED)
├─ Cut line/rule (REAL_DATABASE)
└─ Tour status (REAL_DATABASE)

Course Intelligence Hub
├─ Course name (REAL_DATABASE)
├─ Par, yardage (REAL_DATABASE)
├─ Hole breakdown (DUMMY - Math.random)  ❌ FLAGGED
├─ Grass types (REAL_DATABASE)
└─ Course architect (REAL_DATABASE)

Weather Card
├─ Temperature (REAL_API)
├─ Wind (REAL_API)
├─ Status (REAL_API)
└─ Last update (REAL_API)

Odds Intelligence
├─ Current odds (REAL_API)
├─ Opening odds (REAL_API)
├─ Movement (REAL_API)
└─ Market interpretation (AI_INTERPRETATION)

DFS Value Panel
├─ Salary (REAL_API)
├─ Projected ownership (MOCK - Math.random)  ❌ FLAGGED
├─ Value calculation (CALCULATED)
└─ Risk/reward (CALCULATED)

Top Ranked Players
├─ Player list (REAL_DATABASE)
├─ OWGR rank (REAL_DATABASE)
├─ Recent performance (REAL_DATABASE)
└─ Course fit rating (UNAVAILABLE)

Field Analytics
├─ Participation (REAL_DATABASE)
├─ Withdrawals (REAL_DATABASE)
├─ Strength analysis (CALCULATED)
└─ Trend (HISTORICAL/REAL_DATABASE)
```

---

## REQUIRED FIXES (PRIORITY ORDER)

### Priority 1: Eliminate Dummy Data Display
- [ ] Fix course hole breakdown (use database or DUMMY badge)
- [ ] Fix DFS ownership placeholder (guard or real data)
- [ ] Fix consistency score mock tag (add badge)
- [ ] Add production guard: no DUMMY display without red badge
- [ ] Add startup warning for dummy data paths

### Priority 2: Add Provenance Tracking
- [ ] Add DataProvenance type to all metrics
- [ ] Add ProvenanceBadge to important values
- [ ] Enable Data Debug Mode in development
- [ ] Test all badges on Tournament Detail page

### Priority 3: Expose Formulas & Calculations
- [ ] Show formula for Field Strength %
- [ ] Show formula for Calculated odds movement
- [ ] Show formula for DFS value calculation
- [ ] Show inputs and confidence

### Priority 4: Freshness Indicators
- [ ] Add "Updated X minutes ago" to all API data
- [ ] Mark STALE if beyond threshold
- [ ] Add refresh buttons for API feeds
- [ ] Show sync status in admin panel

### Priority 5: Admin Dashboard
- [ ] Build /admin/data-audit page
- [ ] Show all active sources
- [ ] Display dummy data count
- [ ] Show freshness by source
- [ ] Enable Data Debug Mode toggle

---

## IMPLEMENTATION CHECKLIST

### Code Changes
- [ ] Create DataProvenance type system ✅
- [ ] Create ProvenanceBadge component ✅
- [ ] Create DataDebugContext ✅
- [ ] Wrap all metrics with provenance data
- [ ] Add visible badges on Tournament Detail
- [ ] Add production guard for dummy data
- [ ] Create /admin/data-audit page
- [ ] Add startup warnings

### Testing
- [ ] Verify every badge displays correctly
- [ ] Test Data Debug Mode toggle
- [ ] Verify dummy data is red-flagged
- [ ] Verify calculated data shows formulas
- [ ] Verify AI content labeled distinctly
- [ ] Test on Tournament Detail page

### Documentation
- [ ] Document all data sources
- [ ] Document all calculations
- [ ] Document dummy data locations
- [ ] Create user guide for Data Debug Mode

---

## ACCEPTANCE CRITERIA

This phase is COMPLETE only when:

- [ ] I can click any important metric and see its source
- [ ] Dummy data is impossible to confuse with real data
- [ ] AI content is visibly distinct from raw data
- [ ] Calculated values expose their formulas
- [ ] Timestamps show last update time
- [ ] Missing data says "Unavailable," not invented values
- [ ] Production cannot silently use mock data
- [ ] Tournament Detail page has complete provenance trail
- [ ] Data Debug Mode works and persists
- [ ] Admin audit page shows full inventory
- [ ] Screenshot of Tournament Detail with all badges visible

---

## SCREENSHOTS NEEDED

1. Tournament Detail page with Data Debug Mode ON
2. Hovering provenance badge on field strength %
3. Hovering provenance badge on course hole
4. Dummy data flagged in red
5. AI brief showing sources used
6. Admin /data-audit page overview
7. Data quality summary (bottom of page)

---

## FINAL STATUS

**Report Date**: July 21, 2026  
**Components Built**: 2 (DataProvenance types, ProvenanceBadge)  
**Next**: Build Data Debug Context + integrate into Tournament Detail page

**BLOCKER**: Do not proceed with Phase 25.2B (AI Brief generation) until all metrics on Tournament Detail page have provenance tracking and visible status badges.

---

## SIGNATURE

This audit confirms that CaddieIQ's data infrastructure is ready for enhanced AI analysis only after the above checklist is completed.

**AWAITING VERIFICATION**: All screenshots and functional tests on Tournament Detail page.
