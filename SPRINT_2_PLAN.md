# Sprint 2 – Player Research Pages Implementation Plan

## Executive Summary

Build premium Player Research Pages that answer: **"Should I roster this golfer this week, and why?"**

The player infrastructure already exists (PlayerProfileV2View, player-service, types, routes). Sprint 2 enhances the existing `/players/[playerId]` page with tournament-specific context, enhanced analytics, and strategic recommendations tied to the Tournament Hub insights.

---

## Current State Assessment

### Existing Infrastructure (Reusable)
✅ **PlayerProfileV2View** - Comprehensive player profile layout  
✅ **Player Service** - Data access for player details, analytics, course history  
✅ **Player Types** - PlayerDetail, PlayerAnalytics, CourseHistory  
✅ **Player Route** - `/app/players/[playerId]` with proper metadata  
✅ **Player Components** - Header, cards, skill profiles, status badges  
✅ **Player Hooks** - usePlayerDetail, usePlayerOdds, usePlayerSkillProfile  

### What Needs Enhancement
⚠️ **Tournament Context Integration** - Link tournament data to player profile  
⚠️ **AI Summary** - Generate concise 3-5 sentence analysis  
⚠️ **Form Visualization** - Display recent form trend charts  
⚠️ **Course Fit Explanation** - Explain why player fits/doesn't fit course  
⚠️ **Weather Impact** - Explain how forecast affects golfer value  
⚠️ **DFS Outlook** - Game-type specific recommendations (Cash/Single/GPP)  
⚠️ **Risk Assessment** - Volatility, ownership, course concerns  
⚠️ **Comparable Golfers** - Suggest similar players for stacks/pivots  

---

## Implementation Architecture

### Phase 1: Tournament Context Integration (2 hours)

**Goal:** Connect player profile to active tournament context

**Changes:**
1. **PlayerDetailView** - Add tournament context parameter
2. **PlayerUpcomingContext** - Already exists in player-service; enhance with tournament insights
3. **New utilities** - Create player-tournament-context.ts
   - `getTournamentImpactSummary()` - How tournament affects this player
   - `computePlayerDfsStrategyForTournament()` - Game-type recommendations
   - `computePlayerRiskForTournament()` - Risk factors specific to tournament

**Files to Modify:**
- `/features/players/player-detail-view.tsx` - Accept tournament context
- `/features/players/services/player-service.ts` - Enhance getPlayerById with tournament context
- Create `/features/players/utils/player-tournament-context.ts`

**Data Sources:**
- Existing: PlayerDetail, CourseProfile, CourseIntelligence
- New: Tournament ID (via URL or context provider)

---

### Phase 2: Enhanced Analytics & AI Summary (2-3 hours)

**Goal:** Add AI-generated summary and deeper analytics

**Components to Create:**
1. **PlayerAiSummary** - Concise 3-5 sentence summary
   - Current form assessment
   - Key strengths
   - Biggest concerns
   - Why/why not DFS this week

2. **PlayerFormChart** - Trend visualization
   - Last 10 finishes
   - Cut/missed cut indicators
   - Strokes gained trend
   - Average finish trend

3. **PlayerSeasonStats** - Organized stat categories
   - Driving (accuracy, distance, fairway %)
   - Approach (GIR %, distance control)
   - Around the Green (scrambling, sand saves)
   - Putting (strokes gained, average putts)
   - Scoring (scoring average, eagle %, birdie %)

**Utilities:**
- `generatePlayerAiSummary(player, tournament)` - Generate AI summary
- `deriveFormTrend(recentForm)` - Analyze form trend (improving/stable/declining)
- `categorizeSeasonStats(player)` - Organize stats into categories

**Files to Create:**
- `/features/players/components/player-ai-summary.tsx`
- `/features/players/components/player-form-chart.tsx`
- `/features/players/components/player-season-stats.tsx`
- `/features/players/utils/player-analytics.ts`

---

### Phase 3: Course-Specific Sections (2-3 hours)

**Goal:** Explain player fit for course and weather

**Components to Create:**
1. **PlayerCourseFitExplainer** - Why/why not fit
   - Skill alignment (long-iron player, elite scrambler, etc.)
   - Historical performance at this course
   - Performance in similar conditions
   - Positive/negative factors

