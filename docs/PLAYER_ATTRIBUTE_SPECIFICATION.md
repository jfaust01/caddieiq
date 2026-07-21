# Player Attribute Specification — Course-Player Matching Engine

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

## 1. Overview

This specification defines every player attribute that will power the Course-Player Matching Engine. Attributes are organized into 13 logical categories, each supporting different aspects of golf performance and decision-making.

**Core Principle:** Honesty over coverage. An attribute contributes only when verified from reliable source data. Missing or unreliable signals remain explicitly `unknown` rather than being estimated or interpolated.

---

## 2. Player Attribute Categories

### Category A: Driving

**Purpose:** Measure long-game distance control and accuracy.

#### A.1 - Driving Distance
- **Description:** Average distance of tee shots (in yards)
- **Why it matters:** Long courses reward distance; premium short courses penalize it
- **Source:** PGA Tour Stats, ShotLink, historical tournament data
- **Reliability:** Very High (direct measurement)
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low to Medium (5-15 yard swings normal)
- **Confidence impact:** High (primary course fit signal)
- **Unit:** Yards (0-350 range)
- **Thresholds:**
  - Elite (90-100): 300+ yards
  - Above Average (70-89): 280-299 yards
  - Average (50-69): 260-279 yards
  - Below Average (30-49): 240-259 yards
  - Poor (0-29): <240 yards

#### A.2 - Driving Accuracy
- **Description:** Fairway hit percentage on tee shots
- **Why it matters:** Tight fairways punish inaccuracy; wider layouts reward consistency
- **Source:** PGA Tour Stats, ShotLink
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium (5-25% swings based on course layout)
- **Confidence impact:** High
- **Unit:** Percentage (0-100)
- **Thresholds:**
  - Elite (90-100): 65%+ accuracy
  - Above Average (70-89): 55-64% accuracy
  - Average (50-69): 45-54% accuracy
  - Below Average (30-49): 35-44% accuracy
  - Poor (0-29): <35% accuracy

#### A.3 - Driving Dispersion
- **Description:** Lateral consistency of tee shots (measured by standard deviation)
- **Why it matters:** Wild players struggle on narrow courses; consistent players exploit medium widths
- **Source:** ShotLink ball tracking
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium
- **Confidence impact:** Medium-High
- **Unit:** Yards (standard deviation, 0-50 range)

#### A.4 - Tee Shot Discipline (Decision Quality)
- **Description:** Frequency of choosing sensible tee club (avoiding driver on danger holes)
- **Why it matters:** Reflects course management; smart players lay up on trouble holes
- **Source:** Historical tournament data, round context analysis
- **Reliability:** Medium (inferred from shot patterns)
- **Refresh cadence:** Per season
- **Expected volatility:** Low (relatively consistent)
- **Confidence impact:** Medium
- **Unit:** Percentage of prudent tee decisions

---

### Category B: Approach

**Purpose:** Measure mid-range iron play and distance control.

#### B.1 - Approach Distance (Strokes Gained: Approach)
- **Description:** Net advantage/disadvantage in approach strokes vs. field average
- **Why it matters:** Approach-heavy courses reward iron control; par-5s emphasize approaches
- **Source:** PGA Tour Stats (Strokes Gained breakdown)
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium (6-12 stroke ranges normal)
- **Confidence impact:** High
- **Unit:** Strokes gained (-10 to +10 scale)

#### B.2 - Approach Proximity
- **Description:** Average distance to pin after approach shot (in feet)
- **Why it matters:** Proximity determines putting difficulty; elite proximity = elite scoring
- **Source:** ShotLink ball tracking
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low to Medium (3-8 foot swings)
- **Confidence impact:** High
- **Unit:** Feet (0-40 range typical)
- **Thresholds:**
  - Elite (90-100): <12 feet average
  - Above Average (70-89): 12-16 feet
  - Average (50-69): 16-21 feet
  - Below Average (30-49): 21-26 feet
  - Poor (0-29): >26 feet

#### B.3 - Distance Control (Standard Distance Gaps)
- **Description:** Consistency hitting specific yardages (clustering around target distances)
- **Why it matters:** Firm greens and hazards penalize distance misses; soft greens forgive
- **Source:** ShotLink shot pattern analysis
- **Reliability:** High
- **Refresh cadence:** Per season
- **Expected volatility:** Low
- **Confidence impact:** Medium-High
- **Unit:** Yards (standard deviation of distance from intended)

