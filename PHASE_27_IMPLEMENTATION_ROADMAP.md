# Phase 27 — Decision Engine Implementation Roadmap

**Status**: Architecture Complete | Implementation Ready  
**Date**: July 21, 2026  
**Scope**: Build and integrate the centralized Decision Engine  

---

## MISSION

Transform verified tournament intelligence into explainable player recommendations that power the entire CaddieIQ platform.

Every golfer should have:
- **WHO**: Clear identification of top plays
- **WHY**: Evidence-based reasoning (not black box)
- **HOW**: Specific contest type recommendations
- **WHEN**: When to play, when to fade
- **RISK**: Complete risk assessment

One engine. All pages. All decisions.

---

## ARCHITECTURE COMPLETE ✅

### Type System (366 lines)
- `PlayerDecisionProfile` — 15+ attributes per golfer
- `DecisionTag` — Evidence-based recommendation tags
- `ContestSuitability` — Format-specific recommendations
- `LineupRole` — How to use player in lineups
- `PlayerComparison` — Head-to-head analysis
- `RiskProfile` — Comprehensive risk assessment
- `OwnershipAnalysis` — Ownership context
- `ExplainabilityReport` — Complete audit trail
- `DecisionEngineOutput` — Reusable for all pages

### Decision Engine (605 lines)
- Single entry point: `DecisionEngine.generate(input)`
- Scores every player across 8 dimensions
- Calculates ownership, projections, volatility
- Assesses risk with probabilities
- Generates analyst summaries
- Produces decision tags with evidence
- Recommends contest types and lineup roles
- Builds complete explainability report

### Usage Pattern
```typescript
// Any page can consume the engine:
const decisions = await DecisionEngine.generate({
  tournamentId,
  field,
  tournamentIntelligence,
  playerStats,
  dfsSalaries,
  currentOdds,
  weatherForecast,
  historicalData,
})

// Access player decisions:
decisions.playerDecisions          // All players scored
decisions.topRecommendations.elite // Best plays
decisions.topRecommendations.core  // Secondary plays
decisions.fadeList                 // Recommendations to avoid
decisions.explainability           // Complete audit trail
```

---

## IMPLEMENTATION SCHEDULE

### Phase 27.1: Rating Calculation Engine (6 hours)

**Objective**: Implement all 8 rating factors with real data

**Factors to Calculate**:

1. **Course Fit (25% weight)**
   - Query course analysis from Tournament Intelligence Engine
   - Compare player skill profile to course requirements
   - Extract from: player_statistics, course characteristics
   - Source: DATABASE
   - Expected range: 0-100

2. **Current Form (20% weight)**
   - Query last 10 tournament results
   - Calculate average DFS points
   - Calculate scoring trend (improving/declining/stable)
   - Extract from: player_round_scores, tournament_results
   - Source: DATABASE
   - Expected range: 0-100

3. **Statistical Match (15% weight)**
   - Compare player SG metrics to course requirements
   - Driving accuracy vs fairway width
   - Approach vs green difficulty
   - Short game vs course design
   - Extract from: player_statistics, course_characteristics
   - Source: DATABASE + CALCULATED
   - Expected range: 0-100

4. **Salary Value (10% weight)**
   - Calculate expected salary based on fit
   - Compare actual vs expected
   - Formula: (Expected - Actual) / Expected * 100
   - Extract from: dfsSalaries table
   - Source: CALCULATED
   - Expected range: 0-100

5. **Ownership Leverage (10% weight)**
   - Lower ownership + higher ceiling = better leverage
   - Formula: (100 - ownership%) * (ceiling / 100) * 100
   - Extract from: ownership_projections, ceiling calculation
   - Source: CALCULATED + PROJECTION
   - Expected range: 0-100

6. **Weather Impact (8% weight)**
   - Query weather engine from Tournament Intelligence
   - Identify which conditions favor this player
   - Wind vs driving distance
   - Rain vs accuracy
   - Temperature vs course conditions
   - Extract from: weather_engine, player_statistics
   - Source: API + CALCULATED
   - Expected range: 0-100

7. **Vegas Confidence (7% weight)**
   - Extract from current odds
   - Odds position relative to field
   - Odds movement direction
   - Extract from: odds_quotes table
   - Source: API
   - Expected range: 0-100

8. **Historical Success (5% weight)**
   - Query performance at similar courses
   - Similar hole layouts
   - Similar conditions
   - Similar field strength
   - Extract from: tournament_results, player_round_scores
   - Source: DATABASE + CALCULATED
   - Expected range: 0-100

