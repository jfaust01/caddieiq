# Phase 17.3C.1 Pre-Implementation Audit

**Date**: 2026-07-20  
**Objective**: SportsDataIO Historical Golf Connector  
**Status**: Pre-implementation assessment complete

## 1. Existing SportsDataIO Infrastructure

### REUSE (No new code needed)

- ✅ **SportsDataIO API Client** (`lib/providers/sportsdataio/client.ts`)
  - Already implements: `listTournaments()`, `getTournament()`, `getLeaderboard()`, `listPlayers()`, `getPlayer()`, `listCourses()`
  - Authenticated with `SPORTSDATAIO_API_KEY`
  - Implements retry with backoff for HTTP 5xx, timeouts
  - Returns typed responses: `SdioTournament`, `SdioPlayer`, `SdioLeaderboard`, `SdioCourse`

- ✅ **Configuration & Validation** (`lib/providers/sportsdataio/config.ts`)
  - `validateSportsDataIoConfig()` - pure validation function
  - `loadSportsDataIoConfig()` - environment loader
  - Defaults: `https://api.sportsdata.io/golf/v2`, timeout 10s, max 2 retries

- ✅ **Type Definitions** (`lib/providers/sportsdataio/types.ts`)
  - `SdioPlayer`, `SdioTournament`, `SdioCourse`, `SdioLeaderboard` (partial, permissive with index signatures)

- ✅ **Error Mapping** (`lib/providers/sportsdataio/errors.ts`)
  - Maps HTTP errors to provider error taxonomy
  - Handles transient vs. permanent failures

- ✅ **Logger** (`lib/providers/sportsdataio/logger.ts`)
  - Structured logging without credentials

### EXTEND (Existing but needs connector wrapper)

- ✅ **Historical Importer Framework** (Phase 17.3B)
  - Contract: `discover()`, `fetch()`, `normalize()`, `validate()`, `persist()`, `verify()`
  - Validators: `ChecksumUtil`, `TemporalValidator`, `ProvenanceValidator`, `IdempotencyUtil`
  - Repository: `ImportJobRepository` for job lifecycle
  - Executor: `ImporterExecutor` with 10-step pipeline

### CREATE (New files for Phase 17.3C.1)

1. **SportsDataIOHistoricalImporter** (`lib/imports/sportsdataio-historical-importer.ts`)
   - Implements 6-method contract
   - Wraps SportsDataIO client with normalization & mapping

2. **Tournament Mapper** (`lib/imports/mappers/sportsdataio-tournament-mapper.ts`)
   - SportsDataIO tournament ID → canonical tournament edition

3. **Player Mapper** (`lib/imports/mappers/sportsdataio-player-mapper.ts`)
   - SportsDataIO player ID → canonical player

4. **Score/Outcome Mapper** (`lib/imports/mappers/sportsdataio-score-mapper.ts`)
   - Round scores, leaderboard outcomes

5. **Tests** (test files for each mapper and importer)

## 2. Prisma Models (Existing)

### Primary Models (REUSE)

```
Player (426) ← SdioPlayer.PlayerID
Tournament (791)
TournamentField (882) ← tournament field entries
Round (935) ← tournament rounds
PlayerRound (966) ← player performance per round
Course (624)
TournamentCourse (855)
```

### Historical Tables (REUSE - From Phase 17.3B)

```
HistoricalProvider (6 providers including sportsdataio)
HistoricalProviderImportJob (job tracking)
HistoricalTournamentOutcome (player finishing positions)
HistoricalPlayerFeature (SG metrics, rankings)
```

## 3. Environment Variables

### Required

- ✅ `SPORTSDATAIO_API_KEY` - API authentication (set in integration)
- ✅ `POSTGRES_PRISMA_URL` - Database (via Neon integration)

### Optional

- `SPORTSDATAIO_BASE_URL` - Defaults to `https://api.sportsdata.io/golf/v2`

## 4. Provider Registry Record

**Current State**: REGISTERED

```
ID: prov_sportsdataio_001
ProviderId: sportsdataio
Name: SportsDataIO
Version: 1.0
Priority: 100
SupportedDatasets: [TOURNAMENT_METADATA, TOURNAMENT_FIELD, OUTCOMES, SCORES, PLAYER_STATS]
Coverage: 95%
HistoricalDepthDays: 1825
RateLimitPerSecond: 10
RateLimitPerDay: 100000
IsActive: true
HealthStatus: (to be verified)
```

## 5. Supported Datasets for This Phase

### A. Tournament Edition Metadata ✅

- SportsDataIO `TournamentID` → `Tournament` model
- Venue name → `Course.name` via slug matching
- Date range validation

### B. Historical Tournament Field ✅

- SportsDataIO `PlayerID` → `Player` model
- Field status from SportsDataIO

### C. Tournament Outcomes ✅

- Leaderboard finishing position
- Score relative to par (if available)
- Total strokes

### D. Round Scores ✅

- Round number, score, cumulative

### E. Player Statistics ✓ (Conditional)

- Only if destination model exists in schema
- SG metrics: Driving, Approach, Short Game, Putting (if available from SportsDataIO)

## 6. Implementation Matrix

| Component | Status | Details |
|-----------|--------|---------|
| **API Client** | REUSE | SportsDataIOGolfClient (lib/providers/sportsdataio/client.ts) |
| **Configuration** | REUSE | loadSportsDataIoConfig() |
| **Type Validation** | REUSE | SdioTournament, SdioPlayer, SdioLeaderboard schemas |
| **Error Handling** | REUSE | ProviderError mapping, transient retry logic |
| **Importer Contract** | REUSE | HistoricalImporter interface (6 methods) |
| **Validators** | REUSE | ChecksumUtil, TemporalValidator, ProvenanceValidator |
| **Repository** | REUSE | ImportJobRepository |
| **Executor** | REUSE | ImporterExecutor pipeline |
| **Importer Impl** | CREATE | SportsDataIOHistoricalImporter (wraps client) |
| **Mappers** | CREATE | Tournament, Player, Score, Outcome mappers |
| **Tests** | CREATE | Fixtures, schema validation, mapping tests |

## 7. Pilot Tournament Selection Criteria

### Candidates (from existing tournament data)

- **Tournament**: PGA Tour event with unambiguous SportsDataIO ID
- **Requirements**:
  - SportsDataIO tournament ID known
  - Canonical CaddieIQ tournament edition exists
  - Course mapping verified
  - Field, outcomes, scores available
  - Completed event (no future dates)

### Preferred Characteristics

- Recent (last 2-3 years) for strong canonical mappings
- High field data quality
- Score/leaderboard data available

## 8. Blocking Issues

**None identified.**

- ✅ SportsDataIO API key available (integration)
- ✅ Database connected (Neon)
- ✅ Models exist for all required entities
- ✅ Historical framework operational
- ✅ Retry/rate-limit utilities available

## 9. Next Steps

1. **Verify SportsDataIO Access** - Test connectivity, list tournaments
2. **Select Pilot Tournament** - Identify candidate with full dataset
3. **Implement Importer** - Create SportsDataIOHistoricalImporter
4. **Implement Mappers** - Tournament, Player, Score mappers
5. **Implement Tests** - Fixtures, validation, mapping, idempotency
6. **Dry Run** - Validate without persistence
7. **Real Import** - Execute and verify
8. **Determinism Verification** - Run twice, confirm identical results
