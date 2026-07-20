# Course-Player Matching Engine — Complete Architecture (Steps 6-10)

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

# STEP 6: Explainability Engine

## 1. Overview

Every match score must be explainable. The Explainability Engine generates plain-English narratives that articulate:
- Why this player fits this course
- What skills matter most
- Where risks exist
- How form and history factor in

## 2. Explanation Components

### Component A: Lead Explanation (1 Sentence)

```
"Excellent fit: {Player}'s elite {skill} (rank: {percentile}%) 
perfectly suits {Course}'s {demand} emphasis."
```

**Examples:**
```
"Excellent fit: Scottie Scheffler's elite approach play (99th percentile) 
perfectly suits TPC Sawgrass's firm-green emphasis."

"Poor fit: Bryson DeChambeau's extreme distance (99th percentile) 
conflicts with Winged Foot's short-course design (par 70)."

"Moderate fit: Rory McIlroy's balanced game provides no advantage 
or disadvantage on generic tournament courses."
```

### Component B: Skill Breakdown Explanations (1-2 Sentences Per Skill)

#### Driving Explanation
```
if Player_Driving > 80 and Course_Driving_Demand > 7:
  "Elite Driving ({percentile}%): {Course} rewards distance 
  ({yards}+ yards typical), which {Player} excels at."
  
elif Player_Driving < 40 and Course_Driving_Demand > 7:
  "Concern - Weak Driving ({percentile}%): {Course} penalizes 
  short hitters on {yardage}-yard layout."
  
else:
  "Driving is neutral: {Player}'s {percentile}% fits {Course}'s 
  medium-demand layout."
```

#### Approach Explanation
```
if Player_Approach > 85 and Course_Approach_Demand > 7:
  "Elite Approach Play ({percentile}%): Small {green_size} greens 
  and firm conditions reward {Player}'s exceptional proximity."
  
elif Player_Approach < 35 and Course_Approach_Demand > 7:
  "Concern - Weak Approach: {Player} struggles with precision 
  ({distance} average proximity) on demanding {course_name}."
  
else:
  "Solid Approach ({percentile}%): Approach demands are moderate."
```

#### Putting Explanation
```
if Player_Putting > 85 and Course_Stimp > 11:
  "Elite Putting ({percentile}%) on fast greens (Stimp {stimp}): 
  {Player} makes more long putts than field average, creating 
  meaningful advantage on quick greens."
  
elif Player_Putting < 40 and Course_Stimp > 11:
  "Concern - Poor Putting on Fast Greens: Stimp {stimp} greens 
  heavily favor elite putters. {Player} ranks only {percentile}%."
  
else:
  "Putting Advantage Neutral: Medium green speed suits 
  {Player}'s putting level."
```

### Component C: Form & Momentum (1 Sentence)

```
if Form_Score > +8:
  "{Player} is in elite form: {last_10_avg} scoring average 
  (best in {months})."

elif Form_Score < -8:
  "Caution - Current form is poor: {last_10_avg} average 
  ({strokes_worse_than_usual} worse than baseline)."

else:
  "{Player} is playing at baseline form ({recent_avg})."
```

### Component D: Venue History (1 Sentence)

```
if Venue_Visits > 3 and Venue_Bonus > 5:
  "{Player} has dominated {course}: {wins} wins, 
  {avg_finish} finish position in {visits} visits."

elif Venue_Visits > 3 and Venue_Bonus < -5:
  "Concern - Poor venue record: {Player} averages 
  {avg_finish} finish position at {course}."

elif Venue_Visits == 0:
  "First visit: No historical data for {course}."

else:
  "Limited history: {visits} visit(s), mixed results."
```

### Component E: Risk Assessment (1-2 Sentences)

```
if Volatility_High and Fit_Score_Low:
  "High-risk fit: {Player} is volatile (±{volatility} strokes) 
  and doesn't match course demands."

elif Volatility_High and Fit_Score_High:
  "High-ceiling fit: {Player} can score very well ({ceiling}) 
  on the right day, but has downside risk ({floor})."

elif Volatility_Low and Fit_Score_High:
  "Reliable fit: {Player} consistently plays well in these 
  conditions (±{volatility} range)."
```

### Component F: Confidence Statement (1 Sentence)

```
if Confidence > 0.80:
  "High confidence (87%): Based on {player_rounds}+ recent 
  tournaments and {course_events}+ tour events here."

elif Confidence < 0.50:
  "Lower confidence (42%): {Player} has limited playing history; 
  use as directional estimate."
```

