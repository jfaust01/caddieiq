# DFS Value Data Flow

**Phase:** 15.3B Documentation

## Flow Overview

```
Salary Data (DraftKings API)
     ↓
OddsImporter (fetch salary caps + lines)
     ↓
Normalizer (map to DfsSalary model)
     ↓
Validator (validate salary data)
     ↓
OddsRepository.bulkUpsert()
     ↓
DfsSalary + OddsEvent + OddsQuote Tables
     ↓
DfsValueService (per-request calculation)
     ↓
For each player in field:
  1. Get player skill profile
  2. Get course fit score
  3. Get field strength
  4. Calculate: value = (expected_points / salary) * 1000
     ↓
DFS Ranking (ephemeral, not persisted)
     ↓
API Route: GET /api/intelligence/dfs/:tournamentId
     ↓
React Component (Leaderboard / Tournament Intel tab)
```

## Database Schema

```typescript
model DfsSalary {
  id              String  @id
  eventId         String
  
  playerId        String
  tournamentId    String
  
  salary          Int
  opp             String?  // Opponent (other sport context)
  
  fetchedAt       DateTime
  effectiveAt     DateTime  // When salary becomes active
  expiresAt       DateTime?
}

model OddsEvent {
  id              String  @id
  tournamentId    String
  
  sport           String   // "golf"
  eventType       String   // "tournament-winner"
  fetchedAt       DateTime
}

model OddsQuote {
  id              String  @id
  eventId         String
  
  playerId        String
  moneyline       Int
  winProbability  Float
  
  fetchedAt       DateTime
}
```

## Import Pipeline

### Step 1: Fetch Salary Data
**Source:** DraftKings API  
**Trigger:** Tournament-specific (every 15 minutes)

**Raw Data:**
```json
{
  "eventId": "dks-49387-cadillac-2026",
  "players": [
    {
      "playerId": "rory-mcilroy",
      "salary": 10500,
      "opponent": null,
      "avgPoints": 42.5
    },
    ...
  ]
}
```

### Step 2-4: Normalize, Validate, Persist
**Pattern:** Standard 4-layer import

**Output:** DfsSalary + OddsQuote records in database

## DFS Value Calculation

**Service:** `DfsValueService.calculateFieldRankings(tournamentId)`

**Algorithm:**
```typescript
async calculateFieldRankings(tournamentId: string): Promise<DfsProjection[]> {
  // 1. Get tournament field
  const field = await tournamentService.getFieldPlayers(tournamentId)
  
  // 2. Fetch all salaries
  const salaries = await oddsRepository.findSalariesForTournament(tournamentId)
  
  // 3. Get player skill profiles (for all players in field)
  const skillProfiles = await playerSkillService.getSkillProfiles(field.playerIds)
  
  // 4. Get course fit scores (for all players vs. tournament course)
  const courseFits = await courseFitService.getFitScores(
    field.playerIds,
    tournamentId
  )
  
  // 5. Calculate field strength (mean + std dev)
  const fieldStrength = calculateFieldStrength(skillProfiles)
  
  // 6. For each player, calculate value
  const projections = field.playerIds.map(playerId => {
    const skill = skillProfiles.get(playerId)
    const fit = courseFits.get(playerId)
    const salary = salaries.get(playerId)?.salary || 0
    
    // Expected points = skill * fit * weather * fieldStrength
    const expectedPoints = calculateExpectedPoints({
      skill,
      fit,
      fieldStrength,
      weather
    })
    
    // Value score = (expectedPoints / salary) * 1000
    const valueScore = (expectedPoints / salary) * 1000
    
    return {
      playerId,
      salary,
      expectedPoints,
      valueScore,
      percentile: calculatePercentile(valueScore, allProjections)
    }
  })
  
  // 7. Sort by value score descending
  return projections.sort((a, b) => b.valueScore - a.valueScore)
}
```

## Expected Points Calculation

**Input:**
- Player skill dimension (1-100)
- Course fit score (1-100)
- Field strength index
- Weather difficulty (1-10)

**Formula:**
```
basePoints = (skill/100) * (fit/100) * fieldMean
weatherAdjustment = 1 - (weather difficulty / 100)
expectedPoints = basePoints * weatherAdjustment * fieldVariance
```

## Output: DFS Ranking

**NOT persisted** - calculated per request

**Response:**
```json
[
  {
    "playerId": "rory-mcilroy",
    "playerName": "Rory McIlroy",
    "salary": 10500,
    "expectedPoints": 45.2,
    "valueScore": 4.31,
    "rank": 1,
    "percentile": 99,
    "skillScore": 88,
    "fitScore": 92,
    "confidence": 0.95
  },
  ...
]
```

## API Endpoint

### GET /api/intelligence/dfs/:tournamentId
**Calculation:** Per-request (no database call)  
**Cache:** 5 minutes (if salary doesn't change)  
**Response:** Ranked projections with value scores

## Failure Handling

| Failure | Handling |
|---------|----------|
| Salary data missing | Skip player (value unavailable) |
| Player skill unavailable | Use average field skill |
| Course fit unavailable | Use average fit |
| Field empty | Return empty array |
| Salary fetch fails | Return 503 (service unavailable) |

## Refresh Strategy

- **Salaries:** Every 15 minutes (tournament duration)
- **Value calc:** Per-request (ephemeral)
- **TTL:** 5 minutes (for response caching)
- **Persistence:** None (ephemeral calculation)

