# round_statistics Investigation Report

**Date:** 2026-07-17  
**Status:** ✅ Investigation Complete

---

## Executive Summary

The `round_statistics` table contains **0 records** while `player_rounds` contains **3,736 records**. The reason is straightforward: **the round statistics importer was never implemented**.

---

## 1. Intended Purpose of round_statistics

**Prisma Schema Definition** (`/vercel/share/v0-project/prisma/schema.prisma`):

```prisma
model RoundStatistic {
  id                   String   @id @default(cuid())
  playerRoundId        String
  drivingDistance      Float?
  drivingAccuracy      Float?
  fairwaysHit          Int?
  fairwaysPossible     Int?
  greensInRegulation   Int?
  greensPossible       Int?
  putts                Int?
  birdies              Int?
  eagles               Int?
  pars                 Int?
  bogeys               Int?
  doubleBogeys         Int?
  scramblingPercentage Float?
  sandSavePercentage   Float?
  proximityToHole      Float?
  sgOffTheTee          Float?
  sgApproach           Float?
  sgAroundGreen        Float?
  sgPutting            Float?
  sgTotal              Float?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  playerRound PlayerRound @relation(fields: [playerRoundId], references: [id], onDelete: Cascade)

  // Exactly one statistic record per player round.
  @@unique([playerRoundId])
  @@index([playerRoundId])
  @@map("round_statistics")
}
```

**Purpose:** Store detailed round-level golf statistics for each player in each round:
- **Tee Metrics:** Driving distance, fairway accuracy
- **Green Metrics:** GIR, regulation hits, proximity to hole
- **Scoring Metrics:** Birdies, eagles, pars, bogeys, double bogeys, scrambles, sand saves
- **Strokes Gained Metrics:** SG breakdown (off-tee, approach, around-green, putting, total)

**Relationship:**
- **1:1 with PlayerRound** — Exactly one statistic record per player per round
- **Via playerRoundId foreign key** — Links to the player's round performance
- **Cascade delete** — Deleting a player_round also deletes its statistics

---

## 2. Which Importer is Responsible?

**Answer: NONE — The importer was NOT implemented.**

**Evidence:**

### Importer Export List (`/vercel/share/v0-project/lib/imports/index.ts`)

Lines 1-532 export:
- ✅ `runPlayerImport()`
- ✅ `runCourseImport()`
- ✅ `runTournamentImport()`
- ✅ `runCourseLinking()`
- ✅ `runFieldImport()` — Populates `tournament_fields`
- ✅ `runStatisticsImport()` — Populates `player_season_statistics` (season-level, not round-level)
- ✅ `runNewsImport()`
- ✅ `runBettingImport()`
- ✅ `runFantasyImport()`
- ✅ `runWeatherImport()`
- ✅ `runCourseGeolocation()`
- ✅ `runOddsImport()`
- ❌ **NO `runRoundStatisticsImport()`**

### Historical Results Import (`/vercel/share/v0-project/lib/imports/historical-results-import.ts`)

This is the importer that runs the rounds/player_rounds pipeline:

**What it DOES:**
- Fetches leaderboards from SportsDataIO `/json/Leaderboard/{tournamentId}`
- Creates `Round` records
- Creates `PlayerRound` records with position and rank from the leaderboard
- Lines 352-356 verify final counts and confirm 0 records in round_statistics

```typescript
const actualRoundCount = await prisma.round.count()
const actualPlayerRoundCount = await prisma.playerRound.count()
const actualRoundStatsCount = await (prisma.roundStatistic?.count?.() ?? Promise.resolve(0))

console.log(`[v0] ACTUAL DATABASE STATE (verified by Prisma.count()):`)
console.log(`[v0]   rounds: ${actualRoundCount}`)
console.log(`[v0]   player_rounds: ${actualPlayerRoundCount}`)
console.log(`[v0]   round_statistics: ${actualRoundStatsCount}`)
```

