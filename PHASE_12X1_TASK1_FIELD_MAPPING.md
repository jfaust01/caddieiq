# PHASE 12.X.1 — TASK 1: Field Mapping Analysis

## Overview

This document maps every field available in the SportsDataIO Leaderboard response (`Players[].Rounds[]`) to our database schemas.

---

## Part A: PlayerRound Field Mapping

**Source:** `Players[].Rounds[]` (per-round leaderboard data)  
**Destination:** `player_rounds` table  
**Current Status:** Partially populated with incorrect values

### Mapping Table

| SportsDataIO Field | Current Mapping | Correct Mapping | Schema Field | Notes |
|--------------------|-----------------|-----------------|--------------|-------|
| `Number` | ❌ Not used | Ignored | — | Indicates round number (1, 2, 3, 4) but Leaderboard provides aggregate player tournament data, not per-round. Will need separate extraction. |
| `Score` | ❌ Not used (using Rank instead) | ✅ `score` | `player_rounds.score` | **CRITICAL FIX NEEDED**: Current code uses `Rank` (finishing position like 1, 2, 3) as score. Should use `Score` (actual strokes like 68, 70, 87). |
| `Par` | ❌ Not available | Available from Tournament | — | Course par for the round. Used to calculate toPar. |
| `ToPar` | ❌ Not calculated | 🟡 `toPar = Score - Par` | `player_rounds.toPar` | Must calculate: player's score minus course par. For example: 87 - 71 = +16. |
| `Day` | ❌ Not used | ✅ Informational | — | Round date. Could enhance with round scheduling info. |
| `Birdies` | ❌ Not used | 🟡 Statistical | — | Count of birdies in round. Belongs in RoundStatistic, not PlayerRound. |
| `Eagles` | ❌ Not used | 🟡 Statistical | — | Count of eagles. Belongs in RoundStatistic. |
| `Pars` | ❌ Not used | 🟡 Statistical | — | Count of pars. Belongs in RoundStatistic. |
| `Bogeys` | ❌ Not used | 🟡 Statistical | — | Count of bogeys. Belongs in RoundStatistic. |
| `DoubleBogeys` | ❌ Not used | 🟡 Statistical | — | Count of double bogeys. Belongs in RoundStatistic. |
| `TripleBogeys` | ❌ Not used | 🟡 Statistical | — | Count of triple+ bogeys. Belongs in RoundStatistic. |
| `HoleInOnes` | ❌ Not used | 🟡 Statistical | — | Count of aces. Belongs in RoundStatistic. |
| `DoubleEagles` | ❌ Not used | 🟡 Statistical | — | Count of double eagles. Belongs in RoundStatistic. |
| `BogeyFree` | ❌ Not used | ❌ Unsupported | — | Indicates if round was bogey-free. Not in schema. Recommend adding to RoundStatistic if useful. |
| `TeeTime` | ✅ Already mapped | ✅ `teeTime` | `player_rounds.teeTime` | Already correctly extracted from leaderboard. |
| `Holes[]` | ❌ Not used | 🟡 Detailed breakdown | — | 18-hole array with per-hole score, par, toPar. Recommend separate RoundHole table (TASK 4). |

---

## Part B: RoundStatistic Field Mapping

**Source:** `Players[].Rounds[]` (aggregated round stats)  
**Destination:** `round_statistics` table  
**Current Status:** Completely empty (0 records)

### Mapping Table

