# Architectural Correction: Multi-Round Tournament Support

## Executive Summary

**Scope:** Redesign Historical Results import to create 1-4 Round records per tournament and corresponding PlayerRound/RoundStatistic records for each round.

**Impact:** No schema changes required; importer refactor only.

---

## Current State

### Database
```sql
-- Current structure
SELECT COUNT(*) FROM rounds WHERE "roundNumber" = 1;  -- All 43 tournaments
SELECT COUNT(*) FROM rounds WHERE "roundNumber" > 1;  -- Zero results

-- Leaderboard endpoint provides 4 rounds per player:
-- Players[].Rounds[0].Number = 1
-- Players[].Rounds[1].Number = 2
-- Players[].Rounds[2].Number = 3
-- Players[].Rounds[3].Number = 4
```

### Importer (historical-results-import.ts)
- Creates exactly 1 Round with `roundNumber=1` per tournament (hardcoded, line 182)
- Passes only `player.Rounds[0]` to mapper (line 248)
- Attempts RoundStatistic upsert with mismatched round references

### Data State
| Entity | Current | Target |
|--------|---------|--------|
| Rounds | 43 (all roundNumber=1) | 129-172 (43 × 1-4 rounds) |
| PlayerRounds | ~3,736 (1 per player) | ~14,944 (4 per player) |
| RoundStatistics | 0 (broken pipeline) | ~14,944 (1:1 with PlayerRound) |

---

## Schema Changes

### Required: NONE

The schema already supports this design:

```prisma
model Round {
  id                String
  tournamentId      String
  roundNumber       Int              // ← Already allows 1, 2, 3, 4
  
  @@unique([tournamentId, roundNumber])  // ← Enforces max 1 round per number
}

model PlayerRound {
  id                String
  roundId           String
  tournamentFieldId String
  score             Int?
  toPar             Int?
  position          Int?
  // ... other fields
  
  @@index([roundId, tournamentFieldId])  // ← Already optimized for lookups
}

model RoundStatistic {
  id                String
  playerRoundId     String  @unique  // ← 1:1 relationship, already correct
  birdies           Int?
  bogeys            Int?
  // ... other stats
}
```

**Conclusion:** Schema is architecturally sound. No migrations needed.

---

## Import Changes

### Step 1: Create Multiple Rounds Per Tournament

**Current behavior:**
```typescript
// Line 182-188
const roundRes = await roundRepo.upsert({
  tournamentId: tournament.id,
  roundNumber: 1,  // ← HARDCODED
  scheduledDate: round.scheduledDate,
})
const roundId = roundRes.record.id
```

**New behavior:**
```typescript
// For each round in the tournament
const maxRounds = Math.max(
  ...leaderboard.Players
    .filter(p => p.Rounds?.length)
    .map(p => p.Rounds.length),
  0
)

const roundIds = new Map<number, string>()

for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
  const roundRes = await roundRepo.upsert({
    tournamentId: tournament.id,
    roundNumber: roundNum,
    scheduledDate: calculateScheduledDate(leaderboard, roundNum),
  })
  roundIds.set(roundNum, roundRes.record.id)
}
```

**Changes:**
- Determine max round count from API data
- Create one Round record per round number (1-4)
- Store round ID mapping for PlayerRound creation

### Step 2: Create PlayerRounds for All Rounds

**Current behavior:**
```typescript
// Line 234-250
const roundData = player.Rounds && player.Rounds.length > 0
  ? player.Rounds[0]  // ← ONLY FIRST ROUND
  : undefined
const playerRound = mapSportsDataPlayerRound(roundId, fieldEntry.id, player, roundData)
playerRoundInputs.push({
  roundId,
  tournamentFieldId: fieldEntry.id,
  playerRound,
})
```

