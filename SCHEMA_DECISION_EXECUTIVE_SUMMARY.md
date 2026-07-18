# Schema Decision: One Round Per Tournament - Executive Summary

## The Question
Is the database model that creates **one Round per Tournament** intentional, or is it a bug?

## The Answer
**It is intentional**, but based on **incorrect assumptions** about the SportsDataIO API.

---

## Findings

### 1. The Design is Intentional
The schema explicitly supports 1-4 rounds:
```sql
@@unique([tournamentId, roundNumber])  -- Allows roundNumber 1, 2, 3, 4
```

The importer comment says:
> "Creates a single aggregate round for the entire tournament, since the provider does not expose per-round data."

**This assumption is WRONG.** SportsDataIO DOES provide per-round data in the Leaderboard endpoint at `Players[].Rounds[]`.

### 2. The Schema Supports Multi-Round Correctly
✓ Rounds table is designed correctly
✓ PlayerRounds table is designed correctly
✓ RoundStatistics table is designed correctly
✓ No schema migration needed

### 3. The Importer Creates Only One Round
Currently creates `roundNumber=1` for every tournament, regardless of actual rounds.

### 4. Data is Available But Unused
Raw API includes all 4 rounds with individual scores, but importer only uses the first round.

---

## Current Problems This Causes

1. **PlayerRound.score is wrong**
   - Contains Round 1 score (87) instead of aggregated tournament score
   - Can't show score progression (87 → 74 → 69 → 68)

2. **RoundStatistics never populated**
   - Importer tries to link to non-existent multi-round PlayerRounds
   - Query finds 0 matching records, upsert skipped

3. **Lost data**
   - Individual round birdies, bogeys, par info lost
   - Round-by-round analytics impossible

---

## The Migration

### What Changes
- Importer now creates 4 Round records per tournament (not 1)
- Importer now creates 4 PlayerRounds per player (not 1)
- RoundStatistics populated (one per player per round)

### What Stays the Same
- Schema (no migrations needed)
- UI/services layer (queries unchanged)
- API contracts (backward compatible)

### Code Changes
**One file:** `lib/imports/historical-results-import.ts`
**Impact:** ~50 lines modified

### Data Growth
- Rounds: 1 per tournament → 1-4 per tournament
- PlayerRounds: 147 per tournament → 588 per tournament
- RoundStatistics: 0 → 588 per tournament

### Risk
**Very Low** because:
- Schema already supports this
- No breaking changes
- Fully reversible
- Zero schema migrations

---

## Recommendation

**Proceed with migration to multi-round support** because:

1. ✓ Schema already supports it (no DB migration)
2. ✓ Data is available (wasting SportsDataIO data)
3. ✓ Fixes multiple issues with one change
4. ✓ Minimal code change (one file)
5. ✓ No breaking changes
6. ✓ Enables future features (round-by-round leaderboard, etc.)

---

## Documentation

Full analysis and implementation plan in:
- `DATABASE_MODEL_ANALYSIS.md` — Complete findings with evidence
- `MIGRATION_IMPLEMENTATION_PLAN.md` — Step-by-step implementation checklist

