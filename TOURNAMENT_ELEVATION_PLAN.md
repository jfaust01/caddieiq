# TOURNAMENT PAGE ELEVATION PLAN
## Premium Fantasy Golf Research Experience

---

## OVERVIEW

Transform the Tournament Hub into a premium fantasy golf research platform by enhancing existing sections with strategic depth, expert insights, and premium analytics. Focus on data quality, context, and usability rather than adding new placeholders.

**Key Principle:** Every metric explains WHY it matters. Every section either displays meaningful data or explains why it's unavailable.

---

## GOAL: ANSWER 7 KEY QUESTIONS IN <2 MINUTES

When a user opens a tournament, they should be able to answer:

1. **Which golfers fit this course?** → Course Intelligence + Player Archetypes
2. **Which skills matter most?** → Skill Importance ratings + Explanations
3. **What does the weather change?** → Weather Impact Analysis
4. **What are the biggest DFS edges?** → Strategy Card + Value Plays
5. **What players are underpriced?** → Best Values section
6. **What players are risky?** → Risk Factors card
7. **What is the overall story?** → Tournament Summary + Insights

---

## SECTION-BY-SECTION IMPROVEMENTS

### 1. TOURNAMENT SUMMARY (ENHANCED)
**Current State:** Basic tournament title, date, location  
**Target State:** Executive overview readable in <60 seconds

**Components to Enhance:**
- `command-center-header.tsx` - Expand with summary card

**Data Sources:**
- Tournament object: name, dates, location, status
- Field data: size, average OWGR (if available)
- Course profile: par, yardage, rating, slope
- Weather: current + forecast summary
- Odds: implied winners, favorites

**Display:**
```
Tournament Summary Card:
┌─────────────────────────────────────────────┐
│ The Masters Tournament                      │
│ Augusta National | Par 72 | 7,510 yards     │
│                                             │
│ Field Strength: 92 players, elite field    │
│ Expected Scoring: 3-5 under par            │
│ Key Themes: Long hitters, Augusta experts  │
│ Weather: Mild, light winds (tailwind wind) │
│ Primary DFS Edge: Accuracy > Distance      │
└─────────────────────────────────────────────┘
```

**Derived Analytics:**
- Field quality rating (major/elite/strong/regular)
- Expected scoring environment (from historical data + current course state)
- Key strategic themes (derived from course characteristics)
- Winning score estimate (from historical trends)

**Performance:** Reuses existing data; no new queries

---

### 2. COURSE INTELLIGENCE (ENHANCED)
**Current State:** Cards showing characteristics, fantasy analysis  
**Target State:** Every metric has context explaining WHY it matters

**Components to Enhance:**
- `skill-importance-cards.tsx` - Add explanations to each skill
- Add confidence badges (70% / 85% / 95%)
- Add "Why This Matters" section for each skill

**Display for Each Skill:**
```
┌──────────────────────────────────────┐
│ ★★★ Approach Play (Confidence: 92%)   │
│                                       │
│ Small greens (avg 4,500 sq ft) punish │
│ approach misses. Elite approach        │
│ players gain 0.5+ strokes per round.  │
│                                       │
│ Action: Prioritize approach specialists
└──────────────────────────────────────┘
```

**Data Sources:**
- CourseProfile: avgGreenSize, avgYardage, fairwayWidth, greenSpeed, windExposure
- Existing skills: driving, irons, shortGame, putting, courseManagement
- Confidence: derived from data completeness (0-100%)

**Derived Analytics:**
- Confidence level (how complete is the course profile?)
- Explanation template (matched to specific course traits)
- Player value impact (0.1 - 1.0 strokes)

---

### 3. WEATHER IMPACT (NEW SECTION)
**Current State:** Weather card showing current temp/wind  
**Target State:** Explain how TODAY'S conditions change player value

**Components to Create:**
- `weather-impact-analysis.tsx`