**New behavior:**
```typescript
// For each player, create PlayerRound for each round they played
for (const player of leaderboard.Players) {
  if (!player.Name || !player.Rounds || player.Rounds.length === 0) {
    continue
  }
  
  const playerSlug = slugify(player.Name)
  const fieldEntry = await prisma.tournamentField.findFirst({
    where: {
      tournamentId: tournament.id,
      player: { slug: playerSlug },
    },
  })
  
  if (!fieldEntry) {
    continue
  }
  
  // Iterate through all rounds for this player
  for (let roundIdx = 0; roundIdx < player.Rounds.length; roundIdx++) {
    const roundNum = roundIdx + 1
    const roundData = player.Rounds[roundIdx]
    const roundId = roundIds.get(roundNum)
    
    if (!roundId) {
      console.warn(`[v0] No roundId found for roundNumber=${roundNum}`)
      continue
    }
    
    // Create PlayerRound with actual round score
    const playerRound = mapSportsDataPlayerRound(
      roundId,
      fieldEntry.id,
      player,
      roundData
    )
    
    playerRoundInputs.push({
      roundId,
      tournamentFieldId: fieldEntry.id,
      playerRound,
    })
  }
}
```

**Changes:**
- Loop through all rounds for each player
- Use correct roundId from mapping (not hardcoded roundId)
- Pass actual roundData for each round iteration

### Step 3: RoundStatistic Population (Unchanged)

The RoundStatistic population logic remains the same—it now simply has valid PlayerRound references:

```typescript
// This already works correctly once PlayerRounds are created with proper roundIds
for (const player of leaderboard.Players) {
  if (!player.Rounds || player.Rounds.length === 0) continue
  
  const fieldEntry = await prisma.tournamentField.findFirst({
    where: {
      tournamentId: tournament.id,
      player: { slug: slugify(player.Name) },
    },
  })
  
  if (!fieldEntry) continue
  
  // For each round
  for (let roundIdx = 0; roundIdx < player.Rounds.length; roundIdx++) {
    const roundNum = roundIdx + 1
    const roundData = player.Rounds[roundIdx]
    const roundId = roundIds.get(roundNum)
    
    // Find the PlayerRound we just created
    const playerRound = await prisma.playerRound.findFirst({
      where: {
        roundId,
        tournamentFieldId: fieldEntry.id,
      },
    })
    
    if (!playerRound) continue
    
    // Map scorecard to RoundStatistic
    const roundStatistic = mapSportsDataRoundStatistic(playerRound.id, roundData)
    roundStatisticInputs.push({
      playerRoundId: playerRound.id,
      roundStatistic,
    })
  }
}
```

---

## Importer Changes Summary

**File:** `lib/imports/historical-results-import.ts`

**Lines affected:**
- Line 182-188: Round creation loop (1 loop → loop 1-4)
- Line 234-250: PlayerRound creation (1 per player → 1 per player per round)
- Line 302-340: RoundStatistic population (query logic updated)

**Code impact:** ~100 lines modified (from ~400 line function)

**No changes needed:**
- `lib/domain/round/mapper.ts` — Already correct
- `lib/domain/round-statistic/mapper.ts` — Already correct
- All repositories — Already correct
- All service queries — Work unchanged

---

## Affected Queries and Repositories

### Queries That Assume Single Round Per Tournament

These queries work unchanged because they filter by `roundNumber`:

```typescript
// ✓ Works unchanged
const rounds = await prisma.round.findMany({
  where: { tournamentId }
})
// Now returns 4 rounds instead of 1

// ✓ Works unchanged
const firstRound = await prisma.round.findFirst({
  where: { tournamentId, roundNumber: 1 }
})
// Still returns the first round

// ✓ Works unchanged (added for reference)
const finalStandings = await prisma.round.findFirst({
  where: { tournamentId, roundNumber: 4 }
})
// Returns the final tournament round
```

### New Queries Enabled

