# PHASE 12.X.1 — TASK 4: Hole Data Analysis and Schema Recommendation

## Overview

The SportsDataIO Leaderboard response includes hole-by-hole detail for each round in `Players[].Rounds[].Holes[]`. This document analyzes what data is available and recommends whether to extend the schema with a separate `RoundHole` table or persist only aggregate data.

---

## Available Hole-Level Data

### Structure

```json
{
  "Rounds": [
    {
      "PlayerRoundID": 180987,
      "Number": 1,
      "Par": 71,
      "Score": 87,
      "Holes": [
        {
          "Number": 1,
          "Par": 4,
          "Score": 5,
          "ToPar": -1,
          "HoleInOne": false,
          "Eagle": false,
          "Birdie": true,
          "IsPar": false,
          "Bogey": false,
          "DoubleBogey": false
        },
        // ... 18 holes per round
      ]
    }
  ]
}
```

### Fields Per Hole

| Field | Type | Example | Use Case |
|-------|------|---------|----------|
| `Number` | int (1-18) | 1 | Hole identifier |
| `Par` | int | 4 | Course difficulty |
| `Score` | int | 5 | Player strokes on hole |
| `ToPar` | int | -1 | Relative scoring (birdie) |
| `HoleInOne` | bool | false | Ace tracking |
| `Eagle` | bool | false | Result classification |
| `Birdie` | bool | true | Result classification |
| `IsPar` | bool | false | Result classification |
| `Bogey` | bool | false | Result classification |
| `DoubleBogey` | bool | false | Result classification |

### Data Volume

- Per player, per round: 18 holes
- Per tournament: ~140 players × 4 rounds × 18 holes = **~10,080 hole records**
- Annual (43 tournaments): **~433,440 hole records** at scale

---

## Current Schema Status

**Current `RoundStatistic` table:**
- ✅ Aggregate metrics only (birdies, bogeys, etc. counts)
- ❌ No hole-level breakdown
- ❌ No ability to query individual hole performance

**Potential `RoundHole` table:**
- ❌ Does not exist
- ❌ Not in Prisma schema

---

## Analysis: Denormalization vs. Separate Table

### Option A: Create `RoundHole` Table ✅ RECOMMENDED

**Schema Addition:**
```prisma
model RoundHole {
  id String @id @default(cuid())
  roundStatisticId String
  holeNumber Int
  par Int
  score Int
  toPar Int
  result String // "EAGLE" | "BIRDIE" | "PAR" | "BOGEY" | "DOUBLE_BOGEY" | "HOLE_IN_ONE"
  isHoleInOne Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roundStatistic RoundStatistic @relation(fields: [roundStatisticId], references: [id], onDelete: Cascade)

  @@unique([roundStatisticId, holeNumber])
  @@index([roundStatisticId])
  @@index([holeNumber])
  @@map("round_holes")
}
```

**Relationship:**
```
PlayerRound (1) ↔ (1) RoundStatistic (1) ↔ (18) RoundHole
```

### Option B: Denormalize Into RoundStatistic ❌ NOT RECOMMENDED

