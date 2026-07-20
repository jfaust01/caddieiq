# Match Score Architecture — Course-Player Matching Engine

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

## 1. Overview

The match score is a multi-layered scoring system that decomposes course-player fit into interpretable, explainable components. Each component serves a different audience:

- **Core match score (0-100)** → UI display, ranking
- **Sub-scores (5 dimensions)** → Explanation, player choice
- **Confidence score (0-100)** → Uncertainty quantification
- **Ceiling/floor profile** → Volatility, DFS strategy
- **Component breakdown** → Transparency, audit trail

---

## 2. Five-Dimensional Match Score

### Component A: Skill Fit Dimension (0-100)

**Purpose:** How well does the player's permanent skill profile match this course's permanent demand profile?

**Calculation:**
1. **Measure player's skill level** (per 5 skill buckets):
   - Driving: percentile vs. tour average (0-100)
   - Approach: percentile vs. tour average (0-100)
   - Short Game: percentile vs. tour average (0-100)
   - Putting: percentile vs. tour average (0-100)
   - Scoring: percentile vs. tour average (0-100)

2. **Measure course's demand** (per 5 skill buckets):
   - Driving: 0-100 scale (high yardage = high demand)
   - Approach: 0-100 scale (green difficulty = demand)
   - Short Game: 0-100 scale (hazard density = demand)
   - Putting: 0-100 scale (green speed = demand)
   - Scoring: 0-100 scale (overall difficulty = demand)

3. **Combine into skill fit:**
   ```
   Skill Fit = Σ (player_skill[i] * course_demand_weight[i]) / Σ (course_demand_weight[i])
   ```

**Where:**
- `player_skill[i]` = Player's percentile in skill bucket i (0-100)
- `course_demand_weight[i]` = Weight for skill i based on course demand
- Sum of weights = 100

**Example:**
```
Player: Dustin Johnson
  - Driving: 95 (elite)
  - Approach: 75 (above average)
  - Short Game: 70 (average)
  - Putting: 60 (below average)
  - Scoring: 72 (above average)

Course: Long Course (7,500 yds, narrow fairways, small greens)
  - Driving demand: 40% weight
  - Approach demand: 25% weight
  - Short Game demand: 15% weight
  - Putting demand: 10% weight
  - Scoring demand: 10% weight

Skill Fit = (95*0.40) + (75*0.25) + (70*0.15) + (60*0.10) + (72*0.10) = 80.7
```

**Scale:**
- 80-100: Excellent structural fit
- 65-79: Good fit
- 50-64: Moderate fit
- 35-49: Poor fit
- 0-34: Terrible fit

**Output:** SkillFitScore (0-100)

---

### Component B: Form & Momentum Dimension (-15 to +15)

**Purpose:** How is the player currently performing vs. their baseline?

**Calculation:**
```
Form Score = Player's Current Trajectory - Career Baseline
```

**Detailed:**
1. **Calculate career baseline:**
   - Player's all-time average score (strokes per round)
   - Filter to relevant events (same tier, same season length)

2. **Calculate recent average:**
   - Last 10 tournament rounds
   - If fewer than 10, use all available recent rounds

3. **Calculate differential:**
   ```
   Form Score = Recent Avg - Career Baseline (in strokes)
   ```

4. **Convert to +/-15 scale:**
   - +5 or better: Elite form (+15 points)
   - +3 to +5: Strong form (+10 points)
   - +1 to +3: Good form (+5 points)
   - -1 to +1: Neutral form (0 points)
   - -3 to -1: Below average form (-5 points)
   - -5 to -3: Poor form (-10 points)
   - -5 or worse: Cold form (-15 points)

**Example:**
```
Player: Scottie Scheffler
  - Career baseline: 70.1 average
  - Last 10 rounds average: 68.3
  - Differential: -1.8 strokes (playing well)
  - Form Score: +8 points
```

**Output:** FormScore (-15 to +15)

---

### Component C: Course History Dimension (-10 to +10)

**Purpose:** Has the player performed well or poorly at this specific course historically?

**Calculation:**
```
Venue Bonus = Historical Average at Venue - Career Baseline
```

**Detailed:**
1. **Look up player's history at this course:**
   - If 0 visits: Bonus = 0 (no history, no bonus)
   - If 1 visit: Bonus = (Historical avg - Baseline) × 0.25 (light weight)
   - If 2-3 visits: Bonus = (Historical avg - Baseline) × 0.50 (medium weight)
   - If 4+ visits: Bonus = (Historical avg - Baseline) × 1.0 (full weight)

