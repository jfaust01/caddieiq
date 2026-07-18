# Database Model Analysis: One Round Per Tournament

## Executive Summary

The current model creates **ONE Round per Tournament** (roundNumber=1) and is a **deliberate architectural simplification**, not an oversight. However, it does not match the SportsDataIO data model which provides **4 rounds per player** with individual round scores.

### Status
- **Intentional:** YES (documented in code comments)
- **Issue:** The schema supports 1-4 rounds, but the importer only creates 1
- **Migration Required:** YES, to populate individual rounds and fix the RoundStatistic pipeline

---

## Current Architecture (One Round Per Tournament)

### Schema Design
```
Rounds Table:
  @@unique([tournamentId, roundNumber])  ← Allows 1-4 rounds per tournament

Historical Imports Create:
  roundNumber = 1  (always)
  Only one Round per tournament
  Treated as aggregate tournament data
```

### Rationale for Simplification

**From round/mapper.ts (line 18-20):**
```typescript
/**
 * Creates a single aggregate round for the entire tournament, with `roundNumber=1`
 * since the provider does not expose per-round data.
```

**Root cause:** When this code was written, the developer believed SportsDataIO **"does not expose per-round data"** at the leaderboard endpoint. This is FALSE.

### Evidence the Assumption Was Wrong

**SportsDataIO Leaderboard Response DOES include:**
```json
{
  "Players": [
    {
      "Name": "Austin Eckroat",
      "Rank": 2,
      "Rounds": [
        {
          "Number": 1,
          "Score": 87,
          "Par": 71,
          "Birdies": 12,
          "Bogeys": 5,
          ...
        },
        {
          "Number": 2,
          "Score": 74,
          "Par": 71,
          ...
        },
        {
          "Number": 3,
          "Score": 69,
          ...
        },
        {
          "Number": 4,
          "Score": 68,
          ...
        }
      ]
    }
  ]
}
```

**Scoring shows individual round performance:**
- Round 1: 87 (+16)
- Round 2: 74 (+3)
- Round 3: 69 (-2)
- Round 4: 68 (-3)
- **Tournament Total:** 298 (calculated from individual rounds, not provided separately)

---

## Current Data Pipeline

```
SportsDataIO Leaderboard (4 rounds per player)
           ↓
Importer (only uses Round 1)
           ↓
Database (1 Round per Tournament)
    Round 1 (aggregate)
           ↓
PlayerRounds (147 records, linked to Round 1)
           ↓
RoundStatistic (attempted 1:1 with PlayerRound, empty)
```

**Problem:** PlayerRound.score contains Round 1 data, but tournament ranking is lost. RoundStatistics aren't populated because the query pattern doesn't find matching PlayerRounds.

---

## Proposed Migration

### Option A: Full Support for Multi-Round Tournaments (Recommended)

**New Architecture:**
```
Tournament (Cognizant Classic)
    ├── Round 1 (roundNumber=1)
    │   ├── PlayerRound (Austin Eckroat, Round 1)
    │   │   └── RoundStatistic (Score: 87, Birdies: 12, ...)
    │   ├── PlayerRound (Scottie Scheffler, Round 1)
    │   │   └── RoundStatistic (Score: 72, Birdies: 3, ...)
    │   └── ... 147 players
    │
    ├── Round 2 (roundNumber=2)
    │   ├── PlayerRound (Austin Eckroat, Round 2)
    │   │   └── RoundStatistic (Score: 74, Birdies: 4, ...)
    │   ├── PlayerRound (Scottie Scheffler, Round 2)
    │   │   └── RoundStatistic (Score: 68, Birdies: 5, ...)
    │   └── ... 147 players
    │
    ├── Round 3 (roundNumber=3)
    │   └── ... similar pattern
    │
    └── Round 4 (roundNumber=4)
        └── ... similar pattern
```

### Database Changes

**No schema changes needed** - the schema already supports this:
```typescript
Round:
  @@unique([tournamentId, roundNumber])  // Allows 1, 2, 3, 4
```

**Tables affected:** None (schema is correct)

### Importer Changes Required

**File:** `lib/imports/historical-results-import.ts`

**Current logic (simplified):**
```typescript
// Line 186
const round = mapSportsDataRound(tournament.id, leaderboard.Tournament)
const roundRes = await roundRepo.upsert({
  tournamentId: tournament.id,
  roundNumber: 1,  // ← HARDCODED
  scheduledDate: round.scheduledDate,
})

// Line 248
const roundData = player.Rounds && player.Rounds.length > 0 
  ? player.Rounds[0]  // ← ONLY USES FIRST ROUND
  : undefined
```

**Required changes:**

1. **Create multiple Rounds per Tournament (1-4):**
   ```typescript
   // Instead of creating one Round with roundNumber=1,
   // create one for each round in the tournament
   
   const maxRounds = Math.max(
     ...leaderboard.Players.map(p => p.Rounds?.length ?? 0)
   )
   
   for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
     // Create/upsert Round with roundNumber=roundNum
     // Calculate scheduledDate for this specific round if available
   }
   ```

