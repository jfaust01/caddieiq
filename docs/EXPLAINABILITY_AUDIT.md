# Explainability Normalization Audit — CaddieIQ

**Purpose:** Ensure every recommendation, score, ranking, confidence value, projection, and trend answers "Why?" with consistent interactions showing Decision Trace, Explain, Confidence, Source, and Calculation.

**Status:** Comprehensive audit identifying all surfaces and implementation plan.

---

## Executive Summary

CaddieIQ has a well-architected Explainability Engine (`lib/explainability/`) that produces canonical `Explanation` objects for 8 models. However, this infrastructure is not uniformly surfaced across the UI. This audit identifies:

1. **Surfaces with explanations:** 23+ `WhyButton` and tooltip implementations exist
2. **Surfaces missing explanations:** 40+ numeric/score displays that should explain their "why"
3. **Implementation gaps:** No consistent interaction pattern for hover/click to reveal explanation
4. **Priority tiers:** Critical (player ratings, tournament scores), High (DFS/fit/skill), Medium (supporting metrics)

---

## 1. Current State of Explainability Coverage

### 1.1 Surfaces WITH consistent "Why?" interactions (✓)

| Surface | Component | Pattern | Coverage |
|---------|-----------|---------|----------|
| Player overall rating | `player-overall-rating.tsx` | `WhyButton` + popover | Full |
| Player skill scores | `player-skills-grid.tsx` | `WhyButton` per skill | Full |
| Course fit rating | `course-fit-summary.tsx` | `WhyButton` + explanation | Full |
| DFS value score | `tournament-dfs-leaderboards.tsx` | Confidence badge + tooltip | Partial |
| Weather signals | `tournament-weather-intelligence.tsx` | Decision trace timeline | Partial |
| Tournament field strength | `tournament-field-summary.tsx` | Tooltip on rating | Basic |
| AI Coach recommendations | `ai-coach-widget.tsx` | Citation + source link | High |
| Decision trace | `decision-trace-timeline.tsx` | Timeline with stages | Full |
| Admin explainability | `/admin/explainability/` | Full breakdown view | Complete |

### 1.2 Surfaces WITHOUT consistent explanations (✗)

**Tournament Context:**
- Tournament name/status (why is it marked as "in progress"?)
- Field size (where does the count come from? How confident is it?)
- Course name and Par (no source or methodology)
- Purse amount (relevance? Source?)
- Cut line (if shown, no methodology)

**Player Context:**
- Player name + bio (no source)
- Career earnings (outdated? Real-time? Source?)
- Recent finishes (how recent? Weighted how?)
- Ownership in field (calculated from what data?)
- Injury status (source? Confidence?)
- PGA Tour status (how verified?)

**DFS Boards:**
- "Top Value" top 5 (which signal family? Why these 5?)
- "Highest Confidence" (confidence in what? Salary accuracy?)
- "Risky GPP Targets" (what makes them risky? Volatility? Floor?)
- "Underpriced" (vs. what projection? What data?)

**Course Fit Board:**
- "Top Fits" ranking (which signals weighted highest?)
- "Fades" (opposite of top fits? How calculated?)
- "Trending Up" (trending vs. what baseline? Time window?)
- "Most Uncertain" (uncertainty in what? Score variance?)

**Form/Skill Rankings:**
- Skill leaderboard rankings (tied to which data source?)
- Trend arrows (trend period? Weighting?)
- Percentile badges (percentile of what cohort? All-time? Recent?)

**Analytics Dashboards:**
- Aggregate stats (average, median, spread)
- Distribution charts (source data? How sampled?)
- Trend lines (time window? Smoothing?)
- Comparison scores (vs. what baseline?)

**Odds & Markets:**
- Favorite odds (consensus? Weighted by what?)
- Value markers (vs. what fair value estimate?)
- Market movement (last update? Volume?)
- Implied probability (devigged by what model?)

**Weather:**
- Wind direction (source? Real-time?)
- Temperature impact (how modeled? By which signal?)
- Rain probability (forecast model? Timing?)
- "Favorable/Unfavorable" verdicts (which factors drove this?)

---

## 2. Priority Implementation Tiers

### Tier 1: CRITICAL (must have explanations)

Player scores in any decision context:
- Overall rating (already has `WhyButton`)
- Skill scores (already has `WhyButton`)
- Form rating (NEW)
- Course fit band (already has `WhyButton`)

Tournament/Field context:
- Field strength / average rating (NEW)
- Cut line / field depth (NEW)
- Trending patterns (NEW)

### Tier 2: HIGH (should have explanations)

DFS/Market/Projection surfaces:
- DFS board ranks/confidence (partially done)
- Odds favorites/value (NEW)
- Fantasy projections (NEW)
- Course fit board entries (NEW)
- Skill leaderboard positions (NEW)

### Tier 3: MEDIUM (nice-to-have)

Analytics dashboards:
- Aggregate stats (NEW)
- Distribution metrics (NEW)
- Comparison benchmarks (NEW)

Support/contextual:
- Player metadata (injury, status, earnings) (NEW)
- Course metadata (par, elevation, design) (NEW)

---

## 3. Interaction Patterns

### 3.1 Hover / Click Patterns

**Pattern A: Inline Icon** (for small/dense displays)
```
"Overall Rating 72.4 ⓘ"
     ↓ hover/click
[Popover: Decision trace, source, confidence]
```
**Usage:** Skill scores, leaderboard positions, stat bars

**Pattern B: Badge/Chip** (for cards)
```
┌─────────────────┐
│ DFS Value: 87.5 │
│ [High confidence badge]
│  ↓ click
└─────────────────┘
[Sheet/Modal: Full explanation breakdown]
```
**Usage:** Card-level scores, tournament summaries