2. **Convert to -10 to +10 scale:**
   - Cap bonus at +10, penalty at -10 (prevents extreme outliers)

**Example:**
```
Player: Tiger Woods
  - Career baseline: 71.0
  - At Augusta National (15 visits): 68.2 average
  - Differential: -2.8 strokes
  - Weight: 1.0 (15 visits)
  - Venue Bonus: +10 (capped at maximum)
```

**Output:** VenueHistoryBonus (-10 to +10)

---

### Component D: Confidence Multiplier Dimension (0.3 to 1.0)

**Purpose:** How confident are we in the fit calculation?

**Calculation:** Multiply final score by confidence factor

**Component Confidence:**
1. **Player Attribute Confidence** (% of fit determined by data quality)
   ```
   Player Conf = MIN(0.5 + (rounds_of_data / 100), 1.0)
   - 10 rounds: 0.6
   - 50 rounds: 1.0
   - 100+ rounds: 1.0
   ```

2. **Course Attribute Confidence** (% of demand determined by data quality)
   ```
   Course Conf = MIN(0.4 + (tournaments_at_course / 10), 1.0)
   - 1 tournament: 0.5
   - 5 tournaments: 0.9
   - 10+ tournaments: 1.0
   ```

3. **Data Recency Confidence** (how fresh is the data?)
   ```
   Recency Conf = 1.0 if last_data_point < 1 month
                = 0.9 if 1-3 months
                = 0.8 if 3-6 months
                = 0.7 if 6-12 months
                = 0.5 if >1 year
   ```

4. **Combined Confidence:**
   ```
   Confidence = (Player_Conf * 0.5) + (Course_Conf * 0.3) + (Recency_Conf * 0.2)
   ```

**Output:** ConfidenceMultiplier (0.3 to 1.0)

---

### Component E: Volatility Profile Dimension

**Purpose:** What's the range of possible outcomes?

**Calculation:**
1. **Calculate player's volatility:**
   - Historical standard deviation of scores: σ_player (typically 2-4 strokes)
   - Recent volatility: σ_recent (last 10 rounds)

2. **Calculate course's volatility:**
   - Historical standard deviation of field scores at course: σ_course (typically 2-3 strokes)

3. **Estimated outcome distribution:**
   ```
   Total Volatility = SQRT(σ_player^2 + σ_course^2)
   ```

4. **Ceiling/Floor calculations:**
   ```
   Ceiling = Base_Score + (1 * Total_Volatility)  // 84th percentile
   Floor = Base_Score - (1 * Total_Volatility)    // 16th percentile
   ```

5. **Volatility Index:**
   ```
   Volatility = Ceiling - Base_Score  // Upside potential
   Downside = Base_Score - Floor      // Downside risk
   ```

**Example:**
```
Player: Rory McIlroy
  - Player volatility: 2.8 strokes
  - Course volatility: 2.4 strokes
  - Combined: SQRT(2.8^2 + 2.4^2) = 3.66 strokes
  - Base score: 72
  - Ceiling: 72 + 3.66 = 75.66
  - Floor: 72 - 3.66 = 68.34
  - Volatility Index: 3.66 strokes
```

**Output:** VolatilityProfile { Ceiling, Base, Floor, VolatilityIndex }

---

## 3. Composite Match Score Calculation

### Step 1: Calculate Raw Component Scores

```typescript
rawScores = {
  skillFit: CalculateSkillFit(player, course),           // 0-100
  formBonus: CalculateFormBonus(player),                 // -15 to +15
  venueBonus: CalculateVenueHistory(player, course),    // -10 to +10
  volatilityProfile: CalculateVolatility(player, course) // { ceiling, base, floor }
}
```

---

### Step 2: Normalize and Combine

```
Combined Score = Skill Fit + Form Bonus + Venue Bonus

// Scale to 0-100 range:
if Combined > 100: Combined = 100
if Combined < 0: Combined = 0

Match Score = Combined
```

**Example:**
```
Skill Fit: 78
Form Bonus: +8
Venue Bonus: +5
Combined: 91 (capped at 100)
Match Score: 91
```

---

### Step 3: Apply Confidence Multiplier

```
Final Match Score = Match Score * Confidence Multiplier

// Special handling for low confidence:
if Confidence < 0.5:
  Return "Moderate Confidence" + range instead of exact score
if Confidence < 0.3:
  Return "Low Confidence" + quartile instead of exact score
```