**Implementation**:
```typescript
// lib/decision-engine/modules/ratings.ts
export class RatingCalculator {
  static calculateCourseFit(player, courseAnalysis, playerStats): number {
    // 1. Get skills rewarded from courseAnalysis
    // 2. Score player on each skill
    // 3. Weight by importance
    // 4. Return 0-100 score
  }
  
  static calculateCurrentForm(playerId): number {
    // 1. Query player's last 10 tournaments
    // 2. Calculate average DFS points
    // 3. Calculate trend (slope of results)
    // 4. Weight by recency
    // 5. Return 0-100 score
  }
  
  // ... similar for other 6 factors
}
```

**Data Sources**:
- ✅ player_statistics
- ✅ player_round_scores
- ✅ tournament_results
- ✅ course_characteristics
- ✅ odds_quotes
- ✅ Tournament Intelligence Engine

**Success Criteria**:
- Each factor returns 0-100
- Factors align with intuition (better form = higher rating)
- Weights are correct (course fit is 25% of rating)
- Overall rating distribution makes sense (spread 20-95, no clustering)
- Top 5 players match human expectations

**Tests**:
- Unit tests for each factor
- Integration tests with sample tournament
- Spot checks: elite players score 75+, poor fits score <50

---

### Phase 27.2: Risk Assessment Engine (4 hours)

**Objective**: Identify and quantify player risks

**Risk Factors to Calculate**:

1. **Missed Cut Risk**
   - Query historical missed cut rate
   - Adjust for current form
   - Adjust for field strength
   - Extract from: tournament_results, player statistics
   - Formula: Base rate * form adjustment * field adjustment
   - Output: 0-100 probability

2. **Volatility Risk**
   - Calculate standard deviation of recent scores
   - Higher std dev = higher volatility
   - Extract from: player_round_scores (last 20 tournaments)
   - Formula: std_dev of scores / average score
   - Output: 0-100 rating

3. **Weather Sensitivity**
   - Query historical performance in various weather
   - Wind: Does player perform worse in wind?
   - Rain: Does accuracy drop in wet conditions?
   - Temperature: Does player fatigue in heat?
   - Extract from: tournament_results with weather data
   - Formula: Performance variance across weather conditions
   - Output: 0-100 rating

4. **Injury Concerns**
   - Query injury status from external source
   - Check recent withdrawals
   - Check recent missed cuts
   - Output: None | Minor | Significant | Severe

5. **Recent Inconsistency**
   - Calculate coefficient of variation (std_dev / mean)
   - Higher CV = more inconsistent
   - Extract from: player_round_scores (last 10 tournaments)
   - Output: 0-100 rating + Improving/Declining/Stable trend

**Overall Risk Level**:
```
Very Low:   All risks < 25 & missed cut < 10%
Low:        No risks > 60 & missed cut < 20%
Moderate:   Some risks 40-70 or missed cut 20-35%
High:       Risks > 70 or missed cut > 50%
Very High:  Multiple risks > 75 or missed cut > 60%
```

**Risk Adjustment to Overall Rating**:
- Very Low risk: +5 to rating
- Low risk: +2 to rating
- Moderate risk: 0 adjustment
- High risk: -5 to rating
- Very High risk: -10 to rating

**Implementation**:
```typescript
// lib/decision-engine/modules/risk.ts
export class RiskAssessment {
  static assessMissedCutRisk(playerId, fieldStrength): number {
    // 1. Query player's historical missed cut rate
    // 2. Adjust for field strength
    // 3. Adjust for current form
    // 4. Return 0-100 probability
  }
  
  static assessVolatilityRisk(playerId): number {
    // 1. Get last 20 tournament scores
    // 2. Calculate std dev
    // 3. Normalize to 0-100
  }
  
  // ... similar for other factors
  
  static buildCompleteProfile(playerId, field, weather): RiskProfile {
    // Combine all risks into RiskProfile object
    // Calculate overall risk level
    // Calculate rating adjustment
  }
}
```

**Data Sources**:
- ✅ player_round_scores
- ✅ tournament_results
- ✅ Player API (injury status)
- ✅ Weather API

**Success Criteria**:
- Missed cut risk aligns with player quality
- Volatility risk identifies inconsistent performers
- Weather sensitivity identifies weather-sensitive players
- Overall risk level makes intuitive sense
- Risk adjustment is applied consistently