#### B.4 - Approach Accuracy (Green Hit Percentage)
- **Description:** Percentage of greens hit in regulation
- **Why it matters:** High-difficulty courses lower GIR; high-accessibility courses elevate it
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium (varies by course setup)
- **Confidence impact:** Medium
- **Unit:** Percentage

---

### Category C: Around Green (Short Game)

**Purpose:** Measure performance from 120 yards and in.

#### C.1 - Strokes Gained: Short Game
- **Description:** Net advantage/disadvantage vs. field average from <120 yards
- **Why it matters:** Short-game-heavy courses reward scrambling ability
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium-High (variable by week)
- **Confidence impact:** High
- **Unit:** Strokes gained (-8 to +8 scale)

#### C.2 - Scrambling Percentage
- **Description:** Percentage of missed greens recovered to make par
- **Why it matters:** Rough conditions, elevated greens require strong scrambling
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium-High
- **Confidence impact:** High
- **Unit:** Percentage (30-70% range typical)

#### C.3 - Bunker Play (Strokes Gained: Bunker)
- **Description:** Net advantage in bunker shots vs. field
- **Why it matters:** Bunker-heavy courses favor bunker specialists
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** High (bunker shots relatively rare)
- **Confidence impact:** Medium-High (high-volatility signal)
- **Unit:** Strokes gained (-4 to +4 scale)

#### C.4 - Chip/Pitch Proximity
- **Description:** Average distance to pin after pitch/chip shot
- **Why it matters:** Better proximity = easier putts = better scoring
- **Source:** ShotLink ball tracking
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium
- **Confidence impact:** High
- **Unit:** Feet (0-15 range typical)

#### C.5 - Rough Performance
- **Description:** Strokes gained from rough vs. field average
- **Why it matters:** Heavy rough increases scrambling difficulty
- **Source:** ShotLink rough detection + stats derivation
- **Reliability:** High (requires rough detection data)
- **Refresh cadence:** Per tournament round
- **Expected volatility:** High
- **Confidence impact:** Medium (confidence depends on rough data availability)
- **Unit:** Strokes gained (-3 to +3 scale)

---

### Category D: Putting

**Purpose:** Measure green reading and putt-making consistency.

#### D.1 - Strokes Gained: Putting
- **Description:** Net advantage vs. field average on greens
- **Why it matters:** Fast greens favor elite putters; slow greens reduce putting gap
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium-High (high week-to-week swings)
- **Confidence impact:** High
- **Unit:** Strokes gained (-4 to +4 scale)

#### D.2 - Putt Distance (Makeable Range, 0-10 feet)
- **Description:** Percentage of putts made from 0-10 feet
- **Why it matters:** Fast greens reward elite short-putt makers
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low to Medium (elite putters >80%, average 65-75%)
- **Confidence impact:** High
- **Unit:** Percentage (60-95% range)

#### D.3 - Putt Distance (Lag Range, 10-30 feet)
- **Description:** Percentage of putts made from 10-30 feet
- **Why it matters:** Lag putting reflects consistency; better on slow/large greens
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium (20-35% range typical)
- **Confidence impact:** Medium-High
- **Unit:** Percentage

#### D.4 - Putt Distance (Long Range, 30+ feet)
- **Description:** Percentage of putts made from 30+ feet
- **Why it matters:** Elite distance putters score well from missed approaches
- **Source:** PGA Tour Stats
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** High (rare events, high variance)
- **Confidence impact:** Medium (sample size limited)
- **Unit:** Percentage (5-15% range typical)

#### D.5 - Three-Putt Avoidance
- **Description:** Percentage of greens hit where player avoided three-putt
- **Why it matters:** Reflects consistency; firm/fast greens penalize three-putts heavily
- **Source:** PGA Tour Stats (inverse of three-putt rate)
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low to Medium (elite >95%, average 85-92%)
- **Confidence impact:** Medium
- **Unit:** Percentage

---

### Category E: Scoring

**Purpose:** Measure aggregate scoring performance and efficiency.

#### E.1 - Scoring Average
- **Description:** Average score per round (strokes)
- **Why it matters:** Raw measure; lower on easier courses
- **Source:** PGA Tour Stats, historical tournament data
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low (relatively consistent, 68-78 range)
- **Confidence impact:** Medium-High (outcome measure, not process)
- **Unit:** Strokes per round (65-80 range typical)