2. **PlayerCourseHistoryTable** - Historical performance
   - Starts, cuts made, best finish, average finish
   - Scoring trend at this event
   - Performance trajectory (improving/declining)

3. **PlayerWeatherFitCard** - Forecast impact
   - How wind affects this player
   - Hot/cold weather tendencies
   - Scoring differential in current conditions
   - Strategy adjustments for forecast

**Utilities:**
- `generateCourseFitExplanation(player, course)` - Why player fits/doesn't fit
- `analyzeWeatherImpact(player, weather)` - How forecast affects value
- `scorePlayerForCourseConditions(player, course, weather)` - Predicted value impact

**Files to Create:**
- `/features/players/components/player-course-fit-explainer.tsx`
- `/features/players/components/player-course-history-table.tsx`
- `/features/players/components/player-weather-fit-card.tsx`
- `/features/players/utils/player-course-fit.ts`

---

### Phase 4: DFS & Risk Assessment (1.5-2 hours)

**Goal:** Provide game-type specific recommendations and risk analysis

**Components to Create:**
1. **PlayerDfsOutlookCard** - Game-type recommendations
   - Cash games: Confidence level + primary strategy
   - Single entry: Ceiling/floor outlook + volatility
   - Large field GPP: Leverage opportunity + ownership concern

2. **PlayerRiskAssessmentCard** - Risk factors
   - Recent volatility (std dev of finishes)
   - Ownership concerns (chalk vs contrarian)
   - Course concerns (historical under-performance)
   - Weather concerns (forecast mismatches)
   - Withdrawal/injury risk (if available)
   - Risk score: Low / Medium / High

**Utilities:**
- `generateDfsStrategyByGameType(player, tournament)` - Game-type specific recs
- `computePlayerRiskScore(player, tournament)` - Overall risk assessment
- `identifyOwnershipConcern(player, salary)` - Chalk vs value analysis

**Files to Create:**
- `/features/players/components/player-dfs-outlook-card.tsx`
- `/features/players/components/player-risk-assessment-card.tsx`
- `/features/players/utils/player-dfs-strategy.ts`

---

### Phase 5: Comparable Golfers (1-1.5 hours)

**Goal:** Recommend similar players for stacks and pivots

**Components to Create:**
1. **PlayerComparablesList** - Similar players
   - Based on: Salary within 10%, similar projection, course fit, form
   - Show 3-5 comparables
   - Quick stats comparison (salary, projection, form)
   - Use case: "If this player is chalk, consider [comparable] for a pivot"

**Utilities:**
- `findComparableGolfers(player, field, tournament)` - Find 3-5 similar players
- `scorePlayerSimilarity(player1, player2, weights)` - Compute similarity

**Files to Create:**
- `/features/players/components/player-comparables-list.tsx`
- `/features/players/utils/player-comparables.ts`

---

### Phase 6: Integration & Polish (1-2 hours)

**Goal:** Integrate all sections into PlayerDetailView

**Updates:**
1. Enhance **PlayerDetailView** layout:
   - Header (existing, enhanced with tournament context)
   - AI Summary (new)
   - Form Chart (new)
   - Course Fit Explainer (new)
   - Course History (existing, maybe enhance)
   - Season Statistics (enhance with categories)
   - Weather Fit (new)
   - DFS Outlook (new)
   - Risk Assessment (new)
   - Comparable Golfers (new)

2. Add tournament context provider to page route

3. Test responsive layout (mobile, tablet, desktop)

4. Verify dark mode support

5. Performance check (lazy-load charts if needed)

**Files to Modify:**
- `/features/players/player-detail-view.tsx` - Main layout
- `/app/(app)/players/[playerId]/page.tsx` - Add tournament context

---

## Data Sources & Dependencies

### Existing (Already Fetched)
- `PlayerDetail` - Complete player data
- `PlayerAnalytics` - Form, stats, trends
- `CourseHistory` - Past performance at courses
- `RecentForm` - Last 10 finishes
- `SeasonStatistics` - Category stats

### New (To Fetch)
- **Tournament Context** - Current event the player is playing in
- **DFS Value** - Salary and projection (already available via hooks)
- **Odds** - Vegas odds and win probability
- **Field Analytics** - For comparable golfers and ownership analysis

