# Multi-Round Tournament Migration Plan

## Pre-Migration State
- **Rounds created:** 1 per tournament (roundNumber=1 only)
- **PlayerRounds created:** 1 per player per tournament (147 per Cognizant Classic)
- **RoundStatistics:** 0 records (pipeline broken due to Round mismatch)

## Post-Migration State (Target)
- **Rounds created:** 1-4 per tournament (roundNumber 1, 2, 3, 4)
- **PlayerRounds created:** 1 per player per round (147 × 4 = 588 per tournament)
- **RoundStatistics:** 1 per player per round (588 per tournament)

## Migration Scope

### No Schema Changes Required
✓ Rounds table already has `@@unique([tournamentId, roundNumber])`
✓ PlayerRounds table already has `@@index([roundId, tournamentFieldId])`
✓ RoundStatistics table already correctly designed

### Code Changes Required

#### 1. Update Round Mapper (lib/domain/round/mapper.ts)
**Lines affected:** 18-41

**Changes:**
- Update comment to remove "provider does not expose per-round data"
- Document that now creates 1 Round per actual tournament round
- Keep roundNumber calculation logic as-is (caller now provides it)

#### 2. Update Historical Results Importer (lib/imports/historical-results-import.ts)
**Lines affected:** 181-256

**Key changes:**
```
BEFORE:
- Line 182-188: Create 1 Round with roundNumber=1 hardcoded
- Line 248: Use only player.Rounds[0]

AFTER:
- Detect max round count from player.Rounds arrays
- Create one Round record per tournament round (1-4)
- For each player, iterate through all their rounds
- Create one PlayerRound per player per round
- Pass correct roundData to mapper
```

**Pseudo-code:**
```typescript
// Determine how many rounds this tournament has
const maxRounds = Math.max(
  ...leaderboard.Players
    .filter(p => p.Rounds?.length)
    .map(p => p.Rounds.length),
  0
)

// Create Round records for each round number (1 to maxRounds)
for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
  const roundRes = await roundRepo.upsert({
    tournamentId: tournament.id,
    roundNumber: roundNum,
    // scheduledDate could be calculated if data available
  })
  roundIds[roundNum] = roundRes.record.id
}

// Create PlayerRound for each player and round
for (const player of leaderboard.Players) {
  for (let roundIdx = 0; roundIdx < player.Rounds.length; roundIdx++) {
    const roundNum = roundIdx + 1
    const roundData = player.Rounds[roundIdx]
    const roundId = roundIds[roundNum]
    
    const playerRound = mapSportsDataPlayerRound(
      roundId,
      fieldEntry.id,
      player,
      roundData
    )
    playerRoundInputs.push(playerRound)
  }
}
```

#### 3. No Changes Needed
- Round mapper logic (no changes to returned structure)
- PlayerRound mapper (already correctly uses roundData)
- RoundStatistic mapper (already correct)
- RoundStatisticRepository (already correct)
- UI/service layer (queries work unchanged)

## Implementation Checklist

- [ ] **Code Review**
  - [ ] Review DATABASE_MODEL_ANALYSIS.md
  - [ ] Confirm Option A is approved
  - [ ] Sign off on importer logic changes

- [ ] **Implementation**
  - [ ] Update round mapper comments
  - [ ] Update importer to create multiple rounds
  - [ ] Update importer player round iteration
  - [ ] Build and run TypeScript check
  - [ ] Add debug logging to verify round creation

- [ ] **Data Cleanup (Optional)**
  - [ ] Backup current player_rounds data
  - [ ] Delete existing player_rounds from Round(roundNumber=1)
  - [ ] Delete existing rounds with only roundNumber=1
  - [ ] Verify no orphaned round_statistics (should be 0 anyway)

- [ ] **Re-import**
  - [ ] Run historical results import with single tournament first
  - [ ] Verify 4 Rounds created (1, 2, 3, 4)
  - [ ] Verify 588 PlayerRounds created (147 × 4)
  - [ ] Verify 588 RoundStatistics created
  - [ ] Run verification queries from DATABASE_MODEL_ANALYSIS.md

- [ ] **Testing**
  - [ ] Query leaderboard for Round 1 only (final scores)
  - [ ] Query leaderboard for Round 3 (mid-tournament)
  - [ ] Verify player positions are consistent across rounds
  - [ ] Check RoundStatistic data accuracy (birdies, bogeys, etc.)

- [ ] **Validation**
  - [ ] Run complete import for all tournaments
  - [ ] Compare old vs new player_rounds count
  - [ ] Verify no data loss
  - [ ] Check database integrity

## Estimated Impact
- **Lines of code changed:** ~50 in importer
- **Files modified:** 1 (historical-results-import.ts)
- **Database schema changes:** 0
- **Breaking changes:** 0 (backward compatible)
- **Data growth:** ~3x (147 → 588 PlayerRounds per tournament)

## Risk Assessment
- **Low risk** - Schema already supports this design
- **Reversible** - Can delete rounds 2-4 and go back to old state if needed
- **No migrations needed** - Schema is unchanged
- **Validation strong** - Can verify data before committing

## Success Criteria
1. ✓ 4 Rounds created per tournament
2. ✓ 588 PlayerRounds per tournament (4 rounds × 147 players)
3. ✓ 588 RoundStatistics per tournament with correct data
4. ✓ player_rounds.score now contains actual strokes per round
5. ✓ player_rounds.toPar now calculated correctly
6. ✓ player_rounds.position preserved from tournament ranking
7. ✓ All leaderboard queries still work
8. ✓ Round-by-round analytics now possible

