# Phase 26 — Tournament Intelligence Engine Implementation Roadmap

**Status**: Architecture Complete | Implementation Ready  
**Date**: July 21, 2026  
**Scope**: Build and integrate 10 intelligence modules  

---

## MISSION

Transform CaddieIQ from data display to intelligent recommendation engine.

Every statistic should answer:
- **Why does this matter?**
- **What does it mean?**
- **How should a DFS player react?**

Build ONE reusable intelligence engine that powers the entire platform instead of isolated page-specific logic.

---

## ARCHITECTURE COMPLETE ✅

### Type System (247 lines)
- Complete TypeScript types for all 10 modules
- Structured output for entire application consumption
- Source attribution built into every insight
- Confidence scoring throughout

### Orchestration Engine (399 lines)
- Master coordinator for all 10 modules
- Single entry point: `TournamentIntelligenceEngine.generate(input)`
- Returns `TournamentIntelligenceOutput` with complete analysis
- Server-only (no client computation)

### Usage Pattern
```typescript
// Any page/feature can consume the engine:
const intelligence = await TournamentIntelligenceEngine.generate({
  tournament,
  field,
  weather,
  courseMetrics,
  historicalData,
  playerStats,
  currentOdds,
})

// All 10 modules available in single object:
intelligence.courseAnalysis       // Module 1
intelligence.playerFitScores      // Module 2
intelligence.weatherAnalysis      // Module 3
intelligence.fieldStrengthAnalysis // Module 4
intelligence.courseHistoryAnalysis // Module 5
intelligence.dfsStrategy           // Module 6
intelligence.valueAnalysis         // Module 7
intelligence.storylines            // Module 8
intelligence.executiveSummary      // Module 9
intelligence.explainability        // Module 10
```

---

## IMPLEMENTATION SCHEDULE

### Phase 26.1: Course Analysis Module (4 hours)

**Objective**: Interpret course characteristics and explain how it plays

**Inputs**:
- Course hole data (par, yardage, handicap, water, bunkers)
- Course metrics (difficulty, driving importance, etc)
- Historical scoring trends (last 5 years)
- Slope rating and course rating

**Outputs**:
- Headline interpretation (2-3 sentences)
- Skills rewarded with importance levels
- Skills penalized with severity
- Historical trend breakdown
- Weather strategy implications
- DFS strategic implications
- Confidence score

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/course-analysis.ts
export class CourseAnalysisModule {
  async generate(input: CourseAnalysisInput): Promise<CourseAnalysis> {
    // 1. Analyze hole data (bunkers, water, par distribution)
    // 2. Interpret course metrics from courseIntelligence
    // 3. Create skills-rewarded list from metrics
    // 4. Create skills-penalized list from metrics
    // 5. Query historical tournament results
    // 6. Extract scoring trends (improving/declining)
    // 7. Map to weather implications
    // 8. Generate DFS implications
    // 9. Return structured analysis
  }
}
```

**Data Sources**:
- ✅ course_holes table
- ✅ courseIntelligence table
- ✅ tournament_results table
- ✅ player_round_scores table

**Success Criteria**:
- Headline captures course character
- 4-8 skills rewarded with clear explanation
- 4-8 skills penalized with clear explanation
- Historical trends show 5-year scoring pattern
- DFS implications are specific and actionable
- Confidence reflects data completeness

---

### Phase 26.2: Player Fit Engine (6 hours)

**Objective**: Score every golfer on course fit, form, skills, and history

**Inputs**:
- Player statistics (driving, approach, short game, putting, SG)
- Recent form (last 10 tournaments)
- Course-specific history
- Course metrics (skill requirements)
- Wind performance historical data

**Outputs**:
- Overall fit score (0-100) for each field player
- Supporting factors (name, score, explanation, source)
- Weaknesses (name, severity, explanation)
- Confidence on prediction

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/player-fit.ts
export class PlayerFitEngine {
  async scoreAllFieldPlayers(
    field: TournamentField,
    courseMetrics: CourseIntelligence,
    playerStats: PlayerStatistics[],
  ): Promise<PlayerFitScore[]> {
    // For each player in field:
    // 1. Assess course fit (skills required vs player strengths)
    // 2. Assess current form (recent results, scoring average)
    // 3. Assess skill match to course type
    // 4. Check wind performance history
    // 5. Check venue-specific history
    // 6. Calculate overall fit score
    // 7. Identify weaknesses
    // 8. Return sorted by fit score descending
  }
}
```

