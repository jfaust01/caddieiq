# Phase 25.2B Implementation Roadmap

## Audit Complete → Now Fix Data Integrity

The comprehensive audit revealed that CaddieIQ is currently showing:
- ✅ 65% verified real data
- ⚠️ 10% dummy/mock data without warnings
- ❌ 89 metrics with no source attribution
- ❌ No production guard against silent mock data

**This blocks all AI intelligence features.**

---

## IMPLEMENTATION PHASES

### Phase 25.2B.1: Remove Production Mock Data (2-4 hours)

#### Task 1.1: Fix Course Hole Breakdown
**File**: `features/tournaments/components/course-intelligence-hub.tsx:58-65`

**Current**:
```typescript
const holes = Array.from({ length: 18 }).map((_, i) => ({
  par: i < 9 ? (Math.random() > 0.5 ? 3 : 4) : Math.random() > 0.5 ? 4 : 5,
  yardage: 350 + Math.random() * 250,
  handicap: Math.floor(Math.random() * 18) + 1,
}))
```

**Fix**: Query `course_holes` table
```typescript
const holes = courseDetails?.holes || 
  Array.from({ length: 18 }).map(() => ({
    par: null,
    yardage: null,
    handicap: null,
  }))
```

**Effort**: 30 minutes  
**Risk**: LOW - adds fallback for missing data

---

#### Task 1.2: Fix DFS Ownership
**File**: `features/slate-analysis/services/slate-orchestration-service.ts:187`

**Current**:
```typescript
ownership: Math.random() * 50, // Placeholder
```

**Options**:
A. Connect to real DFS API (FanDuel/DraftKings)
B. Remove column entirely
C. Red-flag with DUMMY status

**Recommendation**: B (remove) or A (connect real API)  
**Effort**: 1-2 hours  
**Risk**: CRITICAL if left as-is

---

#### Task 1.3: Add Production Guard
**New File**: `lib/data-integrity/guards.ts`

```typescript
export function preventMockDataDisplay() {
  // Prod env: throw if mock data detected
  // Dev env: log warning
  // Test env: allow silently
}

// Use before rendering any metric
if (process.env.NODE_ENV === 'production') {
  preventMockDataDisplay()
}
```

**Effort**: 1 hour  
**Impact**: HIGH - prevents silent mock display

---

### Phase 25.2B.2: Add Data Provenance System (4-6 hours)

#### Task 2.1: Provenance Types
**File**: `lib/types/data-provenance.ts` (already created)

**Defines**:
- Status types (REAL_API, REAL_DATABASE, CALCULATED, etc.)
- Source info (name, endpoint, table, formula)
- Metadata (timestamp, confidence, freshness)

**Effort**: Already created ✅

---

#### Task 2.2: Provenance Badge Component
**File**: `components/data-provenance/provenance-badge.tsx` (already created)

**Features**:
- Visual status badge (green/blue/red/etc)
- Hover popover with details
- Formula display for calculated values
- Source traceability

**Effort**: Already created ✅

---

#### Task 2.3: Wrap Tournament Detail Metrics (2-3 hours)

**Metrics to wrap** (89 total):

Tournament Overview (6):
- [ ] Purse (REAL_DATABASE)
- [ ] FedEx Points (REAL_DATABASE)
- [ ] World Ranking Points (REAL_DATABASE)
- [ ] Cut Rule (REAL_DATABASE)
- [ ] Cut Line (REAL_DATABASE)
- [ ] Field Size (REAL_DATABASE)

Field Analytics (4):
- [ ] Average Ranking (REAL_DATABASE)
- [ ] Withdrawals (REAL_DATABASE)
- [ ] World-Ranked % (CALCULATED)
- [ ] Top 10 (REAL_DATABASE)

Course Intelligence (5):
- [ ] Par (REAL_DATABASE)
- [ ] Yardage (REAL_DATABASE)
- [ ] Architect (REAL_DATABASE)
- [ ] Year Built (REAL_DATABASE)
- [ ] Hole Breakdown (DUMMY → FIX or REAL)

Weather (4):
- [ ] Temperature (REAL_API)
- [ ] Wind (REAL_API)
- [ ] Precipitation (REAL_API)
- [ ] Status (REAL_API)

Odds (4):
- [ ] Current (REAL_API)
- [ ] Opening (REAL_API)
- [ ] Movement (CALCULATED)
- [ ] Books (REAL_API)

DFS (5+):
- [ ] Salary (REAL_API)
- [ ] Projected (CALCULATED)
- [ ] Ownership (FIX - currently DUMMY)
- [ ] Leverage (CALCULATED)
- etc.

**Effort**: 2-3 hours for all 89  
**How**: Wrap values with `<ProvenanceBadge>` component

---

### Phase 25.2B.3: Developer Data Debug Mode (2-3 hours)