**Tests**:
- Players with 0 missed cuts in 100+ rounds should have < 5% risk
- Inconsistent player should score > 60 on volatility risk
- Elite players should have Very Low overall risk

---

### Phase 27.3: Ownership & Projection Engine (3 hours)

**Objective**: Project ownership and DFS scoring range

**Ownership Projection**:
- Start with base ownership (25% of field)
- Adjust for course fit rating (+1% per 10 fit points above 60)
- Adjust for current form rating (+0.5% per 10 form points above 60)
- Adjust for salary value (-0.5% per 10 salary value points)
- Adjust for Vegas odds (high odds = higher ownership)
- Ensure market reality (popular players stay popular)
- Expected output: 5-50% range

**DFS Projections**:
- Calculate baseline from course fit + current form
- Baseline DFS = (courseFit + currentForm) / 2.5
- Apply weather impact (±10% range)
- Apply volatility adjustment (lower confidence for volatile)
- Add ceiling: baseline * 1.3
- Add floor: baseline * 0.7
- Apply salary context (higher salary = higher ceiling expectation)

**Implementation**:
```typescript
// lib/decision-engine/modules/projections.ts
export class ProjectionEngine {
  static projectOwnership(
    player,
    courseFit,
    currentForm,
    salaryValue,
    vegasOdds
  ): number {
    // 1. Start with 25% base
    // 2. Apply adjustments
    // 3. Clip to realistic range (5-50%)
    // 4. Return ownership percentage
  }
  
  static calculateProjections(
    courseFit,
    currentForm,
    weatherImpact,
    volatility,
    salary
  ): { ceiling: number; floor: number } {
    // 1. Calculate baseline
    // 2. Apply adjustments
    // 3. Calculate ceiling (baseline * 1.3)
    // 4. Calculate floor (baseline * 0.7)
    // 5. Return range
  }
}
```

**Data Sources**:
- ✅ Rating calculations
- ✅ odds_quotes
- ✅ dfsSalaries
- ✅ Weather engine

**Success Criteria**:
- Ownership projections seem realistic
- Elite players 30-50% ownership
- Secondary players 15-30%
- Value plays 5-20%
- Ceilings are optimistic but possible
- Floors are realistic worst-case

---

### Phase 27.4: Analyst Summary & Tags (3 hours)

**Objective**: Generate readable summaries and decision tags

**Analyst Summary**:
- 1-2 sentences capturing why player is recommended
- Or why player should be avoided
- Use adjectives from data (elite, solid, risky, etc)
- Include specific reasons (excellent fit, strong form)
- Include leverage context if applicable

**Example Formats**:
- Elite Play: "Scottie Scheffler projects as one of the strongest overall plays this week due to elite approach play, excellent recent form, and outstanding performance on comparable courses."
- Leverage Play: "Jordan Spieth offers excellent value at his salary with good course fit and lower projected ownership, creating leverage in large-field tournaments."
- Fade: "Rory McIlroy faces headwinds with his current form on a course that doesn't reward his skill set, suggesting limited upside at his salary."

**Decision Tags** (with confidence and evidence):
- Elite Play (confidence + why)
- Core Play (confidence + why)
- Cash Lock (confidence + why)
- High Ceiling (confidence + why)
- Boom/Bust (confidence + why)
- Contrarian (confidence + why)
- Value (confidence + why)
- Fade (confidence + why)
- Risky Chalk (confidence + why)
- Weather Boost (confidence + why)
- Course Horse (confidence + why)
- Balanced Option (confidence + why)

**Implementation**:
```typescript
// lib/decision-engine/modules/summaries.ts
export class SummaryGenerator {
  static generateAnalystSummary(
    player,
    rating,
    courseFit,
    currentForm,
    ownership,
    risk
  ): string {
    // 1. Determine strength level from rating
    // 2. Describe fit from courseFit
    // 3. Describe form from currentForm
    // 4. Describe ownership impact
    // 5. Assemble 1-2 sentence summary
  }
  
  static generateTags(
    rating,
    courseFit,
    currentForm,
    ownership,
    ceiling,
    floor,
    risk,
    weather
  ): DecisionTag[] {
    // 1. Identify applicable tags
    // 2. Gather supporting evidence
    // 3. Assign confidence based on evidence
    // 4. Return array of tags
  }
}
```

**Data Sources**:
- ✅ All rating calculations
- ✅ Risk assessment
- ✅ Ownership projections

**Success Criteria**:
- Summaries are 1-2 sentences
- Tags match the player's profile
- Every tag has supporting evidence
- Language is professional, not sensational
- Multiple readers agree with assessment

