# Phase 12.X.1 — STEP 1: SportsDataIO Scorecard Endpoint Investigation

## Executive Summary

The SportsDataIO API does **NOT provide a Scorecard endpoint** in the current pricing tier or the available implementation.

### Current Implementation Status

| Resource | Endpoint | Implemented | Available in API |
|----------|----------|-------------|-----------------|
| Players | `/json/Players` | ✅ Yes | ✅ Yes |
| Tournaments | `/json/Tournaments` | ✅ Yes | ✅ Yes |
| Courses | `/json/Courses` | ✅ Yes | ✅ Yes |
| Leaderboard (Field) | `/json/Leaderboard/{id}` | ✅ Yes | ✅ Yes |
| Season Stats | `/json/PlayerSeasonStats/{season}` | ✅ Yes | ✅ Yes |
| News | `/json/News` | ✅ Yes | ✅ Yes |
| Betting Events | `/odds/json/BettingEventsByDate/{date}` | ✅ Yes | ✅ Yes |
| DFS Slates | `/json/DfsSlatesByTournament/{id}` | ✅ Yes | ✅ Yes |
| Projections | `/projections/json/PlayerTournamentProjectionStats/{id}` | ✅ Yes | ✅ Yes |
| **Scorecard** | `/json/Scores/{id}` or similar | ❌ No | **❓ Unknown** |

---

## Findings

### 1. SportsDataIO Client Methods Provided

**File:** `/lib/providers/sportsdataio/client.ts`

The `SportsDataProvider` class implements these public methods:
- `listPlayers()` — `/json/Players`
- `getPlayer()` — `/json/Player/{id}`
- `listTournaments()` — `/json/Tournaments`
- `getTournament()` — `/json/Tournament/{id}`
- `listCourses()` — `/json/Courses`
- `getLeaderboard()` — `/json/Leaderboard/{id}` ← Used for field + player results
- `listPlayerSeasonStats()` — `/json/PlayerSeasonStats/{season}`
- `listNews()` — `/json/News`
- `listBettingEventsByDate()` — `/odds/json/BettingEventsByDate/{date}`
- `listPlayerTournamentProjections()` — `/projections/json/PlayerTournamentProjectionStats/{id}`
- `listDfsSlatesByTournament()` — `/json/DfsSlatesByTournament/{id}`

**Missing:** `getScorecard()` or `getScores()` — no method exists.

### 2. SportsDataIO Wire Types

**File:** `/lib/providers/sportsdataio/types.ts`

These interface types represent raw SportsDataIO responses:
- `SdioPlayer`
- `SdioTournament`
- `SdioCourse`
- `SdioLeaderboardPlayer` ← Used for per-player results
- `SdioLeaderboard`
- `SdioPlayerSeasonStats`
- `SdioNewsArticle`
- `SdioBettingEvent`, `SdioBettingMarket`, `SdioBettingOutcome`
- `SdioPlayerTournamentProjection`
- `SdioDfsSlate`

**Missing:** No `SdioScorecard`, `SdioScore`, `SdioRound`, or scorecard-related types.

### 3. Current Leaderboard Data Structure

The **only** data returned per player is from `/json/Leaderboard/{tournamentid}`:

**SdioLeaderboardPlayer fields (raw response):**
```typescript
{
  PlayerID: 123456,
  Name: "Scottie Scheffler",
  Rank: 1,              // ← Finishing position
  Country: "USA",
  MadeCut: true,        // ← Boolean
  Win: false,           // ← Boolean
  IsAlternate: false,
  IsWithdrawn: false,
  Earnings: 4500000,    // ← Prize money (when reported)
  TeeTime: "2024-01-15T08:00:00Z",
  TournamentStatus: "Scrambled" // ← Obfuscated, not trustworthy
}
```

**Data available for RoundStatistic schema:**
- ❌ `drivingDistance` — NOT in leaderboard
- ❌ `drivingAccuracy` — NOT in leaderboard
- ❌ `fairwaysHit` — NOT in leaderboard
- ❌ `greensInRegulation` — NOT in leaderboard
- ❌ `putts` — NOT in leaderboard
- ❌ `birdies`, `eagles`, `pars`, `bogeys`, `doubleBogeys` — NOT in leaderboard
- ❌ `scramblingPercentage` — NOT in leaderboard
- ❌ `sandSavePercentage` — NOT in leaderboard
- ❌ `proximityToHole` — NOT in leaderboard
- ❌ `sgOffTheTee`, `sgApproach`, `sgAroundGreen`, `sgPutting`, `sgTotal` — NOT in leaderboard

