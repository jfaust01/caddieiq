# Phase 12.X.2 — Multi-Round Tournament Import Implementation

## Overview

This document summarizes the complete implementation of Phase 12.X.2, which converts the CaddieIQ historical results importer from a single-round-per-tournament model to a multi-round model that matches the SportsDataIO API structure.

---

## What Was Implemented

### PHASE 1: Multi-Round Detection
**Location:** `lib/imports/historical-results-import.ts` (lines 181-230)

Detects the number of distinct round numbers (1-4) from SportsDataIO Leaderboard API response:
- Scans all player records for distinct `Rounds[].Number` values
- Creates a `Set<number>` of round numbers
- Sorts them in ascending order (1, 2, 3, 4)

**Code added:**
```typescript
const distinctRoundNumbers = new Set<number>()
for (const player of leaderboard.Players) {
  if (player.Rounds?.length) {
    for (const round of player.Rounds) {
      if (round.Number) distinctRoundNumbers.add(round.Number)
    }
  }
}
const sortedRoundNumbers = Array.from(distinctRoundNumbers).sort((a, b) => a - b)
```

### PHASE 2: Create Multiple Rounds Per Tournament
**Location:** `lib/imports/historical-results-import.ts` (lines 231-250)

Creates one Round record for each detected roundNumber:
- Loops through sorted round numbers (1, 2, 3, 4)
- Calls `roundRepo.upsert()` for each round
- Stores mapping of `roundNumber → roundId` for later use
- Increments summary counter for each round created

**Key changes:**
- Before: One hardcoded `roundNumber=1`
- After: Dynamic `roundNumber` (1 through N)

### PHASE 3: Create PlayerRounds for All Rounds
**Location:** `lib/imports/historical-results-import.ts` (lines 268-313)

For each player, creates one PlayerRound record per round they played:
- Iterates through `player.Rounds[]` array (instead of taking only first)
- For each round, retrieves the correct `roundId` from the mapping
- Passes `roundData` to mapper (contains Score, Par, Birdies, etc.)
- Creates PlayerRound records via bulk upsert

**Key changes:**
```typescript
// BEFORE: Single round
const roundData = player.Rounds?.[0]  // Only first round
const playerRound = mapSportsDataPlayerRound(roundId, fieldEntry.id, player, roundData)

// AFTER: All rounds
for (const roundData of player.Rounds) {
  const roundNumber = roundData.Number
  const roundId = roundIdsByNumber.get(roundNumber)  // Correct round ID
  const playerRound = mapSportsDataPlayerRound(roundId, fieldEntry.id, player, roundData)
  // Repeat for each round
}
```

### PHASE 4: Fix PlayerRound Score Mapping
**Location:** `lib/domain/round/mapper.ts` (lines 47-94)

Updated the mapper to use actual round scores instead of tournament rank:
- Accepts optional `roundData` parameter with scorecard data
- Uses `roundData.Score` (actual strokes) instead of fallback Rank
- Calculates `toPar = Score - Par` when both available
- Preserves `player.Rank` as tournament position (applies to all rounds)

**Before:**
```typescript
const score = player?.Rank ?? 999  // Using rank as score (WRONG)
const toPar = null  // Always null
```

**After:**
```typescript
let score: number | null = null
let toPar: number | null = null

if (roundData?.Score !== undefined) {
  score = roundData.Score  // Actual strokes
  if (roundData.Par !== undefined) {
    toPar = roundData.Score - roundData.Par  // Calculated correctly
  }
}
```

### PHASE 5: RoundStatistic Population
**Location:** `lib/imports/historical-results-import.ts` (lines 350-420)

Populates RoundStatistic records with scorecard statistics:
- Now works correctly because PlayerRounds have correct roundIds
- Queries for PlayerRound using roundId + fieldEntry.id mapping
- Maps scorecard data (Birdies, Bogeys, Pars, etc.)
- Creates 1:1 relationship with PlayerRound

**Fixes applied:**
- Correctly queries for PlayerRound with actual roundId
- Iterates all rounds (not just first round)
- Maps all scorecard statistics

---

## Data Migration

### Pre-Migration State
- 1 Round per tournament (roundNumber=1)
- 3,736 PlayerRounds (1 per player per tournament)
- 0 RoundStatistics (pipeline was broken)

### Post-Migration State
- 4 Rounds per tournament (roundNumber 1, 2, 3, 4)
- ~14,944 PlayerRounds (4 per player per tournament)
- ~14,944 RoundStatistics (1:1 with PlayerRound)

### Migration Process
1. Backup existing data to backup tables
2. Clear rounds, player_rounds, round_statistics
3. Run importer with PHASES 1-4 implementation
4. Verify all data populated correctly
5. Confirm no data loss or inconsistencies

---

## Database Impact

### Schema Changes
**ZERO schema migrations required**

The schema already supports this architecture:
```sql
Rounds:
  @@unique([tournamentId, roundNumber])  -- Allows 1-4 per tournament

PlayerRounds:
  roundId FK  -- Already supports multiple PlayerRounds per Player
  
RoundStatistics:
  @@unique(playerRoundId)  -- 1:1 relationship (unchanged)
```