2. **Create PlayerRound for each (Player, Round) combination:**
   ```typescript
   // Instead of one PlayerRound per player,
   // create one for each round they played
   
   for (const player of leaderboard.Players) {
     for (let i = 0; i < player.Rounds.length; i++) {
       const roundNum = i + 1
       const roundData = player.Rounds[i]
       
       // Find/create the Round record with roundNumber=roundNum
       const round = await roundRepo.findByNumber(tournament.id, roundNum)
       
       // Create PlayerRound with:
       // - roundId: round.id
       // - score: roundData.Score (actual strokes)
       // - toPar: roundData.Score - roundData.Par
       // - position: player.Rank (tournament final position)
       
       const playerRound = mapSportsDataPlayerRound(
         round.id,
         fieldEntry.id,
         player,
         roundData
       )
       
       playerRoundInputs.push(playerRound)
     }
   }
   ```

3. **RoundStatistic mapping remains the same:**
   - Already correctly maps all fields from roundData
   - No changes needed to repository

### Impact Assessment

**Database:**
- No schema migrations (already supports multiple rounds)
- ~3,736 existing PlayerRounds (1 per player) → ~14,944 PlayerRounds (4 per player)
- ~0 existing RoundStatistics → ~14,944 RoundStatistics

**Code:**
- `historical-results-import.ts`: ~30-50 lines modified
- `round/mapper.ts`: Comment update to reflect multi-round support
- All other code: No changes (schema is unchanged)

**Backward Compatibility:**
- No breaking changes to queries
- Existing leaderboard display can query "final tournament position" by getting the last round for each player
- Round 1 queries still work exactly the same

### Verification Queries

**After migration, verify data integrity:**

```sql
-- Verify round structure
SELECT 
  t.name,
  COUNT(r.id) as round_count,
  ARRAY_AGG(r."roundNumber" ORDER BY r."roundNumber") as round_numbers
FROM tournaments t
LEFT JOIN rounds r ON r."tournamentId" = t.id
WHERE t.status = 'COMPLETED'
GROUP BY t.id, t.name
ORDER BY round_count DESC;

-- Should show: Cognizant Classic has 4 rounds (1, 2, 3, 4)

-- Verify player rounds per round
SELECT 
  r."roundNumber",
  COUNT(pr.id) as player_count,
  COUNT(rs.id) as statistics_count
FROM rounds r
LEFT JOIN player_rounds pr ON pr."roundId" = r.id
LEFT JOIN round_statistics rs ON rs."playerRoundId" = pr.id
WHERE r."tournamentId" = 'cmrlmaawh00024zpam57jf0g6'
GROUP BY r."roundNumber"
ORDER BY r."roundNumber";

-- Should show: Each round has 147 players with 147 statistics

-- Verify tournament ranking is preserved
SELECT 
  pr."id",
  t."name",
  p."fullName",
  r."roundNumber",
  pr.score,
  pr."toPar",
  pr.position,
  rs.birdies,
  rs.bogeys
FROM player_rounds pr
JOIN rounds r ON r.id = pr."roundId"
JOIN tournament_fields tf ON tf.id = pr."tournamentFieldId"
JOIN tournaments t ON t.id = r."tournamentId"
JOIN players p ON p.id = tf."playerId"
LEFT JOIN round_statistics rs ON rs."playerRoundId" = pr.id
WHERE t."externalId" = '590'
  AND p.slug = 'austin-eckroat'
ORDER BY r."roundNumber";

-- Should show: Austin Eckroat with scores 87, 74, 69, 68 across rounds
```

---

## Decision Timeline

| Date | Event | Decision |
|------|-------|----------|
| 2026-07-14 | Schema created | Designed to support 1-4 rounds per tournament |
| 2026-07-14 | Importer created | Assumed SportsDataIO has no per-round data, created roundNumber=1 only |
| ~2026-01-24 | Historical import ran | Only Round 1 created; RoundStatistics never populated |
| 2026-01-25 | Bug discovered | User noticed player_rounds.score was wrong (rank instead of strokes) |
| 2026-01-25 | Root cause found | Schema is correct; importer makes wrong assumptions |

---

## Recommendation

**Implement Option A** for these reasons:

1. **Schema already supports it** - No database migration costs
2. **Data is available** - SportsDataIO provides all 4 rounds
3. **Minimal code change** - ~50 lines in one importer file
4. **Fixes multiple issues:**
   - Corrects player_rounds.score (will use actual strokes per round)
   - Enables RoundStatistic population (one per player per round)
   - Enables round-by-round analytics
5. **No breaking changes** - All existing queries continue to work

---

## NOT Recommended: Keeping One Round Per Tournament

**Why this doesn't work:**
- Loses round-by-round score progression
- Can't represent "Cut" accurately (happens mid-tournament)
- RoundStatistic data is meaningless (aggregated across 4 rounds or missing)
- Contradicts the schema design that explicitly allows multiple rounds
- Wastes SportsDataIO data that's already being fetched