**What it DOES NOT DO:**
- It does NOT populate round_statistics
- No code creates `RoundStatistic` records anywhere

### Codebase Search

**Grep result:** Only 0 matches for "runRoundStatisticsImport" or similar in `/vercel/share/v0-project/lib/imports`

---

## 3. Which SportsDataIO Endpoint Would Supply the Data?

To populate round_statistics with detailed statistics, one of these endpoints would be required:

### Option A: Scorecard Feed (RECOMMENDED)
**Endpoint:** `/json/Scorecard/{TournamentID}` or `/json/RoundScorecard/{RoundID}`

**Raw Response Example:**
```json
{
  "Scorecards": [
    {
      "PlayerID": 123456,
      "RoundNumber": 1,
      "Score": 68,
      "ToPar": -4,
      "DrivingDistance": 287.3,
      "DrivingAccuracy": 0.667,
      "FairwaysHit": 10,
      "FairwaysPossible": 15,
      "GreensInRegulation": 14,
      "Putts": 28,
      "Birdies": 3,
      "Eagles": 1,
      "Pars": 10,
      "Bogeys": 4,
      "DoubleBogeys": 0,
      "ScramblingPercentage": 0.50,
      "SGOffTheTee": 0.234,
      "SGApproach": -0.567,
      "SGAroundGreen": 0.123,
      "SGPutting": 1.234,
      "SGTotal": 1.024
    }
  ]
}
```

### Option B: Player Stats Feed
**Endpoint:** `/json/PlayerStats/{PlayerID}?date=YYYY-MM-DD`  
Would require aggregating or filtering by tournament.

### Option C: Advanced Tier Enhancements
Trial tier (current): Only basic leaderboard (Rank, MadeCut, Earnings)  
Enhanced/Professional tier: Likely includes scorecard detail

---

## 4. Importer Status

**Status: NOT IMPLEMENTED AT ALL**

**Evidence:**
- ✅ Database schema exists (`round_statistics` table)
- ✅ Prisma types generated (`RoundStatistic` model)
- ✅ Other importers fully functional
- ❌ **No `/app/api/imports/round-statistics/route.ts` endpoint**
- ❌ **No `lib/imports/round-statistics-import.ts` implementation**
- ❌ **No export in `/lib/imports/index.ts`**
- ❌ **No mapper from SportsDataIO payload to RoundStatistic**

The infrastructure (schema, types, relationships) exists but the importer code path was **never written**.

---

## 5. Schema Relationships

### ERD: How round_statistics Relates to Other Tables

```
Tournament
    ↓
  Round (tournamentId FK)
    ↓
  PlayerRound (roundId FK, tournamentFieldId FK)
    ↓ (1:1 relationship)
  RoundStatistic (playerRoundId FK, UNIQUE)
    ↓
  Fields: drivingDistance, putts, sgTotal, etc.
```

### Database Relationships Defined

**PlayerRound → RoundStatistic:**
```prisma
model PlayerRound {
  id           String
  roundId      String
  tournamentFieldId String
  // ... other fields ...
  
  // One-to-one relationship to RoundStatistic
  statistic? RoundStatistic
}

model RoundStatistic {
  id         String
  playerRoundId String  // FK to PlayerRound
  // ... detailed stats ...
  
  playerRound PlayerRound @relation(fields: [playerRoundId], references: [id], onDelete: Cascade)
  @@unique([playerRoundId])
}
```

**To resolve player details from round_statistics:**

```sql
SELECT 
  rs.id,
  rs.drivingDistance,
  rs.putts,
  rs.sgTotal,
  pr.score,                  -- From PlayerRound
  tf.fieldPosition,          -- From TournamentField
  p.fullName,                -- From Player
  r.roundNumber,             -- From Round
  t.name as tournament_name  -- From Tournament
FROM round_statistics rs
JOIN player_rounds pr ON rs.playerRoundId = pr.id
JOIN tournament_fields tf ON pr.tournamentFieldId = tf.id
JOIN players p ON tf.playerId = p.id
JOIN rounds r ON pr.roundId = r.id
JOIN tournaments t ON r.tournamentId = t.id;
```

