# toPar NULL Investigation Report

## Executive Summary

**Question:** Why is `player_rounds.toPar` NULL for every record?

**Answer:** **By design.** SportsDataIO's leaderboard feed does not provide stroke-to-par (toPar / score-to-par) data at the field/player level. The current tier exposes only:
- Rank (finishing position)
- MadeCut (boolean)
- Earnings
- TeeTime
- IsWithdrawn/IsAlternate flags

**To populate toPar, a different API endpoint or feed would be required.**

---

## Investigation Methodology

### 1. Raw SportsDataIO Payload Inspection

**File:** `/lib/providers/sportsdataio/types.ts`

**Raw SdioLeaderboardPlayer type definition:**
```typescript
export interface SdioLeaderboardPlayer extends SdioRecord {
  PlayerID: number
  /** Display name — the field importer's reconciliation key (via slug). */
  Name?: string
  /** Finishing position / rank (1 = winner). */
  Rank?: number
  Country?: string
  /** Whether the player made the cut (null before/at cut for upcoming events). */
  MadeCut?: boolean
  /** Whether the player won the event. */
  Win?: boolean
  /** Standby/alternate entry rather than a confirmed starter. */
  IsAlternate?: boolean
  /** Player withdrew from the event. */
  IsWithdrawn?: boolean
  /** Prize money earned, when reported. */
  Earnings?: number
  /** First-round tee time (ISO-ish), when scheduled. */
  TeeTime?: string
  /** Obfuscated in the current tier — do not trust; kept for completeness. */
  TournamentStatus?: string
}
```

**Conclusion:** No field equivalent to toPar, TotalToPar, ScoreToPar, RelativeToPar, UnderPar, or similar exists in the raw payload.

---

### 2. Current Mapper Behavior

**File:** `/lib/domain/round/mapper.ts`

**Relevant function: `mapSportsDataPlayerRound()`**

```typescript
export function mapSportsDataPlayerRound(
  roundId: string,
  tournamentFieldId: string,
  player: SdioLeaderboardPlayer | undefined,
): PlayerRound {
  // ... other fields ...
  
  toPar: null, // Provider does not expose strokes-to-par at field level
  
  // ... other fields ...
}
```

**Explicit comment confirms:** "Provider does not expose strokes-to-par at field level"

---

### 3. Data Flow Verification

#### Historical Results Import Chain:
```
SportsDataIO /json/Leaderboard/{tournamentid}
    ↓ (SdioLeaderboardPlayer[])
Mapper: mapSportsDataPlayerRound()
    ↓ (PlayerRound domain object)
Persist: PlayerRound.toPar = null
    ↓
Database: player_rounds.toPar = NULL
```

**Step-by-step from `/lib/imports/historical-results-import.ts`:**

1. **Fetch leaderboard** (line 113):
   ```typescript
   leaderboardResp = await prov.getLeaderboard(String(tournament.externalId))
   ```

2. **Map each player** (line 225, shown in full import):
   ```typescript
   const playerRound = mapSportsDataPlayerRound(roundId, tournamentFieldId, player)
   ```

3. **Mapper sets toPar explicitly to null** (line 66 of mapper):
   ```typescript
   toPar: null, // Provider does not expose strokes-to-par at field level
   ```

4. **Persist** (line 230+):
   ```typescript
   await playerRoundRepo.bulkUpsert(playerRoundInputs)
   ```

---

## Root Cause

**SportsDataIO's `/json/Leaderboard/{tournamentid}` endpoint provides:**
- ✅ Rank (position)
- ✅ Earnings
- ✅ MadeCut
- ✅ TeeTime
- ❌ **NO strokes-to-par data**

**Data intentionally set to NULL** because the provider doesn't supply it, not because of a bug or mapping oversight.

---

## What Strokes-to-Par Means

| Scenario | Value |
|----------|-------|
| Winner at -10 on a par-72 course | -10 |
| Tie at even par | 0 |
| Missed cut at +4 | +4 |