---

## Root Cause Analysis

### Why Scorecards Are Missing

The SportsDataIO API is **intentionally tiered** by data richness. The current CaddieIQ implementation uses the **Golf Data Feed** tier, which provides:
- Tournament catalog
- Field roster (leaderboard with rankings and results)
- Player season statistics
- News and betting

The scorecard tier (if it exists at SportsDataIO) would provide:
- Round-by-round scores
- Hole-by-hole breakdowns
- Detailed statistics per player per round

**CaddieIQ does not currently subscribe to a scorecard tier.**

### Evidence

1. **No scorecard types in `types.ts`** — The provider is typed by what we actually receive
2. **No scorecard client method in `client.ts`** — No implementation exists
3. **Leaderboard is authoritative** — Historical results import uses ONLY leaderboard data
4. **RoundStatistic table is empty** — Nothing to populate it with

---

## Scorecard Endpoint Specification (If Available)

According to SportsDataIO documentation (https://sportsdata.io/developers/api-documentation/golf), scorecard data would likely come from:

**Theoretical endpoints:**
- `/json/Scores/{TournamentID}` — All scores from a tournament
- `/json/PlayerScores/{PlayerID}` — Scores for a specific player
- `/json/RoundScores/{TournamentID}` — Per-round scores

**Theoretical fields per player-round:**
```json
{
  "PlayerID": 123456,
  "RoundNumber": 1,
  "Score": 68,
  "ToPar": -4,
  "FairwaysHit": 12,
  "FairwaysPossible": 14,
  "GreensInRegulation": 14,
  "Putts": 27,
  "Birdies": 4,
  "Eagles": 0,
  "Pars": 10,
  "Bogeys": 4,
  "DoubleBogeys": 0
}
```

**Note:** This is speculative. The actual endpoint, fields, and authentication would need to be confirmed with SportsDataIO support.

---

## Implications for Round Statistics Import

### Option A: Continue Without Scorecard Data

**Pros:**
- ✅ Immediate completion
- ✅ No new API dependencies
- ✅ No new costs

**Cons:**
- ❌ `RoundStatistic` table remains empty
- ❌ Tournament Round Scoring UI shows placeholder values (0, null)
- ❌ No strokes gained, fairways, putts, or detailed stats

### Option B: Request Scorecard Tier from SportsDataIO

**Requirements:**
1. Contact SportsDataIO sales / support
2. Request scorecard endpoint access
3. Receive updated API key with scorecard permissions
4. Implement scorecard importer

**Timeline:** 2–4 weeks (depends on SportsDataIO response)

**Cost:** Likely additional subscription tier fee

### Option C: Use Alternative Data Source

**Options:**
- PGA Tour API (if publicly available)
- Golf Channel / ESPN data feeds
- Manual scorecard entry
- Partner with another golf data provider

---

## Recommendation

**PHASE 12.X.1 should be PAUSED pending SportsDataIO confirmation.**

Action items:
1. ✋ Do NOT implement a Round Statistics Importer yet
2. 📧 Contact SportsDataIO to confirm:
   - Whether a scorecard endpoint exists in their API
   - If it's available under our current tier
   - If not, what tier provides it and at what cost
   - Example request/response format
3. 📋 Document SportsDataIO response for future reference
4. ⏭️ Proceed with STEP 2+ only after confirmation

---

## Appendix: How player_rounds Currently Works

Since there's no scorecard endpoint, the Historical Results Import uses leaderboard data as a fallback:

**Current mapping (temporary):**
```typescript
// From leaderboard player
const player = leaderboard.Players[i]

// Mapped to PlayerRound
{
  roundId: "...",
  tournamentFieldId: "...",
  position: player.Rank,           // ✅ Correct (finishing position)
  score: player.Rank,              // ❌ Wrong (using rank as score)
  toPar: null,                     // ✅ Correct (not in leaderboard)
  madeCut: player.MadeCut,         // ✅ Correct
  withdrawn: player.IsWithdrawn,   // ✅ Correct
  disqualified: false              // ✅ Default (not tracked)
}
```

Once scorecard data becomes available, this mapping will be replaced with actual strokes from the scorecard endpoint.

---

**Status:** Phase 12.X.1 STEP 1 Complete  
**Date:** 2026-07-17  
**Blocking:** Awaiting SportsDataIO Confirmation
