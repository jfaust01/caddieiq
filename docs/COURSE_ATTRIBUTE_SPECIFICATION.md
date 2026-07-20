# Course Attribute Specification — Course-Player Matching Engine

**Status:** Architecture Specification for Phase 16A  
**Date:** 2026-07-20  
**Document Type:** Implementation-Agnostic Design  

---

## 1. Overview

This specification defines every course attribute that will power the Course-Player Matching Engine. Attributes are organized into 12 logical categories representing course difficulty, design, and setup characteristics.

**Core Principle:** Honesty over coverage. A course attribute contributes only when verified from reliable source data (course design, ShotLink, setup sheets, scoring data). Missing signals remain `unknown` rather than estimated.

---

## 2. Course Attribute Categories

### Category A: Layout Dimensions

**Purpose:** Measure course size and distance distribution.

#### A.1 - Total Yardage
- **Description:** Course length in yards from championship tees
- **Why it matters:** Longer courses reward distance; shorter courses don't
- **Source:** Course design (USGA handicap)
- **Reliability:** Very High (official measurement)
- **Update frequency:** Per tournament setup
- **Unit:** Yards (6,800-8,000 typical)

#### A.2 - Par
- **Description:** Total strokes for 18 holes
- **Why it matters:** Par scale defines course difficulty baseline
- **Source:** Official course design
- **Reliability:** Very High
- **Update frequency:** Rarely changes
- **Unit:** Strokes (66-72 typical)

#### A.3 - Par Distribution Profile
- **Description:** Count of par-3, par-4, par-5 holes (and any par-6)
- **Why it matters:** Par-4 heavy courses demand accuracy; par-5 heavy reward distance
- **Source:** Official course design
- **Reliability:** Very High
- **Update frequency:** Never (course design)
- **Unit:** Distribution (e.g., 4 par-3s, 10 par-4s, 4 par-5s)
- **Patterns:**
  - Par-3 heavy: Approach and putting focus
  - Par-4 heavy: Driving accuracy emphasized
  - Par-5 heavy: Distance and par-5 scoring critical

#### A.4 - Average Hole Length
- **Description:** Mean yardage per hole
- **Why it matters:** Normalized measure of difficulty
- **Source:** Total yardage ÷ 18
- **Reliability:** Very High
- **Update frequency:** Per tournament setup
- **Unit:** Yards per hole (377-444 typical range)

#### A.5 - Hole Length Variance (Standard Deviation)
- **Description:** Variability in hole lengths (tight distribution vs. scattered)
- **Why it matters:** Tight variance = predictable course; high variance = varied demands
- **Source:** All hole yardages
- **Reliability:** Very High
- **Update frequency:** Never (course design)
- **Unit:** Yards (30-80 range typical)

#### A.6 - Reachability Profile
- **Description:** % of par-5s reachable in 2 shots by average player
- **Why it matters:** Reachable par-5s = birdie opportunities; unreachable = par courses
- **Source:** Par-5 distances vs. PGA average distance (325 yards)
- **Reliability:** High
- **Update frequency:** Never (course design)
- **Unit:** Percentage (0-100%)

---

### Category B: Fairway Difficulty

**Purpose:** Measure off-tee accuracy demands.

#### B.1 - Average Fairway Width
- **Description:** Mean fairway width (in yards) across par-4 and par-5 holes
- **Why it matters:** Narrow fairways penalize inaccuracy; wide fairways forgive
- **Source:** Course survey or design specs
- **Reliability:** Medium-High (depends on survey quality)
- **Update frequency:** Per tournament setup (course conditioning affects playable width)
- **Unit:** Yards (25-60 range typical)

#### B.2 - Fairway Width Distribution
- **Description:** % of holes with wide (>40 yds), medium (25-40 yds), narrow (<25 yds) fairways
- **Why it matters:** Mix of widths creates varied demands
- **Source:** Course survey
- **Reliability:** Medium-High
- **Update frequency:** Per tournament setup
- **Unit:** Distribution (e.g., 20% wide, 50% medium, 30% narrow)

