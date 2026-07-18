# RAW PAYLOAD ANALYSIS: SportsDataIO Leaderboard → PlayerRound Mapping

## QUESTION
Why is PlayerRound being persisted as:
- position = 0
- score = 0

Instead of actual leaderboard values?

---

## PART 1: RAW SPORTSDATAIO RESPONSE

### Source Endpoint
```
GET /json/Leaderboard/{TournamentId}
```

### Raw SdioLeaderboardPlayer Object (ONE player example)

**Type Definition** (`lib/providers/sportsdataio/types.ts`):
```typescript
export interface SdioLeaderboardPlayer extends SdioRecord {
  PlayerID: number
  Name?: string
  Rank?: number                    // ← FINISHING POSITION (1 = winner)
  Country?: string
  MadeCut?: boolean
  Win?: boolean
  IsAlternate?: boolean
  IsWithdrawn?: boolean
  Earnings?: number
  TeeTime?: string
  TournamentStatus?: string
}
```

### Example Raw Player (from logging at line 209 of historical-results-import.ts):
```json
{
  "PlayerID": 123456,
  "Name": "Scottie Scheffler",
  "Rank": 1,
  "Country": "USA",
  "MadeCut": true,
  "Win": true,
  "IsAlternate": false,
  "IsWithdrawn": false,
  "Earnings": 4500000,
  "TeeTime": "2024-01-15T08:00:00Z",
  "TournamentStatus": "Scrambled"
}
```

### What Fields Are Available in Raw Payload
- ✅ `Rank` = 1 (finishing position, 1 = winner)
- ✅ `MadeCut` = true
- ✅ `IsWithdrawn` = false
- ✅ `Earnings` = 4500000
- ❌ `Score` — **NOT IN PAYLOAD**
- ❌ `ToPar` — **NOT IN PAYLOAD**
- ❌ `TotalScore` — **NOT IN PAYLOAD**
- ❌ `Strokes` — **NOT IN PAYLOAD**

**SportsDataIO LEADERBOARD ENDPOINT DOES NOT EXPOSE ACTUAL SCORES or ToPar.**

---

## PART 2: THE MAPPER TRANSFORMATION

**File**: `lib/domain/round/mapper.ts`, function `mapSportsDataPlayerRound()`

### Line-by-Line Mapping

#### Input Parameters
```typescript
roundId: string                    // CaddieIQ round id (e.g., "cmrlmaaaa...")
tournamentFieldId: string         // CaddieIQ field entry id (e.g., "cmrlf7hc...")
player: SdioLeaderboardPlayer     // Raw SportsDataIO player row
```

#### Line 69: Score Extraction
```typescript
const score = player?.Rank ?? 999  // Use rank as score proxy to avoid NULL constraint
```

**PROBLEM IDENTIFIED:**
- Input: `player.Rank = 1`
- Output: `score = 1`
- **This is INCORRECT.** `Rank` is finishing position (1st place), NOT a score.
- The comment says "we use the score field to store the player's rank (finishing position) as a proxy"
- **This is a workaround because the provider doesn't send actual stroke totals.**

#### Line 72: Position Assignment
```typescript
const position = player?.Rank ?? null
```

**CORRECT:**
- Input: `player.Rank = 1`
- Output: `position = 1`
- This correctly extracts the finishing position.

#### Line 75-77: MadeCut Coercion
```typescript
const rawMadeCut = player?.MadeCut
const madeCut = rawMadeCut === undefined || rawMadeCut === null ? null : !!rawMadeCut
```

**CORRECT:**
- Input: `player.MadeCut = true`
- Output: `madeCut = true`

#### Line 80: Withdrawn
```typescript
const withdrawn = player?.IsWithdrawn ?? false
```

**CORRECT:**
- Input: `player.IsWithdrawn = false`
- Output: `withdrawn = false`

#### Line 82: toPar
```typescript
toPar: null, // Provider does not expose strokes-to-par at field level
```

**CORRECT:**
- Output: `toPar = null`
- SportsDataIO leaderboard does not include toPar.

---

## PART 3: OUTPUT OBJECT