---

### Phase 27.5: Contest Suitability & Lineup Roles (3 hours)

**Objective**: Recommend contest types and lineup roles

**Contest Suitability**:
- **Cash Games**: Floor > 30 DFS points? Rating > 70?
  - Suitable: "Excellent" (elite floor/ceiling)
  - Suitable: "Good" (strong floor)
  - Not suitable: "Poor" (risky floor)

- **Single Entry**: Ceiling > 65? Lower ownership?
  - Suitable: "Good" (ceiling upside)
  - Not suitable: "Fair" (moderate ceiling)

- **Multi-Entry**: Ceiling/floor spread > 15?
  - Suitable: "Good" (volume upside)

- **Large Field GPP**: Ownership < 25%? Ceiling > 60?
  - Suitable: "Good" (leverage + ceiling)
  - Not suitable: "Poor" (high ownership or low ceiling)

**Lineup Roles**:
- **Core Piece**: Rating > 75, build around this player
- **Tournament Pivot**: Ownership < 20%, ceiling > 70, create differentiation
- **Last Man In**: Salary < 8500, decent fit, value play
- **Salary Saver**: Salary < 8000, floor still > 25
- **High Ceiling Anchor**: Salary > 11000, ceiling > 80, chalk
- **Ownership Pivot**: Ownership > 40%, fade in contrarian builds
- **Leverage Play**: Ownership < 15%, use in large fields
- **Balanced Build**: Rating 55-70, reliable contributor
- **Fade**: Ownership > 50% and rating < 60, avoid

**Implementation**:
```typescript
// lib/decision-engine/modules/contest-roles.ts
export class ContestAndRoleEngine {
  static assessContestSuitability(
    rating,
    ceiling,
    floor,
    volatility,
    ownership,
    salary
  ): ContestSuitability[] {
    // 1. For each contest type, assess suitability
    // 2. Provide reasoning
    // 3. Return array of contest recommendations
  }
  
  static determineLineupRoles(
    rating,
    ownership,
    ceiling,
    floor,
    salary,
    fieldSize
  ): LineupRole[] {
    // 1. Identify applicable roles
    // 2. Provide explanation
    // 3. Return array of recommended roles
  }
}
```

**Data Sources**:
- ✅ All previous calculations
- ✅ dfsSalaries
- ✅ Field composition

**Success Criteria**:
- Cash players have strong floors
- Single entry players have ceiling upside
- Large field recommendations prioritize leverage
- Roles make intuitive sense
- Different roles for different player profiles

---

### Phase 27.6: Explainability & Audit Trail (3 hours)

**Objective**: Complete transparency for every recommendation

**Supporting Facts**:
- Every recommendation backed by 3+ facts
- Facts include: stat name, value, source, confidence
- Sources: DATABASE, API, CALCULATED, HISTORICAL, MODEL
- Confidence: 0-100 (reflects data quality)

**Reasoning Chain**:
- Step-by-step explanation of how decision was made
- Inputs and outputs for each step
- How factors combine to create overall rating

**Missing Inputs**:
- What data would improve this recommendation?
- Impact of missing data (Critical, Important, Minor)

**Limitations**:
- What assumptions are we making?
- What could change the recommendation?
- What are we not accounting for?

**Unknowns**:
- What don't we know?
- How would it affect the recommendation?

**Data Quality Score**:
- 0-100 rating of data completeness
- Affected by: missing stats, age of data, forecast uncertainty
- Displayed as confidence level: Very High, High, Moderate, Low, Very Low

**Implementation**:
```typescript
// lib/decision-engine/modules/explainability.ts
export class ExplainabilityEngine {
  static buildExplainabilityReport(
    player,
    allRatings,
    riskAssessment,
    ownership,
    projections
  ): ExplainabilityReport {
    // 1. Gather supporting facts
    // 2. Build reasoning chain
    // 3. Identify missing inputs
    // 4. List limitations
    // 5. Identify unknowns
    // 6. Calculate data quality score
    // 7. Determine confidence level
  }
}
```

**Data Sources**:
- ✅ All calculations with source tracking
- ✅ Data quality metrics

**Success Criteria**:
- Every recommendation has 3+ supporting facts
- Reasoning chain is understandable
- Data quality score reflects reality
- User can trace decision back to input data
- No black boxes

---

### Phase 27.7: Player Comparison Engine (2 hours)

**Objective**: Head-to-head comparison between any two players