**Display:**
```
┌─────────────────────────────────────────┐
│ WEATHER IMPACT ANALYSIS                 │
│                                         │
│ Wind: 12 mph NW (elevated)              │
│ • Increases scrambling importance +40%  │
│ • Favor accurate drivers +0.3 strokes  │
│ • Reduce aggressive bomb plays         │
│                                         │
│ Temperature: 58°F (cool)                │
│ • Firm conditions favor ball strikers  │
│ • Reduce birdie rate (3-4% drop)       │
│ • Disadvantage distance > accuracy     │
│                                         │
│ Rain Probability: 20% (low)             │
│ • Minimal scoring impact               │
│ • Standard conditions expected         │
└─────────────────────────────────────────┘
```

**Data Sources:**
- WeatherIntelligence: temperature, wind, humidity, precipProbability
- CourseProfile: windExposure, elevation, greenSpeed

**Derived Analytics:**
- Impact on skill importance (Driving: +0%, Accuracy: +25%, etc.)
- Scoring environment shift (-0.5 to +1.5 strokes)
- Player archetype value changes

**Performance:** Pure function; uses existing weather + course data

---

### 4. FIELD STRENGTH (ENHANCED)
**Current State:** Simple field size display  
**Target State:** Comprehensive field quality breakdown

**Components to Enhance:**
- `command-center-header.tsx` or new `field-strength-card.tsx`

**Display:**
```
┌──────────────────────────────────────────┐
│ FIELD STRENGTH                           │
│ ─────────────────────────────────────────│
│ Total Players: 156                       │
│ Average OWGR: 18.5 (Elite)              │
│ Major Champions: 14 (9%)                │
│ Defending Champion: Present             │
│ Top 50 Finalists from Last Year: 8      │
│ First-Time Entrants: 12 (8%)            │
│ Field Rating: ELITE (Top 5%)            │
└──────────────────────────────────────────┘
```

**Data Sources:**
- TournamentField: entrants, size
- Player data: worldGolfRanking, careerWins, majors
- Historical: defending champion, returning finalists

**Derived Analytics:**
- Field quality rating (elite/strong/regular/weak)
- Experience distribution
- Depth analysis (Top 10 vs. 50-100 players)

---

### 5. DFS STRATEGY (NEW SECTION)
**Current State:** Scattered insights in morning brief  
**Target State:** One strategic card with 4 game-type recommendations

**Components to Create:**
- `dfs-strategy-card.tsx`

**Display:**
```
┌──────────────────────────────────────────────┐
│ DFS STRATEGY FOR THIS TOURNAMENT             │
├──────────────────────────────────────────────┤
│ CASH GAMES ($3K contests)                    │
│ • Lock: Elite accuracy drivers (+10%)        │
│ • Fade: Volatile long hitters                │
│ • Strategy: Stack verified form              │
│                                              │
│ GPP / LARGE FIELD (10K+ entries)             │
│ • Seek: Mid-tier approach specialists        │
│ • Target Ownership: <15%                     │
│ • Stack strategy: Course experts + rebels    │
│                                              │
│ SINGLE-ENTRY                                 │
│ • Core: Proven course history                │
│ • Pivot: Underowned major winners            │
│ • Avoid: First-time events                   │
│                                              │
│ KEY LEVERAGE THEME:                          │
│ Underweight long-hitting plays, overweight   │
│ approach/short-game specialists (-3% salary) │
└──────────────────────────────────────────────┘
```

**Data Sources:**
- CourseProfile: skill importance rankings
- DfsValueField: pricing, projections, ownership (if available)
- Field: historical performers at this course

**Derived Analytics:**
- Game-type specific recommendations
- Leverage themes (undervalued archetypes)
- Salary allocation guidance

---

### 6. PLAYER ARCHETYPES (ENHANCED)
**Current State:** "Best Fits" / "Consider Fading" lists  
**Target State:** Explained archetypes with examples

**Components to Enhance:**
- `player-archetype-list.tsx` - Add explanations

