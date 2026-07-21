# Intelligence Data Flows

**Phase:** 15.3B Documentation

## Player Skill Intelligence Flow

### 1. Data Source: Round Statistics
```
SportsDataIO
     ↓
HistoricalResultsImporter
     ↓
Round + RoundStatistic Tables
     ↓
PlayerSkillRepository.findSamplesByPlayerId(playerId)
     ↓
Returns: PlayerSamples {
  rounds: Round[],
  statistics: RoundStatistic[],
  season: Int
}
```

### 2. Calculation: Build Skill Profile
**Service:** `PlayerSkillIntelligenceService.getPlayerProfile(playerId)`

**Process:**
```typescript
1. Load player samples (verified rounds)
2. If no samples, return unavailable profile
3. Load platform population (all players' samples)
4. For each skill dimension:
   - Extract features from samples
   - Calculate player score
   - Compare to population percentile
5. Return skill profile with confidence
```

**Engine:** Pure function `buildPlayerSkillProfile()`

**Output:**
```typescript
PlayerSkillProfile {
  playerId: string,
  skills: {
    long: 85,
    short: 92,
    overall: 88,
    consistency: 79,
    comfort: 84
  },
  percentiles: {
    long: 92,
    short: 97,
    overall: 94,
    consistency: 85,
    comfort: 89
  },
  samples: {
    count: 47,
    span: "2024-2026",
    season: 2026
  }
}
```

### 3. Batch Retrieval for Field
**Service:** `PlayerSkillIntelligenceService.getSkillProfilesForPlayers(playerIds)`

**Query:**
```sql
SELECT player_id, samples FROM PlayerSkill
WHERE player_id IN ($1, $2, ..., $N)
```

**Output:** `Map<playerId, PlayerSkillProfile>`

### 4. Consumption: Leaderboard
**Component:** `FieldLeaderboard`

**Display:**
- Player name
- Skill rating (1-100)
- Rank in field
- Trend (vs. platform average)

---

## Course Intelligence Flow

### 1. Data Source: Course Specs
```
GolfCourseAPI
     ↓
CourseImporter
     ↓
Course + CourseDetails + CourseHole + CourseTee Tables
     ↓
CourseDetailsRepository.findById(courseId)
CourseHoleRepository.findByCourseId(courseId)
CourseTeeRepository.findByCourseId(courseId)
```

### 2. Calculation: Generate Intelligence
**Service:** `CourseIntelligenceService.getCourseIntelligence(courseId)`

**Process:**
```typescript
1. Fetch course details
2. Fetch holes (all 18)
3. Fetch tees (all boxes)
4. If incomplete, return null
5. Aggregate into CourseAnalysisInput
6. Run CourseIntelligenceEngine (pure function)
7. Return CourseIntelligence with traits
```

**Engine:** Pure function `generateCourseIntelligence()`

**Output:**
```typescript
CourseIntelligence {
  courseId: string,
  birdieRank: 72,    // 1-100
  accuracyRank: 68,
  distanceRank: 85,
  firmnessRank: 62,
  hash: "abc123...", // Deterministic
  buildVersion: 1
}
```

### 3. Persistence
**Repository:** `CourseIntelligenceRepository.upsert(intelligence)`

One record per course (idempotent update)

### 4. Consumption: Intel Tab
**Component:** `CourseIntelligenceCard`

**Display:**
- Course name
- Par, yardage, rating
- Trait scores (visual)
- Key characteristics (text)

---

## Weather Intelligence Flow

### 1. Data Source: Weather API
```
OpenWeather API
     ↓
WeatherImporter
     ↓
WeatherSnapshot + WeatherPeriod Tables
     ↓
WeatherRepository.findLatestSnapshot(tournamentId)
```

### 2. Normalization: By Round/Wave
**Service:** `WeatherIntelligenceService.getWeatherContext(tournamentId)`

**Process:**
```typescript
1. Fetch snapshot for tournament
2. If not found or too old, return unavailable
3. Group periods by round (wave)
4. For each round, calculate:
   - Average temperature
   - Average wind speed + direction
   - Max precipitation chance
   - Cloud cover trend
5. Assign difficulty ratings
6. Return context by round
```

**Engine:** Pure function `normalizeWeatherByRound()`