## 3. Full Explanation Template

```
"{Player} at {Course}

OVERALL: {Match_Score}/100 - {Tier} fit

SKILL BREAKDOWN:
• Driving: {Driving_Explanation}
• Approach: {Approach_Explanation}
• Short Game: {ShortGame_Explanation}
• Putting: {Putting_Explanation}
• Scoring: {Scoring_Explanation}

MOMENTUM: {Form_Explanation}

VENUE HISTORY: {Venue_Explanation}

RISK PROFILE: {Risk_Explanation}

CONFIDENCE: {Confidence_Explanation}

PRACTICAL IMPLICATION:
{Player} should {action_verb} this event. {Specific_advice}."
```

## 4. Explanation Patterns

### Pattern A: Clear Advantage
```
Tiger Woods @ Augusta National (Score: 92)

Tiger's combination of elite putting (91st percentile) and 
elite approach play (88th percentile) perfectly suits Augusta's 
fast-green and firm-condition emphasis. His 15 wins at Augusta 
provide additional confidence. Current form (8-under recent average) 
adds upside potential. Expectation: Strong finish likely.
```

### Pattern B: Clear Disadvantage
```
Bryson DeChambeau @ Winged Foot (Score: 38)

Winged Foot (7,264 yards, par 70) doesn't reward Bryson's extreme 
distance (99th percentile driving). Short courses minimize the value 
of 350-yard drives. Bryson's approach (65th percentile) is average, 
and Winged Foot emphasizes precision. Weak fit on all dimensions.
```

### Pattern C: Specialist Vs. Generalist
```
Scottie Scheffler @ TPC Sawgrass (Score: 78 - Moderate)

Scottie is a balanced player with elite fundamentals (top 10% in all skills). 
TPC Sawgrass is a well-balanced course (no single emphasis). This creates 
a good-but-not-exceptional fit. Scottie won't have a particular advantage 
vs. other balanced players.
```

---

# STEP 7: Versioning Strategy

## 1. Versioning Principles

### Principle 1: Match Scores Are Versioned
Every match score is tagged with the algorithm version that produced it.

```
MatchScore {
  buildId: "matching-engine-v1.0",
  timestamp: 2026-07-22T14:30:00Z,
  player: PlayerId,
  course: CourseId,
  score: 78,
  subScores: {...},
  explanation: "...",
  createdAt: ISO8601,
  version: "phase-16a-v1"
}
```

### Principle 2: No Silent Algorithm Changes
If the matching algorithm changes, the build version changes. No retroactive modifications.

### Principle 3: Safe A/B Testing
Different builds can coexist. Rankings can be computed from V1 while testing V2.

---

## 2. Build Lifecycle

### Build States
```
DEVELOPMENT   (Phase 16A, testing)
   ↓
CANDIDATE     (Ready to test against production)
   ↓
ACTIVE        (Running in production)
   ↓
RETIRED       (Superseded by newer build)
```

### Build Versions
```
matching-engine-v1.0    (Phase 16A baseline)
matching-engine-v1.1    (Bug fixes to v1)
matching-engine-v2.0    (Phase 16B improvements)
matching-engine-v2.1    (ML-tuned weights)
matching-engine-v3.0    (Phase 16C ML model)
```

---

## 3. Historical Reproducibility

### Requirement 1: Can Reproduce Any Historical Score
```
Given: Player ID, Course ID, Build Version
Can retrieve: Exact score that was generated on that date
```

### Requirement 2: Can Compare Builds
```
Given: Player ID, Course ID
Can compute: Score using v1.0, Score using v2.0, Difference
Result: Understand what changed between versions
```

### Requirement 3: Can Rollback Instantly
```
If v2.0 has a bug:
  Set ACTIVE build back to v1.0
  All new scores use v1.0
  Historical v2.0 scores still exist (tagged v2.0)
  No data loss
```

---

## 4. Version Storage

### Database Schema Pattern

```
Table: MatchScoreBuild
  buildId (PK)          // "matching-engine-v1.0"
  versionNumber         // 1.0
  createdAt             // 2026-07-20T10:00:00Z
  state                 // DEVELOPMENT | CANDIDATE | ACTIVE | RETIRED
  description           // "Phase 16A baseline"
  configuration         // JSON: weight values, algorithms, thresholds
  testResults           // Performance metrics
  releaseNotes          // What changed

Table: MatchScore (referenced by many services)
  scoreId (PK)
  playerId
  courseId
  tournamentId
  buildId (FK to MatchScoreBuild)  // <-- Version tag
  score                 // 0-100
  subScores             // JSON
  explanation           // String
  createdAt
  updatedAt             // Only if recalculated
  recalculationReason   // "player form updated", "course setup changed"
  calculatedAt          // Timestamp of calculation
```

