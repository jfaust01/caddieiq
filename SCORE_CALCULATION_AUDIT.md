# Score Calculation Audit — Critical Issue Found

## Problem Summary

Score calculations are incorrect, producing impossible values:
- **Example 1:** Score: 87, toPar: 16 ✓ (Correct)
- **Example 2:** Score: 32, toPar: -39 ✗ (Impossible)
- **Example 3:** Score: 117, toPar: 46 ✗ (Impossible)

## Root Cause Analysis

### Current Implementation (WRONG)

**File:** `lib/domain/round/mapper.ts` (lines 47-73)

**Current Formula:**
```typescript
if (roundData?.Score !== undefined && roundData.Score !== null) {
  score = roundData.Score
  // Calculate toPar if both score and par are available
  if (roundData.Par !== undefined && roundData.Par !== null) {
    toPar = roundData.Score - roundData.Par
  }
}
```

**Assumption:** `roundData.Score` = total strokes for a single round (e.g., 68, 70, 87)

### The Issue

SportsDataIO's `Rounds[].Score` is **NOT** per-round strokes. Evidence:

#### Cognizant Classic (18-hole rounds)
| Round | Players | Min Score | Max Score | Avg Score |
|-------|---------|-----------|-----------|-----------|
| 1     | 145     | 0         | 104       | 92        |
| 2     | 145     | 0         | 108       | 94        |
| 3     | 143     | 0         | 103       | 44        |
| 4     | 67      | 84        | 102       | 92        |

**Problem:** Round 3 has avg score of 44 (only ~half a normal 18-hole round). This is clearly not per-round strokes.

#### Mexico Open at Vidanta (9-hole format)
| Round | Players | Min Score | Max Score | Avg Score |
|-------|---------|-----------|-----------|-----------|
| 1     | 132     | 0         | 37        | 33        |
| 2     | 132     | 0         | 37        | 32        |
| 3     | 130     | 0         | 36        | 16        |
| 4     | 65      | 31        | 36        | 33        |

**Problem:** Scores of 32-37 are clearly NOT 18-hole scores. Max score of 37 cannot be for Par 72. Round 3 shows avg of 16 (corrupted data?).

### What SportsDataIO Actually Provides

Based on the SdioRound interface definition (types.ts lines 117-160):

```typescript
export interface SdioRound extends SdioRecord {
  Number?: number              // Round number (1, 2, 3, 4)
  Par?: number                 // Course par for this round
  Score?: number               // ← **Total strokes for this round** (per documentation)
  HoleInOnes?: number
  Eagles?: number
  Birdies?: number
  Pars?: number
  Bogeys?: number
  DoubleBogeys?: number
  Holes?: SdioRoundHole[]       // ← Individual hole data
}
```

**Key:** The `Holes` array contains per-hole scores. We should be calculating score from `Holes`, not using `Score` directly.

## What the Data Really Represents

The scores being stored are **NOT uniform across tournaments**. Possible interpretations:

1. **Some tournaments use 9-hole rounds** (Mexico Open avg 33 strokes = ~4.4 per hole × 9 = ~40, close to Par 36)
2. **Score field may be cumulative** (tournament total, not round total)
3. **Holes array is the authoritative source** (we should sum from individual hole scores)
4. **Data quality issues** - some tournaments missing or corrupted

## Current Consequences

❌ Round 1-2 of Cognizant: Correct (coincidentally, because avg stroke count matches reality)  
❌ Round 3-4 of Cognizant: Wrong (data format different or corrupted)  
❌ Mexico Open all rounds: Wrong (data is from 9-hole format or cumulative)  
❌ Mayakoba: Wrong (scores > 100 with avg 117 over par)  

## Recommended Fix

### Option A: Use Holes Array (Most Reliable)

Calculate score from individual hole scores instead of using `Rounds[].Score`:

```typescript
if (roundData?.Holes && Array.isArray(roundData.Holes)) {
  // Sum strokes across all holes in this round
  score = roundData.Holes.reduce((sum, hole) => {
    return sum + (hole.Score ?? 0)
  }, 0)
  
  // Sum par across all holes
  const roundPar = roundData.Holes.reduce((sum, hole) => {
    return sum + (hole.Par ?? 0)
  }, 0)
  
  toPar = score - roundPar
}
```

**Advantages:**
- Exact per-hole data, no guessing
- Works for 9-hole and 18-hole formats
- Consistent across all tournaments

**Disadvantages:**
- Requires Holes array to be populated (may not always be present)
- More complex calculation

### Option B: Use Tournament Format + Par

Normalize based on tournament format and hole count:

```typescript
if (roundData?.Score !== undefined && roundData.Par !== undefined) {
  // If average score per hole is ~4-5, this is per-hole score
  const estimatedHoles = Math.round(roundData.Score / 4.2)
  
  if (estimatedHoles < 14) {
    // This is 9-hole data
    // Holes array par is correct, convert if needed
    score = roundData.Score
    toPar = score - roundData.Par
  } else if (estimatedHoles >= 16 && estimatedHoles <= 19) {
    // This is 18-hole data
    score = roundData.Score
    toPar = score - roundData.Par
  } else {
    // Ambiguous, needs manual review
    score = null
    toPar = null
  }
}
```

**Advantages:**
- Can work with existing data
- Handles mixed formats

**Disadvantages:**
- Heuristic-based (fragile)
- May still miss edge cases

### Option C: Audit Source Data

Contact SportsDataIO or retrieve raw API responses to understand actual data format:

**Questions to answer:**
1. Does `Rounds[].Score` always represent total strokes for that round?
2. Are all tournaments in the same format (18 holes)?
3. Is the `Holes` array always populated?
4. What does a score of 32-37 mean in 9-hole tournaments?

## Recommended Action

**IMMEDIATE:** Use Option A (Holes array) as it's the most reliable source of truth.

**IF Holes unavailable:** Fall back to Option B with documentation of limitations.

**VALIDATION:**
- Round averages should be: 66-75 strokes for 18-hole, 33-37 strokes for 9-hole
- toPar should be reasonable: -15 to +15 for competitive tournaments
- No scores < 50 or > 110 for 18-hole tournaments without verification

## Database Fix

Once correct calculation is implemented, backfill existing data:

```sql
-- Backup existing data
CREATE TABLE player_rounds_scores_backup AS SELECT * FROM player_rounds;

-- Clear incorrect scores
UPDATE player_rounds SET score = NULL, "toPar" = NULL 
WHERE score < 50 OR score > 110;

-- Re-run import with corrected mapper
```