| SportsDataIO Field | Database Field | Type | Mapping | Notes |
|--------------------|----------------|------|---------|-------|
| `Score` | — | Int | ❌ Not applicable | This is the total strokes, not a statistic. Belongs in PlayerRound. |
| `Par` | — | Int | ❌ Not applicable | This is course par. Belongs in Round or could be stored here for reference. |
| `Birdies` | `birdies` | Int | ✅ Direct | Count of birdies in the round. Example: 2 |
| `Eagles` | `eagles` | Int | ✅ Direct | Count of eagles in the round. Example: 0 |
| `Pars` | `pars` | Int | ✅ Direct | Count of pars in the round. Example: 11 |
| `Bogeys` | `bogeys` | Int | ✅ Direct | Count of bogeys in the round. Example: 5 |
| `DoubleBogeys` | `doubleBogeys` | Int | ✅ Direct | Count of double bogeys. Example: 0 |
| `TripleBogeys` | — | Int | ❌ Unsupported | Triple+ bogey count. Not in schema. Recommend adding. |
| `HoleInOnes` | — | Int | ❌ Unsupported | Ace count. Not in schema. Recommend adding. |
| `DoubleEagles` | — | Int | ❌ Unsupported | Double eagle count. Not in schema. Recommend adding. |
| `WorseThanDoubleBogey` | — | Int | ❌ Unsupported | Scores worse than double bogey. Not in schema. Recommend adding. |
| `BogeyFree` | — | Boolean | ❌ Unsupported | Was the round bogey-free? Not in schema. Recommend adding. |
| `LongestBirdieOrBetterStreak` | — | Int | ❌ Unsupported | Longest consecutive streak of birdie-or-better. Not in schema. Recommend adding. |
| `BackNineStart` | — | Boolean | ❌ Unsupported | Did player start on back nine? Not in schema. Recommend for context. |
| `Holes[].ToPar` | — | Int | 🟡 Per-hole detail | Individual hole to-par values available. Requires separate table (see TASK 4). |
| All other SG metrics | `sgOffTheTee`, `sgApproach`, `sgAroundGreen`, `sgPutting`, `sgTotal` | Float | ❌ Not in SportsDataIO | Strokes gained metrics. Require alternative data source. Leave NULL. |
| Driving Distance/Accuracy | `drivingDistance`, `drivingAccuracy` | Float | ❌ Not in SportsDataIO | Require alternative source or calculation. Leave NULL. |
| GIR %, Scrambling % | `greensInRegulation`, `scramblingPercentage` | Int/Float | 🟡 Derivable | Can be calculated from Holes[] but requires complex logic. Leave NULL for now. |

---

## Part C: Round Field Mapping

**Source:** `Tournament` envelope + individual `Players[].Rounds[]`  
**Destination:** `rounds` table  
**Current Status:** Partially populated (35 records, but only aggregate info)

### Current Round Creation

The mapper currently creates only **ONE aggregate round per tournament** with:
- `roundNumber = 1`
- `scheduledDate = Tournament.StartDate`
- `status = COMPLETED`

### Issue with Current Approach

The SportsDataIO Leaderboard does NOT provide per-round breakdowns at the field level:
- We receive aggregate player tournament scores (Rank, MadeCut, Earnings)
- But we DO receive per-player, per-round detail in `Players[].Rounds[]`

**Solution:** Extract actual round numbers from `Players[].Rounds[].Number` and create separate Round records for rounds 1, 2, 3, 4 (depending on tournament completion status).

---

## Summary

### PlayerRound Corrections Needed ❌

1. **Fix `score` field**: Change from `Rank` to `Players[].Rounds[].Score`
   - **Current:** position=1 AND score=1 (wrong)
   - **Correct:** position=1 AND score=87 (actual strokes)

2. **Calculate `toPar`**: Add logic to compute `Score - Par`
   - **Formula:** `toPar = round.Score - round.Par`
   - **Example:** 87 - 71 = +16

### RoundStatistic Population ✅

1. **Direct mappings:** Birdies, Eagles, Pars, Bogeys, DoubleBogeys (5 fields)
2. **Calculated fields:** None (all straightforward from API)
3. **Unsupported fields:** Strokes Gained, Driving metrics, GIR %, Scrambling % (leave NULL)
4. **Schema gaps:** TripleBogeys, HoleInOnes, DoubleEagles, BogeyFree, Streaks (recommend additions)

### Round Structure Enhancement ✅

Create separate Round records for each actual round (1, 2, 3, 4) instead of one aggregate round per tournament.

---

## Next Steps

- **TASK 2:** Implement PlayerRound correction (score from Players[].Rounds[].Score)
- **TASK 3:** Populate RoundStatistic with available fields
- **TASK 4:** Analyze Holes[] structure and recommend schema approach
- **TASK 5:** Enhance importer for idempotency, transactions, batching