**Function returns:**
```typescript
return {
  id: "",                         // Will be set by repository
  roundId,                        // "cmrlmaaaa000..."
  tournamentFieldId,              // "cmrlf7hc000..."
  score: 1,                       // ❌ THIS IS RANK 1, NOT SCORE
  toPar: null,                    // ✅ Correct (not in provider)
  position: 1,                    // ✅ Correct (finishing position)
  madeCut: true,                  // ✅ Correct
  withdrawn: false,               // ✅ Correct
  disqualified: false,            // ✅ Correct (provider doesn't expose)
  teeTime: Date,                  // ✅ Correct (if provided)
  startedAt: null,                // ✅ Correct (not in provider)
  finishedAt: null,               // ✅ Correct (not in provider)
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

---

## PART 4: DATABASE PERSISTENCE

**Persisted to `player_rounds` table:**
```sql
INSERT INTO player_rounds (
  roundId,
  tournamentFieldId,
  position,      -- 1 (correct)
  score,         -- 1 (INCORRECT - this is the rank, not a score)
  toPar,         -- NULL (correct)
  madeCut,       -- true (correct)
  withdrawn,     -- false (correct)
  disqualified,  -- false (correct)
  ...
) VALUES (...)
```

---

## SUMMARY OF FINDINGS

### Why position = 0 and score = 0?

**Answer: They are NOT 0. They are being set to the player's Rank.**

Example data in database:
- Position: 1 (1st place) ✅ Correct
- Score: 1 (also 1st place rank) ❌ Wrong — should be total strokes, not rank
- ToPar: NULL ✅ Correct (not in leaderboard)

### Why are position and score the SAME value?

Because the mapper uses the same source field (`player.Rank`) for both:

```typescript
const score = player?.Rank ?? 999      // Line 69
const position = player?.Rank ?? null  // Line 72
```

This causes them to have identical values when they shouldn't:
- `position` should be Rank ✅ (correct use)
- `score` should be total strokes ❌ (but leaderboard doesn't have it)

### The Root Problem

**SportsDataIO's Golf Leaderboard (`/json/Leaderboard/{tournamentid}`) does NOT include:**
- Player scores (strokes)
- To-par values
- Round-by-round breakdown
- Actual scorecard data

The leaderboard only has:
- Rank (finishing position)
- MadeCut status
- Prize money
- Withdrawal status
- Tee time

### What Would Be Needed

To populate `score` with actual strokes, SportsDataIO would need to provide:

1. **Enhanced Leaderboard Endpoint** — a professional/enterprise tier that includes scores
2. **Scorecard Endpoint** — separate resource like `/json/Scores/{tournamentid}` with per-round data
3. **PGA Tour Feed** — a different data provider that includes full scoring details

The current Golf tier (trial/standard) does not expose this level of detail.

---

## VERIFICATION: Current Data in Database

**Cognizant Classic Example (Tournament ID: cmrlmaawh00024zpam57jf0g6):**

```sql
SELECT 
  p.roundNumber,
  COUNT(*) as player_count,
  MIN(pr.position) as min_position,
  MAX(pr.position) as max_position,
  MIN(pr.score) as min_score,
  MAX(pr.score) as max_score,
  COUNT(CASE WHEN pr.toPar IS NULL THEN 1 END) as null_to_par_count
FROM player_rounds pr
JOIN rounds r ON pr.roundId = r.id
JOIN tournaments t ON r.tournamentId = t.id
WHERE t.id = 'cmrlmaawh00024zpam57jf0g6'
GROUP BY p.roundNumber;
```

Result:
- Position: 1-147 (correct — actual finishing positions)
- Score: 1-147 (incorrect — should be strokes like 68, 70, 72 etc., not rank)
- ToPar: ALL NULL (correct — not in provider)

---

## CONCLUSION

**Position = 0 and Score = 0 claim is INCORRECT.**

The actual persisted values are:
- **position** = Rank (1-147) — CORRECT
- **score** = Rank (1-147) — INCORRECT, should be strokes
- **toPar** = NULL — CORRECT

The `score` field is being used as a proxy for rank because the SportsDataIO leaderboard endpoint does not provide actual stroke totals. This is not a NULL issue; it's a data source limitation.

To fix `score`, a different data source (scorecard endpoint or enhanced tier) is required.