**Display:**
```
┌───────────────────────────────────────┐
│ BEST FITS FOR THIS COURSE             │
├───────────────────────────────────────┤
│ Elite Ball Strikers                   │
│ Consistently gain strokes off tee and │
│ approach play. Perfect for courses    │
│ penalizing accuracy over distance.    │
│ Example: Scottie Scheffler, Rory M.  │
│                                       │
│ Long-Iron Specialists                │
│ Mid-range irons critical on par 4s.   │
│ Narrow fairways demand precision.     │
│ Example: Jon Rahm, Patrick Cantlay    │
├───────────────────────────────────────┤
│ CONSIDER FADING                       │
├───────────────────────────────────────┤
│ Pure Bombers (weak short game)        │
│ Distance advantage neutralized by     │
│ small greens and accuracy demands.    │
│ Example: Bryson DeChambeau, etc.      │
└───────────────────────────────────────┘
```

**Data Sources:**
- CourseProfile: skill demands
- Player stats (if available): driving distance, accuracy, GIR%, scoring avg

---

### 7. BEST VALUES (NEW SECTION)
**Current State:** Part of Morning Brief  
**Target State:** Dedicated value card with 4 categories

**Components to Create:**
- `best-values-card.tsx`

**Display (If Pricing/Projections Exist):**
```
┌────────────────────────────────────────┐
│ BEST VALUE PLAYS                       │
├────────────────────────────────────────┤
│ TOP VALUE PLAYS (Value Score 85+%)     │
│ • Jack Hume - $4,200 (Upside: 42pts)  │
│ • Aaron Rai - $5,100 (Upside: 51pts)  │
│                                        │
│ BEST LEVERAGE                          │
│ • Billy Horschel - $6,800 (Own: 2%)   │
│ • Hideki Matsuyama - $7,400 (Own: 3%) │
│                                        │
│ SAFEST CASH OPTIONS                    │
│ • Scottie Scheffler - $9,800 (Floor)  │
│ • Rory McIlroy - $8,900 (Floor)       │
│                                        │
│ HIGH UPSIDE GPP TARGETS                │
│ • Tom Kim - $6,500 (Ceiling: 58pts)   │
│ • Collin Morikawa - $5,900 (Ceiling)  │
└────────────────────────────────────────┘
```

**Data Sources:**
- DfsValueField: salary, projections, historical scoring, ownership
- Player course fit: historical performance at this venue

---

### 8. RISK FACTORS (NEW SECTION)
**Current State:** Scattered in Morning Brief  
**Target State:** Dedicated card explaining major risks

**Components to Create:**
- `risk-factors-card.tsx`

**Display:**
```
┌────────────────────────────────────────┐
│ RISK FACTORS TO MONITOR                │
├────────────────────────────────────────┤
│ HIGH WIND RISK ⚠                       │
│ 18+ mph NW wind can swing outcomes     │
│ 2-3 stroke swings possible             │
│ Action: Overweight accuracy            │
│                                        │
│ COURSE FIT MISMATCHES                  │
│ 8 players < 15% course fit rating      │
│ May be overexposed in lineups          │
│                                        │
│ RECENT FORM CONCERNS                   │
│ Collin Morikawa: 3 missed cuts (last 5)│
│ Billy Horschel: Injury watch           │
│                                        │
│ WITHDRAWAL RISK                        │
│ 2 players have injury concerns         │
│ Monitor practice round participation   │
│                                        │
│ OWNERSHIP RISK                         │
│ Scottie Scheffler at 28% ownership     │
│ Correlated lineups likely in GPP       │
└────────────────────────────────────────┘
```

**Data Sources:**
- WeatherIntelligence: wind forecast
- Field: player fit ratings
- FieldNews: injuries, recent form
- Ownership data (if available)

---

### 9. COURSE HISTORY (ENHANCED)
**Current State:** Not displayed on tournament page  
**Target State:** Historical trends when available

**Components to Create:**
- `course-history-summary.tsx` (render only if data exists)

**Display (If Historical Data Available):**
```
┌──────────────────────────────────────┐
│ COURSE HISTORY                       │
├──────────────────────────────────────┤
│ Avg Winning Score: -9 (from 2018-23) │
│ Typical Cut Line: 1-under par        │
│ Scoring Conditions: Moderately tough │
│                                      │
│ Birdie Rate: 18% of holes            │
│ Bogey Rate: 12% of holes             │
│ Par Breakers: Holes 4, 8, 13         │
│                                      │
│ Trending: Getting tougher (-0.3/yr)  │
│ Upcoming: Likely -6 to -12 range     │
└──────────────────────────────────────┘
```