#### E.2 - Scoring Relative to Course (vs. Stroke Play)
- **Description:** Average score minus course stroke play average
- **Why it matters:** Relative performance neutralizes course difficulty
- **Source:** Tournament results + stroke play par
- **Reliability:** High
- **Refresh cadence:** Per tournament
- **Expected volatility:** Low to Medium
- **Confidence impact:** High (normalizes for difficulty)
- **Unit:** Strokes relative to field

#### E.3 - Par Breakers (% Scoring <Par)
- **Description:** Percentage of rounds scoring below course par
- **Why it matters:** Reflects capability to attack; higher on easier courses
- **Source:** Tournament results
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium
- **Confidence impact:** Medium
- **Unit:** Percentage (30-80% range)

#### E.4 - Bogey Avoidance
- **Description:** Percentage of holes where player scored par or better
- **Why it matters:** Consistency marker; elite players avoid bogeys
- **Source:** Hole-by-hole scoring
- **Reliability:** Very High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Low to Medium
- **Confidence impact:** Medium-High
- **Unit:** Percentage (55-85% range typical)

#### E.5 - Score Variance (Tournament-to-Tournament)
- **Description:** Standard deviation of scoring across tournaments
- **Why it matters:** Variance reflects consistency; consistent players don't collapse
- **Source:** Historical tournament database
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (inherent trait)
- **Confidence impact:** Medium
- **Unit:** Strokes (standard deviation, 1-4 range)

---

### Category F: Recovery

**Purpose:** Measure crisis management when shots miss targets.

#### F.1 - Strokes Gained: Penalty Avoidance
- **Description:** Advantage from avoiding water/OB vs. field
- **Why it matters:** Penalty courses punish risk-takers; safe courses don't matter
- **Source:** Tournament penalty tracking
- **Reliability:** Medium (penalties relatively rare)
- **Refresh cadence:** Per tournament round
- **Expected volatility:** High (rare events)
- **Confidence impact:** Low to Medium (sample size small)
- **Unit:** Strokes gained (-3 to +3 scale)

#### F.2 - Trouble Recovery Rate
- **Description:** % of trouble shots (from rough, bunkers, hazards) that result in par or better
- **Why it matters:** Rough/hazard courses reward recovery specialists
- **Source:** ShotLink trouble tracking
- **Reliability:** Medium-High
- **Refresh cadence:** Per tournament round
- **Expected volatility:** Medium-High
- **Confidence impact:** Medium
- **Unit:** Percentage

#### F.3 - Comeback Holes (After Bogey)
- **Description:** Scoring performance on hole immediately after bogey
- **Why it matters:** Reflects mental resilience; some players "snowball" negatively
- **Source:** Hole-by-hole analysis
- **Reliability:** Medium
- **Refresh cadence:** Per season
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** Low to Medium
- **Unit:** Average score (par to par+1.5 range)

---

### Category G: Course History

**Purpose:** Measure player performance at specific venues.

#### G.1 - Venue-Specific Scoring Average
- **Description:** Historical scoring average at a specific course
- **Why it matters:** Some players "fit" specific courses
- **Source:** Historical tournament records at venue
- **Reliability:** Varies (depends on visit frequency)
- **Refresh cadence:** After each visit to venue
- **Expected volatility:** Medium (small sample sizes)
- **Confidence impact:** Medium (depends on sample size; confidence increases with visits)
- **Unit:** Strokes per round
- **Confidence Model:** 
  - 1 visit: Low confidence (1 data point)
  - 2-3 visits: Medium confidence
  - 4+ visits: High confidence

#### G.2 - Venue-Specific Win Rate
- **Description:** Percentage of tournaments won at specific venue
- **Why it matters:** Consistent winners at venue show strong fit
- **Source:** Historical tournament results
- **Reliability:** Varies (depends on participation)
- **Refresh cadence:** After each tournament at venue
- **Expected volatility:** High (small sample)
- **Confidence impact:** Low to Medium (rare wins)
- **Unit:** Percentage of tournaments won

#### G.3 - Venue Pattern Recognition
- **Description:** Scoring trend at venue over time (improving/declining)
- **Why it matters:** Recent course fit may differ from historical average
- **Source:** Chronological tournament records
- **Reliability:** Medium (requires multiple visits)
- **Refresh cadence:** Per season
- **Expected volatility:** Medium
- **Confidence impact:** Medium (forward-looking signal)
- **Unit:** Scoring trend (improving/stable/declining)