### Computed (Pure Functions)
- AI Summary
- Form Trends
- Course Fit Score
- Risk Assessment
- Comparable Golfers
- DFS Strategy by game type

---

## Component Hierarchy

```
PlayerDetailPage (/players/[playerId])
  ├── PlayerDetailView
  │   ├── PlayerHeader (existing)
  │   ├── PlayerAiSummary (NEW)
  │   ├── PlayerFormChart (NEW)
  │   ├── PlayerCourseFitExplainer (NEW)
  │   ├── PlayerCourseHistoryTable (existing, enhanced)
  │   ├── PlayerSeasonStats (existing, enhanced)
  │   ├── PlayerWeatherFitCard (NEW)
  │   ├── PlayerDfsOutlookCard (NEW)
  │   ├── PlayerRiskAssessmentCard (NEW)
  │   └── PlayerComparablesList (NEW)
```

---

## Data Flow

```
Tournament Page (selects golfer)
  ↓
Player Detail Page (/players/[playerId])
  ↓
Page Route (fetches PlayerDetail + Tournament Context)
  ↓
PlayerDetailView
  ├── AI Summary Utility (generates summary)
  ├── Course Fit Utility (explains fit)
  ├── DFS Strategy Utility (game-type recs)
  ├── Risk Assessment Utility (identifies risks)
  └── Comparables Utility (finds similar players)
  ↓
Renders 10 sections with real data
```

---

## Performance Considerations

### Data Fetching
- Player data: Already cached in player-service
- Tournament context: Fetched once per page load
- Comparable golfers: Computed from existing field data (not a new query)
- **Total additional overhead: ~20-30ms**

### Component Rendering
- Charts use Recharts (lightweight, already used in codebase)
- Lazy-load form chart if needed (Suspense boundary)
- All other components are lightweight card/text layouts
- **Bundle impact: ~15-20KB new code**

### Caching
- AI summaries: Cacheable (same player + tournament = same summary)
- Risk assessments: Cacheable
- Recommend Redis/ISR caching if needed

---

## Success Criteria

✅ **Every section answers a specific question:**
- AI Summary: "Is this player in form?"
- Form Chart: "What's the trend?"
- Course Fit: "Does this course suit them?"
- Course History: "How have they played here before?"
- Season Stats: "What are their strengths?"
- Weather Fit: "How will conditions affect them?"
- DFS Outlook: "What's the DFS recommendation by game type?"
- Risk Assessment: "What could go wrong?"
- Comparable Golfers: "Who should I consider instead?"

✅ **No placeholder or mock data** - All content real and meaningful
✅ **Responsive design** - Works on mobile, tablet, desktop
✅ **Dark mode support** - Matches existing design system
✅ **Performance** - Page loads <2 seconds (with existing optimizations)
✅ **Error handling** - Graceful degradation when data unavailable

---

## Estimation

| Phase | Hours | Notes |
|-------|-------|-------|
| 1. Tournament Context | 2 | Utilities + integration |
| 2. AI & Analytics | 2.5 | Summary, charts, stat categories |
| 3. Course Sections | 2.5 | Fit explainer, history, weather |
| 4. DFS & Risk | 2 | Game-type recs, risk scoring |
| 5. Comparables | 1.5 | Find + render similar players |
| 6. Integration & Polish | 1.5 | Layout, responsive, dark mode |
| **Total** | **12-13 hours** | Medium complexity |

---

## Risk Assessment

**Low Risk:**
- Reusing existing player infrastructure
- No database schema changes
- All data already available
- Pure functions (testable, deterministic)

**Medium Complexity:**
- 9+ new components to create
- Multiple utility files
- Chart visualization (Recharts)

**High Value:**
- Transforms player page from stats dump to strategic research tool
- Directly answers the core question: "Should I roster this golfer?"
- Bridges gap between Tournament Hub (course insights) and player research

---

## Next Steps

1. **Approval:** Review this plan and provide feedback
2. **Start Phase 1:** Tournament context integration
3. **Iterative development:** Phase by phase with periodic testing
4. **Final integration:** Bring all sections together in PlayerDetailView
5. **Testing & Polish:** Responsive design, dark mode, performance

This plan transforms the player profile into a premium scouting report that feels essential, not supplementary.