#### B.3 - Rough Severity
- **Description:** Rough thickness and penalty (how much stroke loss from rough)
- **Why it matters:** Heavy rough increases scrambling demand
- **Source:** Setup sheet, visual assessment, scoring correlation
- **Reliability:** Medium (subjective)
- **Update frequency:** Per tournament week (mowing patterns change)
- **Unit:** Category (Light / Medium / Heavy)
- **Definitions:**
  - Light: Players can advance 80%+ of distance from rough
  - Medium: Players advance 60-80% of distance
  - Heavy: Players advance <60% of distance

#### B.4 - Dogleg Distribution
- **Description:** % of holes with doglegs (left, right, double)
- **Why it matters:** Doglegs reward good course management; punish wild drives
- **Source:** Course design
- **Reliability:** Very High
- **Update frequency:** Never
- **Unit:** Percentage (30-60% typical)

#### B.5 - Forced Carry Percentage
- **Description:** % of tee shots requiring forced carry over hazard/penalty area
- **Why it matters:** Forced carries penalize short hitters and high-risk players
- **Source:** Course design inspection
- **Reliability:** High
- **Update frequency:** Never (design feature)
- **Unit:** Percentage (10-40% typical)

#### B.6 - Landing Area Precision Index
- **Description:** Tightness of optimal landing zone (wide landing area = forgiving; tight = demand
- **Why it matters:** Tight landing zones increase accuracy demand
- **Source:** ShotLink ball tracking analysis + design
- **Reliability:** Very High (from ShotLink data)
- **Update frequency:** Per tournament
- **Unit:** Yards (landing zone width, 30-80 range)

---

### Category C: Green Difficulty

**Purpose:** Measure approach complexity and putting difficulty.

#### C.1 - Average Green Size
- **Description:** Mean putting surface area (in square feet)
- **Why it matters:** Larger greens are more forgiving; small greens penalize misses
- **Source:** Course survey
- **Reliability:** Medium-High
- **Update frequency:** Never (design feature)
- **Unit:** Square feet (3,000-8,000 typical)

#### C.2 - Green Size Distribution
- **Description:** % of greens that are small (<4,000 sq ft), medium (4-6,000), large (>6,000)
- **Why it matters:** Mix determines approach demands
- **Source:** Course survey
- **Reliability:** Medium-High
- **Update frequency:** Never
- **Unit:** Distribution percentages

#### C.3 - Green Shape Complexity
- **Description:** Median green contour complexity (flat vs. multi-tiered)
- **Why it matters:** Tiered greens increase putting distance and difficulty
- **Source:** Design specs + visual assessment
- **Reliability:** Medium
- **Update frequency:** Never
- **Unit:** Category (Simple / Moderate / Complex)

#### C.4 - Green Speed (Stimp Measurement)
- **Description:** Putting surface speed (in feet of rollout)
- **Why it matters:** Fast greens reward elite putters; slow greens reduce putting gap
- **Source:** Official Stimpmeter measurement
- **Reliability:** Very High
- **Update frequency:** Daily during tournament
- **Unit:** Stimp rating (8-13 typical, pro tour 11-13 typical)
- **Tier:**
  - Slow: <10 Stimp (medium-length putts become 1-2 footers)
  - Medium: 10-11 Stimp (standard difficulty)
  - Fast: 11-12 Stimp (elite putting rewarded)
  - Very Fast: >12 Stimp (extreme putting premium)

#### C.5 - Green Firmness
- **Description:** Green surface firmness (soft, medium, firm)
- **Why it matters:** Firm greens hold approach shots; soft greens forgive
- **Source:** Setup assessment, recent weather
- **Reliability:** Medium-High
- **Update frequency:** Daily during tournament
- **Unit:** Category (Soft / Medium / Firm)

#### C.6 - Approach Distance Profile
- **Description:** Average distance from which typical approach shot reaches green
- **Why it matters:** Defines typical approach club demands
- **Source:** ShotLink + course design
- **Reliability:** Very High
- **Update frequency:** Per tournament
- **Unit:** Yards (120-180 typical)

#### C.7 - Green Slope Aggregate
- **Description:** Average overall slope difficulty (rated 0-10)
- **Why it matters:** Sloped greens require elite putting
- **Source:** Setup assessment + visual analysis
- **Reliability:** Medium
- **Update frequency:** Per season (slope changes with mowing)
- **Unit:** Rating (2-7 scale typical)

---

### Category D: Hazard Profile

**Purpose:** Measure penalty areas and recovery difficulty.

#### D.1 - Water Hazard Count
- **Description:** Number of holes with water in play
- **Why it matters:** Water hazards increase risk/reward calculus
- **Source:** Course design
- **Reliability:** Very High
- **Update frequency:** Never
- **Unit:** Count (0-14 typical)

#### D.2 - Water Hazard Type Distribution
- **Description:** % of water hazards that are fronting, lateral, carrying, back
- **Why it matters:** Different water positions create different strategic problems
- **Source:** Design inspection
- **Reliability:** High
- **Update frequency:** Never
- **Unit:** Distribution percentages

#### D.3 - Bunker Count (Course Total)
- **Description:** Total number of bunkers on course
- **Why it matters:** Bunker density affects probability of bunker shots
- **Source:** Course design
- **Reliability:** Very High
- **Update frequency:** Per course renovation
- **Unit:** Count (30-100 typical)

#### D.4 - Bunker Density by Zone
- **Description:** Bunker distribution (tee zone, fairway, approach, green surrounds)
- **Why it matters:** Bunker placement affects which shots require recovery
- **Source:** Course design mapping
- **Reliability:** High
- **Update frequency:** Per course renovation
- **Unit:** Distribution across 4 zones

#### D.5 - Bunker Difficulty Rating
- **Description:** Average bunker difficulty to escape from (soft sand, deep, steep)
- **Why it matters:** Difficult bunkers penalize bunker players more
- **Source:** Setup assessment, visual analysis
- **Reliability:** Medium
- **Update frequency:** Per tournament week
- **Unit:** Category (Easy / Medium / Difficult)

#### D.6 - Out of Bounds Frequency
- **Description:** % of holes with OB as significant threat
- **Why it matters:** OB penalties punish wild players severely
- **Source:** Course design inspection
- **Reliability:** High
- **Update frequency:** Never
- **Unit:** Percentage (20-50% typical)

#### D.7 - Total Penalty Area (Square Footage)
- **Description:** Aggregate area of all hazards (water + OB + bunkers) as % of course
- **Why it matters:** High penalty area = punishing layout; low = forgiving
- **Source:** Design mapping
- **Reliability:** Medium-High
- **Update frequency:** Never
- **Unit:** Percentage of course (15-40% typical)

---

### Category E: Elevation & Terrain

**Purpose:** Measure vertical difficulty and environmental factors.

#### E.1 - Elevation Change (Aggregate)
- **Description:** Total cumulative elevation change over 18 holes
- **Why it matters:** Hilly courses add physical demand and wind exposure
- **Source:** Elevation mapping, topographic survey
- **Reliability:** Very High
- **Update frequency:** Never
- **Unit:** Feet (100-600 typical range)

#### E.2 - Course Altitude
- **Description:** Mean elevation above sea level
- **Why it matters:** High altitude adds distance (thinner air); affects ball flight
- **Source:** Geographic data
- **Reliability:** Very High
- **Update frequency:** Never
- **Unit:** Feet above sea level (sea level to 8,000 typical)

#### E.3 - Altitude Impact Factor
- **Description:** Expected ball flight distance increase from altitude
- **Why it matters:** High-altitude courses reward distance
- **Source:** Altitude-distance correlation (3-5% increase per 5,000 feet)
- **Reliability:** High
- **Update frequency:** Never
- **Unit:** Percentage increase

#### E.4 - Slope of Green Complex
- **Description:** Average green-to-tee elevation change
- **Why it matters:** Uphill approaches are harder; downhill putts are faster
- **Source:** Topographic survey
- **Reliability:** High
- **Update frequency:** Never
- **Unit:** Feet (0-50 typical)

#### E.5 - Terrain Variety Index
- **Description:** Variety of terrain types (links, parkland, hybrid)
- **Why it matters:** Links require different skill mix than parkland
- **Source:** Visual assessment + design classification
- **Reliability:** Medium-High
- **Update frequency:** Per course renovation
- **Unit:** Category (Links / Parkland / Hybrid / Desert / Mountain)

---

### Category F: Grass & Surface

**Purpose:** Measure course grass type and surface characteristics.

#### F.1 - Primary Grass Type (Fairway)
- **Description:** Dominant grass species on fairways
- **Why it matters:** Grass type affects lie quality and playability
- **Source:** Course maintenance records
- **Reliability:** Very High
- **Update frequency:** Per season (overseeding patterns)
- **Unit:** Grass type (Bentgrass / Bermuda / Zoysia / Ryegrass / Fescue / Other)

#### F.2 - Primary Grass Type (Rough)
- **Description:** Dominant grass species in rough
- **Why it matters:** Rough grass affects recovery difficulty
- **Source:** Course maintenance records
- **Reliability:** Very High
- **Update frequency:** Per season
- **Unit:** Grass type enum

#### F.3 - Primary Grass Type (Green)
- **Description:** Dominant grass species on greens
- **Why it matters:** Green grass affects speed and roll characteristics
- **Source:** Course maintenance records
- **Reliability:** Very High
- **Update frequency:** Per season
- **Unit:** Grass type enum

#### F.4 - Grass Overseeding Pattern
- **Description:** % of year under winter overseeding (if applicable)
- **Why it matters:** Overseeded courses play different
- **Source:** Course calendar
- **Reliability:** Very High
- **Update frequency:** Per year
- **Unit:** Percentage of year (0-100%)

#### F.5 - Turf Condition Index
- **Description:** Overall turf health and playability rating
- **Why it matters:** Poor turf increases randomness; good turf improves consistency
- **Source:** Course assessment, recent weather
- **Reliability:** Medium
- **Update frequency:** Weekly during tournament
- **Unit:** Category (Poor / Fair / Good / Excellent)

---

### Category G: Tree & Layout

**Purpose:** Measure tree coverage and strategic complexity.

#### G.1 - Tree Density Index
- **Description:** % of course covered by trees
- **Why it matters:** Heavy trees penalize wild players; tree-free courses don't
- **Source:** Satellite imagery, visual assessment
- **Reliability:** Medium-High
- **Update frequency:** Per season (tree growth, removal)
- **Unit:** Percentage (0-70% typical)

#### G.2 - Tree Placement Strategy
- **Description:** Trees positioned to enhance strategy (narrowing fairways, framing)
- **Why it matters:** Strategic trees add complexity; random trees add randomness
- **Source:** Design intent + visual assessment
- **Reliability:** Medium
- **Update frequency:** Per course renovation
- **Unit:** Category (Strategic / Random / Minimal)

#### G.3 - Signature Holes (High-Difficulty Concentration)
- **Description:** Count of holes designed as difficulty peaks
- **Why it matters:** Signature holes may bias rankings
- **Source:** Design documentation
- **Reliability:** Medium
- **Update frequency:** Never
- **Unit:** Count (2-6 typical)

#### G.4 - Risk/Reward Hole Count
- **Description:** % of holes offering clear risk/reward options
- **Why it matters:** Risk holes reward aggressive players
- **Source:** Design inspection
- **Reliability:** Medium-High
- **Update frequency:** Never
- **Unit:** Percentage (20-50% typical)

---

### Category H: Wind Exposure

**Purpose:** Measure weather vulnerability and wind impact.

#### H.1 - Wind Exposure Index
- **Description:** Course's vulnerability to wind (exposed vs. sheltered)
- **Why it matters:** Exposed courses reward wind-control specialists
- **Source:** Geographic location, tree cover analysis
- **Reliability:** Medium
- **Update frequency:** Never
- **Unit:** Rating (1-10 scale; 1=sheltered, 10=exposed)

#### H.2 - Wind Pattern Direction (Typical)
- **Description:** Prevailing wind direction during tournament season
- **Why it matters:** Some players prefer certain wind directions
- **Source:** Historical weather data
- **Reliability:** High
- **Update frequency:** Per season
- **Unit:** Direction (N, NE, E, SE, S, SW, W, NW)

#### H.3 - Wind Impact on Scoring
- **Description:** Historical scoring correlation with wind speed
- **Why it matters:** Wind-sensitive courses show strong correlation
- **Source:** Weather data + scoring correlation analysis
- **Reliability:** Medium
- **Update frequency:** Per season (accumulated data)
- **Unit:** Scoring differential per 5 mph wind

---

### Category I: Scoring Difficulty

**Purpose:** Measure course's demonstrated difficulty from scoring data.

#### I.1 - Historical Scoring Average (Field)
- **Description:** Field average score across tournaments held at course
- **Why it matters:** Lower average = harder course; higher = easier
- **Source:** PGA Tour statistics
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Strokes per round (70-75 typical)

#### I.2 - Scoring Difficulty Trend
- **Description:** Change in scoring average over multiple years
- **Why it matters:** Getting harder (improvements) or easier (degradation)
- **Source:** Historical PGA Tour data
- **Reliability:** Very High
- **Update frequency:** Per season
- **Unit:** Strokes change per year

#### I.3 - Scoring Variance (Field)
- **Description:** Standard deviation of field scores
- **Why it matters:** High variance = course allows separation; low = everyone similar
- **Source:** Tournament score distribution
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Strokes (standard deviation, 1-3 range typical)

#### I.4 - Scoring Spread (Leader to Cut Line)
- **Description:** Gap between leader and cut line score
- **Why it matters:** Large gap = clear course separation; small gap = bunched scoring
- **Source:** Tournament leaderboard
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Strokes (typically 5-15)

#### I.5 - Birdie Frequency (Field Average)
- **Description:** Birdies per round as % of holes played
- **Why it matters:** Low birdie % = defensive course; high % = offensive
- **Source:** Hole-by-hole scoring
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Percentage (10-30% typical)

#### I.6 - Eagle Frequency
- **Description:** Eagles per round as % of holes played
- **Why it matters:** Course's reward structure for excellence
- **Source:** Hole-by-hole scoring
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Percentage (0.5-3% typical)

#### I.7 - Bogey+ Rate
- **Description:** % of holes scoring bogey or worse
- **Why it matters:** High rate = punishing; low rate = forgiving
- **Source:** Hole-by-hole scoring
- **Reliability:** Very High
- **Update frequency:** After each tournament
- **Unit:** Percentage (15-35% typical)

---

### Category J: Tournament Setup

**Purpose:** Measure week-specific setup characteristics.

#### J.1 - Pin Position Difficulty
- **Description:** Setup difficulty rating (easy, medium, hard pin positions)
- **Why it matters:** Tournament directors set difficulty via pin positions
- **Source:** Setup sheet, observed pin positions
- **Reliability:** Medium (subjective)
- **Update frequency:** Daily during tournament
- **Unit:** Category (Easy / Medium / Hard)

#### J.2 - Rough Setup Difficulty
- **Description:** Rough thickness and cut height strategy
- **Why it matters:** Directors increase difficulty via rough setup
- **Source:** Setup notes, visual assessment
- **Reliability:** Medium-High
- **Update frequency:** Daily during tournament
- **Unit:** Category (Light / Medium / Heavy)

#### J.3 - Green Maintenance Setup
- **Description:** Green speed, firmness, mowing height strategy
- **Why it matters:** Green setup dramatically affects difficulty
- **Source:** Setup notes, Stimpmeter readings
- **Reliability:** High
- **Update frequency:** Daily during tournament
- **Unit:** Descriptive (e.g., "10.5 Stimp, firm, high cut")

#### J.4 - Course Conditioning Assessment
- **Description:** Overall setup difficulty on 1-10 scale
- **Why it matters:** Cumulative difficulty of all setup decisions
- **Source:** Setup assessment
- **Reliability:** Medium
- **Update frequency:** Daily during tournament
- **Unit:** Rating (1-10 scale)

---

### Category K: Course-Specific Characteristics

**Purpose:** Measure unique course identity traits.

#### K.1 - Course Signature (Historical Player Advantage)
- **Description:** Players who historically perform well at this venue
- **Why it matters:** Some players fit specific courses
- **Source:** Historical tournament results
- **Reliability:** Medium (may change with course evolution)
- **Update frequency:** Per season
- **Unit:** Player list (top 3-5 recent winners, top finishers)

#### K.2 - Course Setup Variability
- **Description:** Year-to-year setup consistency (stable setup vs. variable)
- **Why it matters:** Stable courses reward local knowledge; variable courses don't
- **Source:** Historical setup records
- **Reliability:** Medium-High
- **Update frequency:** Per season
- **Unit:** Category (Consistent / Variable)

#### K.3 - Hole-by-Hole Difficulty Profile
- **Description:** Difficulty rating for each hole (1-10)
- **Why it matters:** Identifies signature holes and bottlenecks
- **Source:** Design + scoring data correlation
- **Reliability:** High
- **Update frequency:** Never (design feature)
- **Unit:** Array of 18 difficulty ratings (1-10 each)

#### K.4 - Course Routing Implications
- **Description:** Back-nine vs. front-nine difficulty, scoring patterns
- **Why it matters:** Some players perform better on specific nines
- **Source:** Historical scoring by nine
- **Reliability:** High
- **Update frequency:** Per season (accumulated data)
- **Unit:** Comparative analysis (front avg score vs. back avg score)

---

### Category L: Weather Historical Context

**Purpose:** Measure typical weather patterns at course.

#### L.1 - Typical Temperature (Tournament Week)
- **Description:** Historical average temperature during tournament
- **Why it matters:** Temperature affects ball carry and firmness
- **Source:** Historical weather data
- **Reliability:** Very High
- **Update frequency:** Per season
- **Unit:** Degrees Fahrenheit (average high/low)

#### L.2 - Typical Wind Speed (Tournament Week)
- **Description:** Historical average wind speed during tournament
- **Why it matters:** Wind difficulty context
- **Source:** Historical weather data
- **Reliability:** Very High
- **Update frequency:** Per season
- **Unit:** Miles per hour (average)

#### L.3 - Precipitation Probability
- **Description:** Historical likelihood of rain during tournament week
- **Why it matters:** Rain softens course, increases playability
- **Source:** Historical weather data
- **Reliability:** High
- **Update frequency:** Per season
- **Unit:** Percentage likelihood

#### L.4 - Humidity Profile
- **Description:** Typical humidity range during tournament
- **Why it matters:** Affects air density and ball flight
- **Source:** Historical weather data
- **Reliability:** High
- **Update frequency:** Per season
- **Unit:** Percentage (relative humidity)

---

## 3. Course Difficulty Scoring

### Aggregate Course Difficulty Index

Course difficulty is computed from the above attributes into a **0-100 scoring scale:**

```
Course Difficulty Score = 
  (Yardage Contribution * 15%) +
  (Fairway Difficulty * 20%) +
  (Green Difficulty * 20%) +
  (Hazard/Penalty * 20%) +
  (Scoring Difficulty * 25%)
```

**Tiers:**
- Easy (0-40): Short courses, wide fairways, forgiving greens
- Standard (40-60): Typical tournament courses
- Challenging (60-75): Major championship venues
- Extreme (75-100): U.S. Open, PGA Championship courses

---

## 4. Course-Attribute Organization for Matching

The 60+ individual attributes roll up into **5 Primary Demand Buckets**:

| Bucket | Attributes | Purpose |
|--------|-----------|---------|
| **Driving Demand** | A.1-B.6 (yardage, fairway, width, doglegs) | Driving difficulty |
| **Approach Demand** | C.1-C.7 (green size, speed, firmness, slope) | Approach difficulty |
| **Short Game Demand** | D.1-D.7 (hazards, bunkers, recovery areas) | Crisis management |
| **Putting Demand** | C.4, I.5-I.6 (green speed, birdie frequency, consistency) | Putting difficulty |
| **Scoring Difficulty** | I.1-I.7, E.1-E.2 (historical scoring, variance) | Overall difficulty |

**Additional Context Layers:**
- Environmental (E.1-H.3)
- Setup (J.1-J.4)
- Course Identity (K.1-K.4)

---

## 5. Data Quality & Confidence

### Per-Attribute Confidence

Same framework as Player Attributes:

1. **Sample Size** (recent tournaments at venue)
2. **Data Freshness** (recent vs. historical)
3. **Consistency** (year-to-year variability)
4. **Source Reliability** (official vs. inferred)

---

## 6. Assumptions

1. All course characteristics assume availability of official course design or USGA documentation
2. Scoring data assumes 2+ tournaments held at venue for meaningful signal
3. Setup data assumes access to official setup sheets (available for PGA Tour events)
4. Environmental factors assume historical weather data integration
5. Course changes (renovations, rerouting) require schema updates

---

## 7. Open Questions

1. How frequently should courses be re-surveyed for updated characteristics (elevation, trees)?
2. Should we differentiate between championship tees and other tee boxes?
3. How to weight course setup difficulty vs. inherent design difficulty?
4. Should we track course-specific player vulnerabilities (e.g., "this course historically beats player X")?
5. How to handle courses with significant seasonal variation (overseeding, dormancy)?

---

**Next:** Matching Philosophy (Step 3)
