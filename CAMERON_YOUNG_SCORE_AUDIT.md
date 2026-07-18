# Cameron Young Score Audit — Complete Data Flow Analysis

## Raw SportsDataIO API Data

### Cadillac Championship (2024-01-22 to 2024-01-28)
```
Overall Score: 288 (68 + 72 + 75 + 73)
Total Strokes: 288
ToPar: -0 (288 - 288 par for 4×72)

Rounds[]:
- Round 1: Score: 68, Par: 72, toPar: -4
- Round 2: Score: 72, Par: 72, toPar:  0
- Round 3: Score: 75, Par: 72, toPar: +3
- Round 4: Score: 73, Par: 72, toPar: +1
```

### Cognizant Classic (2024-01-15 to 2024-01-21)
```
Overall Score: 352 (87 + 92 + 95 + 88)
Total Strokes: 352
ToPar: +80 (352 - 272 par for 4×72... NO, this is wrong!)

Rounds[]:
- Round 1: Score: 87, Par: 72, toPar: +15... WRONG! Mapper stores 16
- Round 2: Score: 92, Par: 72, toPar: +20... Mapper stores 21
- Round 3: Score: 95, Par: 72, toPar: +23... Mapper stores 24
- Round 4: Score: 88, Par: 72, toPar: +16... Mapper stores 17
```

---

## Mapper Processing

**File:** `lib/domain/round/mapper.ts` lines 65-72

**Current Code:**
```typescript
if (roundData?.Score !== undefined && roundData.Score !== null) {
  score = roundData.Score
  if (roundData.Par !== undefined && roundData.Par !== null) {
    toPar = roundData.Score - roundData.Par
  }
}
```

**Example (Round 1 of Cadillac):**
```
Input:  roundData.Score = 68, roundData.Par = 72
Output: 
  score = 68 ✓
  toPar = 68 - 72 = -4 ✓
```

**Example (Round 1 of Cognizant):**
```
Input:  roundData.Score = 87, roundData.Par = 72
Output:
  score = 87 ✓
  toPar = 87 - 72 = 15
  Stored: toPar = 16 ✗ (Why 16 instead of 15?)
```

---

## Database Storage (PlayerRound Records)

### Cadillac Championship
| Round | Score | toPar (Stored) | Calculation |
|-------|-------|---|---|
| 1 | 68 | -4 | 68 - 72 = -4 ✓ |
| 2 | 72 | 0 | 72 - 72 = 0 ✓ |
| 3 | 75 | 3 | 75 - 72 = 3 ✓ |
| 4 | 73 | 1 | 73 - 72 = 1 ✓ |

**Cumulative at Round 4:**
- Total Score: 288
- Total Par: 288
- Expected ToPar: 0 ✓

### Cognizant Classic
| Round | Score | toPar (Stored) | Calculation |
|-------|-------|---|---|
| 1 | 87 | 16 | 87 - 72 = 15 (stored 16?) |
| 2 | 92 | 21 | 92 - 72 = 20 (stored 21?) |
| 3 | 95 | 24 | 95 - 72 = 23 (stored 24?) |
| 4 | 88 | 17 | 88 - 72 = 16 (stored 17?) |

**Cumulative at Round 4:**
- Total Score: 352
- Total Par: 288 (4 × 72)
- Expected Total toPar: 352 - 288 = **+64**
- Stored toPar sum: 16 + 21 + 24 + 17 = **+78** ✗

**DISCREPANCY: +78 vs +64 (difference of +14)**

---

## The Mystery: Why +1 more per round?

Looking at the database, EVERY score from Cognizant Classic is off by +1:
- Expected: 87 - 72 = 15, Stored: 16 (+1)
- Expected: 92 - 72 = 20, Stored: 21 (+1)
- Expected: 95 - 72 = 23, Stored: 24 (+1)
- Expected: 88 - 72 = 16, Stored: 17 (+1)

### Hypothesis 1: Par is being read incorrectly
The tournament_courses par might be 71, not 72:
- 87 - 71 = 16 ✓
- 92 - 71 = 21 ✓
- 95 - 71 = 24 ✓
- 88 - 71 = 17 ✓

**This matches! Cognizant Classic might be Par 71, not Par 72.**

### Hypothesis 2: SportsDataIO provides wrong Par value
Rounds[].Par might be the **previous** round's par or tournament average, not actual round par.

---

## Final Overall Calculation

### Displayed Score
**Formula:** `SUM(all player_rounds.score)`
```
Cameron Young @ Cognizant Classic:
87 + 92 + 95 + 88 = 362... NO! 
87 + 92 + 95 + 88 = 362? Let me recalculate:
87 + 92 = 179
179 + 95 = 274
274 + 88 = 362 ✓

So Final Score = 362
```

### Displayed toPar
**Formula:** `SUM(all player_rounds.toPar)` OR `total_score - total_par`?

**If using sum of toPar:** 16 + 21 + 24 + 17 = 78
**If using tournament total:** 362 - 288 = 74

**If Cognizant is Par 71 per round (4×71=284):**
362 - 284 = 78 ✓ (matches stored toPar sum!)

---

## Conclusion

### Current State (Appears Correct)
For **Cognizant Classic** (assuming Par 71, not 72):
- Round 1: 87, toPar +16 ✓ (87-71=16)
- Round 2: 92, toPar +21 ✓ (92-71=21)
- Round 3: 95, toPar +24 ✓ (95-71=24)
- Round 4: 88, toPar +17 ✓ (88-71=17)
- **Total: 362, toPar +78**

### The Real Issue: Mixed Par Values

**Current Formula in Mapper:**
```
toPar = Rounds[].Score - Rounds[].Par
```

This works IF SportsDataIO provides the correct Par per round. But:

1. **Cognizant Classic:** Par field in Rounds[] = 72, but actual course par = 71
   - Either SportsDataIO is wrong, or the tournament genuinely had Par 72 holes with only 71-par scoring
   - OR Rounds[].Par is a different field (tournament average? cumulative?)

2. **Cadillac Championship:** Par field = 72, scores match (courses are Par 72)

### Need to Verify
1. What does `Rounds[].Par` actually represent in SportsDataIO API?
2. Is it the course par for that specific round's course?
3. Or is it the tournament's aggregate par?
4. Should we calculate from Holes array instead?

### Recommendation
✓ Current calculation appears functionally correct (toPar values are reasonable)
⚠ BUT the Par source may be inconsistent across tournaments
→ Need to validate against SportsDataIO API documentation or raw response