```typescript
// ✓ New capability: Round-by-round leaderboard
const round2Leaderboard = await prisma.playerRound.findMany({
  where: {
    round: { tournamentId, roundNumber: 2 }
  },
  orderBy: { position: 'asc' }
})

// ✓ New capability: Player's round progression
const playerRounds = await prisma.playerRound.findMany({
  where: {
    tournamentFieldId,
    round: { tournamentId }
  },
  orderBy: { round: { roundNumber: 'asc' } }
})

// ✓ New capability: Round statistics
const round3Stats = await prisma.roundStatistic.findMany({
  where: {
    playerRound: {
      round: { tournamentId, roundNumber: 3 }
    }
  }
})
```

---

## Data Migration

### Pre-Migration Cleanup

```sql
-- Verify current state
SELECT 
  COUNT(*) as total_rounds,
  COUNT(DISTINCT "roundNumber") as unique_round_numbers,
  ARRAY_AGG(DISTINCT "roundNumber") as round_numbers
FROM rounds;

-- Expected: 43 rounds, all with roundNumber=1

-- Delete existing player rounds (they reference roundNumber=1)
DELETE FROM player_rounds;

-- Delete existing round statistics (should be empty)
DELETE FROM round_statistics;

-- Delete existing rounds
DELETE FROM rounds;
```

### Post-Import Verification

```sql
-- Verify new structure
SELECT 
  t.name,
  COUNT(r.id) as round_count,
  ARRAY_AGG(r."roundNumber" ORDER BY r."roundNumber") as round_numbers,
  COUNT(pr.id) as player_round_count,
  COUNT(rs.id) as statistic_count
FROM tournaments t
LEFT JOIN rounds r ON r."tournamentId" = t.id
LEFT JOIN player_rounds pr ON pr."roundId" = r.id
LEFT JOIN round_statistics rs ON rs."playerRoundId" = pr.id
GROUP BY t.id, t.name
ORDER BY round_count DESC;

-- Expected: Each tournament has 1-4 rounds, 147-588 player rounds, 147-588 statistics
```

---

## Data Counts After Migration

### Conservative Estimate (All Tournaments Have 4 Rounds)

```
Total tournaments: 43
Rounds per tournament: 4
Players per tournament: ~147 average

Rounds:
  Before: 43 (all roundNumber=1)
  After:  172 (43 × 4)
  Change: +129 records

PlayerRounds:
  Before: ~3,736 (1 per player)
  After:  ~14,944 (4 per player)
  Change: +11,208 records

RoundStatistics:
  Before: 0 (broken pipeline)
  After:  ~14,944 (1:1 with PlayerRound)
  Change: +14,944 records
```

### Actual (Varies by Tournament)

Some tournaments may have only 2-3 completed rounds (cut events, weather delays). Query to determine:

```sql
-- Check actual round distribution
SELECT 
  MAX(player_rounds) as max_rounds,
  MIN(player_rounds) as min_rounds,
  AVG(player_rounds)::INT as avg_rounds,
  COUNT(*) as tournament_count
FROM (
  SELECT 
    t.id,
    COUNT(DISTINCT p."Rounds") as player_rounds
  FROM tournaments t
  -- This requires API call to determine; use conservative estimate
)
```

---

## Tournament ID and Player ID Preservation

### Guaranteed Preservation

```sql
-- Tournament IDs stay the same
Round.tournamentId = Tournament.id  (no change)

-- Player IDs stay the same
TournamentField.playerId = Player.id  (no change)

-- PlayerRound junction preserved
PlayerRound.tournamentFieldId = TournamentField.id  (no change)

-- New PlayerRounds created for existing TournamentFields
-- Old PlayerRounds deleted and recreated
-- But TournamentField references unchanged
```

### Verification Query