**Data Sources:**
- Tournament historical results (if available)
- Scoring records by year
- Course conditioning trends

**Empty State:** "Historical data for this course not yet available"

---

### 10. PREMIUM INSIGHTS (NEW SECTION)
**Current State:** Not structured  
**Target State:** 5-10 expert-style observations

**Components to Create:**
- `premium-insights-list.tsx`

**Display:**
```
┌────────────────────────────────────────┐
│ EXPERT INSIGHTS FOR THIS WEEK          │
├────────────────────────────────────────┤
│ • The course rewards elite long-iron  │
│   players — mid-range accuracy is key.│
│                                        │
│ • Wind forecast suggests scoring will │
│   be slower. Expect winners -8 to -10.│
│                                        │
│ • Distance is less valuable than      │
│   accuracy — expect mid-tier hitters  │
│   to outperform bombers.              │
│                                        │
│ • Around-the-green specialists gain   │
│   0.3-0.5 strokes vs. general field.  │
│                                        │
│ • Course setup appears defensive;     │
│   expect higher cut line (+2/-1).     │
│                                        │
│ • Defend against chalk — elite players│
│   are overexposed in contests.        │
└────────────────────────────────────────┘
```

**Data Sources:**
- CourseProfile: all characteristics
- Weather: forecast
- Field: average stats
- Historical: course trends

**Derived Analytics:**
- Expert observation templates matched to course traits
- 5-10 generated insights from tournament data

---

## COMPONENTS BEING IMPROVED

| Component | Current State | Enhancement | Priority |
|-----------|---|---|---|
| `command-center-header.tsx` | Basic title/date | Add executive summary | HIGH |
| `skill-importance-cards.tsx` | 5-star ratings | Add explanations + confidence | HIGH |
| `morning-brief.tsx` | 5 scattered insights | Consolidate into strategy card | MEDIUM |
| `tournament-weather-intelligence.tsx` | Current conditions | Add impact on player value | MEDIUM |
| `field-fit-board.tsx` | Player cards | Explain archetype categories | MEDIUM |
| New: `weather-impact-analysis.tsx` | N/A | New component | MEDIUM |
| New: `field-strength-card.tsx` | N/A | New component | LOW |
| New: `dfs-strategy-card.tsx` | N/A | New component | HIGH |
| New: `best-values-card.tsx` | N/A | New component (if pricing exists) | HIGH |
| New: `risk-factors-card.tsx` | N/A | New component | MEDIUM |
| New: `premium-insights-list.tsx` | N/A | New component | MEDIUM |

---

## DATA SOURCES & REUSE

**Already Available (Existing Fetches):**
- Tournament: `tournament` object
- Field: `field` (entrants, size, analytics)
- Course: `courseProfile` (characteristics, difficulty, etc.)
- Weather: `weather` (temperature, wind, rain, humidity)
- Odds: `odds` (leaderboards, implied winners)
- DFS: `dfsField` (projections, salary, ownership — if available)
- News: `fieldNews`

**Derived (Pure Functions - No New DB Queries):**
- Field strength rating
- Course difficulty (0-10)
- Skill importance + explanations
- Player archetypes (best fits/fades)
- Weather impact analysis
- Strategy recommendations
- Risk factors
- Expert insights

**Not Yet Available (Do NOT Display):**
- Player-specific injury data (show if fieldNews contains)
- Real-time pricing/ownership (show if `dfsField` has it)
- Historical course results (show if tournament context has it)
- Course conditioning (show if available in courseProfile)

---

## PERFORMANCE CONSIDERATIONS

### Data Fetching
- **Zero new database queries** — all data already fetched in `tournament-command-center.tsx`
- All enhancements use existing `Promise.all()` data
- No additional load time

### Computation
- All derived analytics are pure functions: O(n) where n=field size (~150 players) or characteristics (~20)
- Total computation: <50ms
- All done server-side; renders already-computed JSX