**Factors** (each with evidence):
- Course Fit (30% weight) — Does player's skill profile match what course rewards?
- Current Form (25% weight) — Recent results, scoring average
- Approach Golf (10% weight) — Iron play quality
- Driving (10% weight) — Accuracy and distance
- Short Game (15% weight) — Sand play, chipping, scrambling
- Putting (10% weight) — Putting average, SG
- Wind Performance (5% weight) — Historical wind scores
- Venue History (5% weight) — Performance at similar courses
- Recent SG Trends (5% weight) — Direction of recent play
- Momentum (5% weight) — Confidence/confidence from recent tournaments

**Data Sources**:
- ✅ player_statistics
- ✅ player_round_scores
- ✅ tournament_results
- ✅ player_rankings
- ✅ strokes_gained data

**Success Criteria**:
- Scores are 0-100 with clear distribution
- Top 5 fit scores are verified against course requirements
- Supporting factors total >50% of overall score
- Weaknesses identify genuine vulnerabilities
- Confidence reflects data completeness
- Ranked list is actionable for DFS decisions

---

### Phase 26.3: Weather Engine (3 hours)

**Objective**: Interpret weather implications for scoring and strategy

**Inputs**:
- Weather forecast (temperature, wind, rain)
- Course characteristics (elevation, wind exposure)
- Historical weather performance

**Outputs**:
- Morning vs afternoon advantage (condition + scoring impact)
- Suspension risk with probability and time windows
- Club selection implications
- DFS impact summary
- Confidence score

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/weather.ts
export class WeatherEngine {
  async generate(input: WeatherAnalysisInput): Promise<WeatherAnalysis> {
    // 1. Analyze wind (direction, speed, variability)
    // 2. Determine morning/afternoon advantage
    // 3. Calculate scoring impact (-5 to +5 strokes)
    // 4. Assess suspension risk
    // 5. Identify club selection changes
    // 6. Generate DFS impact
    // 7. Return structured analysis
  }
}
```

**Weather Factors**:
- Wind speed & direction (primary factor)
- Temperature (affects ball flight, course conditions)
- Humidity (affects ball flight)
- Precipitation (affects greens and rough)
- Elevation changes
- Course wind exposure

**Data Sources**:
- ✅ OpenWeather API (current forecast)
- ✅ Historical weather data
- ✅ Course elevation data

**Success Criteria**:
- Morning/afternoon advantage is clearly stated
- Scoring impact has numeric justification
- Club selection changes are specific
- DFS impact identifies which players benefit
- Confidence reflects forecast accuracy

---

### Phase 26.4: Field Strength Engine (2 hours)

**Objective**: Analyze tournament field quality and volatility

**Inputs**:
- Field composition (player rankings, experience)
- Major winners count
- Elite players count

**Outputs**:
- Overall strength (0-100)
- Breakdown by ranking bands (Top 10, 11-20, 21-50, etc)
- Major winners and elite players count
- Depth assessment
- Expected volatility
- Payout implications

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/field-strength.ts
export class FieldStrengthEngine {
  async analyze(field: TournamentField): Promise<FieldStrengthAnalysis> {
    // 1. Calculate % of world-ranked players
    // 2. Break down by ranking bands
    // 3. Count major winners
    // 4. Assess depth of talent
    // 5. Identify field weaknesses
    // 6. Predict volatility
    // 7. Explain payout implications
  }
}
```

**Data Sources**:
- ✅ tournament_fields table
- ✅ player_rankings table
- ✅ player_tournament_wins table

**Success Criteria**:
- Overall strength aligns with field composition
- Ranking breakdown shows distribution
- Volatility assessment is justified
- Payout implications are specific

---

### Phase 26.5: Course History Engine (4 hours)

**Objective**: Analyze venue history, past winners, and trends

**Inputs**:
- Tournament results (last 5-10 years)
- Player performance at venue
- Course changes/renovations