---

### Category H: Recent Form

**Purpose:** Measure current momentum and temporary condition.

#### H.1 - Last 10 Rounds Scoring Average
- **Description:** Average score over last 10 tournament rounds
- **Why it matters:** Current form predicts near-term performance
- **Source:** Most recent tournament rounds
- **Reliability:** Very High
- **Refresh cadence:** After each tournament round
- **Expected volatility:** High (volatile, reflects form)
- **Confidence impact:** High (primary momentum signal)
- **Unit:** Strokes per round

#### H.2 - Scoring Trend (Last 10 Rounds)
- **Description:** Direction of scoring trend (improving/stable/declining)
- **Why it matters:** Momentum matters; improving players peak; declining fade
- **Source:** Rolling average of last 10 rounds
- **Reliability:** High
- **Refresh cadence:** After each tournament round
- **Expected volatility:** High
- **Confidence impact:** High
- **Unit:** Strokes per round trend (±2 range)

#### H.3 - Last Tournament Result (Finish Position)
- **Description:** Placement in most recent tournament
- **Why it matters:** Recent success predicts near-term success
- **Source:** Most recent tournament leaderboard
- **Reliability:** Very High
- **Refresh cadence:** After each tournament
- **Expected volatility:** High
- **Confidence impact:** High
- **Unit:** Finishing position (1-200+ range)

#### H.4 - Top-10 Frequency (Last 20 Tournaments)
- **Description:** % of tournaments finishing in top 10
- **Why it matters:** Consistency marker; elite players finish top-10 regularly
- **Source:** Historical tournament results
- **Reliability:** Very High
- **Refresh cadence:** Per tournament
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** High
- **Unit:** Percentage (5-60% range typical)

#### H.5 - Made Cut Percentage (Last 20 Tournaments)
- **Description:** % of tournaments where player made cut
- **Why it matters:** Cut-making is baseline skill; 50%+ typical for pros
- **Source:** Tournament cut data
- **Reliability:** Very High
- **Refresh cadence:** Per tournament
- **Expected volatility:** Low (relatively stable)
- **Confidence impact:** Medium
- **Unit:** Percentage (40-95% range)

#### H.6 - Withdrawal/Injury Status
- **Description:** Current health status (playing / injured / recovering)
- **Why it matters:** Injured players perform worse; recovering players below baseline
- **Source:** Tour updates, player status
- **Reliability:** High
- **Refresh cadence:** Per tournament week
- **Expected volatility:** N/A (discrete state)
- **Confidence impact:** High (binary modifier)
- **Unit:** Status enum (Playing, MinorInjury, MajorInjury, Recovering)

---

### Category I: Wind Performance

**Purpose:** Measure how player handles windy conditions.

#### I.1 - Wind-Impact Elasticity
- **Description:** Scoring degradation per additional 5 mph of wind
- **Why it matters:** Wind-exposed courses penalize wind-sensitive players
- **Source:** Weather data + scoring correlation
- **Reliability:** Medium (requires weather + scoring correlation)
- **Refresh cadence:** Per season (aggregated)
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** Medium
- **Unit:** Strokes penalty per 5 mph wind

#### I.2 - Trajectory Control (Ball Flight Shape Consistency)
- **Description:** Ability to produce consistent ball flight (draw vs. fade)
- **Why it matters:** Wind rewards controlled trajectory
- **Source:** ShotLink ball tracking
- **Reliability:** Medium-High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (inherent trait)
- **Confidence impact:** Medium-High
- **Unit:** Dispersion measure (standard deviation)

#### I.3 - Windy Round Performance Differential
- **Description:** Scoring differential on windy days vs. calm days
- **Why it matters:** Direct measure of wind adaptability
- **Source:** Weather conditions + scoring on days with wind
- **Reliability:** Medium (requires wind data correlation)
- **Refresh cadence:** Per season
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** Medium
- **Unit:** Strokes penalty on windy days

---

### Category J: Grass Performance

**Purpose:** Measure performance on different grass types.

