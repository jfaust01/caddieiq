# SportsDataIO Endpoint Inventory

Complete list of every HTTP endpoint currently used by CaddieIQ.

## Base URL

```
https://api.sportsdata.io/golf/v2
```

## All Endpoints (9 Total)

### 1. Health / Connectivity Check
- **Path:** `/json/Players` (used for health probe)
- **Method:** GET
- **Usage:** Minimal authenticated read in `SportsDataProvider.health()`
- **Purpose:** Verify API connectivity and authentication

### 2. Players - List All
- **Path:** `/json/Players`
- **Method:** GET  
- **Implementation:** `SportsDataProvider.listPlayers()`
- **Importer:** `runPlayerImport()` in `app/api/imports/players/route.ts`
- **Response Type:** `SdioPlayer[]`
- **Data:** Player metadata, world rank, nationality, tour

### 3. Players - Get Single
- **Path:** `/json/Player/{playerId}`
- **Method:** GET
- **Implementation:** `SportsDataProvider.getPlayer(playerId)`
- **Status:** Implemented but NOT ACTIVELY USED in current importers
- **Response Type:** `SdioPlayer`

### 4. Tournaments - List All
- **Path:** `/json/Tournaments`
- **Method:** GET
- **Implementation:** `SportsDataProvider.listTournaments()`
- **Importer:** `runTournamentImport()` in `app/api/imports/tournaments/route.ts`
- **Response Type:** `SdioTournament[]`
- **Data:** Tournament names, dates, courses, status

### 5. Tournaments - Get Single
- **Path:** `/json/Tournament/{tournamentId}`
- **Method:** GET
- **Implementation:** `SportsDataProvider.getTournament(tournamentId)`
- **Status:** Implemented but NOT ACTIVELY USED in current importers
- **Response Type:** `SdioTournament`

### 6. Courses - List All
- **Path:** `/json/Courses`
- **Method:** GET
- **Implementation:** `SportsDataProvider.listCourses()`
- **Importer:** `runCourseImport()` in `app/api/imports/courses/route.ts`
- **Response Type:** `SdioCourse[]`
- **Data:** Course names, locations, hole par, course par

### 7. Leaderboard / Field Results
- **Path:** `/json/Leaderboard/{tournamentId}`
- **Method:** GET
- **Implementation:** `SportsDataProvider.getLeaderboard(tournamentId)`
- **Importers:** 
  - `runFieldImport()` in `app/api/imports/fields/route.ts` (field entries)
  - `runHistoricalResultsImport()` (creates rounds + player_rounds)
- **Response Type:** `SdioLeaderboard`
- **Data:** 
  - Per-player finishing position, earnings, made cut status
  - **ALSO CONTAINS:** Round-by-round scorecard with scores, par, hole-by-hole detail, statistics
- **Records:** 147 players × 4 rounds = 588 player_rounds imported

### 8. Player Season Statistics
- **Path:** `/json/PlayerSeasonStats/{season}`
- **Method:** GET
- **Implementation:** `SportsDataProvider.listPlayerSeasonStats(season)`
- **Importer:** `runPlayerSeasonStatisticsImport()` in `app/api/imports/statistics/route.ts`
- **Response Type:** `SdioPlayerSeasonStats[]`
- **Data:** Season stats (events played, ranking, OWGR points, scoring average, etc.)
- **Records:** 1,225 player season statistics

### 9. News Articles
- **Path:** `/json/News`
- **Method:** GET
- **Implementation:** `SportsDataProvider.listNews()`
- **Importer:** `runNewsImport()` in `app/api/imports/news/route.ts`
- **Response Type:** `SdioNewsArticle[]`
- **Data:** Golf news articles with title, body, date
- **Records:** 2 articles imported

### 10. Betting Events
- **Path:** `/odds/json/BettingEventsByDate/{date}` (Different base URL)
- **Method:** GET
- **Base URL:** `https://api.sportsdata.io` (v3/golf/odds)
- **Implementation:** `SportsDataProvider.listBettingEventsByDate(date)`
- **Importer:** `runBettingImport()` in `app/api/imports/betting/route.ts`
- **Response Type:** `SdioBettingEvent[]` (with nested markets and outcomes)
- **Data:** Betting odds, player matchups, payouts
- **Records:** 2 betting events imported

### 11. DFS Slates
- **Path:** `/json/DfsSlatesByTournament/{tournamentId}`
- **Method:** GET
- **Implementation:** `SportsDataProvider.listDfsSlatesByTournament(tournamentId)`
- **Importer:** `runFantasyImport()` in `app/api/imports/fantasy/route.ts`
- **Response Type:** `SdioDfsSlate[]`
- **Data:** DFS slate info with nested players and salary info
- **Records:** DFS slate data (used for salary/contest tracking)

### 12. Fantasy Projections
- **Path:** `/projections/json/PlayerTournamentProjectionStats/{tournamentId}` (Different base URL)
- **Method:** GET
- **Base URL:** `https://api.sportsdata.io` (v3/golf/projections)
- **Implementation:** `SportsDataProvider.listPlayerTournamentProjections(tournamentId)`
- **Importer:** `runFantasyImport()` in `app/api/imports/fantasy/route.ts`
- **Response Type:** `SdioPlayerTournamentProjection[]`
- **Data:** Fantasy point projections, salary info
- **Records:** Fantasy projection data

## Summary

**Total Unique Endpoints:** 12

**Active Importers Using These Endpoints:**
1. ✅ Players
2. ✅ Tournaments
3. ✅ Courses
4. ✅ Leaderboard (field + player_rounds)
5. ✅ Player Season Statistics
6. ✅ News
7. ✅ Betting Events
8. ✅ DFS Slates
9. ✅ Fantasy Projections

**Implemented but Not Used:**
- Get single player (`/json/Player/{id}`)
- Get single tournament (`/json/Tournament/{id}`)

## Critical Finding: Scorecard Data Location

**The scorecard/round statistics data is NOT in a separate endpoint.**

Instead, it's **nested inside the Leaderboard response** (`/json/Leaderboard/{tournamentId}`):

```
Leaderboard Response
├── Tournament (metadata)
└── Players[]
    └── [Player details]
        └── Rounds[]  ← THIS IS THE SCORECARD DATA
            ├── Score (strokes)
            ├── Par (course par)
            ├── Holes[]
            │   ├── Score
            │   ├── Par
            │   └── ToPar
            └── Statistics (birdies, bogeys, etc.)
```

**Status:** Round statistics data is already being fetched by `runHistoricalResultsImport()` but NOT being persisted to the `round_statistics` table. The data is available; it just needs to be mapped and stored.

## Verification Script

A discovery script exists at `scripts/discover-sportsdataio.mjs` that tests all endpoints for availability and returns sample data.

Run with:
```bash
node --env-file-if-exists=/vercel/share/.env.project scripts/discover-sportsdataio.mjs
```

