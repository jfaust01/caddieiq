# Player Data Flow

**Phase:** 15.3B Documentation

## Flow Overview

```
SportsDataIO
     ↓
PlayerImporter (fetch player list)
     ↓
Normalizer (map to Player model)
     ↓
Validator (validate player data)
     ↓
PlayerRepository.bulkUpsert()
     ↓
Player + PlayerTourHistory + PlayerSeasonStatistic
     ↓
Historical Results Importer
(Post-tournament: rounds, scores, stats)
     ↓
Round + RoundStatistic Tables
     ↓
RoundRepository + RoundStatisticRepository
     ↓
PlayerSkillIntelligenceService
(Fetch rounds for player → build skill profile)
     ↓
PlayerSkillIntelligence Engine
(Pure function: samples → skill profile)
     ↓
PlayerIntelligenceBuild + PlayerIntelligence Tables
(Versioned builds, active selection)
     ↓
API Routes
     ↓
React Components (Player Profile, Leaderboard)
```

## Database Schema

```typescript
model Player {
  id              String  @id
  firstName       String
  lastName        String
  slug            String  @unique
  bio             String?
  
  // Relations
  tourHistory     PlayerTourHistory[]
  rounds          PlayerRound[]
  seasonStats     PlayerSeasonStatistic[]
}

model PlayerTourHistory {
  id              String  @id
  playerId        String
  player          Player  @relation(fields: [playerId], references: [id])
  
  tourId          String
  totalEvents     Int?
  totalWins       Int?
  totalTop10      Int?
}

model PlayerSeasonStatistic {
  id              String  @id
  playerId        String
  player          Player  @relation(fields: [playerId], references: [id])
  
  season          Int
  events          Int?
  cuts            Int?
  wins            Int?
  top10s          Int?
  avgScore        Float?
}

model Round {
  id              String  @id
  tournamentId    String
  playerId        String
  roundNumber     Int
  
  totalScore      Int
  toParScore      Int
  scoringFormat   String // "stroke" | "match"
}

model RoundStatistic {
  id              String  @id
  roundId         String
  playerId        String
  
  strokesGained   Float?
  fairwayHits     Int?
  gir             Int?
  birdieCount     Int?
}

model PlayerIntelligenceBuild {
  id              String  @id
  version         Int
  
  // Versioned collection
  builds          PlayerIntelligence[]
  activeBuild     PlayerIntelligence?
}

model PlayerIntelligence {
  id              String  @id
  playerId        String
  buildId         String
  
  skills: {
    long          Float?    // Driving distance
    short         Float?    // Short game
    overall       Float?    // Overall
    consistency   Float?    // Variance
    comfort       Float?    // On-course comfort
  }
  percentiles: Record<SkillKey, number | null>
}
```

## Import Pipeline

### Step 1: Fetch Players
**Source:** SportsDataIO API  
**Provider:** `SportsDataIoProvider.listPlayers()`

**Raw Data:**
```json
[
  {
    "playerId": "rory-mcilroy",
    "firstName": "Rory",
    "lastName": "McIlroy",
    "nationality": "Northern Ireland"
  }
]
```

### Step 2-4: Map, Validate, Persist
**Pattern:** Same as tournaments and courses

**Output:** Player table populated

### Step 5: Import Historical Results (Post-Tournament)
**Source:** SportsDataIO API  
**Importer:** `HistoricalResultsImporter`

**Raw Data:**
```json
{
  "tournamentId": "cadillac-championship-2026",
  "round": 1,
  "results": [
    {
      "playerId": "rory-mcilroy",
      "score": 69,
      "parScore": -3,
      "position": 5
    }
  ]
}
```

**Persistence:**
1. Create Round records (one per tournament round)
2. Create PlayerRound records (player scores)
3. Create RoundStatistic records (individual metrics)

## Player Skill Intelligence

### Service: PlayerSkillIntelligenceService
**File:** `lib/player-skill-intelligence/service.ts`

**Purpose:** Build normalized player skill profiles

**Process:**
```typescript
1. Fetch player samples (rounds with statistics)
2. If no samples, return unavailable profile
3. Load platform population (all players' samples)
4. For each skill dimension:
   - Calculate player percentile vs. population
   - Return score + confidence
5. Return PlayerSkillProfile
```

### Intelligence Build

**Build Components:**
1. **Feature Extraction** - Extract meaningful metrics from raw stats
2. **Calculation** - Compute skill dimensions (Long, Short, Overall, Consistency, Comfort)
3. **Normalization** - Compare against platform population
4. **Confidence** - Assign confidence based on sample size
5. **Versioning** - Store as numbered build

**Build Trigger:**
- Manual admin button
- Scheduled monthly job
- Triggered by significant data changes

**Versioning:**
- Each build is immutable (version 1, 2, 3, ...)
- One build designated as "active"
- Easy rollback if build quality issue

### Output: PlayerSkillProfile
```typescript
{
  playerId: "rory-mcilroy",
  skills: {
    long: 85,        // 1-100 scale
    short: 92,
    overall: 88,
    consistency: 79,
    comfort: 84
  },
  percentiles: {
    long: 92,        // vs. platform population
    short: 97,
    overall: 94,
    consistency: 85,
    comfort: 89
  },
  samples: {
    count: 47,       // number of rounds
    span: "2024-2026",
    season: 2026
  }
}
```

## Course Fit Skill Profile

The Player Skill profile is bridged to Course Fit model:

**Conversion:**
```typescript
toCourseFitSkillProfile(profile: PlayerSkillProfile): Record<FitSkillKey, number | null> {
  return {
    long: profile.skills.long,
    short: profile.skills.short,
    overall: profile.skills.overall,
    consistency: profile.skills.consistency,
    comfort: profile.skills.comfort
  }
}
```

## Data Retrieval

### PlayerRepository
```typescript
findById(id: string)
findBySlug(slug: string)
findByTournamentField(tournamentId: string)
```

### PlayerSkillRepository
```typescript
findSamplesByPlayerId(playerId: string): Promise<PlayerSamples>
findSamplesByPlayerIds(playerIds: string[]): Promise<Map<string, PlayerSamples>>
loadPlatformPopulation(): Promise<PlayerPopulation>
```

## API Endpoints

### GET /api/players/:id
Returns player profile

### GET /api/players/:id/skill
Returns player skill profile (normalized percentiles)

### GET /api/players/:id/history
Returns tournament history

## Failure Points

| Point | Failure | Handling |
|-------|---------|----------|
| Provider API down | HTTP 5xx | Logged, retry |
| Player validation fails | Missing name | Logged, skipped |
| Round import fails | Tournament not found | Logged, round skipped |
| Skill build fails | No samples | Return honest unavailable |
| Percentile calc fails | Population empty | Return null percentiles |

## Refresh Strategy

- **Players:** Quarterly
- **Historical results:** Post-tournament
- **Skill builds:** Monthly
- **TTL:** None (historical)