#### J.1 - Bentgrass Performance
- **Description:** Average scoring on Bentgrass courses
- **Why it matters:** Some players excel on specific grass types
- **Source:** Bentgrass venue historical scores
- **Reliability:** Varies (depends on participation)
- **Refresh cadence:** After each Bentgrass event
- **Expected volatility:** Medium
- **Confidence impact:** Medium (confidence increases with visits)
- **Unit:** Strokes per round

#### J.2 - Bermuda Performance
- **Description:** Average scoring on Bermuda courses
- **Why it matters:** Bermuda is common; player affinity varies
- **Source:** Bermuda venue historical scores
- **Reliability:** Varies
- **Refresh cadence:** After each Bermuda event
- **Expected volatility:** Medium
- **Confidence impact:** High (Bermuda frequence)
- **Unit:** Strokes per round

#### J.3 - Other Grass Types (Poa, Zoysia, Fescue)
- **Description:** Average scoring on other grass types
- **Why it matters:** Grass-sensitive players show strong patterns
- **Source:** Grass-specific venue records
- **Reliability:** Varies (depends on participation)
- **Refresh cadence:** After events
- **Expected volatility:** Medium
- **Confidence impact:** Low to Medium
- **Unit:** Strokes per round

---

### Category K: Mental/Consistency

**Purpose:** Measure psychological resilience and performance stability.

#### K.1 - Clutch Performance (Pressure Moments)
- **Description:** Scoring differential in final 9 holes vs. earlier play
- **Why it matters:** Clutch players excel in tournaments; high-pressure courses reward mental strength
- **Source:** Hole-by-hole scoring in tournaments
- **Reliability:** Medium
- **Refresh cadence:** Per season (aggregated)
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** Medium
- **Unit:** Strokes differential (par to par+2 range)

#### K.2 - Consistency Index
- **Description:** Tournament-to-tournament scoring consistency (low variance = high consistency)
- **Why it matters:** Consistent players score well on varied courses
- **Source:** Tournament result variance
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** High
- **Unit:** Coefficient of variation (0.05-0.20 range; lower = more consistent)

#### K.3 - Comeback Success Rate
- **Description:** % of times player recovers from poor tournament to finish in top-20
- **Why it matters:** Resilience players show bounceback patterns
- **Source:** Historical tournament records
- **Reliability:** Medium
- **Refresh cadence:** Per season
- **Expected volatility:** Low
- **Confidence impact:** Medium
- **Unit:** Percentage

---

### Category L: Volatility Profile

**Purpose:** Measure risk characteristics and ceiling/floor.

#### L.1 - Ceiling (90th Percentile Round)
- **Description:** Expected score for 90th percentile round (best 1 in 10)
- **Why it matters:** Upside-potential tournaments value high ceilings
- **Source:** Historical scoring percentiles
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** High
- **Unit:** Strokes (typically 5-8 below average)

#### L.2 - Floor (10th Percentile Round)
- **Description:** Expected score for 10th percentile round (worst 1 in 10)
- **Why it matters:** Risk-averse tournament selection avoids high floors
- **Source:** Historical scoring percentiles
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** High
- **Unit:** Strokes (typically 3-6 above average)

#### L.3 - Upside Frequency
- **Description:** % of rounds scoring 3+ below average
- **Why it matters:** High-volatility players have more super-hot rounds
- **Source:** Historical rounds vs. average
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (inherent trait)
- **Confidence impact:** High
- **Unit:** Percentage (5-25% range)

#### L.4 - Downside Frequency
- **Description:** % of rounds scoring 3+ above average
- **Why it matters:** High-volatility players also have more cold stretches
- **Source:** Historical rounds vs. average
- **Reliability:** Very High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (inherent trait)
- **Confidence impact:** High
- **Unit:** Percentage (5-25% range)

---

### Category M: DFS Characteristics

**Purpose:** Measure traits that predict daily fantasy success.

#### M.1 - Salary vs. Finishing Position Correlation
- **Description:** Tendency to finish higher/lower than salary suggests
- **Why it matters:** Some players are "good values"; others "fade"
- **Source:** DFS salary data + tournament finishes
- **Reliability:** Medium-High
- **Refresh cadence:** Per tournament week
- **Expected volatility:** Medium (tournament-dependent)
- **Confidence impact:** Medium
- **Unit:** Correlation coefficient (-0.5 to +0.5 range)

