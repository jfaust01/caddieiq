# RoundStatistic Import Pipeline Trace

## Player: Austin Eckroat (Cognizant Classic - Tournament 590)

### STEP 1: Raw SportsDataIO API Response ✅

**Endpoint:** `https://api.sportsdata.io/golf/v2/json/Leaderboard/590`

**Player Object:**
```json
{
  "PlayerID": 40003612,
  "Name": "Austin Eckroat",
  "Rank": 2,
  "MadeCut": 1.8,
  "IsWithdrawn": false,
  "Rounds": [
    {
      "PlayerRoundID": 180987,
      "Number": 1,
      "Score": 87,
      "Par": 71,
      "Birdies": 12,
      "Eagles": 0,
      "Pars": 11,
      "Bogeys": 5,
      "DoubleBogeys": 0,
      "TripleBogeys": 0
    },
    {
      "PlayerRoundID": 180988,
      "Number": 2,
      "Score": 74,
      "Par": 71,
      ...
    },
    {
      "PlayerRoundID": 180989,
      "Number": 3,
      "Score": 69,
      "Par": 71,
      ...
    },
    {
      "PlayerRoundID": 180990,
      "Number": 4,
      "Score": 68,
      "Par": 71,
      ...
    }
  ]
}
```

✅ **Verified:** `Players[].Rounds[]` exists with 4 rounds, each with complete scorecard data (Score, Par, Birdies, Bogeys, etc.)

---

### STEP 2: Database Structure ✅

**Tournaments:**
- ID: `cmrlmaawh00024zpam57jf0g6` (Cognizant Classic)
- Status: COMPLETED

**Rounds:**
```sql
SELECT id, tournamentId FROM rounds WHERE tournamentId = 'cmrlmaawh00024zpam57jf0g6'
```

Result: **1 round record**
- ID: `cmrpj84e800ijmeroxhi7hawu`
- tournamentId: `cmrlmaawh00024zpam57jf0g6`
- Note: Only **ONE** Round per tournament, not 4

**PlayerRounds:**
```sql
SELECT COUNT(*) FROM player_rounds WHERE roundId = 'cmrpj84e800ijmeroxhi7hawu'
```

Result: **147 player_rounds** (one per player in field)
- Each PlayerRound represents that player's aggregate for the single Tournament Round

---

### STEP 3: The Import Pipeline Code ⚠️

**File:** `lib/imports/historical-results-import.ts` (lines 298-355)

**Key Code Section:**
```typescript
// Build round statistics from player scorecard data
if (leaderboard.Players && Array.isArray(leaderboard.Players)) {
  for (const player of leaderboard.Players) {
    if (!player.Name || !player.Rounds || player.Rounds.length === 0) {
      continue
    }

    // Get field entry
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

    // For each round, create a RoundStatistic ❌ PROBLEM HERE
    for (const roundData of player.Rounds) {  // Iterates 4 times
      // Find the corresponding PlayerRound
      const playerRound = await prisma.playerRound.findFirst({
        where: {
          roundId,  // ❌ This is the SAME roundId each iteration
          tournamentFieldId: fieldEntry.id,
        },
      })

      if (!playerRound) {
        continue
      }

      // Map and push
      const roundStatistic = mapSportsDataRoundStatistic(playerRound.id, roundData)
      roundStatisticInputs.push({
        playerRoundId: playerRound.id,
        roundStatistic,
      })
    }
  }
}
```

---

## **IDENTIFIED BUG: Architectural Mismatch**

### The Problem

The database schema assumes:
- **1 Round per Tournament** (aggregate leaderboard)
- **1 PlayerRound per Player per Tournament** (one-to-one)
- **1 RoundStatistic per PlayerRound** (one-to-one via playerRoundId)

The SportsDataIO API provides:
- **4 Rounds per Player** (individual scorecard data: R1, R2, R3, R4)
- **4 SdioRound objects** in `Players[].Rounds[]`

### The Mistake

The code loops through `player.Rounds` (4 iterations) but:
1. **Queries for the same PlayerRound 4 times** — `playerRound.findFirst({ roundId, tournamentFieldId })`
2. **The `roundId` is the tournament's aggregate Round**, not the individual round numbers
3. **Result:** The first iteration finds the ONE PlayerRound, the remaining 3 iterations also find the same record or fail
4. **Outcome:** Attempts to upsert the same playerRoundId multiple times, or finds 0 matches

### The Fix Needed

The code should use `roundData.Number` to identify which round is being processed. But there's a **structural issue**:

**There is NO separate Round record for Round 1, Round 2, Round 3, Round 4.**

- The architecture expects: 1 Round = tournament aggregate
- The data provides: 4 rounds = individual round scores

**Solution Options:**

A) **Use the first round only** (current data structure)
   - Take only `player.Rounds[0]` (Round 1 data)
   - Store in the single RoundStatistic for that player
   - Ignore rounds 2-4

B) **Create separate Round records** (schema change)
   - Create 4 Round records per tournament (R1, R2, R3, R4)
   - Create 4 PlayerRound records per player (one per round)
   - Create 4 RoundStatistic records per player (one per round)
   - **Requires schema migration**

---

## Current Trace Execution

With debug logging enabled, running the import should show:

```
[v0] TASK 3: Populating RoundStatistic from scorecard data
[v0] Processing Austin Eckroat with 4 rounds
[v0]   ✓ Field entry found: [fieldEntryId]
[v0]   Round 1: Number=1, Score=87, Par=71
[v0]     Query: roundId=cmrpj84e800ijmeroxhi7hawu, tournamentFieldId=[fieldId]
[v0]     ✓ PlayerRound found: [playerRoundId]
[v0]     Mapped to RoundStatistic: birdies=12, score=87
[v0]   Round 2: Number=2, Score=74, Par=71
[v0]     Query: roundId=cmrpj84e800ijmeroxhi7hawu, tournamentFieldId=[fieldId]
[v0]     ✓ PlayerRound found: [playerRoundId]  ← SAME playerRoundId as Round 1
[v0]     Mapped to RoundStatistic: birdies=..., score=74
[v0]   Round 3: ...
[v0]   Round 4: ...
[v0] STEP 3 SUMMARY: roundStatisticInputs.length = 4
[v0] Preparing bulk upsert of 4 round statistics
[v0] RoundStatistic bulk upsert complete: inserted=1, updated=3, failed=0
```

**Expected Result:**
- roundStatisticInputs = 4 objects, BUT all have the SAME playerRoundId
- upsert attempts 4 times on the same playerRoundId
- Only 1 INSERT (first time), then 3 UPDATEs (overwriting the same record)
- **Final database:** 1 RoundStatistic with Round 4's data (the last overwrite)

**Why this is wrong:**
- We're trying to store 4 different round scorecards (87, 74, 69, 68) into ONE RoundStatistic record
- Each upsert overwrites the previous one
- Final result: only Round 4 data persists (Score: 68, Birdies from R4)

---

## Recommendation

**Before continuing:** Clarify the intended behavior:

1. Should CaddieIQ store multi-round tournaments as separate Round records (Rounds 1-4)?
2. Or should it aggregate all 4 rounds into a single tournament-level leaderboard?
3. If aggregating, which metric should RoundStatistic show (total? round 1 only?)?

The current schema (1 Round per tournament) does not support storing individual round statistics.