---

## 5. Build Transition Process

### Scenario: Launch V2.0 After Improvements

```
Week 1:
  - V2.0 ready (better ML weights)
  - Deploy as CANDIDATE
  - Run both V1.0 (ACTIVE) and V2.0 (CANDIDATE) for all tournaments
  - Compare score distributions

Week 2-3:
  - Monitor stability of V2.0 vs V1.0
  - Test UI rendering of both versions
  - Confirm no algorithmic bugs
  - Get stakeholder approval

Week 4:
  - Set V2.0 to ACTIVE
  - V1.0 moves to RETIRED
  - All new scores use V2.0
  - Historical V1.0 scores preserved

Week 5+:
  - If bug found in V2.0, can instantly revert to V1.0 ACTIVE
  - V2.0 scores remain as historical record
```

---

## 6. Major vs. Minor Versions

### Minor Version (V1.0 → V1.1): Bug Fixes
- Same algorithm
- Same weights
- Only fixes for data bugs or edge cases
- Can retroactively recalculate V1.0 scores to V1.1

### Major Version (V1.0 → V2.0): Algorithmic Changes
- New weighting scheme
- New components
- New confidence calculations
- Cannot retroactively change V1.0 scores
- Must coexist with V1.0 for comparison

---

# STEP 8: Data Pipeline Architecture

## 1. Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│ SOURCE DATA FEEDS                                           │
├─────────────────────────────────────────────────────────────┤
│ • PGA Tour Statistics                                       │
│ • ShotLink Ball Tracking                                    │
│ • USGA Course Design Database                               │
│ • Tournament Setup Sheets                                   │
│ • Weather Historical Data                                   │
│ • Player News/Status Updates                                │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ DATA INGESTION & NORMALIZATION                              │
├─────────────────────────────────────────────────────────────┤
│ • Import PGA Stats → Player Attributes                      │
│ • Parse ShotLink → Derived Metrics                          │
│ • Ingest Course Data → Course Attributes                    │
│ • Validate & Quality Check                                  │
│ • Flag Missing or Inconsistent Data                         │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ PLAYER INTELLIGENCE LAYER                                   │
├─────────────────────────────────────────────────────────────┤
│ • Calculate Skill Percentiles                               │
│ • Build Skill Profile (5 buckets)                           │
│ • Compute Form Trajectory                                   │
│ • Track Venue History                                       │
│ • Calculate Volatility Profile                              │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ COURSE INTELLIGENCE LAYER                                   │
├─────────────────────────────────────────────────────────────┤
│ • Build Course Profile (design + scoring history)           │
│ • Calculate Demand Weights (5 buckets)                      │
│ • Extract Setup Parameters                                  │
│ • Assess Course Volatility                                  │
│ • Tag Course Characteristics                                │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ MATCHING ENGINE CORE                                        │
├─────────────────────────────────────────────────────────────┤
│ • For each (Player, Course, Tournament):                    │
│   - Compute Skill Fit Score                                 │
│   - Apply Form & Venue Bonuses                              │
│   - Calculate Confidence                                    │
│   - Generate Explanation                                    │
│   - Compute Ceiling/Floor                                   │
│   - Store MatchScore (versioned)                            │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ TOURNAMENT RANKINGS OUTPUT                                  │
├─────────────────────────────────────────────────────────────┤
│ • Field Fit Rankings (best to worst fit)                    │
│ • Player Cards (individual player fit + explanation)        │
│ • Comparative Analysis (tournament-specific insights)       │
│ • DFS Value Integration (fit + salary analysis)             │
│ • Betting Recommendations (fit + odds)                      │
└─────────────┬───────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ PUBLIC API & DISPLAY LAYERS                                 │
├─────────────────────────────────────────────────────────────┤
│ • REST API: /player/{id}/courses/fit                        │
│ • REST API: /course/{id}/field/rankings                     │
│ • GraphQL: Query fit data with filters                      │
│ • UI Components: Fit cards, explanations                    │
│ • DFS Integration: Salary vs. fit scatter plots             │
│ • Betting Integration: Fit-adjusted odds                    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Execution Strategy

### Real-Time vs. Batch