#### M.2 - Week-to-Week Consistency
- **Description:** % of weeks finishing within salary tier (not huge over/under)
- **Why it matters:** Predictable players suit DFS better
- **Source:** Weekly performance vs. salary
- **Reliability:** High
- **Refresh cadence:** Per tournament week
- **Expected volatility:** Low (trait-based)
- **Confidence impact:** Medium
- **Unit:** Percentage (40-80% range)

#### M.3 - Max Upside Score (Contest Points Ceiling)
- **Description:** Highest fantasy points scored in single tournament
- **Why it matters:** High ceilings win tournaments; low ceilings miss value
- **Source:** DFS historical records
- **Reliability:** High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (historical maximum)
- **Confidence impact:** Medium
- **Unit:** Fantasy points

#### M.4 - Min DFS Score (Contest Points Floor)
- **Description:** Lowest fantasy points scored in single tournament (excluding injuries)
- **Why it matters:** Floor management critical for GPP vs. cash games
- **Source:** DFS historical records
- **Reliability:** High
- **Refresh cadence:** Per season
- **Expected volatility:** Low (historical minimum)
- **Confidence impact:** Medium
- **Unit:** Fantasy points

---

## 3. Attribute Organization for Matching

The 50+ individual attributes above roll up into **5 Primary Skill Buckets** for matching:

| Bucket | Attributes | Purpose |
|--------|-----------|---------|
| **Driving** | A.1-A.4 (distance, accuracy, dispersion, discipline) | Long-game fit |
| **Approach** | B.1-B.4 (SG approach, proximity, distance control, GIR) | Mid-range fit |
| **Short Game** | C.1-C.5 (SG short game, scrambling, bunkers, chip proximity, rough) | Crisis management |
| **Putting** | D.1-D.5 (SG putting, 0-10ft, 10-30ft, 30+ft, 3-putt avoid) | Green reading fit |
| **Scoring** | E.1-E.5 (scoring avg, relative scoring, par breakers, bogey avoid, variance) | Overall efficiency |

**Additional Context Layers:**
- Recent Form (H.1-H.6)
- Course History (G.1-G.3)
- Environmental Factors (I.1-I.3, J.1-J.3)
- Risk Profile (K.1-L.4, M.1-M.4)

---

## 4. Data Quality & Confidence Scoring

### Per-Attribute Confidence Framework

For each attribute, confidence is graded 0-100 based on:

1. **Sample Size** (30% weight)
   - 0 rounds: 0% confidence
   - 1-5 rounds: 25% confidence
   - 6-20 rounds: 50% confidence
   - 21-50 rounds: 75% confidence
   - 50+ rounds: 100% confidence

2. **Data Freshness** (20% weight)
   - >1 year old: 25% confidence
   - 6-12 months old: 50% confidence
   - 1-6 months old: 75% confidence
   - <1 month old: 100% confidence

3. **Signal Stability** (30% weight)
   - High variance (>±5 strokes): 50% confidence
   - Medium variance (±3-5 strokes): 75% confidence
   - Low variance (<±3 strokes): 100% confidence

4. **Source Reliability** (20% weight)
   - Inferred/Estimated: 50% confidence
   - Official Stats: 100% confidence

---

## 5. Attribute Evolution

### Projected 100+ Attribute Roadmap

**Phase 16A Foundation (50 attributes):** Current spec

**Phase 16B Extensions (20 attributes):**
- Shot-by-shot quality metrics
- Specific hazard performance (water, bunker types)
- Green-reading accuracy by slope
- Lie quality performance

**Phase 16C ML Features (30+ attributes):**
- Shot patterns (trajectory shapes)
- Course-positioning preferences
- Player-specific vulnerability profiles
- Dynamic adjustment speed

---

## 6. Assumptions

1. All attributes assume availability of PGA Tour official statistics or ShotLink data
2. Historical venue performance assumes at least 2 visits for meaningful signal
3. Environmental factors (wind, grass) assume data correlation with scoring
4. DFS characteristics assume access to salary and result data
5. Recent form assumes active tournament participation

---

## 7. Open Questions

1. How should we weight attributes that depend on missing data sources (e.g., rough performance without ShotLink)?
2. Should venue-specific performance use weighted averages (recent visits weighted higher) or raw average?
3. How to handle players with limited playing history (<50 rounds)?
4. Should some attributes be tournament-format-specific (stroke play vs. matchplay)?
5. Do we need course-management scoring (shot selection quality vs. execution)?

---

**Next:** Course Attribute Specification (Step 2)