### Data Growth
- **Rounds:** 30 → 120-130 records
- **PlayerRounds:** 3,736 → 14,944 records
- **RoundStatistics:** 0 → 14,944 records
- **Disk space:** ~50-100MB additional

### Performance Impact
- No degradation expected
- Queries still filtered by roundNumber or use index on roundId
- Bulk operations remain efficient

---

## Files Modified

### `lib/imports/historical-results-import.ts`
- **Lines 181-230:** PHASE 1 - Detect and create multiple rounds
- **Lines 231-250:** PHASE 1 continuation - Store roundId mapping
- **Lines 268-313:** PHASE 2 - Iterate all player rounds
- **Lines 350-420:** PHASE 3 - Populate RoundStatistics
- **Summary fields:** Added roundStatisticsCreated, roundStatisticsUpdated, roundStatisticsFailed

### `lib/domain/round/mapper.ts`
- **Lines 47-94:** PHASE 4 - Updated score mapping logic
- **Parameter:** Added optional `roundData` parameter
- **Comments:** Updated to reflect multi-round support

### `lib/providers/sportsdataio/types.ts`
- **Lines 93-160:** Added SdioRound and SdioRoundHole interfaces
- **Lines 176-179:** Updated SdioLeaderboardPlayer to include Rounds[]

---

## Verification & Validation (PHASE 7-8 Ready)

### Pre-Validation Checklist
- ✓ Code implemented and compiled
- ✓ Database cleared
- ✓ Backups created
- ✓ TournamentField relationships preserved (3,736 entries)
- ✓ Ready for import

### Validation Queries (Execute After Import)

**Query 1: Verify Rounds**
```sql
SELECT r."roundNumber", COUNT(pr.id) as player_round_count
FROM rounds r LEFT JOIN player_rounds pr ON pr."roundId" = r.id
GROUP BY r."roundNumber" ORDER BY r."roundNumber"
-- Expected: 4 rows, each with ~3,600+ player rounds
```

**Query 2: Verify PlayerRound Count**
```sql
SELECT COUNT(*) as total FROM player_rounds
-- Expected: ~14,944
```

**Query 3: Verify RoundStatistics**
```sql
SELECT COUNT(*) as total FROM round_statistics
-- Expected: ~14,944 (1:1 with player_rounds)
```

**Query 4: Verify Data Accuracy (Austin Eckroat)**
```sql
SELECT r."roundNumber", pr.score, pr."toPar", rs.birdies
FROM player_rounds pr
JOIN rounds r ON pr."roundId" = r.id
WHERE player.slug = 'austin-eckroat'
ORDER BY r."roundNumber"
-- Expected: Scores 87, 74, 69, 68 (progression visible)
```

**Query 5: Verify Integrity**
```sql
SELECT COUNT(DISTINCT "tournamentFieldId") as field_entries
FROM player_rounds
-- Expected: 3,736 (unchanged)
```

---

## Rollback Procedure

If import fails or validation fails:

```sql
TRUNCATE TABLE round_statistics CASCADE;
TRUNCATE TABLE player_rounds CASCADE;
TRUNCATE TABLE rounds CASCADE;

INSERT INTO rounds SELECT * FROM rounds_backup_phase12x2;
INSERT INTO player_rounds SELECT * FROM player_rounds_backup_phase12x2;
INSERT INTO round_statistics SELECT * FROM round_statistics_backup_phase12x2;
```

---

## Success Criteria

All of the following must be true:

- [ ] ✓ 4 distinct round numbers (1, 2, 3, 4) per tournament
- [ ] ✓ ~14,944 total PlayerRounds (~4x original)
- [ ] ✓ ~14,944 RoundStatistics (1:1 with PlayerRound)
- [ ] ✓ Score values are actual strokes (87, 74, 69, 68), not ranks
- [ ] ✓ toPar calculated correctly (+16, +3, -2, -3)
- [ ] ✓ Tournament position preserved across all rounds
- [ ] ✓ RoundStatistics populated (birdies, bogeys, pars visible)
- [ ] ✓ TournamentField relationships unchanged
- [ ] ✓ No orphaned or inconsistent records
- [ ] ✓ Import completes without errors

---

## Documentation References

- **Architecture Analysis:** `DATABASE_MODEL_ANALYSIS.md`
- **Migration Strategy:** `PHASE_12X2_MIGRATION_AND_VALIDATION.md`
- **Validation Readiness:** `PHASE_12X2_VALIDATION_READINESS.md`
- **Implementation Checklist:** `PHASE_12X2_IMPLEMENTATION_CHECKLIST.md`

---

## Timeline

- **PHASE 1:** Multi-round detection ✓ Complete
- **PHASE 2:** PlayerRound creation ✓ Complete
- **PHASE 3:** RoundStatistic population ✓ Complete
- **PHASE 4:** Score mapping fix ✓ Complete
- **PHASE 5:** Migration strategy ✓ Documented
- **PHASE 6:** Repository audit ✓ Complete (no changes needed)
- **PHASE 7:** Single tournament validation → Ready to execute
- **PHASE 8:** Full import validation → Ready to execute

---

## Next Steps

1. Execute PHASE 7 validation test
2. Run verification queries 1-5
3. Confirm all success criteria pass
4. Execute PHASE 8 full import
5. Sign off on migration complete

**Status: Ready for PHASE 7-8 validation ✓**

