# Phase 29 — AI Lineup Builder & Explainable Optimizer Implementation Roadmap

**Status**: Architecture Complete | Implementation Ready  
**Date**: July 21, 2026  
**Scope**: Build core optimization algorithms with complete explainability  
**Estimated Effort**: 80 hours across 12 phases  

---

## MISSION

Build an optimizer that feels like working with an experienced DFS analyst, not clicking a black-box button.

Every recommendation must answer:
- **Why was this golfer selected?**
- **What are the alternatives?**
- **What are the risks?**
- **How does this fit my strategy?**

---

## ARCHITECTURE SUMMARY

### Type System (407 lines)
Complete definitions for:
- 8 contest types (cash, single entry, GPP formats)
- 10+ strategy profiles (floor, ceiling, leverage, etc)
- 9-factor player grading (projection, ceiling, floor, ownership, leverage, correlation, risk, weather, course fit)
- 10-factor lineup grading (all above + overall)
- Player explanations with sources
- Lineup explanations with reasoning
- Constraints (locks, excludes, groups)
- Exports (CSV, printable, shareable)

### Optimizer Engine (505 lines)
Master orchestrator:
- `OptimizerEngine.generate()` - Main entry point
- Player scoring across 9 dimensions
- Lineup building with constraint satisfaction
- Grade calculation for players and lineups
- Stack analysis for combinations
- Lineup comparison
- What-if scenario analysis
- Multiple export formats

---

## IMPLEMENTATION PHASES

### Phase 29.1: Core Player Scoring (10 hours)

**Objective**: Implement the 9-factor player scoring algorithm

**Inputs**:
- Decision Engine player ratings
- DFS salaries
- Course fit scores
- Recent form data
- Ownership projections
- Weather impact
- Vegas odds

**Implement**:
```typescript
// Core scoring function
scorePlayer(decision, input, previouslySelected): PlayerGrades {
  // 1. Course Fit (20% weight) - how well skills match course
  // 2. Current Form (20% weight) - recent tournament results
  // 3. Statistical Match (15% weight) - underlying stats vs requirements
  // 4. Salary Value (15% weight) - points per dollar
  // 5. Ownership (10% weight) - inverse ownership (lower = higher score)
  // 6. Leverage (10% weight) - differentiation opportunity
  // 7. Weather Impact (5% weight) - conditions favor?
  // 8. Correlation (5% weight) - lineup fit vs previous selections
  // 9. Risk Adjustment (5% weight) - missed cut risk, volatility
  
  // Return: PlayerGrades with 0-100 score for each factor
}
```

**Success Criteria**:
- Scores align with tournament intelligence
- Ownership consideration creates leverage opportunities
- Weather factors properly weighted
- Final scores show clear differentiation
- Top 5 players are reasonable

---

### Phase 29.2: Lineup Building Algorithm (12 hours)

**Objective**: Build 6-player lineups respecting salary cap and constraints

**Algorithm**:
1. Generate candidate sets based on strategy
2. Test all valid combinations ($50K salary cap)
3. Apply constraints (locks, excludes)
4. Score each valid lineup on 10 dimensions
5. Select diverse top lineups

**Approaches to Test**:
- Greedy selection (highest score first)
- Integer linear programming
- Randomized + ranking
- Custom heuristic

**Implementation**:
```typescript
buildLineup(
  input: OptimizerInput,
  playerScores: Map<string, PlayerGrades>,
  strategyIndex: number
): LineupExplanation {
  // 1. Apply strategy weights (what matters for this strategy?)
  // 2. Apply constraints (respecting locks/excludes)
  // 3. Apply previous lineup diversity (don't duplicate)
  // 4. Select 6 golfers optimizing for combined grade
  // 5. Verify salary constraint ($50K)
  // 6. Build explanation with reasoning
  // 7. Return LineupExplanation
}
```

**Success Criteria**:
- All lineups respect $50K salary cap
- Constraints properly enforced
- Diversity across multiple lineups
- Lineup grades make sense
- Build time < 2 seconds for 5 lineups

---

### Phase 29.3: Strategy Profiles Implementation (8 hours)

**Objective**: Implement 10+ predefined strategies with different weights

**Strategies**:

| Strategy | Focus | Weights |
|----------|-------|---------|
| Highest Floor | Safety | Floor: 40%, Projection: 30%, Risk: 30% |
| Highest Ceiling | Upside | Ceiling: 40%, Projection: 30%, Leverage: 30% |
| Balanced | Equilibrium | All factors: ~10% each |
| Aggressive GPP | Big upside, high risk | Ceiling: 40%, Leverage: 30%, Risk tolerance |
| Leverage | Ownership contrast | Leverage: 40%, Ownership inverse: 30%, Projection: 30% |
| Stars and Scrubs | Elite + value | Top tier: high weights, Others: value focus |
| Balanced Build | Gradual exposure | Medium weights across all factors |
| Weather Edge | Weather advantage | Weather: 30%, Course fit: 25%, Projection: 25% |
| Course Specialists | Venue expertise | Course fit: 40%, Historical: 30%, Projection: 30% |
| Recent Form | Hot hands | Recent form: 40%, Momentum: 30%, Projection: 30% |

