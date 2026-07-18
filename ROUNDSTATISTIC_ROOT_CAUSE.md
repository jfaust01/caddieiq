# RoundStatistic Import: Root Cause Analysis

**Status:** 0 records in round_statistics (completely empty)

---

## Executive Summary

The RoundStatistic import **never reaches the database** because the code attempts to insert 4 records with the **same playerRoundId** for each player. The unique constraint `@@unique([playerRoundId])` prevents this, but the code doesn't detect the violation until runtime.

**The bug:** The import pipeline treats each player's 4 scorecard rounds as separate records when they should all map to ONE PlayerRound aggregate.

---

## Complete Trace: Austin Eckroat (Tournament 590)

### Phase 1: Data Availability ✅
- SportsDataIO provides: 4 rounds per player (`Players[0].Rounds[]` array length = 4)
- Each round has: Score (87, 74, 69, 68), Birdies (12, ..., ..., ...), etc.
- All data is complete and correct in the API response

### Phase 2: Database Schema (Mismatch) ❌

**What CaddieIQ has:**
```
Tournament
  └─ Round (1 record per tournament)
      └─ PlayerRound (1 record per player per tournament)
          └─ RoundStatistic (1 record per PlayerRound)
```

**What SportsDataIO provides:**
```
Tournament
  └─ Player
      └─ Rounds[] (array of 4 rounds)
          ├─ Round 1 (Score: 87, Birdies: 12)
          ├─ Round 2 (Score: 74, Birdies: ...)
          ├─ Round 3 (Score: 69, Birdies: ...)
          └─ Round 4 (Score: 68, Birdies: ...)
```

### Phase 3: Import Code Execution (Where It Breaks)

**File:** `lib/imports/historical-results-import.ts` (lines 319-339)

```typescript
// Loop through player's 4 scorecard rounds
for (const roundData of player.Rounds) {  // ITERATION 1, 2, 3, 4
  
  // Query database for PlayerRound
  const playerRound = await prisma.playerRound.findFirst({
    where: {
      roundId,  // ← ALWAYS THE SAME: "cmrpj84e800ijmeroxhi7hawu"
      tournamentFieldId: fieldEntry.id,  // ← ALWAYS THE SAME: Austin's field entry
    },
  })
  
  // Result: Same playerRound found all 4 times
  // If playerRound exists:
  //   Iteration 1: playerRoundId = "xyz123"
  //   Iteration 2: playerRoundId = "xyz123" (DUPLICATE!)
  //   Iteration 3: playerRoundId = "xyz123" (DUPLICATE!)
  //   Iteration 4: playerRoundId = "xyz123" (DUPLICATE!)
  
  // Array after loop:
  roundStatisticInputs = [
    { playerRoundId: "xyz123", roundStatistic: { score: 87, birdies: 12, ... } },
    { playerRoundId: "xyz123", roundStatistic: { score: 74, birdies: ..., ... } },  // DUPLICATE KEY!
    { playerRoundId: "xyz123", roundStatistic: { score: 69, birdies: ..., ... } },  // DUPLICATE KEY!
    { playerRoundId: "xyz123", roundStatistic: { score: 68, birdies: ..., ... } },  // DUPLICATE KEY!
  ]
}
```

### Phase 4: Database Upsert Attempt ❌

**File:** `lib/repositories/round-statistic-repository.ts` (line 128+)

```typescript
async bulkUpsert(inputs: ResolvedRoundStatistic[]) {
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index]
    
    // Upsert by playerRoundId (UNIQUE constraint)
    const res = await this.upsert(input)
    // Line 45: where: { playerRoundId: input.playerRoundId }
  }
}
```

**What happens:**

| Iteration | playerRoundId | Action | Result |
|-----------|---------------|--------|--------|
| 1 | "xyz123" | Create RoundStatistic | ✅ INSERT (first time) |
| 2 | "xyz123" | Upsert RoundStatistic | ⚠️ UPDATE (same record, overwrites score 87→74) |
| 3 | "xyz123" | Upsert RoundStatistic | ⚠️ UPDATE (same record, overwrites score 74→69) |
| 4 | "xyz123" | Upsert RoundStatistic | ⚠️ UPDATE (same record, overwrites score 69→68) |

**Final state in database:**
- 1 RoundStatistic record for Austin's PlayerRound
- Contains Round 4 data (Score: 68, not 87)
- Rounds 1-3 data completely lost

### Phase 5: Why 0 Records Exist