**Outputs**:
- Historical winners list with scores
- Repeated contenders
- Winning player profile
- Historical cut lines
- Scoring statistics
- Trends (difficulty increasing/decreasing)

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/course-history.ts
export class CourseHistoryEngine {
  async analyze(tournamentId: string): Promise<CourseHistoryAnalysis> {
    // 1. Query past tournaments at same course
    // 2. Extract winning scores and cut lines
    // 3. Identify repeated contenders
    // 4. Create winning player profile
    // 5. Calculate historical scoring stats
    // 6. Identify trends
    // 7. Return structured analysis
  }
}
```

**Data Sources**:
- ✅ tournament_results table
- ✅ tournament_rounds table
- ✅ player_round_scores table
- ✅ courses table

**Success Criteria**:
- Winners list shows consistent patterns
- Repeated contenders are verified
- Winning profile is actionable
- Trends are supported by data
- Cut line history shows at least 5 years

---

### Phase 26.6: DFS Strategy Engine (4 hours)

**Objective**: Generate format-specific recommendations

**Inputs**:
- Player fit scores
- Field strength analysis
- Weather analysis
- Salary data
- Current odds

**Outputs**:
- Cash strategy (recommendation + why + salary range)
- Single entry strategy (key players)
- Multi-entry strategy (differentiation)
- Large field strategy (leverage)

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/dfs-strategy.ts
export class DfsStrategyEngine {
  async generate(
    playerFits: PlayerFitScore[],
    fieldStrength: FieldStrengthAnalysis,
    weather: WeatherAnalysis,
    salaries: DfsSalary[],
  ): Promise<DfsStrategy> {
    // For each format:
    // 1. Identify key constraints (salary cap, scoring requirement)
    // 2. Generate primary recommendation
    // 3. Explain with data
    // 4. Suggest salary/player ranges
    // 5. Provide example reasoning
  }
}
```

**Format Strategies**:
- **Cash**: Minimize variance, lean on consensus
- **Single Entry**: Maximize ceiling, differentiate from field
- **Multi-Entry**: Explore ownership leverage, game theory
- **Large Fields**: Target 40-50% owned players for leverage

**Data Sources**:
- ✅ Player fit scores
- ✅ DFS salaries
- ✅ Ownership percentages
- ✅ Correlation analysis

**Success Criteria**:
- Each format has clear distinction
- Recommendations are supported by evidence
- Salary ranges are specific
- Example reasoning is provided

---

### Phase 26.7: Value Engine (3 hours)

**Objective**: Identify undervalued and overpriced players

**Inputs**:
- Player fit scores (quality indicator)
- DFS salaries
- Ownership percentages
- Correlation analysis

**Outputs**:
- Undervalued players (fit > salary expectation)
- Overpriced players (fit < salary expectation)
- Ceiling/floor scores
- Leverage opportunities

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/value.ts
export class ValueEngine {
  async analyze(
    playerFits: PlayerFitScore[],
    salaries: DfsSalary[],
    ownership: OwnershipData[],
  ): Promise<ValueAnalysis> {
    // 1. Calculate expected value of each player
    // 2. Compare to salary and ownership
    // 3. Identify undervalued (good fit, low salary, low ownership)
    // 4. Identify overpriced (low fit, high salary)
    // 5. Calculate ceiling/floor
    // 6. Identify leverage opportunities
  }
}
```

**Value Metrics**:
- Fit Score / Salary ratio
- Ownership leverage (low owned, high ceiling)
- Correlation gaps (uncorrelated players)

**Data Sources**:
- ✅ Player fit scores
- ✅ DFS salaries
- ✅ Ownership data

**Success Criteria**:
- Undervalued list shows actual inefficiencies
- Overpriced list is justified
- Ceiling/floor are data-backed
- Leverage opportunities are explained

---

### Phase 26.8: Tournament Storylines (3 hours)

**Objective**: Generate 5-10 meaningful data-backed narratives

**Inputs**:
- Player history (injuries, momentum)
- Course history
- Field composition changes
- Statistical anomalies

**Outputs**:
- 5-10 storylines
- Each with narrative, relevance, DFS impact
- Only data-backed (no speculation)

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/storylines.ts
export class StorylineEngine {
  async generate(
    field: TournamentField,
    courseHistory: CourseHistoryAnalysis,
    currentOdds: OddsData[],
  ): Promise<TournamentStoryline[]> {
    // Identify storylines:
    // 1. Injury comebacks
    // 2. Momentum runs
    // 3. Course changes/renovations
    // 4. Field composition anomalies
    // 5. Historical patterns
    // 6. Odds movements
    // 7. Repeated contenders
    // Create 5-10 high-relevance stories
  }
}
```

**Storyline Types**:
- Player injury returns
- Momentum/recent form
- Course changes
- Field weaknesses
- Historical trends
- Odds anomalies
- Repeated contenders
- Statistical outliers

**Data Sources**:
- ✅ Player history
- ✅ Tournament results
- ✅ Injury data
- ✅ Odds movements

**Success Criteria**:
- Each story is 2-3 sentences max
- All stories are data-backed
- DFS impact is clear
- 5-10 stories total
- No speculation or commentary