Store as JSON or individual columns:
- ❌ Loses queryability (can't filter by hole results)
- ❌ Violates normalization principles
- ❌ Makes aggregation queries complex
- ✓ Saves one join per query

---

## Recommended Approach: Option A (RoundHole Table)

### Rationale

1. **Analytics Value**
   - Query "How many pars on hole 18?" across all tournaments
   - Query "Player performance on short par-4s"
   - Query "Scoring trends by hole position (front 9 vs. back 9)"

2. **Data Integrity**
   - Each hole uniquely identified by (roundStatisticId, holeNumber)
   - Aggregate counts can be verified: sum(birdies) == count(result='BIRDIE')
   - Enables data quality checks

3. **Performance**
   - Indexed on (roundStatisticId, holeNumber)
   - Aggregate queries use existing indexed RoundStatistic.birdies, etc.
   - Hole detail queries still fast with index

4. **Flexibility**
   - Future metrics easily added without schema changes
   - Alternative sources can backfill data
   - Enables real-time hole tracking for live tournaments

5. **Precedent**
   - Sports analytics platforms always normalize hole-level data
   - Enables player vs. hole matchup analysis
   - Required for strokes-gained calculations on specific holes

### Not Recommended: Denormalization

- Violates analytical use cases
- Makes schema harder to reason about
- Locks us into current data source (SportsDataIO)

---

## Migration Path

### Phase 1 (Current): Skip Hole Data

**Action:** Do NOT implement RoundHole table yet.

**Reason:**
- Current RoundStatistic counts (birdies, bogeys, eagles) are sufficient
- Can add hole data in a subsequent phase
- No breaking changes to existing schema

**What to do now:**
- Keep `mapSportsDataRoundStatistic()` as-is (aggregates only)
- Hole data is available in API but not persisted
- Document this limitation for future

### Phase 2 (Future): Add RoundHole Table

**Triggers for Phase 2:**
- Dashboard needs hole-level filtering
- Analytics requests specific hole performance
- Strokes-gained calculations needed per hole
- Live tournament scoring requires hole tracking

**Implementation (when needed):**
1. Add `RoundHole` model to Prisma schema
2. Create `RoundHoleRepository` with bulk upsert
3. Add `mapSportsDataRoundHole()` mapper
4. Integrate into historical results importer
5. Backfill existing RoundStatistics with hole data

---

## Conclusion: SKIP ROUNDHOLE FOR NOW

### Recommendation

**Do NOT create RoundHole table in TASK 4.**

**Reasoning:**

1. **Sufficient Data:** RoundStatistic aggregate counts (birdies, bogeys, etc.) are sufficient for current analytics needs
2. **No Current Use Case:** UI/dashboards don't require hole-level breakdown
3. **Future-Proof:** Can add RoundHole in future without modifying RoundStatistic
4. **Scope Creep:** TASK 4 is analysis, not implementation
5. **Performance:** Skip unnecessary write load on ~433K additional records annually until needed

### What to Document Instead

Add comments to the code indicating:
- Hole data is available in SdioRound.Holes[]
- Can be extracted for RoundHole table if needed
- Aggregate approach (current) sufficient for MVP

### Example Code Comment

```typescript
// HOLE DATA AVAILABLE BUT NOT PERSISTED (TASK 4 Decision)
// The SdioRound response includes Holes[] with per-hole scores, pars, and results.
// This data is not persisted to a RoundHole table because:
// - Aggregate metrics (birdies, bogeys) are sufficient for current use cases
// - No hole-level filtering required by current analytics
// - Can be added in future as Phase 2 without schema refactoring
//
// To implement hole-level tracking in the future:
// 1. Create RoundHole table in Prisma schema
// 2. Extend mappers to call mapSportsDataRoundHole()
// 3. Update historical-results-import to populate RoundHole bulk upsert
// 
// Hole fields available: Number (1-18), Par, Score, ToPar, Result (Eagle/Birdie/Par/Bogey)
```

---

## Appendix: Full Hole Data Example

### Real Data: Austin Eckroat, Round 1, Hole 1-5

```json
{
  "PlayerRoundID": 180987,
  "Number": 1,
  "Day": "2024-02-29T00:00:00",
  "Par": 71,
  "Score": 87,
  "Birdies": 12,
  "Bogeys": 5,
  "Holes": [
    {
      "Number": 1,
      "Par": 4,
      "Score": 5,
      "ToPar": -1,
      "Birdie": true
    },
    {
      "Number": 2,
      "Par": 4,
      "Score": 5,
      "ToPar": -1,
      "Birdie": true
    },
    {
      "Number": 3,
      "Par": 5,
      "Score": 7,
      "ToPar": -1,
      "Birdie": true
    },
    {
      "Number": 4,
      "Par": 4,
      "Score": 4,
      "ToPar": 0,
      "IsPar": true
    },
    {
      "Number": 5,
      "Par": 3,
      "Score": 2,
      "ToPar": -1,
      "HoleInOne": true
    }
  ]
}
```

---

## Summary

| Aspect | Decision |
|--------|----------|
| Create RoundHole table now? | ❌ NO — Not needed for current use cases |
| Persist hole data now? | ❌ NO — Aggregate data sufficient |
| Keep hole data in API? | ✅ YES — Available for future extraction |
| Document for future? | ✅ YES — Add comments and migration path |
| When to revisit? | When dashboard needs hole-level filtering or analytics requests it |