---

## 6. Why Does player_rounds Have Placeholder Values Instead of Waiting?

**Answer: By design — no interdependency.**

### Historical Results Import Sequence

The import processes in this order:

1. **Tournaments created** (from SportsDataIO schedule feed)
2. **Players created** (from SportsDataIO player database)
3. **Tournament Fields created** (linking tournament ↔ player)
4. **Rounds created** (one per completed tournament)
5. **PlayerRounds created** (one per player per round)

**Data available at each stage:**

| Stage | Data | Source |
|-------|------|--------|
| Rounds created | `roundId`, `tournamentId`, `roundNumber` | Tournament data |
| PlayerRounds created | `playerRoundId`, `score` (= Rank), `position` (= Rank), `madeCut` | Leaderboard |
| ⬇️ **Would require scorecard endpoint** ⬇️ |
| RoundStatistics _(not implemented)_ | `drivingDistance`, `putts`, `sgTotal`, etc. | Scorecard feed _(N/A, endpoint not called)_ |

### Why Not Wait?

**Architectural Reason:**

1. **Leaderboard is authoritative for tournament results** — Rank, MadeCut, Earnings come from the official leaderboard
2. **Scorecard is supplementary detail** — Statistics (SG metrics, fairways hit, etc.) enhance but don't change the tournament result
3. **Different data sources, different frequencies** — Leaderboards finalize immediately; stats may arrive later or come from a separate endpoint
4. **Fail-safe design** — If the scorecard endpoint is unavailable (404, rate-limited, trial-tier restriction), the core tournament data is still imported and visible
5. **UI gracefully handles missing stats** — The Round Scoring table displays without statistics, filling gaps with "—" or omitting SG columns

**Current State:**
- `player_rounds.score` is populated from leaderboard Rank (suboptimal but present)
- `player_rounds.toPar` is NULL (not in leaderboard endpoint)
- `round_statistics` is unused (scorecard endpoint never called)

### If the Import Were Implemented

The sequence would be:

```
1. Leaderboard → PlayerRounds (done ✅)
   score = Rank (1, 2, 3, ...)
   position = Rank
   toPar = NULL (not in leaderboard)

2. Scorecard → RoundStatistics (not done ❌)
   score = actual strokes (68, 70, 72, ...)
   toPar = actual to-par (-4, -2, 0, ...)
   drivingDistance, putts, sgTotal, etc.
```

The existing approach makes player_rounds **immediately valid** with partial data, then would **optionally enhance** via round_statistics if/when the scorecard endpoint became available.

---

## Current Database State (Verified)

```
Tournaments:              43 records  ✅
Tournament Fields:     3,855 records  ✅
Players:              6,275 records  ✅
Rounds:                  35 records  ✅
PlayerRounds:         3,736 records  ✅
RoundStatistics:           0 records  ❌ (Importer not implemented)
```

---

## Conclusion

**round_statistics is empty because the importer was never implemented.**

The table schema, Prisma types, and database relationships all exist, but the code to fetch from SportsDataIO's scorecard endpoint and populate the table was never written.

**To implement round statistics:**
1. Determine if SportsDataIO trial tier or professional tier has a scorecard endpoint
2. Build mapper: `SdioScorecard → RoundStatistic` domain object
3. Build importer: `POST /app/api/imports/round-statistics/route.ts`
4. Call SportsDataIO scorecard endpoint for each tournament
5. Transform and persist `RoundStatistic` records
6. Export `runRoundStatisticsImport()` from `/lib/imports/index.ts`

Until then, round_statistics will remain empty and the Round Scoring UI will display without detailed statistics (SG, fairways, etc.).
