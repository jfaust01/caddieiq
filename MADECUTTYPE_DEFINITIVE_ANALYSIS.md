# SportsDataIO MadeCut Field - Definitive Type Analysis

**Executed:** 2026-07-17  
**Tournament:** Cadillac Championship (74 players)  
**Data Quality:** DEFINITIVE - All 74 players analyzed  

---

## Raw SportsDataIO Response - First 10 Players

| # | PlayerID | Name | MadeCut | typeof | Constructor | Truthiness |
|---|----------|------|---------|--------|-------------|-----------|
| 1 | 40003609 | Cameron Young | 1.1 | number | Number | truthy |
| 2 | 40001274 | Scottie Scheffler | 1.1 | number | Number | truthy |
| 3 | 40002343 | Ben Griffin | 1.1 | number | Number | truthy |
| 4 | 40000764 | Si Woo Kim | 1.1 | number | Number | truthy |
| 5 | 40000010 | Adam Scott | 1.1 | number | Number | truthy |
| 6 | 40002785 | Sepp Straka | 1.1 | number | Number | truthy |
| 7 | 40001064 | Alexander Noren | 1.1 | number | Number | truthy |
| 8 | 40002645 | Alex Smalley | 1.1 | number | Number | truthy |
| 9 | 40000003 | Rickie Fowler | 1.1 | number | Number | truthy |
| 10 | 40002249 | Kurt Kitayama | 1.1 | number | Number | truthy |

---

## Complete MadeCut Type Analysis (All 74 Players)

**Unique Types:** Only `number` (NO boolean, NO string, NO null)

**Value Distribution:**
```
number:1.1  → 72 players (97.3%)
number:0    → 2 players  (2.7%)
```

**Conclusion:** MadeCut is CONSISTENTLY a `number` type with two distinct values:
- `1.1` = Player made the cut (truthy number)
- `0` = Player missed the cut (falsy number)

---

## What This Means

### Current Type Definition (WRONG)
```typescript
// lib/providers/sportsdataio/types.ts
export interface SdioLeaderboardPlayer extends SdioRecord {
  MadeCut?: boolean
  //    ^^^^^ WRONG - API returns number, not boolean!
}
```

### Actual API Response (CONFIRMED)
```json
{
  "MadeCut": 1.1,    // NUMBER (float), not boolean
  "MadeCut": 0       // NUMBER (integer), not boolean
}
```

### Current Mapper Implementation
```typescript
// lib/domain/round/mapper.ts (BEFORE FIX)
const madeCut = player?.MadeCut ?? null
// Returns: 1.1 (number) → Prisma REJECTS
```

### Fixed Mapper Implementation
```typescript
// lib/domain/round/mapper.ts (AFTER FIX)
const rawMadeCut = player?.MadeCut
const madeCut = rawMadeCut === undefined || rawMadeCut === null ? null : !!rawMadeCut
// Coerces: 1.1 → true, 0 → false, null → null → Prisma ACCEPTS
```

---

## Verification: Does the Fix Handle All Cases?

✅ **YES - The fix handles all documented cases:**

| Input | Output | Type | Valid |
|-------|--------|------|-------|
| `1.1` (made cut) | `true` | `boolean` | ✅ |
| `0` (missed cut) | `false` | `boolean` | ✅ |
| `null` | `null` | `null` | ✅ |
| `undefined` | `null` | `null` | ✅ |

### How the Fix Works

```typescript
const rawMadeCut = player?.MadeCut  // Could be: 1.1, 0, undefined, null
const madeCut = 
  rawMadeCut === undefined || rawMadeCut === null 
    ? null                          // null/undefined → null
    : !!rawMadeCut                  // 1.1 → true, 0 → false
```

The `!!` (double NOT) operator:
- Converts any truthy value to `true` (e.g., `!!1.1 = true`)
- Converts any falsy value to `false` (e.g., `!!0 = false`)
- Preserves the explicit null check above

---

## Semantic Meaning

**What does MadeCut represent?**

In golf tournaments with cuts:
- Players who score well "make the cut" (continue to final rounds)
- Players who score poorly "miss the cut" (eliminated)

**SportsDataIO Encoding:**
- `1.1` = Made cut (likely represents position in field relative to cut line)
- `0` = Missed cut (explicit zero)

**Our Mapping:**
- `true` = Made cut (matches Prisma boolean requirement)
- `false` = Missed cut (matches Prisma boolean requirement)
- `null` = Unknown/N/A (preserved for edge cases)

---

## Type Definition Update Recommendation

To fix the TypeScript definition to match reality:

```typescript
// lib/providers/sportsdataio/types.ts
export interface SdioLeaderboardPlayer extends SdioRecord {
  // Update from: MadeCut?: boolean
  // To:
  MadeCut?: number  // API returns 1.1 (made cut) or 0 (missed cut)
}
```

However, the mapper fix is MORE IMPORTANT because it ensures Prisma compatibility regardless of the type definition.

---

## Summary

| Aspect | Finding |
|--------|---------|
| **Actual Type** | `number` (not boolean) |
| **Values Found** | 1.1 (made cut), 0 (missed cut) |
| **All 74 Players** | Consistent number type |
| **Type Mismatch** | YES - API returns number, Prisma expects boolean |
| **Fix Applied** | YES - Mapper coerces with `!!` operator |
| **Fix Handles All Cases** | YES - 1.1→true, 0→false, null→null |
| **Ready to Re-Import** | YES ✅ |

---

## Action Items

- [x] Identify exact MadeCut values from API
- [x] Confirm type consistency across all players
- [x] Verify mapper fix handles all cases
- [x] Document findings
- [ ] Re-run import after fix verification
- [ ] Verify all 74 players persist successfully
- [ ] Check database for ~2,590 total player records (35 tournaments × 74 average)

