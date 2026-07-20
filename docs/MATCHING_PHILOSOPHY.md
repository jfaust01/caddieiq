# Matching Philosophy — Course-Player Matching Engine

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

## 1. Core Principle

The matching engine answers: **"Why is this golfer an excellent fit for this golf course this week?"**

The answer must be:
1. **Explainable** — Every score must articulate the reasoning in plain English
2. **Evidenced** — Every claim must trace back to verified player/course data
3. **Versioned** — Historical consistency must be maintainable across algorithm updates
4. **Scalable** — Must support 50+ player attributes vs. 60+ course attributes

---

## 2. Matching Philosophy: Core Theses

### Thesis A: Course Demand Creates Fit Opportunity

**Principle:** Courses emphasize different skills. A course's demand profile determines which player skills matter.

**Examples:**
- Long courses reward **driving distance** — elite distance players fit
- Firm courses reward **approach precision** — elite iron players fit
- Fast greens reward **elite putting** — putting specialists fit
- Rough courses reward **scrambling** — recovery specialists fit
- Wind-exposed courses reward **trajectory control** — ball-strikers fit

**Implication for Weighting:**
- When a course has high driving demand (long yardage, narrow fairways), driving attributes get higher weight
- When a course has low putting demand (slow greens, forgiving pin positions), putting attributes get lower weight
- Weights evolve per course, not static

**Decision Framework:**
> "What skills does this course require? Emphasize player attributes matching those skills."

---

### Thesis B: Player Specialization Enables Fit Ranking

**Principle:** Players have different strength profiles. Specialist players (elite at one skill, average elsewhere) fit better on specialist courses (that reward that single skill).

**Examples:**
- Elite distance driver (elite driving, average approach) fits long courses better than balanced players
- Elite putter (elite putting, average driving) fits fast-green courses better than balanced players
- Scrambler (elite short game, average driving) fits rough/hazard courses better than balanced players