**Output:**
```typescript
{
  round1: {
    temp: 72,
    wind: 8,
    windDir: "NW",
    precip: 0.1,
    difficulty: 4
  },
  round2: { ... }
}
```

### 3. Consumption: Weather Display
**Component:** `WeatherCard`

**Display:**
- Forecast by round
- Wind speed + direction (visual arrow)
- Precipitation chance
- Temperature

---

## Odds Intelligence Flow

### 1. Data Source: Odds API
```
DraftKings / Odds Provider
     ↓
OddsImporter
     ↓
DfsSalary + OddsEvent + OddsQuote Tables
     ↓
OddsRepository.findWinOddsForField(tournamentId)
```

### 2. Calculation: Win Probability
**Service:** `OddsIntelligenceService.getWinProbabilities(tournamentId)`

**Process:**
```typescript
1. Fetch odds quotes for all field players
2. For each player, convert moneyline to probability
3. Normalize probabilities (sum to 100%)
4. Calculate implied rank vs. field strength
5. Return probability + rank
```

**Formula:**
```
winProbability = 100 / (moneyline + 100)
impliedRank = calculatePercentile(prob, allProbs)
```

**Output:**
```typescript
{
  playerId: "rory-mcilroy",
  winProb: 0.089,      // 8.9%
  impliedRank: 3,
  confidence: 0.95
}
```

### 3. Consumption: Odds Display
**Component:** `OddsCard`

**Display:**
- Win probability (%)
- Rank in field
- Historical accuracy
- Betting line

---

## DFS Value Intelligence Flow (Composite)

### 1. Combine All Signals
```
DfsValueService.calculateFieldRankings(tournamentId)
├─ Player Skill Intelligence
│  ├─ Player samples
│  └─ Platform population
├─ Course Intelligence
│  ├─ Course specs
│  └─ Traits (birdie, accuracy, distance, firmness)
├─ Weather Intelligence
│  └─ Forecast by round
├─ Field Strength
│  └─ Mean + std dev of skills
└─ Salary Data
   └─ DfsSalary from DraftKings
```

### 2. Per-Player Value Calculation
```typescript
for each player in field:
  skill = getSkill(playerId)
  fit = calculateCourseFit(playerId, courseId)
  salary = getSalary(playerId, tournamentId)
  
  expectedPoints = (skill / 100) * (fit / 100) * basePoints * weatherAdj
  value = (expectedPoints / salary) * 1000
  
  output: {
    playerId,
    expectedPoints,
    value,
    salary
  }
```

### 3. Ranking & Percentiles
```typescript
1. Sort by value descending
2. Calculate percentile (vs. all in field)
3. Assign rank
4. Return top N projections
```

**Output:** Ranked DFS projections

---

## Active Build Selection

### Pattern: Versioned, Switchable

**Models:** `PlayerIntelligenceBuild` + `PlayerIntelligence`

**Lifecycle:**
```
1. Build 1 (current active)
2. Build 2 (new build starts)
   - Calculate all players
   - Store with buildVersion = 2
3. Test Build 2
   - Query with BUILD_VERSION env var = 2
   - Validate quality
4. Promote Build 2 to Active
   - Update env var
   - All queries now use v2
5. Archive Build 1
   - Keep in DB for rollback
   - Marked as inactive
```

**Benefit:** Atomic switch, easy rollback

---

## Confidence & Data Quality

### Honest "Unavailable" Pattern

```typescript
// When data insufficient, return unavailable (not fabricated)
if (samples.rounds.length < MINIMUM_SAMPLES) {
  return unavailableSkillProfile(
    playerId,
    [{ code: "insufficient-samples", detail: "..." }],
    "Skill profile requires minimum round history"
  )
}
```

### Confidence Metrics

**Player Skill:**
- 1-10 rounds: LOW confidence (30%)
- 11-50 rounds: MEDIUM confidence (70%)
- 50+ rounds: HIGH confidence (95%)

**Course Intelligence:**
- Based on data completeness
- All specs available: HIGH (90%)
- Missing tees: MEDIUM (60%)
- Missing holes: LOW (30%)

**Weather:**
- Based on forecast recency
- < 6 hours old: HIGH (90%)
- 6-12 hours old: MEDIUM (70%)
- > 12 hours old: LOW (40%)