If the import code encounters **ANY error** during the PlayerRound lookup or construction phase, it skips the entire player:

```typescript
if (!fieldEntry) {
  continue  // ← Skips all round statistics
}

if (!playerRound) {
  continue  // ← Skips this specific round
}
```

**Possible reasons for 0 records:**

1. **Field entry lookup fails** (line 307) → Entire player skipped
   - PlayerSlug mismatch between leaderboard name and database
   - Tournament field not properly loaded

2. **PlayerRound lookup fails** (line 321) → Specific round skipped
   - `roundId` doesn't match any Round record
   - `tournamentFieldId` invalid

3. **Both iterations find NO matches** → No roundStatisticInputs collected
   - Result: `if (roundStatisticInputs.length > 0)` is false
   - Console: `[v0] No round statistics to upsert (no scorecard data available)`

---

## Where Data Is Lost

**Exact Line: 323 (in historical-results-import.ts)**

```typescript
const playerRound = await prisma.playerRound.findFirst({
  where: {
    roundId,  // ← Using tournament aggregate Round, not individual round number
    tournamentFieldId: fieldEntry.id,
  },
})

if (!playerRound) {
  continue  // ← DATA LOST HERE: Skip if match fails
}
```

If `playerRound` is not found, the loop continues to the next SdioRound, but no RoundStatistic is created.

**Why PlayerRound might not be found:**
- The Round ID might be wrong
- The TournamentField ID might be stale/incorrect
- The query condition is too specific and matches nothing

---

## Verification Queries

### What's actually in the database:

**Check if PlayerRounds exist for Cognizant Classic:**
```sql
SELECT 
  pr.id,
  pr."tournamentFieldId",
  pr.score,
  pr."toPar",
  pr.position,
  pr."madeCut"
FROM player_rounds pr
WHERE pr."roundId" = (SELECT id FROM rounds WHERE "tournamentId" = 'cmrlmaawh00024zpam57jf0g6')
LIMIT 3;
```

**Expected Result:** 147 PlayerRound records with varying data

**Check RoundStatistics:**
```sql
SELECT COUNT(*) FROM round_statistics;
```

**Actual Result:** 0 (completely empty)

---

## Why Upsert Silently Fails

The upsert code has verification (line 67-73 in repository):

```typescript
// VERIFICATION: Query database immediately to confirm persistence
const verified = await this.prisma.roundStatistic.findUnique({
  where: { playerRoundId: input.playerRoundId },
})

if (!verified) {
  return fail(err)  // Returns failure
}
```

However, if `roundStatisticInputs.length === 0`, the bulkUpsert is **never called**:

```typescript
if (roundStatisticInputs.length > 0) {  // LINE 366
  const statsRes = await roundStatisticRepo.bulkUpsert(roundStatisticInputs)
} else {
  console.log(`[v0] No round statistics to upsert (no scorecard data available)`)
}
```

**Most likely scenario:** The import collects ZERO roundStatisticInputs because:
1. PlayerSlug lookup fails for all players, OR
2. PlayerRound lookup fails for all players

Result: Code takes the `else` branch and logs "no scorecard data available" even though SportsDataIO provided complete data.

---

## Recommended Fixes (In Priority Order)

### OPTION 1: Use First Round Only (Minimal Schema Change)
- Modify line 319 to: `for (const roundData of [player.Rounds[0]]) {`
- Store only Round 1 data in the single RoundStatistic
- Ignore rounds 2-4 from SportsDataIO
- **Pros:** No schema changes, simple fix
- **Cons:** Data loss (3 of 4 rounds discarded)

### OPTION 2: Store All Rounds (Schema Migration)
- Create 4 Round records per tournament (R1, R2, R3, R4)
- Create 4 PlayerRound records per player (one per round)
- Create 4 RoundStatistic records per player (one per round)
- **Pros:** All data preserved
- **Cons:** Major schema changes, impacts leaderboard queries

### OPTION 3: Aggregate Rounds (Data Transformation)
- Calculate tournament totals: sum of Birdies, Bogeys across all 4 rounds
- Store aggregates in single RoundStatistic
- **Pros:** Meaningful summary data
- **Cons:** Requires calculation logic, might not match SportsDataIO intent

---

## Next Steps

1. **Verify** that PlayerRound records exist for the tournament
2. **Check** if the field entry lookup is working correctly
3. **Add logging** to see which check fails (field entry or playerRound)
4. **Decide** on the architectural approach (OPTION 1, 2, or 3)
5. **Implement** fix and re-run import