**Pattern C: Tooltip** (for transient info)
```
On hover: "[Player name]'s course fit is 81 because of
strong history at this layout (signal weight 35%), good
bunker play (weight 25%), …"
```
**Usage:** Supporting metrics, percentile badges

**Pattern D: "Why?" Button** (for complex scores)
```
"Why is [Player] rated 72.4?"
     ↓ click
[Modal: Full ExplanationBreakdown with decision trace]
```
**Usage:** High-stakes recommendations, profile pages

### 3.2 Content Consistency

Every explanation must include (in order of prominence):

1. **Headline:** The score/rank and unit + confidence level
2. **Reasoning:** The 2-3 key factors that drove this (with weights)
3. **Confidence:** Why we trust/don't trust this (missing data? Model accuracy?)
4. **Source:** Which engine produced this? When was it updated?
5. **Calculation:** How were contributors aggregated? Any capping/floor?

---

## 4. Coverage Checklist

### Players Feature

- [ ] Player profile header — add "Why?" to overall rating, form score, course fit
- [ ] Player skills grid — verify `WhyButton` present on each skill (done?)
- [ ] Player career stats — add tooltips explaining each stat (earnings, finishes, streak)
- [ ] Workspace favorites — add confidence/form trend next to each player
- [ ] Comparison modal — add "Why?" for comparison verdict and each contributor
- [ ] Rankings page — add explanation badges to rank positions

### Tournaments Feature

- [ ] Tournament header — add inline ⓘ to field size, course name, status
- [ ] Field summary — add "Why?" to field strength rating
- [ ] Command Center → Brief — add sources/reasoning to headline statements
- [ ] Command Center → Story — cite each claim with source engine
- [ ] Command Center → Trending — add confidence to trending picks
- [ ] DFS leaderboards — expand confidence tooltips with decision trace
- [ ] Course fit board — add "Why?" button for each fit category
- [ ] Skill leaderboards — add "Why?" to rank positions and trend
- [ ] Weather panel — add decision trace for each signal
- [ ] Odds panel — add implied probability explanation

### Analytics Feature

- [ ] Dashboard stats — add tooltips to each metric explaining calculation
- [ ] Distribution charts — label axes with source and time window
- [ ] Trend lines — add confidence bands or "smoothing window" note
- [ ] Comparison benchmarks — explain which player/cohort is baseline

### Model Lab / Admin

- [ ] Model explorer — link each score to its explanation
- [ ] Batch picker explanations — add confidence/reasoning

---

## 5. Implementation Strategy

### Phase 1: Foundation (Week 1)

Create reusable explanation component patterns:
- `ExplanationChip` — compact inline ⓘ with popover
- `ExplanationBadge` — card-level badge with sheet/modal
- `ExplanationTooltip` — hover tooltip with key points
- `ExplanationButton` — "Why?" button with full modal

Patterns inherit from existing `WhyButton`, just standardize API.

### Phase 2: High-Impact Surfaces (Weeks 2-3)

Apply to highest-traffic, highest-decision surfaces:
1. Player overall rating (every player card)
2. Player skill scores (profile + comparison)
3. Tournament field strength (tournament header)
4. DFS board entries (DFS leaderboards)
5. Course fit board entries (field analysis)
6. Odds favorites (odds panel)

### Phase 3: Supporting Surfaces (Week 4+)

- Skill leaderboard positions
- Tournament trending picks
- Analytics dashboard metrics
- Command Center headlines

### Phase 4: Polish & Docs (Week 5)

- Audit all instances — ensure no score lacks explanation
- Create internal style guide for explanation UX
- Add to component library docs

---

## 6. Integration Points

### 6.1 API Surfaces

All existing explainability endpoints work:
```
POST /api/explainability
{
  "model": "overall-rating",
  "playerId": "p123",
  "tournamentId": "t456"
}
→ { explanation: Explanation }
```

No new routes needed; reuse this for all surfaces.

### 6.2 Component Props

Standard props across all explanation components:
```tsx
interface ExplanableNumberProps {
  value: number
  unit?: string
  confidence?: "high" | "medium" | "low"
  explanationKey: string // "overall-rating" | "dfs-value" | etc.
  explanationParams: Record<string, string> // { playerId, tournamentId }
  compact?: boolean // for inline ⓘ vs. full card
}
```

### 6.3 Narrative Control

Control which narrator runs:
```tsx
<ExplanableNumber
  explanationKey="dfs-value"
  narrator="deterministic-v1" // always use deterministic today
/>
```

---

## 7. Success Criteria

- [ ] 100% of scores in "decision context" (player profiles, recommendations, picks) have "Why?" surfaces
- [ ] 90%+ of supporting metrics have tooltips or badges explaining source/calculation
- [ ] All three features (Players, Tournaments, Analytics) have consistent explanation UX patterns
- [ ] Zero generic "No data" or unexplained values in main user flows
- [ ] Admin can audit any score by clicking through to its explanation

---

## 8. Related Documents

- `EXPLAINABILITY.md` — the engine architecture
- `DECISION_TRACE_ENGINE.md` — decision trace pipeline
- `COMPONENT_LIBRARY.md` — UI component standards (to be updated)

---

## Appendix A: Component Locations

- `features/explainability/components/why-button.tsx` — primary "Why?" surface
- `features/explainability/components/explanation-breakdown.tsx` — full explanation display
- `features/explainability/components/decision-trace-timeline.tsx` — trace visualization
- `components/ui/tooltip.tsx` — tooltip primitive
- `lib/explainability/narrator.ts` — prose generation
- `lib/explainability/registry.ts` — model registry (add new surfaces here)