**Example:**
```
Match Score: 91
Confidence: 0.75
Final Score: 91 * 0.75 = 68.25 → Display as "68"
```

---

### Step 4: Calculate Ceiling/Floor

```
Final Ceiling = (Match Score Ceiling) * Confidence
Final Floor = (Match Score Floor) * Confidence

where:
  Match Score Ceiling = Match Score + 1σ volatility
  Match Score Floor = Match Score - 1σ volatility
```

---

## 4. Sub-Score Breakdown

### Driving Sub-Score (0-100)

```
Driving Score = 
  (Player Driving Percentile * Course Driving Demand Weight) / 
  (Total Course Demand Weight applied to driving)
```

**Inputs:**
- Player's driving distance percentile
- Player's driving accuracy percentile  
- Player's driving consistency
- Course yardage demand
- Course fairway width demand

**Output:** 0-100 score with explanation

---

### Approach Sub-Score (0-100)

```
Approach Score = 
  (Player Approach Skills * Course Approach Demand) / 
  (Total weighted approach emphasis)
```

**Inputs:**
- Player's approach proximity percentile
- Player's green hit rate
- Course green size
- Course approach distance profile
- Green speed impact on approach

**Output:** 0-100 score with explanation

---

### Short Game Sub-Score (0-100)

```
Short Game Score = 
  (Player Scrambling/Bunker Skills * Course Hazard Demand) / 
  (Total weighted short-game emphasis)
```

**Inputs:**
- Player's scrambling percentage
- Player's bunker play strokes gained
- Course bunker count/difficulty
- Course rough severity
- Course hazard frequency

**Output:** 0-100 score with explanation

---

### Putting Sub-Score (0-100)

```
Putting Score = 
  (Player Putting Skill * Course Green Speed Demand) / 
  (Total weighted putting emphasis)
```

**Inputs:**
- Player's strokes gained putting
- Player's distance-specific putting (0-10ft, 10-30ft, 30+ft)
- Course Stimp rating
- Course green slope
- Green size impact on putting

**Output:** 0-100 score with explanation

---

### Scoring/Form Sub-Score (0-100)

```
Scoring Score = 
  (Player Scoring Efficiency * Course Difficulty Baseline) + 
  (Form Adjustment Factor)
```

**Inputs:**
- Player's scoring average vs. tour
- Course's historical scoring average
- Player's recent form
- Tournament tier context

**Output:** 0-100 score with explanation

---

## 5. Display Formats

### Format A: Summary Tile

```
┌─────────────────────────────────┐
│ Match Score: 78                 │
│ Confidence: High (82%)          │
│                                 │
│ ▌▌▌▌▌▌▌▌░░ Skill Fit (78)      │
│ Excellent structural alignment  │
│                                 │
│ Ceiling: 82 | Floor: 74         │
└─────────────────────────────────┘
```

### Format B: Detailed Card

```
┌─────────────────────────────────────────────────────┐
│ Course-Player Fit Analysis                          │
│ Tiger Woods @ Augusta National                      │
│                                                     │
│ OVERALL MATCH SCORE: 91/100                        │
│ Confidence: Very High (88%)                         │
│                                                     │
│ COMPONENTS:                                         │
│ • Structural Fit: 85  (Excellent - suits skills)  │
│ • Current Form: +6    (Strong - hot this month)    │
│ • Venue History: +10  (Optimal - 15x winner)       │
│                                                     │
│ SUB-SCORES:                                         │
│ Driving:     82/100 ▌▌▌▌▌▌▌▌░░                    │
│ Approach:    78/100 ▌▌▌▌▌▌▌░░░                    │
│ Short Game:  75/100 ▌▌▌▌▌▌▌░░░                    │
│ Putting:     88/100 ▌▌▌▌▌▌▌▌░░                    │
│ Scoring:     90/100 ▌▌▌▌▌▌▌▌▌░                    │
│                                                     │
│ UPSIDE/DOWNSIDE:                                    │
│ • Best case (ceiling):  95  (+4 upside)            │
│ • Likely (base):        91                         │
│ • Worst case (floor):   87  (-4 downside)          │
│ • Volatility:           Medium (±4 range)          │
│                                                     │
│ INTERPRETATION:                                     │
│ Exceptional match. Tiger's elite putting and       │
│ approach work perfectly on fast Augusta greens.     │
│ Course management and venue history provide        │
│ additional advantage. Hot form increases upside.   │
│                                                     │
│ Confidence: Very high — 15+ visits and recent      │
│ tournament data support this assessment.            │
└─────────────────────────────────────────────────────┘
```