### Rendering
- Each component independent; can be Suspense-wrapped if needed
- No client-side interactivity except optional dropdowns (tee selector, accordion)
- ~10-12 new lightweight components

### Bundle Impact
- ~8-10KB new component code
- Reuses existing shadcn/ui (Card, Badge, Button, etc.)
- No new dependencies
- Icons from `lucide-react` (already imported)

---

## EMPTY STATES & GRACEFUL DEGRADATION

**Rule: Never leave an empty card**

| Missing Data | Behavior |
|---|---|
| No courseProfile | Hide Course Intelligence section; show "Data generating..." |
| No weather | Show "Weather data unavailable" in header |
| No odds | Hide DFS Strategy / Best Values cards |
| No fieldNews | Omit injury/withdrawal warnings from Risk Factors |
| No historical results | Hide Course History section entirely |
| No DFS pricing | Hide Best Values card (keep DFS Strategy) |

---

## VISUAL POLISH IMPROVEMENTS

### Typography & Spacing
- **Section headers:** Larger, bolder (maybe `text-lg font-semibold`)
- **Metric numbers:** Tabular, large (maybe `text-2xl` for difficulty)
- **Descriptions:** Smaller, muted color
- **Spacing:** Consistent 16px gaps between sections

### Visual Elements
- **Difficulty meter:** Color-coded bar (green/yellow/orange/red)
- **Star ratings:** ★★★ (gold/primary color)
- **Icons:** Wind, droplet, trending-up, target, etc.
- **Badges:** Colored by archetype (green for best, gray for fade)

### Responsive
- **Desktop:** Multi-column grids (2-3 cols)
- **Tablet:** 2-column layouts
- **Mobile:** Single column, full width

### Accessibility
- All icons have `aria-hidden=true`
- Text descriptions for all visual elements
- Color not sole indicator (use text + icon + color)

---

## POTENTIAL RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missing course data | Medium | Section not displayed | Show graceful empty state |
| Weather data stale | Low | Misleading recommendations | Timestamp + "last updated" |
| DFS pricing unavailable | Medium | Strategy card appears incomplete | Make it optional; always show strategy direction |
| Field data incomplete | Low | Archetype recommendations poor | Reuse existing field data (already cached) |
| User overwhelm | Medium | Too much information | Organize by importance; collapse non-essential |

---

## SUCCESS CRITERIA

✓ Every metric explains WHY it matters  
✓ All 7 questions answerable in <2 minutes  
✓ Zero empty/placeholder cards  
✓ Premium analytics dashboard feel  
✓ Build compiles without errors  
✓ No performance regression  
✓ Mobile-responsive  
✓ Graceful empty states for all missing data  

---

## IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (2-3 hours)
1. Create utility functions for derived analytics
2. Create helper types (Insight, ValuePlay, RiskFactor, etc.)
3. Test pure functions independently

### Phase 2: Components (3-4 hours)
1. Enhance existing components with explanations
2. Create new lightweight components (strategy, values, risks, insights)
3. Wire data to components

### Phase 3: Integration (1-2 hours)
1. Update `tournament-command-center.tsx` layout
2. Insert new components into page flow
3. Handle empty states

### Phase 4: Polish (1-2 hours)
1. Verify design consistency
2. Mobile responsiveness
3. Performance profiling
4. User feedback

**Total Estimate:** 7-11 hours

---

## DELIVERABLE CHECKLIST

- [ ] Tournament Summary card with executive overview
- [ ] Skill importance with explanations + confidence
- [ ] Weather Impact analysis section
- [ ] Field Strength breakdown card
- [ ] DFS Strategy card (cash/GPP/single-entry/large-field)
- [ ] Enhanced Player Archetypes with explanations
- [ ] Best Values card (if pricing available)
- [ ] Risk Factors card
- [ ] Course History section (if data available)
- [ ] Premium Insights list (5-10 observations)
- [ ] Visual polish: icons, badges, color-coding
- [ ] Empty state handling for all missing data
- [ ] Mobile responsiveness testing
- [ ] Performance verification
- [ ] Build verification