**Implication:**
- Matching score must compare relative strength (Am I better than field average on THIS course's emphasis?)
- Specialist players will have high variance in fit across different course types
- Generalist players will have medium fit across all course types

**Decision Framework:**
> "Does this player specialize in the skills this course rewards?"

---

### Thesis C: Fit is Relative, Not Absolute

**Principle:** Player fit is only meaningful against other players in the field. A player doesn't "fit" or "not fit" a course in absolute terms; they fit **better or worse than the field.**

**Examples:**
- Dustin Johnson's driving isn't "good" or "bad" on a 7,200-yard course—it's good **relative to other 156 players in the field**
- Scottie Scheffler's putting isn't "elite" or "poor" on a slow-green course—it's elite **relative to field average on those greens**

**Implication:**
- Matching scores are always comparative
- Fit doesn't require absolute excellence, only relative advantage
- Field composition matters (elite field vs. weak field)

**Decision Framework:**
> "Is this player's skill advantage greater on this course than on an average course?"

---

### Thesis D: Form is Temporary, Structure is Permanent

**Principle:** Recent form influences fit, but underlying course fit structure persists.

**Examples:**
- A player in poor form (last 10 rounds: 75, 76, 77 average) fits a course for their skills, but will score worse due to current form
- A player in elite form (last 10 rounds: 66, 65, 67 average) fits a course for their skills, and will score better due to current form
- Fit quality doesn't change; execution quality changes

**Implication:**
- Fit scoring must separate structural fit (course-player skill alignment) from execution quality (current form)
- Both should appear in final score, but separately
- A player can have "excellent fit" with "poor form" → moderate final score
- Or "moderate fit" with "elite form" → moderate-to-good final score

**Decision Framework:**
> "Does this course suit this player's permanent skill profile? Separately, what does current form suggest?"

---

### Thesis E: Confidence Follows Data Coverage

**Principle:** Confidence in a fit score depends on data availability, not confidence in the recommendation.

**Examples:**
- A player with 5 rounds of history has lower-confidence fit than same fit level with 50 rounds
- A fast-green course with 2 putting datapoints has lower confidence than 10 putting datapoints
- A course without green speed data (Stimp) has lower-confidence putting fit

**Implication:**
- Confidence is orthogonal to fit quality
- Excellent fit with low confidence is possible (limited data)
- Poor fit with high confidence is possible (lots of confirming data)
- Never hide low confidence behind high-quality score
- Always surface confidence separately from fit score

**Decision Framework:**
> "How much data supports this fit conclusion? That confidence level applies, regardless of the fit score."

---

### Thesis F: Tournament Context Matters

**Principle:** Fit changes based on tournament tier and field strength.

**Examples:**
- A player's fit against the PGA Tour field differs from fit against a Web.com field
- Fit on a course as a Major (elite field, difficult setup) differs from the same course as a regular tour stop (weaker field, standard setup)
- Fit during playoffs differs from regular season (different players, different setups)

**Implication:**
- Fit must account for tournament tier
- Field composition should adjust relative-skill calculations
- Setup difficulty influences fit quality
- Same player-course combination can have different fits based on context

**Decision Framework:**
> "Who else is in the field? What's the tournament tier? How does that context change the fit?"

---

### Thesis G: Explosive Upside Differs from Solid Floor

**Principle:** Fit must distinguish between "ceiling" (best-case scenario) and "floor" (worst-case scenario).

**Examples:**
- A volatile player on a volatile course has high ceiling but also high floor
- A consistent player on a consistent course has medium ceiling and medium floor
- Matching engine should surface both, not just average

**Implication:**
- Fit scores should include three components: floor, base, ceiling
- Volatility profiles matter
- DFS/GPP players care about ceiling; cash-game players care about floor
- Matching score should expose this, not hide it

**Decision Framework:**
> "What's the best-case scenario for this player on this course? Worst-case? Most likely?"

---

## 3. Weight Evolution Framework

### Principle A: Course Demand Determines Initial Weights

**Algorithm:**
1. Measure course's demand for each skill (driving, approach, short game, putting)
2. Set player attribute weights based on demand
3. Higher demand → higher weight
4. Lower demand → lower weight

**Example:**
```
Long Course (7,400 yards, narrow fairways, small greens):
  - Driving Demand: 8/10 → Driving attributes weight: 30%
  - Approach Demand: 6/10 → Approach attributes weight: 20%
  - Short Game Demand: 5/10 → Short game weight: 15%
  - Putting Demand: 4/10 → Putting attributes weight: 20%
  - Scoring Context: 9/10 → Scoring weight: 15%

Short Course (6,500 yards, wide fairways, large greens):
  - Driving Demand: 4/10 → Driving attributes weight: 15%
  - Approach Demand: 5/10 → Approach attributes weight: 15%
  - Short Game Demand: 6/10 → Short game weight: 20%
  - Putting Demand: 7/10 → Putting attributes weight: 30%
  - Scoring Context: 8/10 → Scoring weight: 20%
```

### Principle B: Tuning Formula (Not Exact Weights)

**Rule:** Do NOT specify exact formula. Instead, specify how weights are determined:

> Weight for attribute A on course C = 
> f(course demand for A's skill, player's relative strength in A vs. field, recent performance in A)

**Decision Framework:**
> "Based on course demand profile, which player skills matter most? Emphasize those."

---

## 4. Fit Score Composition

### Multi-Component Fit Score

The matching engine produces a fit score consisting of **5 components:**

#### Component 1: Structural Fit (0-100)
**What it measures:** Course demand alignment with player's permanent skill profile

**Calculation:**
- For each skill (driving, approach, short game, putting):
  - Measure player's skill level (percentile vs. tour average)
  - Measure course demand for that skill
  - Compare: if player is elite in high-demand skill, high structural fit
  - Average across all skills

**Example:**
- Player: Elite approach (90th percentile), average putting (50th percentile)
- Course: High approach demand (8/10), low putting demand (3/10)
- Structural fit = high (player excels at course's emphasis)

**Interpretation:**
- 80-100: Excellent structural alignment
- 60-79: Good alignment
- 40-59: Moderate alignment (neither advantage nor disadvantage)
- 20-39: Poor alignment
- 0-19: Terrible alignment (player weak in course-demanded skills)

---

#### Component 2: Form Adjustment (-10 to +10)
**What it measures:** Current performance trajectory vs. long-term average

**Calculation:**
- Player's last 10-round average minus career average
- Positive = playing above baseline
- Negative = playing below baseline

**Example:**
- Player career average: 71.3 strokes
- Last 10 rounds average: 68.5 strokes
- Form adjustment: +2.8 (playing 2.8 strokes better)

**Interpretation:**
- +5 or higher: Elite current form (hot)
- +2 to +5: Above average form
- -2 to +2: Neutral form (at baseline)
- -5 to -2: Below average form
- -5 or lower: Poor current form (cold)

---

#### Component 3: Venue History Bonus (-5 to +5)
**What it measures:** Past performance at this specific course

**Calculation:**
- If 3+ visits: Historical average score at venue minus player's career average
- If 1-2 visits: Weighted bonus (light weight)
- If first visit: 0

**Example:**
- Player career average: 71.3
- Historical average at this course: 68.7
- Bonus: +2.6 (player historically 2.6 better at this venue)

**Interpretation:**
- Players with strong venue history get bonus
- First-timers get no bonus (fair comparison)
- Players with poor venue history get penalty

---

#### Component 4: Confidence Multiplier (0.3 to 1.0)
**What it measures:** How confident is the fit calculation?

**Calculation:** Average of component confidences:
1. Player attribute confidence (sample size, freshness)
2. Course attribute confidence (survey quality, freshness)
3. Data intersection confidence (do we have both player AND course data?)

**Example:**
- Player: 40 rounds of data (high confidence)
- Course: Fast greens (Stimp 12) but no other putting data (medium confidence)
- Confidence multiplier: 0.7 (good-but-not-perfect)

**Interpretation:**
- 0.9-1.0: High confidence (trust the fit)
- 0.7-0.89: Medium-high confidence
- 0.5-0.69: Medium confidence (notable uncertainty)
- 0.3-0.49: Low confidence (take with grain of salt)

---

#### Component 5: Ceiling/Floor Profile
**What it measures:** Volatility and best/worst-case scenarios

**Calculation:**
- Ceiling = Structural Fit + Form + Venue Bonus + (1 std deviation of upside)
- Floor = Structural Fit + Form + Venue Bonus - (1 std deviation of downside)
- Volatility Index = (Ceiling - Floor) / 2

**Example:**
- Base fit score: 72
- Ceiling (90th percentile round): 76
- Floor (10th percentile round): 68
- Volatility: 4 strokes

**Interpretation:**
- Low volatility (2-3 strokes): Consistent execution expected
- Medium volatility (4-5 strokes): Normal range
- High volatility (6+ strokes): Unpredictable, high ceiling and high floor

---

### Composite Fit Score

**Final Match Score (0-100 scale):**
```
Match Score = 
  Structural Fit (0-100) 
  + Form Adjustment (-10 to +10) 
  + Venue History (-5 to +5)
  [multiplied by Confidence (0.3 to 1.0)]
```

**Scaled to 0-100:**
```
if Confidence < 0.5:
  Show as "Moderate Confidence: 65" instead of exact number
if Confidence < 0.3:
  Show as "Low Confidence" with range instead of score
```

---

## 5. Decision Framework: "When to Weight What?"

### High Driving Demand
**Condition:** Course is long (7,300+ yds), fairways narrow (<30 yds), or distance-penalizing features

**Weight Adjustment:**
- Driving Distance: +2x normal weight
- Driving Accuracy: +1.5x normal weight
- Approach: -0.5x (less emphasis)
- Putting: -0.5x (less emphasis)

**Reasoning:** Long courses reward distance; short courses don't. Simple.

---

### High Approach Demand
**Condition:** Course has small greens (<4,500 sq ft), firm surface, elevation changes, or approach-heavy features

**Weight Adjustment:**
- Approach Distance: +2x normal weight
- Approach Accuracy: +1.5x normal weight
- Driving: -0.5x (less emphasis)

**Reasoning:** Small, firm greens penalize approach misses.

---

### High Putting Demand
**Condition:** Green speed fast (>11 Stimp), greens tiered/sloped, or putting historically determines outcomes

**Weight Adjustment:**
- Putting Strokes Gained: +2x normal weight
- Green Speed (0-10ft):+1.5x normal weight
- Driving: -0.5x (less emphasis)
- Scoring Consistency: +1x (putting noise becomes signal)

**Reasoning:** Fast greens separate elite putters from average putters.

---

### High Scrambling Demand
**Condition:** Course has heavy rough, bunker-dense, or high hazard penalty areas

**Weight Adjustment:**
- Scrambling %: +2x normal weight
- Bunker Play: +1.5x normal weight
- Rough Performance: +2x normal weight
- Driving (distance): -0.5x (accuracy less valuable if rough brutal)

**Reasoning:** Rough/hazard courses reward recovery specialists.

---

### High Wind Exposure
**Condition:** Course is open, exposed, historical wind correlation is high

**Weight Adjustment:**
- Trajectory Control: +2x normal weight
- Recent Form: -1x (form more volatile in wind)
- Consistency: +1.5x (wind rewards consistent swing)

**Reasoning:** Wind punishes inconsistent players more than skill deficiency.

---

### Fast-Moving Field Weeks
**Condition:** Tournament tier is weak (Web.com, secondary events), field is not elite

**Weight Adjustment:**
- Recent Form: +1.5x (form matters more when field weak)
- Venue History: +1.5x (venue knowledge matters more)
- Consistency: -0.5x (volatility matters less against weak field)

**Reasoning:** Weak-field weeks reward hot players and course knowledge.

---

### Major Championship Weeks
**Condition:** Tournament is U.S. Open, PGA Championship, Masters, Open Championship

**Weight Adjustment:**
- Structural Fit: +2x (course-specific skills matter enormously)
- Form: -0.5x (elite field means form less predictive)
- Venue History: +2x (course knowledge premium)
- Consistency: +2x (weak players killed off)

**Reasoning:** Majors reward structural fit and course knowledge.

---

## 6. Non-Weighted Factors (Permanent Principles)

### Principle 1: Never Lower Recent Form Below Zero
**Rule:** Even a cold player is still their baseline. Never make fit score lower than median player fit.

**Rationale:** If a player's baseline is 70 (median fit), and they're cold, they're still at least 70-level fit, just executing poorly.

---

### Principle 2: Confidence Always Reduces Certainty, Never Increases
**Rule:** Low confidence multiplies by 0.3-0.8. Never multiplies above 1.0.

**Rationale:** Missing data should make us less certain, not more certain.

---

### Principle 3: Venue History Bonus is Capped
**Rule:** Venue history bonus never exceeds +5 strokes or -5 strokes, no matter how extreme.

**Rationale:** Venue history is real but not deterministic. Extreme history (100-stroke advantage) signals data error, not real fit.

---

### Principle 4: Floor is Never Lower Than 30% of Ceiling
**Rule:** If ceiling is 75, floor can't be lower than 53 (75 * 0.7).

**Rationale:** Prevents "binary outcomes" (win big or miss cut). Golf has more continuity.

---

## 7. Future Weight Evolution (ML Readiness)

### Design for ML Enhancement

**Current (Phase 16A):** Hand-tuned weights based on course demand

**Future (Phase 16B+):** Weights can be trained via ML

**Extension Points:**
1. Historical tournament results as training labels
2. Optimize weights to predict finish position
3. A/B test new weight configurations
4. Learn interaction effects (e.g., "firm + fast greens" effects differ from "firm alone")

**Implementation Pattern (from Phase 16A):**
- Store weight configurations in versioned builds
- Build V1 = hand-tuned
- Build V2 = ML-tuned (when ML model ready)
- Allow side-by-side comparison and rollback

---

## 8. Assumptions & Constraints

### Assumptions
1. Structured weights (course demand-based) will outperform unstructured weighting
2. Separating structural fit from form will improve predictive power
3. Venue history matters more for major championships than regular events
4. Confidence multipliers will prevent false-precision artifacts
5. Ceiling/floor profiles will better serve DFS and betting use cases

### Constraints
1. No exact formula provided (weights are framework, not algorithm)
2. Weights evolve per course, making reproducibility critical
3. Version management essential (cannot change weights mid-season)
4. Confidence penalties require data availability (no "guessing" to boost score)

---

## 9. Open Questions for Implementation

1. How should conflicting signals be resolved? (e.g., player weak in high-demand skill, but recently hot?)
2. Should course-demand weights be static (per course) or dynamic (per week)?
3. How sensitive should venue history be to recency? (Should 8-year history count equally with 2-year history?)
4. Should field-strength adjustment affect fit, or only outcome prediction?
5. Should we separately score "DFS fit" vs. "tournament fit"? (They may be different)

---

**Next:** Match Score Architecture (Step 4)