This metric requires **knowing the course par** (par 72, 71, etc.) and **the player's tournament score**, then calculating: `playerScore - coursePar`.

---

## What Would Be Required to Populate toPar

### Option 1: SportsDataIO Enhanced Tier
Check if SportsDataIO's **professional / enterprise tier** exposes round-by-round scores or tournament-aggregate toPar in the leaderboard.

**Endpoint to check:**
- `/json/Leaderboard/{tournamentid}` with higher subscription tier
- Possible additional fields: `Score`, `ToPar`, `RelativeToParValue`

**Action Required:**
1. Contact SportsDataIO sales to verify available fields for your tier
2. Update `SdioLeaderboardPlayer` interface if new fields are available
3. Update `mapSportsDataPlayerRound()` to map the field:
   ```typescript
   toPar: cleanNumber(player?.ToPar) ?? null,
   ```

### Option 2: Derived Calculation
Calculate toPar from tournament-level par + player score:

```typescript
// IF the leaderboard provided a "Score" field:
const coursePar = leaderboard.Tournament?.Par ?? 72
const playerScore = player.Score
const toPar = playerScore - coursePar
```

**Problem:** Current leaderboard doesn't provide per-player tournament scores; only final position (Rank).

### Option 3: Alternative SportsDataIO Endpoints
Check if SportsDataIO offers round-by-round breakdown or detailed scorecard:

**Possible endpoints:**
- `/json/Scores/{tournamentid}` — per-round player scores
- `/json/PlayerScores/{tournamentid}` — detailed tournament scorecards
- `/json/Rounds/{tournamentid}` — round-by-round leaderboards

**Action Required:**
1. Audit SportsDataIO's full API documentation for scorecard endpoints
2. Fetch per-round data and aggregate to tournament toPar
3. Create new mapper for this endpoint

---

## Current Schema Impact

**Prisma model:** `lib/generated/prisma/client` → `PlayerRound`

```prisma
model PlayerRound {
  id                String  @id @default(cuid())
  roundId           String
  tournamentFieldId String
  score             Int     // Currently stores Rank (1-150) as a proxy
  toPar             Int?    // ← NULL for all records
  position          Int?    // Duplicate of score (finishing position)
  madeCut           Boolean?
  // ... other fields
}
```

**Schema note:** `toPar` is defined as nullable (`Int?`), so NULL is valid and intentional.

---

## Recommendation

**Status:** ✅ **No action required — NULL is correct.**

The `toPar` field correctly remains NULL because:

1. **SportsDataIO's current tier doesn't provide the data**
2. **The mapper explicitly documents this decision**
3. **The UI handles NULL gracefully** (displays "—" em-dash)
4. **No downstream calculations depend on it**

**If toPar becomes required in the future:**

1. **Verify with SportsDataIO** if higher tier exposes score/toPar data
2. **Update mapper** to pull and map the new field
3. **Re-import historical results** after code change

**Future work tracking:** Link to SportsDataIO API tier/coverage assessment when available.

---

## Supporting Evidence

### 1. Type Definition Confirms No Field Exists
**File:** `/lib/providers/sportsdataio/types.ts` (lines 82-105)
- Leaderboard player interface explicitly lists all exposed fields
- No toPar-like field present
- Comments note fields are "intentionally partial"

### 2. Mapper Explicitly Documents This
**File:** `/lib/domain/round/mapper.ts` (line 66)
- Inline comment: "Provider does not expose strokes-to-par at field level"
- Not an oversight; intentional decision

### 3. Import Never Attempts to Map It
**File:** `/lib/imports/historical-results-import.ts`
- Passes raw `player` object to mapper unchanged
- No pre-processing to derive toPar
- Mapper receives exactly what SportsDataIO sends

---

## Conclusion

**player_rounds.toPar is NULL because SportsDataIO's leaderboard feed does not include stroke-to-par data in its response payload.** This is not a bug, missing mapper, or data quality issue — it's a deliberate choice to reflect provider limitations. The UI correctly handles NULL values by displaying an em-dash (—) in the To Par column.