**Comparison Dimensions**:
- Course Fit: Which player better suited to course?
- Current Form: Whose recent results are better?
- Ownership: Which offers more leverage?
- Salary: Which is better value?
- Projection: Ceiling and floor comparison
- Risk: Which is safer play?
- AI Recommendation: Who should you play?

**Implementation**:
```typescript
// lib/decision-engine/modules/comparison.ts
export class PlayerComparisonEngine {
  static compare(player1Id, player2Id, allDecisions): PlayerComparison {
    // 1. Get both players' decision profiles
    // 2. Compare each dimension
    // 3. Determine winner for each
    // 4. Provide overall recommendation
  }
}
```

**Data Sources**:
- ✅ PlayerDecisionProfile for both players

**Success Criteria**:
- Comparison clearly explains differences
- Winner is justified by evidence
- Could be "Context Dependent" if situation matters

---

### Phase 27.8: Integration Across All Pages (8 hours)

**Objective**: Replace page-specific logic with Decision Engine

**Pages to Update**:

1. **Dashboard**
   - Display top 5 elite plays
   - Show top 5 value plays
   - Highlight contrarian plays
   - Consume: `decisions.topRecommendations`

2. **Tournament Detail**
   - Display all players with decision profiles
   - Show decision tags
   - Show supporting evidence
   - Allow sorting by various metrics
   - Consume: `decisions.playerDecisions`

3. **Player Profile** (`/players/[id]`)
   - Show this player's decision profile
   - Show 3 closest comparisons
   - Show contest suitability
   - Show recommended roles
   - Consume: `decisions.playerDecisions.find(id)`

4. **Slate Analysis**
   - Show top plays for slate
   - Show value plays
   - Show contest recommendations
   - Show example lineups
   - Consume: `decisions.playerDecisions`

5. **Optimizer**
   - Use player ratings as constraints
   - Use ceiling/floor for projections
   - Respect fade recommendations
   - Consume: `decisions.playerDecisions`

6. **AI Chat**
   - Query against decision profiles
   - Answer: "Who should I play?"
   - Answer: "Compare X vs Y"
   - Answer: "What's wrong with this player?"
   - Consume: `decisions.playerDecisions`

7. **Weekly Tournament Report**
   - Executive summary from decisions
   - Top plays
   - Key storylines
   - Value plays
   - Consume: `decisions.topRecommendations`

8. **Admin Dashboard**
   - Show how decisions are calculated
   - Show data quality metrics
   - Show engine health
   - Consume: `decisions.explainability`

**Implementation Pattern**:
```typescript
// Every page should do:
const decisions = await DecisionEngine.generate(input)
const playerDecision = decisions.playerDecisions.find(p => p.playerId === id)

// Then display player decision profile
<PlayerDecisionCard profile={playerDecision} />
```

**Data Sources**:
- ✅ DecisionEngineOutput

**Success Criteria**:
- All pages use same engine
- No page-specific calculation
- No logic duplication
- Consistent recommendations everywhere
- UI components consume PlayerDecisionProfile

---

## COMPLETE IMPLEMENTATION

**Total Effort**: 32 hours

| Phase | Component | Hours | Complexity |
|-------|-----------|-------|-----------|
| 27.1 | Rating Calculator | 6 | High |
| 27.2 | Risk Assessment | 4 | Medium |
| 27.3 | Projections | 3 | Medium |
| 27.4 | Summaries & Tags | 3 | Low |
| 27.5 | Contests & Roles | 3 | Low |
| 27.6 | Explainability | 3 | Medium |
| 27.7 | Comparison Engine | 2 | Low |
| 27.8 | Integration | 8 | High |
| **Total** | | **32 hours** | **Medium** |

---

## SUCCESS CRITERIA

When complete:

✅ Every player has a decision profile  
✅ Every recommendation is explainable  
✅ No black-box recommendations  
✅ All pages consume same engine  
✅ No page-specific calculation logic  
✅ Complete audit trail available  
✅ Users understand why they're recommended  
✅ Users can make confident DFS decisions  

---

## NEXT PHASE

Once Decision Engine is complete:
- Phase 28: AI Chat Integration (chat against decisions)
- Phase 29: Optimizer Integration (use decisions for lineup building)
- Phase 30: Advanced Analytics (player comparisons, correlations)

---

## READY TO BEGIN

Architecture is complete and committed.  
All types are defined.  
Engine scaffolding is in place.  

Next step: Begin Phase 27.1 (Rating Calculation Engine)