- **Real-Time Triggers:**
  - New player score posted → Recalculate player metrics
  - Tournament setup sheet released → Recalculate course demand
  - Player injury status changes → Flag confidence reduction

- **Batch Jobs (Daily):**
  - Recalculate skill percentiles (tour-wide stats)
  - Refresh venue history (accumulate new tournaments)
  - Update form trajectories (rolling averages)

- **Weekly:**
  - Full course profile recalculation (after tournaments complete)
  - Full field rankings for upcoming tournaments
  - Confidence audits (identify low-confidence scores needing attention)

---

# STEP 9: Performance & Scale Strategy

## 1. Scale Requirements

### Player Dataset
- 2,500+ active PGA Tour players
- 1,000+ DP World Tour players
- 500+ Korn Ferry players
- 2,000+ LPGA players
- Total: 6,000 active professional golfers

### Course Dataset
- 30,000+ golf courses globally
- 500+ tournament venues (need detailed profiles)
- 100+ active tournament courses (tracked weekly)

### Calculation Volume
- Baseline: 156 players × 50 weeks = 7,800 field rankings/year
- Each field ranking: 156 × 500 detailed match scores = 78,000 scores
- Total annual production: 600M match scores
- Peak week: 5M-10M score calculations

### Query Volume
- UI display: 50+ fit cards per tournament (156 players, 5 tours)
- Each card: 1 query (1-10ms response)
- API calls: 100+ calls per user session (filtering, comparison)
- Monthly users: 10,000+
- Peak: 50K concurrent users during major tournaments

## 2. Caching Strategy

### Cache Layers

```
Level 1: Match Score Cache (In-Memory)
  - Key: (PlayerId, CourseId, BuildId)
  - TTL: 1 week (or until course setup changes)
  - Size: 600M scores → ~2TB (compressed)
  - Hit rate: 95%+ (same player-course combos repeated)

Level 2: Skill Profile Cache
  - Key: (PlayerId, SkillType)
  - TTL: 24 hours
  - Size: 6,000 × 5 skills × 100 bytes = 3MB
  - Hit rate: 99%+

Level 3: Course Profile Cache
  - Key: CourseId
  - TTL: 1 week (or tournament week)
  - Size: 30,000 × 5KB = 150MB
  - Hit rate: 98%+

Level 4: Ranking Cache
  - Key: (TournamentId, BuildId)
  - TTL: 1 day (or tournament week)
  - Size: 500 tournaments × 78K scores each = immense
  - Strategy: Compute incrementally, cache batches
```

### Invalidation Strategy

```
On Score Posted:
  Invalidate: (Player, *) → forces skill profile recalc
  
On Setup Released:
  Invalidate: (*, Course, *) → forces course profile recalc
  
On Build Activated:
  Invalidate: (*, *, OldBuild) → forces scores under new build
  
On Daily Refresh:
  Invalidate: (*, *, BuildId) that's >24 hours old
```

## 3. Database Design

### Partitioning Strategy

```
MatchScore Table:
  Partition 1: Tournament (by tournament date)
  Partition 2: Player (by player ID)
  Partition 3: Build (by version)
  
  Queries optimized for:
  - Get all scores for tournament T
  - Get all scores for player P
  - Compare scores v1.0 vs v2.0
```

### Indexing Strategy

```
Index 1: (tournamentId, createdAt)
Index 2: (playerId, courseId, buildId)  ← Primary lookup
Index 3: (courseId, createdAt)
Index 4: (buildId, createdAt)
```

## 4. Performance SLAs

```
UI Display (synch):
  - Single match score: <50ms
  - Field fit ranking (156 scores): <500ms
  - Player comparison (10 players × 20 courses): <2s
  
API Queries (async):
  - Single score: <100ms
  - Field ranking: <2s
  - Historical comparison: <5s
  
Batch Operations:
  - Full field ranking: 10-30 minutes
  - Skill percentile refresh: 15 minutes
  - Course profile update: 5 minutes
```

## 5. Scaling Plan

### Phase 16A (Current)
- Single-instance calculation server
- PostgreSQL on Neon
- In-memory cache on main app server
- ~100K scores/week

### Phase 16B
- Dedicated calculation service (scaling separately)
- Distributed cache (Redis cluster)
- Batch job queue (Vercel Workflows or similar)
- ~10M scores/week

### Phase 16C
- Kubernetes scaling for calculation service
- Data warehouse (Snowflake or similar) for analytics
- Real-time streaming pipeline for score updates
- Full OLAP capability (querying historical scores)
- ~100M+ scores/week

---