### Format C: Simple Text Explanation

```
"Tiger Woods is an exceptional fit for Augusta National.
His elite approach play (88th percentile) and world-class
putting (91st percentile) perfectly complement the course's
firm greens and strategic approach-play emphasis. His
dominant venue record (15 wins) provides massive confidence.
Current strong form adds additional upside. Expect scoring
in the mid-to-low 280s for 72 holes."
```

---

## 6. Scoring Rules & Edge Cases

### Rule 1: Score Never Goes Below 30
**Rationale:** Prevent extreme negative scores from suggesting "don't play"

```
if Score < 30:
  Score = 30
  Flag: "Notably poor fit — not recommended"
```

---

### Rule 2: Score Never Goes Above 100
**Rationale:** Prevent over-confidence in extreme fits

```
if Score > 100:
  Score = 100
  Flag: "Perfect fit (theoretical maximum)"
```

---

### Rule 3: First-Time Venue = No Venue Bonus
**Rationale:** First-timers shouldn't be penalized or rewarded for history they don't have

```
if player_visits_at_venue == 0:
  venue_bonus = 0
```

---

### Rule 4: Confidence Never Increases Score, Only Decreases
**Rationale:** Missing data increases uncertainty, never certainty

```
Final_Score = Match_Score * Confidence_Multiplier
// Confidence is 0.3 to 1.0, never > 1.0
```

---

### Rule 5: Form Bonus Caps at ±15
**Rationale:** Prevent form from dominating fit (form is temporary)

```
Form_Bonus = CLAMP(Form_Bonus, -15, +15)
```

---

### Rule 6: Venue Bonus Caps at ±10
**Rationale:** Extreme venue history is unrealistic (probably data error)

```
Venue_Bonus = CLAMP(Venue_Bonus, -10, +10)
```

---

## 7. Edge Case Handling

### Scenario A: New Player (Fewer Than 10 Rounds)
```
Skill Fit Confidence: Low (0.4)
Use: Available data + tour averages for missing data
Mark: "Limited data — use as rough estimate"
```

### Scenario B: Course Without Recent Tournament
```
Course Confidence: Low (0.3)
Use: Design specs + historical scoring from 2+ years ago
Mark: "Course setup may have changed — less certain"
```

### Scenario C: Player Never Visited Venue
```
Venue Bonus: 0 (no history)
Use: Structural fit only
Mark: "First visit — no venue history"
```

### Scenario D: Player Recently Recovered from Injury
```
Form Adjustment: Reduced weight
Use: Pre-injury baseline + recent data with lower confidence
Mark: "Recent injury — less certain"
```

### Scenario E: Course Undergoing Renovation
```
Course Confidence: Very low (0.2)
Use: Pre-renovation data + design specifications
Mark: "Course recently renovated — historical data may not apply"
```

---

## 8. Data Storage & Versioning

### Version-Specific Scoring

Each match score is versioned to support A/B testing and rollback:

```typescript
interface MatchScoreVersion {
  buildId: string,              // e.g., "v1.0"
  timestamp: ISO8601,
  player: PlayerId,
  course: CourseId,
  tournament: TournamentId,
  
  components: {
    skillFit: Score,
    formBonus: Score,
    venueBonus: Score,
    confidence: Multiplier,
    volatility: { ceiling, floor, index }
  },
  
  subScores: {
    driving: Score,
    approach: Score,
    shortGame: Score,
    putting: Score,
    scoring: Score
  },
  
  explanation: string,
  createdAt: ISO8601,
  version: string               // e.g., "phase-16a-v1"
}
```

---

## 9. Assumptions

1. Five-component scoring is sufficient to explain fit quality
2. Skill percentiles vs. tour average are meaningful and calibrated
3. Course demand weights sum to 100% (normalized distribution)
4. Player skill distribution is approximately normal across tour
5. Venue history is meaningful with 2+ visits (low confidence with 1)
6. Form is captured adequately by last-10-rounds average
7. Confidence multiplier correctly captures data quality

---

## 10. Open Questions

1. Should sub-scores be displayed to users, or only top-level score?
2. How frequently should player skill percentiles be recalculated? (Per tournament? Per season?)
3. Should we separately score "major championship fit" vs. "regular tour fit"?
4. How to handle mid-tournament updates to player form?
5. Should recent tournament upsets affect course demand weights?

---

**Next:** Confidence Framework (Step 5)