---

### Phase 26.9: Executive Summary (2 hours)

**Objective**: Create 2-3 minute briefing covering key insights

**Inputs**:
- All 10 modules (summary data)
- Key player fit scores
- Weather implications
- Field composition

**Outputs**:
- Compelling headline
- Key takeaway (1 sentence)
- Must-know points (3-5 bullets)
- Quick recommendation
- 2-3 minute read time

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/executive-summary.ts
export class ExecutiveSummaryModule {
  async generate(allModules: AllIntelligence): Promise<ExecutiveSummary> {
    // 1. Identify headline from course + field + weather combo
    // 2. Create 1-sentence key takeaway
    // 3. Extract 3-5 must-know points from modules
    // 4. Generate quick recommendation
    // 5. Target 300-400 words (2-3 min read)
  }
}
```

**Success Criteria**:
- Headline captures tournament essence
- Key takeaway is actionable
- Must-know points are specific
- Recommendation is clear
- Readable in 2-3 minutes

---

### Phase 26.10: Explainability & Source Attribution (3 hours)

**Objective**: Complete audit trail for every recommendation

**Inputs**:
- All 10 modules (with source data)
- Data quality metrics
- Missing inputs tracking

**Outputs**:
- Supporting facts with sources and confidence
- Data quality score (0-100)
- Missing inputs list
- Limitations list
- Source attribution
- Reasoning trail
- Unknowns

**Implementation**:
```typescript
// lib/tournament-intelligence/modules/explainability.ts
export class ExplainabilityModule {
  async generate(
    modules: AllIntelligence,
    dataQuality: DataQualityMetrics,
  ): Promise<ExplainabilityReport> {
    // 1. Collect supporting facts from each module
    // 2. Tag sources (API, DATABASE, CALCULATED, HISTORICAL)
    // 3. Assign confidence to each fact
    // 4. List missing inputs
    // 5. Document limitations
    // 6. Explain reasoning chain
    // 7. Identify unknowns
  }
}
```

**Success Criteria**:
- Every recommendation has supporting facts
- Sources are documented
- Data quality reflects available data
- Missing inputs are clear
- Limitations are honest
- No black boxes

---

## INTEGRATION POINTS

Once all 10 modules are complete, integrate the engine into:

1. **Dashboard** (`/dashboard`)
   - Executive summary card
   - Top 5 fit scores
   - Value plays
   - Key storyline

2. **Tournament Detail** (`/tournaments/[id]`)
   - All 10 modules displayed
   - Professional analyst perspective
   - Source attribution badges
   - Explainability details

3. **Slate Analysis** (`/slate-analysis`)
   - DFS strategy module
   - Value plays
   - Cash vs multi-entry breakdown
   - Player fit scores

4. **Player Profiles** (`/players/[id]`)
   - Course fit score
   - Recent form
   - Ceiling/floor
   - Value assessment

5. **AI Chat** (Chat interface)
   - Query against intelligence engine
   - Ask follow-up questions
   - Get explanations

6. **Optimizer** (Lineup optimizer)
   - Use player fit scores
   - Value metrics
   - Correlation analysis
   - Constraint modeling

7. **Weekly Reports**
   - Executive summary
   - Key storylines
   - Value plays
   - Recommendations

---

## SUCCESS CRITERIA

When complete:

✅ Every recommendation is evidence-based  
✅ Every conclusion is explainable  
✅ Every insight is reusable  
✅ All pages consume same engine  
✅ No isolated page-specific logic  
✅ Complete audit trail available  
✅ Black-box AI not involved yet  

---

## IMPLEMENTATION TIMELINE

| Phase | Module | Hours | Complexity |
|-------|--------|-------|-----------|
| 26.1 | Course Analysis | 4 | Medium |
| 26.2 | Player Fit Engine | 6 | High |
| 26.3 | Weather Engine | 3 | Medium |
| 26.4 | Field Strength | 2 | Low |
| 26.5 | Course History | 4 | Medium |
| 26.6 | DFS Strategy | 4 | Medium |
| 26.7 | Value Engine | 3 | Low |
| 26.8 | Storylines | 3 | Medium |
| 26.9 | Executive Summary | 2 | Low |
| 26.10 | Explainability | 3 | Low |
| Integration | All pages | 8 | High |
| **Total** | | **42 hours** | **Medium-High** |

---

## READY TO BEGIN

Architecture is complete and committed.  
All types are defined.  
Module stubs are in place.  

Next step: Implement Phase 26.1 (Course Analysis Module)