# STEP 10: Future AI Extension Points

## 1. ML Integration Roadmap

### Phase 16A (Current): Hand-Tuned Weights
```
Weights: Manual configuration per course
Process: Domain experts set driving_weight=0.35, etc.
Accuracy: ~65% of outcomes predicted correctly
Model: None (pure logic)
```

### Phase 16B (Q4 2026): Gradient Boosting
```
Data: Historical 2+ years of tournament results
Train: XGBoost on (player attributes, course attributes) → finish position
Optimize: Weights to minimize prediction error
Accuracy: ~72% of outcomes predicted correctly (7% improvement)
Model: GBM with interpretable SHAP values
```

### Phase 16C (Q1 2027): Deep Learning
```
Data: Historical 3+ years, PGA/DP/KF/LPGA
Train: LSTM on shot sequences + player embeddings
Optimize: End-to-end for tournament outcome
Accuracy: ~75% of outcomes predicted correctly
Model: Transformer for multi-task learning (finish, scoring, upside)
```

### Phase 17+ (2027): Real-Time Simulation
```
Data: Live scoring during tournament
Train: Reinforcement learning on real-time decisions
Optimize: Expected value for DFS/betting recommendations
Accuracy: Update odds in real-time during tournament
Model: Actor-critic policy for shot-by-shot decisions
```

## 2. Extension Points (Built Into Phase 16A)

### Extension Point 1: Weight Training
```
Architecture Hook:
  - Weights stored in versioned BuildConfiguration
  - Interface: computeMatchScore(player, course, buildConfig)
  - Future ML can optimize buildConfig.weights
  - No code change needed; just new configuration
```

### Extension Point 2: Feature Engineering
```
Architecture Hook:
  - Player attributes stored in structured table
  - Can add new attributes without changing core logic
  - New attributes automatically feed into weights
  - ML can learn importance of new attributes
```

### Extension Point 3: Outcome Prediction
```
Architecture Hook:
  - MatchScore is separate from outcome prediction
  - Predict(MatchScore, TournamentContext) → finish position
  - Can plug in ML model without changing MatchScore
  - A/B test different prediction models
```

### Extension Point 4: Shot Simulation
```
Architecture Hook:
  - Player attributes describe long-term patterns
  - Future: Simulate round hole-by-hole using attributes
  - Simulate(Player, Course, Rounds=4) → Distribution of scores
  - Much richer than point estimate
```

### Extension Point 5: Ownership Prediction
```
Architecture Hook:
  - MatchScore + salary → predicted ownership
  - Train: XGBoost(MatchScore, Salary, Field) → Actual ownership
  - DFS users pay premium for accurate ownership prediction
  - Separable from core matching engine
```

---

## 3. ML Safety Guardrails

### Guardrail 1: Model Monitoring
```
After each tournament:
  - Compare predicted scores vs. actual finish positions
  - Calculate model error distribution
  - Alert if error > threshold
  - Trigger manual review before next tournament
```

### Guardrail 2: Explainability Check
```
Every prediction must explain itself:
  - Top 3 attributes contributing to score
  - Top 3 attributes reducing score
  - Why this player/course combo
  - SHAP value breakdown for LIME-style explanation
```

### Guardrail 3: Rollback Safety
```
If ML model underperforms baseline:
  - Instantly revert to previous hand-tuned build
  - No user-facing changes
  - Flag for investigation
  - Can run A/B test to diagnose issue
```

---

# Summary: Complete Architecture

This 10-step design establishes:
1. **50+ Player Attributes** organized into 5 skill buckets
2. **60+ Course Attributes** organized into 5 demand buckets
3. **Matching Philosophy** with 7 core theses guiding weight evolution
4. **5-Component Match Score** (skill fit, form, venue, confidence, volatility)
5. **Sophisticated Confidence Framework** separating data quality from prediction certainty
6. **Explainability Engine** generating natural language narratives
7. **Versioning Strategy** supporting safe A/B testing and rollback
8. **Data Pipeline** flowing from source data through intelligence layers to public APIs
9. **Performance Strategy** supporting 600M+ annual match scores
10. **AI Extension Points** prepared for ML/simulation integration

All components are implementation-agnostic and ready for Phase 16B implementation.

---

**Archive Status:** Phase 16A Architectural Design Complete

**Next Phases:**
- Phase 16B: API Implementation & UI Integration
- Phase 16C: ML Model Training & Deployment
- Phase 17: Real-Time Tournament Updates
- Phase 18: DFS/Betting Integration