```sql
-- Before migration: Get original tournament and player IDs
SELECT 
  t.id as tournament_id,
  t."externalId" as external_id,
  p.id as player_id,
  p.slug,
  COUNT(pr.id) as original_player_round_count
FROM tournaments t
LEFT JOIN rounds r ON r."tournamentId" = t.id
LEFT JOIN player_rounds pr ON pr."roundId" = r.id
LEFT JOIN tournament_fields tf ON tf.id = pr."tournamentFieldId"
LEFT JOIN players p ON p.id = tf."playerId"
GROUP BY t.id, p.id;

-- After migration: Verify same IDs with more records
SELECT 
  t.id as tournament_id,
  t."externalId" as external_id,
  p.id as player_id,
  p.slug,
  COUNT(DISTINCT r."roundNumber") as round_count,
  COUNT(pr.id) as new_player_round_count
FROM tournaments t
LEFT JOIN rounds r ON r."tournamentId" = t.id
LEFT JOIN player_rounds pr ON pr."roundId" = r.id
LEFT JOIN tournament_fields tf ON tf.id = pr."tournamentFieldId"
LEFT JOIN players p ON p.id = tf."playerId"
GROUP BY t.id, p.id
ORDER BY t."externalId", p.slug;

-- Expected: Same tournament and player IDs, 4x more PlayerRounds
```

---

## Repository Updates

### RoundRepository

**No changes needed:**
- `upsert()` already handles `tournamentId` + `roundNumber` uniqueness
- Already returns inserted/updated record

### PlayerRoundRepository

**No changes needed:**
- `bulkUpsert()` already handles multi-record operations
- Already returns count of inserted/updated records

### RoundStatisticRepository

**No changes needed:**
- `bulkUpsert()` already handles 1:1 player round mapping
- Already verifies persistence

---

## Rollback Plan

If migration encounters issues:

```sql
-- Step 1: Delete all new records
DELETE FROM round_statistics WHERE id IN (
  SELECT rs.id FROM round_statistics rs
  JOIN player_rounds pr ON rs."playerRoundId" = pr.id
  WHERE pr."createdAt" > now() - interval '1 hour'
);

DELETE FROM player_rounds WHERE "createdAt" > now() - interval '1 hour';

DELETE FROM rounds WHERE "roundNumber" > 1;

-- Step 2: Re-run original import with roundNumber=1 only
-- (Requires reverting importer changes)
```

---

## Implementation Checklist

- [ ] Backup current database
- [ ] Verify schema @@unique([tournamentId, roundNumber]) constraint exists
- [ ] Review and approve import changes
- [ ] Implement Step 1: Multi-round creation
- [ ] Implement Step 2: Multi-round PlayerRound creation
- [ ] Verify Step 3: RoundStatistic population works
- [ ] Test with single tournament first
- [ ] Run pre-migration cleanup queries
- [ ] Run full import
- [ ] Run post-migration verification queries
- [ ] Verify no duplicate primary keys
- [ ] Verify foreign key integrity
- [ ] Check RoundStatistic data accuracy
- [ ] Validate tournament final positions match
- [ ] Test leaderboard queries still work
- [ ] Test new round-by-round queries
- [ ] Monitor performance metrics

---

## Success Criteria

1. ✓ Tournament IDs and Player IDs preserved
2. ✓ All 43 tournaments have 4 Round records (1-4)
3. ✓ PlayerRound count: ~3,736 → ~14,944
4. ✓ RoundStatistic count: 0 → ~14,944
5. ✓ Each PlayerRound has exactly one RoundStatistic
6. ✓ player_rounds.score contains actual round strokes (not Rank)
7. ✓ player_rounds.toPar calculated correctly per round
8. ✓ player_rounds.position shows tournament final position
9. ✓ Round 1-3 incomplete for cut events (players may not have all 4 rounds)
10. ✓ Existing leaderboard queries unchanged
11. ✓ New round-by-round queries enabled

---

## Risk Assessment

**Low Risk** because:
- ✓ Schema unchanged (no migrations)
- ✓ Tournament/Player IDs unchanged
- ✓ Repos already handle multi-record operations
- ✓ Fully reversible (delete and re-import)
- ✓ No breaking changes to queries
- ✓ Logic isolated to single importer function

**Mitigation:**
- Test with 1 tournament first
- Have rollback SQL ready
- Monitor import performance
- Verify data before deployment

