# Confidence Framework — Course-Player Matching Engine

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

## 1. Core Principle

**Confidence should measure data quality, not prediction certainty.**

A high match score with low confidence is better than a low match score with false confidence. The framework explicitly separates "what we know" from "what we don't know yet."

---

## 2. Confidence Is NOT Accuracy

### Common Misconception
> "High confidence = this player will definitely perform well"

### Truth
> "High confidence = we have sufficient data to trust the fit comparison"

A player can have:
- **High fit score + High confidence** → Trustworthy (play him)
- **High fit score + Low confidence** → Possible (needs more data)
- **Low fit score + High confidence** → Trustworthy (don't play him)
- **Low fit score + Low confidence** → Inconclusive (wait for more data)

---

## 3. Three Confidence Dimensions

### Dimension A: Data Coverage Confidence (0-100)

**What it measures:** Do we have sufficient player and course data to make the comparison?

#### A.1 - Player Attribute Coverage

**Question:** How much do we know about this player?

**Metrics:**
1. **Tournament Rounds Played:**
   - 1-5 rounds: 20% confidence
   - 6-20 rounds: 40% confidence
   - 21-50 rounds: 65% confidence
   - 51-100 rounds: 85% confidence
   - 100+ rounds: 100% confidence

2. **Attribute Completeness:**
   - Count of attributes with data vs. total attributes
   - Missing attributes reduce confidence
   - Example: Player has driving data but no putting data → incomplete

3. **Recent Activity:**
   - Last round within 2 weeks: Full credit
   - Last round 2-4 weeks ago: 90% credit
   - Last round 1-3 months ago: 70% credit
   - Last round 3-12 months ago: 40% credit
   - No data within 12 months: 10% credit

**Formula:**
```
Player Coverage Confidence = 
  (Tournament Rounds Factor * 0.50) + 
  (Attribute Completeness * 0.30) + 
  (Recency Factor * 0.20)
```

**Example:**
```
Player: Collin Morikawa
  - 45 tournament rounds: 65% coverage
  - All 5 skills have data: 100% completeness
  - Last round 8 days ago: 100% recency
  - Coverage = (65 * 0.50) + (100 * 0.30) + (100 * 0.20) = 82%
```

#### A.2 - Course Attribute Coverage

**Question:** How well do we understand this course?

**Metrics:**
1. **Tournaments Held at Course:**
   - 0 tournaments (never hosted): 10% confidence
   - 1 tournament: 30% confidence
   - 2-3 tournaments: 50% confidence
   - 4-7 tournaments: 75% confidence
   - 8+ tournaments: 95% confidence

2. **Attribute Completeness:**
   - Design specs (yardage, par, layout): Always available (100%)
   - Course characteristics (setup, conditions): 90% availability
   - Scoring history: Depends on tournament history
   - Green speed (Stimp), firmness: 80% availability (major tournaments)

3. **Survey Data Quality:**
   - No recent survey: 50% confidence
   - Survey 2+ years old: 65% confidence
   - Survey 1-2 years old: 80% confidence
   - Survey <1 year old: 95% confidence

**Formula:**
```
Course Coverage Confidence = 
  (Tournament History Factor * 0.50) + 
  (Attribute Availability * 0.30) + 
  (Survey Recency * 0.20)
```

**Example:**
```
Course: Augusta National
  - 15+ tournaments: 95% history factor
  - All attributes available: 100% availability
  - Recent survey: 95% survey confidence
  - Coverage = (95 * 0.50) + (100 * 0.30) + (95 * 0.20) = 96%
```

#### A.3 - Combined Coverage Confidence

```
Coverage Confidence = AVERAGE(Player Coverage, Course Coverage)

// Cap at 0.95 (can never be 100%, there's always uncertainty)
Coverage Confidence = MIN(Coverage Confidence, 0.95)
```

---

### Dimension B: Signal Quality Confidence (0-100)

**What it measures:** How reliable are the specific signals being compared?

#### B.1 - Player Skill Signal Reliability

**Question:** How stable and reliable is this player's skill measurement?

**Metrics:**
1. **Measurement Stability** (Are recent results consistent with historical average?)
   ```
   Last 10 rounds std dev vs. Career std dev:
   - Very consistent (<0.5x): 95% reliability
   - Consistent (0.5-1.0x): 85% reliability
   - Somewhat volatile (1.0-1.5x): 70% reliability
   - Very volatile (1.5-2.0x): 50% reliability
   - Extremely volatile (>2.0x): 30% reliability
   ```

2. **Sample Size for Skill** (How many rounds of a specific skill?)
   - For approach shots: 50+ approach shots = 95% confidence
   - For putting: 100+ putts = 95% confidence
   - For short game: 30+ short-game shots = 85% confidence

3. **Injury/Status Factor:**
   - Healthy: 100% reliability
   - Minor injury (playing through): 75% reliability
   - Recently returned: 50% reliability
   - Out for season: 10% reliability

**Formula:**
```
Player Signal Reliability = 
  (Measurement Stability * 0.50) + 
  (Sample Size Adequacy * 0.35) + 
  (Health Status * 0.15)
```

#### B.2 - Course Demand Signal Reliability

**Question:** How consistently does this course test the same skill?

**Metrics:**
1. **Scoring Consistency Across Tournaments:**
   - Same difficulty year-to-year: 95% reliability
   - Some variance: 75% reliability
   - High variance: 50% reliability

2. **Setup Consistency:**
   - Same director, same setup philosophy: 90% reliability
   - Setup varies by director: 70% reliability
   - Setup changes yearly: 50% reliability

3. **Course Changes:**
   - No changes in 5 years: 95% reliability
   - Minor changes: 80% reliability
   - Renovation 1-3 years ago: 60% reliability
   - Major renovation <1 year: 30% reliability

**Formula:**
```
Course Signal Reliability = 
  (Scoring Consistency * 0.40) + 
  (Setup Consistency * 0.40) + 
  (Course Stability * 0.20)
```

#### B.3 - Combined Signal Quality

```
Signal Quality Confidence = AVERAGE(Player Signal, Course Signal)
```

---

### Dimension C: Data Alignment Confidence (0-100)

**What it measures:** Do the player and course data come from the same context?

#### C.1 - Temporal Alignment

**Question:** Are we comparing fresh data across both player and course?

```
Temporal Alignment = 
  1.0 - ABS(Days since last player data - Days since last course data) / 365
  
- Both updated this week: ~100%
- Both updated this month: ~95%
- Player 2 months old, course 1 month old: ~85%
- Player 3 months old, course 1 year old: ~50%
```

#### C.2 - Format Alignment

**Question:** Are player and course attributes measured using compatible scales?

```
Format Alignment = 
  "Are player metrics and course metrics from same source?"
  
- Both from PGA Tour: 100%
- Player from PGA Tour, Course from USGA: 90%
- Player from DP World Tour, Course from PGA Tour: 80%
- Player from one tour, Course from non-tour event: 50%
```

#### C.3 - Tier Alignment

**Question:** Is the player's skill measured against comparable opponents?

```
Tier Alignment = 
  "Is player's percentile calculated vs. right field?"
  
- Major championship player vs. major field: 100%
- Tour player vs. tour field: 95%
- Web.com player vs. PGA tour data: 60%
- International player vs. US-only data: 70%
```

#### C.4 - Combined Alignment

```
Alignment Confidence = AVERAGE(Temporal, Format, Tier Alignment)
```

---

## 4. Final Confidence Score

### Composite Confidence Calculation

```
Confidence = 
  (Coverage Confidence * 0.50) +
  (Signal Quality * 0.35) +
  (Alignment Confidence * 0.15)

// Scale to 0-100
Confidence = MIN(Confidence, 95)  // Cap at 95%
```

---

## 5. Confidence Tiers & Display

### Tier 1: High Confidence (80-95%)
**Meaning:** Trust this fit score fully

**Criteria:**
- Both player and course well-documented
- Recent data from relevant sources
- Signals align across player/course
- Minimal uncertainty

**Display:**
```
"High Confidence (87%)"
"This assessment is based on strong data across recent form and course history."
```

**Action:** Use for decisions

---

### Tier 2: Medium-High Confidence (65-79%)
**Meaning:** Useful, but note limitations

**Criteria:**
- Good player/course data
- Some gaps or older data
- Minor alignment issues

**Display:**
```
"Medium-High Confidence (72%)"
"Based on good data, though some course characteristics are from past events."
```

**Action:** Use with caveats

---

### Tier 3: Medium Confidence (50-64%)
**Meaning:** Directional signal only

**Criteria:**
- Limited data on player or course
- Some misalignment
- Notable gaps

**Display:**
```
"Medium Confidence (58%)"
"Limited recent data. Use as rough estimate, not definitive guide."
```

**Display Score as Range:**
```
"Likely fit range: 68-76 (midpoint 72)"
instead of
"Fit score: 72"
```

**Action:** Use for brainstorming, not final decisions

---

### Tier 4: Low Confidence (<50%)
**Meaning:** Too uncertain for actionable decision

**Criteria:**
- Minimal player/course data
- First-time venue
- Major data gaps
- High misalignment

**Display:**
```
"Low Confidence (35%)"
"Insufficient data for reliable fit assessment.
This player has not played enough rounds (8) or hasn't visited this course type.
Suggestion: Use general skill profile instead."
```

**Display Score as Category:**
```
"Likely Fit: Fair to Good"
instead of exact score
```

**Action:** Wait for more data, or use only as tiebreaker

---

## 6. Confidence Impact on Display

### High Confidence (80%+)
```
Match Score: 78
Confidence: High ████████░░

Sub-Scores:
Driving: 82
Approach: 75
Short Game: 70
Putting: 80
Scoring: 76

Explanation: Based on strong recent form (8 wins last 10 
tournaments) and excellent fit with Augusta's putting 
premium (93rd percentile putting vs. 10.8 Stimp).
```

### Medium Confidence (50-79%)
```
Match Score: Likely 72-78 (midpoint: 75)
Confidence: Medium ████▌░░░░

Based on 15 tournament rounds and Augusta's tournament 
history. Note: Limited driving data.
```

### Low Confidence (<50%)
```
Match Score: Uncertain
Confidence: Low ██░░░░░░░

Reason: Player has only 6 tournament rounds (prefer 20+). 
Insufficient data for reliable fit.

Available signal: Based on available data, likely fit 
is Fair to Good (estimated 60-70 range).
```

---

## 7. Confidence-Specific Rules

### Rule 1: Never Hide Low Confidence Behind High Score
**Bad:**
```
Fit Score: 82 (with 40% confidence)
```

**Good:**
```
Fit Score: Likely 75-89 (midpoint: 82)
Confidence: Low (40%)
```

---

### Rule 2: Use Confidence to Explain Disagreement
**Scenario:** Two similar players, very different fit scores

**Good Explanation:**
```
Player A: Score 75 (Confidence 85%)
Player B: Score 58 (Confidence 35%)

Player A has 40+ tournament rounds at similar courses (high confidence).
Player B has only 6 tournament rounds, first time at this course type (low confidence).
The difference in confidence is more significant than the score difference.
```

---

### Rule 3: Confidence Reduces Over Time
**Rule:** Confidence decays as data ages

```
Confidence Decay = Base_Confidence * (1 - (Days_Old / 365))

- Data 1 month old: 100% of base confidence
- Data 6 months old: 83% of base confidence
- Data 1 year old: 0% of base confidence (refresh needed)
```

---

### Rule 4: Confidence Increases With Each Tournament
**Rule:** Each additional tournament data point increases confidence

```
After New Tournament:
  Player Rounds: 40 → 41
  Coverage Confidence: 75% → 76%
  Overall Confidence: 72% → 73%
```

---

## 8. Confidence Explanations for Users

### Explanation Template A: High Confidence

```
"We have high confidence (87%) in this fit because:
• {Player} has played {45} tournaments this season
• We have {12 months} of recent performance data
• Augusta National has hosted {15+} PGA tournaments
  (providing consistent scoring benchmarks)
• {Player}'s skills are measured against the same
  field and conditions as this tournament"
```

### Explanation Template B: Medium Confidence

```
"We have moderate confidence (64%) because:
• {Player} has limited history: only {8} tournaments
• {Course Name} has been renovated in {2021},
  so older scoring data may not apply
• No {Player} has visited this {design type} before
  (estimate based on similar courses)"
```

### Explanation Template C: Low Confidence

```
"We have low confidence (38%) because:
• {Player} data is limited: only {5} tournaments
• This is {Player}'s first visit to this course
• Recent weather may have changed course conditions
  significantly

Recommendation: Check back after this week's pro-am,
when we'll have live course conditions data."
```

---

## 9. Confidence Assumptions

1. Tournament history at a course is reliable proxy for consistency
2. Player form volatility indicates signal reliability
3. Temporal alignment between player/course data matters
4. Sample size adequacy varies by attribute type
5. Recency decay is linear (not exponential)

---

## 10. Open Questions

1. Should confidence be displayed as a percentage (72%), category (Medium), or both?
2. How to handle confidence when comparing players vs. absolute thresholds?
3. Should injuries automatically lower confidence, or stay based on data quality?
4. How frequently should confidence be recalculated? (Daily? Weekly? Per tournament?)
5. Should we show confidence intervals (e.g., "72 ± 6 points") instead of points + confidence %?

---

**Next:** Explainability Engine (Step 6)