**Implementation**:
```typescript
applyStrategy(
  playerScores: PlayerGrades,
  strategy: StrategyProfile
): AdjustedScores {
  // Apply strategy-specific weighting to base scores
  // Return weighted scores for lineup building
}
```

---

### Phase 29.4: Constraint Satisfaction (6 hours)

**Objective**: Enforce lineup constraints (locks, excludes, groups)

**Constraints**:
- Lock players (must include)
- Exclude players (cannot include)
- Minimum/maximum exposure (% of lineups)
- Salary floors/ceilings
- Player groups (e.g., "max 1 from this group")

**Implementation**:
```typescript
validateLineup(
  lineup: string[],  // 6 player IDs
  constraints: OptimizerConstraints
): boolean {
  // 1. Check locked players present
  // 2. Check no excluded players
  // 3. Check groups satisfied
  // 4. Check salary valid
  // Return: valid or invalid
}
```

---

### Phase 29.5: Stack Analysis & Correlation (8 hours)

**Objective**: Analyze player combinations for synergy and risk

**Analysis**:
- Which players correlate positively?
- Which combinations are risky?
- What's the ownership overlap?
- How diversified is the stack?

**Implementation**:
```typescript
analyzeStack(players: PlayerExplanation[]): StackAnalysis[] {
  // 1. Identify natural stacks (same wave, same course type)
  // 2. Calculate correlation scores
  // 3. Assess risk concentration
  // 4. Identify negative combinations
  // 5. Return StackAnalysis
}
```

---

### Phase 29.6: Pivot Engine & Alternatives (8 hours)

**Objective**: For each player, identify reasonable alternatives

**Pivot Types**:
- **Best Pivot** - Best replacement (higher ceiling)
- **Safer Pivot** - Lower volatility alternative
- **Lower-Owned Pivot** - Contrarian replacement
- **Higher-Ceiling Pivot** - Upside alternative
- **Salary Pivots** - Various salary points

**Implementation**:
```typescript
generatePivots(
  player: PlayerExplanation,
  field: TournamentField,
  constraints: OptimizerConstraints
): PivotOptions {
  // For each pivot type:
  // 1. Find candidates
  // 2. Score on specific dimension
  // 3. Verify constraints allow swap
  // 4. Calculate impact
  // 5. Return PivotOptions
}
```

---

### Phase 29.7: Lineup Comparison & What-If (8 hours)

**Objective**: Compare lineups and run dynamic what-if scenarios

**Comparison**:
- Which players differ?
- Projection/ceiling/floor differences?
- Ownership differences?
- Which lineup for which format?

**What-If Scenarios**:
- "What if I fade Scottie?"
- "What if weather changes?"
- "What if ownership rises to 30%?"
- Instantly rebuild lineup and compare

**Implementation**:
```typescript
compareLineups(
  lineup1: LineupExplanation,
  lineup2: LineupExplanation
): LineupComparison {
  // 1. Identify differing players
  // 2. Calculate metric differences
  // 3. Determine advantages of each
  // 4. Recommend best for each format
}

async whatIf(
  lineup: LineupExplanation,
  modification: string,
  input: OptimizerInput
): Promise<WhatIfScenario> {
  // 1. Parse modification (fade Scottie, weather change, etc)
  // 2. Rebuild lineup with modification
  // 3. Compare to original
  // 4. Explain changes and new recommendation
}
```

---

### Phase 29.8: Player Explanations & Reasoning (8 hours)

**Objective**: Build detailed explanations for each player selection

**For Each Player**:
- Why selected (primary reason + 2-3 supporting)
- Course fit explanation
- Recent form assessment
- Ownership context
- Ceiling/floor analysis
- Risks and concerns
- Pivot options
- Confidence level

**Implementation**:
```typescript
buildPlayerExplanation(
  decision: PlayerDecisionProfile,
  grades: PlayerGrades,
  input: OptimizerInput
): PlayerExplanation {
  // 1. Extract from Decision Engine
  // 2. Calculate grades
  // 3. Build why-selected narrative
  // 4. Add supporting facts
  // 5. Generate pivots
  // 6. Return PlayerExplanation
}
```

---

### Phase 29.9: Lineup Grades & Summary (6 hours)

**Objective**: Calculate comprehensive lineup grades

**10 Factors**:
1. **Projection Grade** - Expected points (0-100)
2. **Ceiling Grade** - Best case (0-100)
3. **Floor Grade** - Worst case (0-100)
4. **Ownership Grade** - Ownership construction quality
5. **Leverage Grade** - Differentiation from field
6. **Correlation Grade** - Player synergy
7. **Risk Grade** - Overall risk level
8. **Weather Grade** - Weather suitability
9. **Course Fit Grade** - Venue specialization
10. **Overall Grade** - Composite score