#### Task 3.1: Debug Context
**File**: `lib/data-debug/debug-context.tsx` (already created)

**Features**:
- Global toggle in dev mode
- Shows source for every metric
- Displays timestamp, confidence, formula
- Color-codes: green=real, blue=calculated, red=dummy

**Effort**: Already created ✅

---

#### Task 3.2: Enable Debug Toggle
**Location**: Admin settings or local storage

**UI**:
```
Developer Tools
Data Debug Mode: [Toggle]
When enabled, all metrics show:
- Source (API/DB/Calculated)
- Timestamp (retrieved at)
- Confidence (percentage)
- Formula (for calculated)
```

**Effort**: 1 hour

---

### Phase 25.2B.4: Admin Data Audit Page (2-3 hours)

#### Task 4.1: Create `/admin/data-integrity`
**Shows**:
- API Connection Status (SportsDataIO, OpenWeather, Odds, GolfCourseAPI)
- Last sync times (all providers)
- Record counts (tournaments, courses, players, results)
- Dummy data count (should be 0 in prod)
- Mock data count (should be 0 in prod)
- Stale data warnings
- Failed syncs
- Data quality score

**URL**: `/admin/data-integrity`  
**Auth**: Admin only  
**Effort**: 2-3 hours

**Example Display**:
```
DATA INTEGRITY DASHBOARD

Connected Providers:
🟢 SportsDataIO - Last Sync: 2 hours ago (47,293 records)
🟢 OpenWeather - Last Sync: 30 min ago (89 locations)
🟢 Odds API - Last Sync: 15 min ago (2,847 quotes)
🟢 GolfCourseAPI - Last Sync: 1 day ago (312 courses)

Database Tables:
✅ tournaments: 156 records
✅ tournament_fields: 4,892 records
✅ player_rankings: 89,234 records
✅ course_holes: 5,616 records
✅ odds_quotes: 2,847 records

Data Quality:
Verified Data: 89%
Calculated: 7%
Estimated: 2%
Dummy: 0%
Unavailable: 2%

Alerts:
⚠️ GolfCourseAPI last sync: 24 hours (should be weekly)
🟢 All other sources healthy
```

---

### Phase 25.2B.5: AI Transparency Layer (3-4 hours)

#### Task 5.1: AI Source Attribution
**File**: `lib/ai-analysis/transparency.ts`

**Every AI insight includes**:
```typescript
interface AiAnalysisWithSources {
  insight: string
  sources: {
    fact: string
    source: 'REAL_API' | 'REAL_DATABASE' | 'CALCULATED' | 'ESTIMATED'
    confidence: number
    provider?: string
  }[]
  reasoning: string
  caveats: string[]
}
```

**Example**:
```
INSIGHT: "Tiger Woods has a strong fit for this course layout"

SOURCES:
- Tiger's recent form: REAL_DATABASE (Player stats)
- Course requires driving accuracy: REAL_DATABASE (Course specs) 
- Tiger's driving accuracy: REAL_DATABASE (Statistics)
- Historical performance: CALCULATED (Win % last 5 years)

CONFIDENCE: 87%

CAVEATS:
- Based on 5-year historical data only
- Recent form score is 2 weeks old
- Weather adjustment is estimated
```

**Effort**: 3-4 hours

---

## IMPLEMENTATION SEQUENCE

**Week 1**:
- [ ] Phase 25.2B.1: Remove mock data (4 hours)
- [ ] Phase 25.2B.2.3: Wrap tournament metrics (3 hours)
- [ ] Phase 25.2B.3.2: Enable debug toggle (1 hour)

**Week 2**:
- [ ] Phase 25.2B.4: Admin audit page (3 hours)
- [ ] Phase 25.2B.5: AI transparency (4 hours)
- [ ] Testing & verification (4 hours)

**Total**: 19 hours spread over 2 weeks

---

## SUCCESS CRITERIA

✅ No Math.random() values displayed in production  
✅ All 89 metrics on Tournament Detail have provenance badges  
✅ Developer debug mode available  
✅ Admin audit page operational  
✅ Every AI insight shows sources  
✅ Data quality score visible  
✅ Zero dummy data silently displayed  
✅ All formulas exposed & auditable  

---

## AFTER COMPLETION

Once data integrity is complete:
- ✅ AI intelligence features can proceed
- ✅ Analyst modules can be built
- ✅ Tournament briefs can be generated
- ✅ Player archetypes can be refined
- ✅ DFS strategy can be added

**Then**: Resume Phases 25.3, 25.4, 25.5, 25.6

---

## BLOCKERS REMOVED

**Before**: Cannot add AI analysis (unreliable source data)  
**After**: All data is traceable, verified, and properly attributed  

**Status**: READY TO EXECUTE