**Implementation**:
```typescript
calculateLineupGrades(players: PlayerExplanation[]): LineupGrades {
  // For each grade factor:
  // 1. Aggregate player grades
  // 2. Apply contest-specific weighting
  // 3. Return 0-100 score
  // 4. Calculate overall
}
```

---

### Phase 29.10: Explainability & Sources (6 hours)

**Objective**: Build complete audit trail with sources

**For Each Recommendation**:
- Supporting facts with sources
- Confidence level
- Data quality assessment
- Missing inputs
- Known limitations
- Assumptions made
- Intelligence used

**Implementation**:
```typescript
buildExplainability(
  lineup: LineupExplanation,
  input: OptimizerInput
): LineupExplanation {
  // Add explainability properties:
  // - sources of each fact
  // - confidence for each claim
  // - completeness assessment
  // - limitations and unknowns
  // - assumptions documented
}
```

---

### Phase 29.11: Export & Persistence (5 hours)

**Objective**: Multiple output formats and lineup persistence

**Exports**:
- DraftKings CSV format
- Printable summary
- Shareable link
- JSON for storage

**Persistence**:
- Save lineups with names
- Track performance (if desired)
- Version history
- Lineup archives

**Implementation**:
```typescript
export(lineup: LineupExplanation, format: ExportFormat): string {
  if (format === 'draftkings-csv') {
    // Generate DraftKings CSV
  } else if (format === 'printable') {
    // Generate readable summary
  }
  // etc
}

saveLineup(lineup: LineupExplanation, name: string): SavedLineup {
  // Persist to database
  // Track metadata and performance
}
```

---

### Phase 29.12: Integration & UI (12 hours)

**Objective**: Integrate optimizer into CaddieIQ interface

**Integration Points**:
1. **Optimizer Page** (`/optimizer`)
   - Generate lineups
   - View explanations
   - Compare lineups
   - Export/save

2. **Tournament Detail**
   - Quick lineup generator
   - Recommended players
   - Strategy selector

3. **Slate Analysis**
   - Optimize for contest
   - View alternatives

4. **Dashboard**
   - Quick optimizer widget
   - Recent lineups

5. **Player Profile**
   - Pivot suggestions
   - Format suitability

**UI Components**:
- Lineup builder interface
- Player cards with explanations
- Lineup grades display
- Strategy selector
- Constraint panel
- Export options
- Comparison view
- What-if builder

---

## INTEGRATION WITH EXISTING ENGINES

**Consumed From**:
- Tournament Intelligence Engine (course analysis, weather, field)
- Decision Engine (player ratings, risk, suitability)
- DFS Salaries table
- Ownership data

**Output To**:
- Dashboard (recommended lineups)
- Analyzer Dashboard (lineup tools)
- Notifications (lineup suggestions)
- Weekly Report (top optimizer picks)

---

## TESTING STRATEGY

### Unit Tests
- Player scoring (all 9 factors)
- Lineup building (constraint satisfaction)
- Strategy application (all 10 profiles)
- Grade calculation (lineups and players)

### Integration Tests
- Full generation with all data
- Multiple contest types
- All strategy profiles
- Constraint combinations

### Validation Tests
- Salary constraints always met
- Grades are reasonable
- Explanations make sense
- Diversity properly calculated

---

## SUCCESS CRITERIA

When Phase 29 is complete:

✅ Generate 5+ lineups in <2 seconds  
✅ All lineups respect salary constraints  
✅ Player selections are explainable  
✅ Pivots offer valid alternatives  
✅ What-if scenarios work instantly  
✅ Lineups vary by strategy  
✅ Grades align with quality  
✅ Exports work in multiple formats  
✅ Comparison clearly shows differences  
✅ Users trust the recommendations  

---

## TIMELINE

| Phase | Component | Hours | Status |
|-------|-----------|-------|--------|
| 29.1 | Player Scoring (9 factors) | 10 | Ready |
| 29.2 | Lineup Building Algorithm | 12 | Ready |
| 29.3 | Strategy Profiles (10+) | 8 | Ready |
| 29.4 | Constraint Satisfaction | 6 | Ready |
| 29.5 | Stack Analysis & Correlation | 8 | Ready |
| 29.6 | Pivot Engine & Alternatives | 8 | Ready |
| 29.7 | Comparison & What-If | 8 | Ready |
| 29.8 | Player Explanations | 8 | Ready |
| 29.9 | Lineup Grades & Summary | 6 | Ready |
| 29.10 | Explainability & Sources | 6 | Ready |
| 29.11 | Export & Persistence | 5 | Ready |
| 29.12 | Integration & UI | 12 | Ready |
| **Total** | | **97 hours** | **Architecture Complete** |

---

## READY TO BEGIN

All architecture is complete.  
All types are defined.  
All method stubs are in place.  

Next step: Phase 29.1 - Implement core 9-factor player scoring

