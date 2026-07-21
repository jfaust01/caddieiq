# CaddieIQ Phase 15.3B — Data Flow Overview

**Status:** Phase 15.3B Documentation  
**Created:** 2026-07-20  
**Scope:** Every data flow from source to UI  
**Methodology:** Code inspection + implementation validation  

---

## Executive Summary

CaddieIQ is a **data-driven intelligence platform** with 6 major external data sources, 40+ import pipelines, 34 repositories, and 5 core intelligence engines. This document maps every piece of data from its external source through normalization, storage, retrieval, and finally to the UI.

### Key Statistics

- **External Providers:** 6 (SportsDataIO, GolfCourseAPI, Weather, News, DataGolf, Odds)
- **Database Tables:** 47 models across 5 domains
- **Repositories:** 34 implementations + base pattern
- **Import Pipelines:** 15+ specialized importers + orchestration
- **Services:** 16+ core services for data retrieval and transformation
- **Intelligence Engines:** 5 (Player Skill, Course, Weather, Odds, DFS Value)
- **API Routes:** 40+ endpoints exposing data
- **UI Entry Points:** Tournament detail, player profile, field pages

### Data Flow Layers

```
┌─────────────────────────────────────────────────────┐
│ EXTERNAL PROVIDERS                                  │
│ (SportsDataIO, GolfCourseAPI, Weather, News, etc.)  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ IMPORT SYSTEM                                       │
│ (fetch → map → validate → persist)                  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ PERSISTENCE LAYER                                   │
│ (PostgreSQL + Prisma)                               │
│ 47 models organized in 5 domains                    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ DATA ACCESS LAYER                                   │
│ (34 Repositories + base pattern)                    │
│ Repository per major entity                        │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ BUSINESS LOGIC LAYER                                │
│ (Services + Intelligence Engines)                   │
│ Aggregation, calculation, normalization             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ API LAYER                                           │
│ (40+ Route Handlers)                                │
│ REST endpoints for every major domain               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ UI LAYER                                            │
│ (React Components + Next.js Pages)                  │
│ Consumes API data and renders                       │
└─────────────────────────────────────────────────────┘
```

---

## Major Data Sources

### 1. **SportsDataIO** (CRITICAL)
- **Purpose:** Player statistics, round scores, historical performance
- **Status:** Scaffold only (not yet implemented)
- **Authentication:** API key-based
- **Refresh:** TBD (planned quarterly with delta sync)
- **Storage:** Players, PlayerRoundHistory, PlayerSeasonStatistic, Round, RoundStatistic
- **Consumers:** Player profiles, rankings, Course Fit skill metrics

### 2. **GolfCourseAPI** (HIGH)
- **Purpose:** Course specifications, yardage, par, handicaps, tee information
- **Status:** Implemented + integrated
- **Authentication:** API key + rate-limited
- **Refresh:** Scheduled (new tournaments trigger course sync)
- **Storage:** Course, CourseDetails, CourseHole, CourseTee, TeeHoleYardage, CourseCoordinates, CourseAddress
- **Consumers:** Course Intelligence, tournament detail pages, course fit analysis

### 3. **Weather Provider** (MEDIUM)
- **Purpose:** 5-day forecast, current conditions, wind, precipitation
- **Status:** Implemented (OpenWeather + fallback)
- **Authentication:** API key + rate-limited
- **Refresh:** Every 6 hours during tournament
- **Storage:** WeatherSnapshot, WeatherPeriod, WeatherImportLog
- **Consumers:** Tournament detail page, weather intelligence, DFS Value calculations

### 4. **News Provider** (MEDIUM)
- **Purpose:** PGA Tour news, player updates, tournament information
- **Status:** Implemented with deduplication
- **Authentication:** RSS/web scraping
- **Refresh:** Continuous (hourly during tournaments)
- **Storage:** NewsArticle
- **Consumers:** Tournament Intel tab, news feed

### 5. **DataGolf** (BETA)
- **Purpose:** Advanced player metrics, course history models
- **Status:** Experimental
- **Authentication:** API key
- **Refresh:** On-demand
- **Storage:** Not yet persisted (query-time only)
- **Consumers:** Advanced Player Intelligence

### 6. **Odds Provider** (BETA)
- **Purpose:** DraftKings betting lines, salary caps, projection models
- **Status:** Beta integration
- **Authentication:** TBD
- **Refresh:** Tournament-specific (15-minute updates)
- **Storage:** OddsEvent, OddsQuote, DfsSalary
- **Consumers:** DFS Value model, salary-adjusted rankings

---

## Import System Architecture

All imports follow the **4-layer pattern**:

```
Provider (fetch)
    ↓
Normalizer (map)
    ↓
Validator (validate)
    ↓
Repository (persist)
```

### Import Manager Orchestration

**File:** `lib/imports/import-manager.ts`

The `ImportManager` orchestrates all imports:

1. **Fetch** - Call provider to get raw external data
2. **Map** - Normalize to domain model using mapper
3. **Validate** - Run data quality checks
4. **Persist** - Bulk upsert into database via repository

### Import Definitions

Each entity has an import definition:

- `player-import.ts` - Player entities from SportsDataIO
- `tournament-import.ts` - Tournament events
- `course-import.ts` - Course specifications
- `weather-import.ts` - Weather forecasts
- `news-import.ts` - News articles
- `odds-import.ts` - Betting lines
- `historical-results-import.ts` - Historical rounds
- `betting-import.ts` - Betting events
- `fantasy-import.ts` - Fantasy projections

### Relations Builders

After primary imports, relation builders connect entities:

- `tournament-relations.ts` - Links tournaments to courses, fields
- `course-relations.ts` - Links course details to holes, tees
- `field-relations.ts` - Links tournament fields to players
- `statistics-relations.ts` - Connects rounds to players

---

## Domain Organization

CaddieIQ uses **domain-driven design** with 5 major domains:

### 1. **Tournament Domain**
- Models: Tournament, TournamentCourse, TournamentField, Round
- Services: TournamentContextService
- Repositories: TournamentRepository, TournamentFieldRepository
- Imports: tournament-import, tournament-relations
- Purpose: Event scheduling and player commitments

### 2. **Course Domain**
- Models: Course + 6 detail tables (Details, Holes, Tees, Coordinates, Address, Specifications)
- Services: CourseIntelligenceService, CourseAnalyticsService, CourseEnrichmentService
- Repositories: 8 course-specific repositories
- Imports: course-import, course-relations, golfcourse-import
- Purpose: Venue specifications and course profile

### 3. **Player Domain**
- Models: Player, PlayerTourHistory, PlayerSeasonStatistic, PlayerRound, RoundStatistic
- Services: PlayerSkillIntelligenceService, PlayerService (implied)
- Repositories: PlayerRepository, PlayerSkillRepository, RoundRepository, RoundStatisticRepository
- Imports: player-import, historical-results-import, statistics-relations
- Purpose: Player profiles and performance history

### 4. **Intelligence Domain**
- Models: PlayerIntelligenceBuild, PlayerIntelligence, CourseIntelligence, CourseInsight, CourseMetricExplanation
- Services: 5 intelligence services + builders
- Engines: PlayerSkillIntelligence, CourseIntelligence, OddsIntelligence, WeatherIntelligence
- Purpose: Calculated metrics, rankings, insights

### 5. **Fantasy/Betting Domain**
- Models: DfsSalary, OddsEvent, OddsQuote, FantasyProjection, BettingEvent, BettingMarket, BettingOutcome
- Services: DfsValueService, OddsIntelligenceService
- Repositories: DFS + Odds repositories
- Imports: odds-import, fantasy-import, betting-import
- Purpose: Salary-adjusted value, betting recommendations

---

## Repository Pattern

Every entity has a corresponding repository following this pattern:

```typescript
interface Repository<T> {
  findById(id: string): Promise<Result<T>>
  findMany(query?: Query): Promise<Result<T[]>>
  create(entity: T): Promise<Result<T>>
  update(entity: T): Promise<Result<T>>
  bulkUpsert(entities: T[]): Promise<Result<number>>
  delete(id: string): Promise<Result<boolean>>
}
```

**Base Class:** `BaseRepository<T>` in `lib/repositories/base-repository.ts`

**Implementations:** 34 specialized repositories

---

## Service Layer

Services aggregate repository calls and implement business logic:

### Tournament Context Service
- **Purpose:** Single authoritative source of tournament context
- **Pattern:** Reads through repository, caches with React `cache()`
- **Usage:** Every tournament-specific page and component

### Course Intelligence Service
- **Purpose:** Generate and retrieve course intelligence metrics
- **Pattern:** Fetch course details, aggregate holes/tees, run engine
- **Output:** CourseIntelligence with trait scores

### Player Skill Intelligence Service
- **Purpose:** Build player skill profiles normalized against population
- **Pattern:** Fetch samples, load population, calculate percentiles
- **Output:** PlayerSkillProfile with 5 skill dimensions

### DFS Value Service
- **Purpose:** Calculate salary-adjusted value scores
- **Pattern:** Combine player skill, course fit, field context
- **Output:** Ranked projections with salary metrics

### Weather Intelligence Service
- **Purpose:** Aggregate weather forecasts with context
- **Pattern:** Fetch forecast, normalize by wave/time window
- **Output:** Weather context for pages and DFS model

---

## Intelligence Engines

Intelligence engines are **pure functions** that consume aggregated data and produce calculated metrics:

### Player Skill Intelligence Engine
- **Input:** Round statistics, player samples
- **Output:** 5-dimension skill profile (Long, Short, Overall, Consistency, Comfort)
- **Location:** `lib/player-skill-intelligence/`

### Course Intelligence Engine
- **Input:** Course specifications (par, yardage, rating, hole data)
- **Output:** Course difficulty traits (Birdie Potential, Accuracy, Distance, Firmness)
- **Location:** `lib/course-intelligence/course-intelligence-engine.ts`

### DFS Value Engine
- **Input:** Player skill, course fit, field context, salary
- **Output:** Salary-adjusted value score + percentile
- **Location:** `lib/dfs-value/`

### Odds Intelligence Engine
- **Input:** Betting lines, player performance, field strength
- **Output:** Win probability, payout expectations
- **Location:** `lib/odds-intelligence/`

### Weather Intelligence Engine
- **Input:** Raw weather forecasts
- **Output:** Normalized weather context (wind, precipitation, temperature bands)
- **Location:** `lib/weather-intelligence/`

---

## API Routes (40+ endpoints)

All data access from the UI goes through REST API routes in `app/api/`:

### Tournament Endpoints
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/:id` - Tournament detail + context
- `GET /api/tournaments/:id/field` - Tournament field with rankings
- `GET /api/tournaments/:id/intel` - Intelligence data (weather, DFS, odds)

### Player Endpoints
- `GET /api/players` - Player search/list
- `GET /api/players/:id` - Player profile
- `GET /api/players/:id/skill` - Player skill profile
- `GET /api/players/:id/history` - Tournament history

### Course Endpoints
- `GET /api/courses` - Course search
- `GET /api/courses/:id` - Course details + intelligence
- `GET /api/courses/:id/analytics` - Course analytics

### Intelligence Endpoints
- `GET /api/intelligence/course/:id` - Course intelligence
- `GET /api/intelligence/player/:id` - Player intelligence
- `GET /api/intelligence/dfs/:tournamentId` - DFS rankings
- `GET /api/intelligence/weather/:tournamentId` - Weather context

### Admin Endpoints
- `POST /api/imports/run` - Trigger import pipeline
- `GET /api/imports/status` - Import status + history
- `GET /api/data-coverage` - Coverage dashboard

---

## Failure Points & Handling

Every data flow has potential failure points:

| Layer | Failure | Detection | Current Handling | Recovery |
|-------|---------|-----------|------------------|----------|
| Provider | API unavailable | HTTP 5xx, timeout | Logged, retry scheduled | Backoff + fallback |
| Provider | Auth failure | HTTP 401/403 | Logged as critical | Manual credential update |
| Normalizer | Missing field | Validation failure | Logged + skipped | Partial record or reject |
| Validator | Quality check | Business rule violation | Logged + rejected | Manual review required |
| Repository | Constraint violation | DB error | Transaction rolled back | Data quality issue |
| Service | Missing dependency | Null/empty result | Honest "unavailable" response | Return placeholder |
| API | Service error | Exception | 500 error response | Client sees error state |
| UI | Network error | Request timeout | Graceful degradation | Show cached data or message |

---

## Cross-Domain Dependencies

```
                         ┌──────────────────┐
                         │   TOURNAMENT     │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────────┐
            │    COURSE    │ │  PLAYER  │ │    FIELD     │
            └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                   │              │              │
        ┌──────────┴──────────┐   │   ┌──────────┴──────────┐
        │                     │   │   │                     │
        ▼                     ▼   ▼   ▼                     ▼
   ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
   │    COURSE    │    │   PLAYER SKILL  │    │    DFS VALUE     │
   │ INTELLIGENCE │    │  INTELLIGENCE   │    │   CALCULATION    │
   └──────────────┘    └─────────────────┘    └──────────────────┘
        │                     │                        │
        └─────────────────────┼────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │   WEATHER    │    │    ODDS      │
            │ INTELLIGENCE │    │ INTELLIGENCE │
            └──────────────┘    └──────────────┘
                    │                   │
                    └─────────────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │  UI DISPLAY  │
                    │ (Tournament  │
                    │   Detail)    │
                    └──────────────┘
```

**Upstream Dependencies (Required):**
- Tournament → requires Course + Field
- Course Intelligence → requires Course (holes, tees, specs)
- Player Skill → requires Player + Rounds
- DFS Value → requires Player Skill + Course Fit + Salary

**Downstream Consumers (Dependent):**
- UI components depend on all services above
- API routes depend on services
- Tournament detail page depends on entire stack

---

## Key Architectural Insights

### 1. **Server-Only Services**
All core services use `server-only` import, preventing accidental client bundling:
- TournamentContextService
- CourseIntelligenceService
- PlayerSkillIntelligenceService
- All intelligence engines

### 2. **React Cache Pattern**
Services use React `cache()` for request-level deduplication:
```typescript
const getPlayerActiveContextCached = cache(
  async (playerId: string): Promise<TournamentContext> => { ... }
)
```
Multiple components requesting same data hit database once per request.

### 3. **Honest "Unavailable" Pattern**
Rather than fabricate data, services return explicit unavailable states:
```typescript
return unavailableSkillProfile(
  playerId,
  [{ code: "no-round-statistics", detail: "..." }],
  "No verified round statistics have been captured..."
)
```

### 4. **Pure Intelligence Engines**
All calculated fields are pure functions:
- Identical input → Identical output
- No side effects or external calls
- Deterministic and testable

### 5. **Repository Abstraction**
All data access goes through repositories:
- No Prisma calls in services
- Single point of change for queries
- Enables consistent error handling

---

## Sequence of a Tournament Page Load

```
1. User navigates to /tournaments/cadillac-championship-2026
2. Next.js loads TournamentDetailPage
3. Page requests getTournamentContext('cadillac-championship-2026')
4. TournamentContextService queries database:
   - TournamentRepository.findContextById(id)
5. Service normalizes raw tournament row
6. Page requests CourseIntelligence for tournament.courseId
7. CourseIntelligenceService:
   - Fetches course details from repository
   - Fetches holes from repository
   - Fetches tees from repository
   - Runs CourseIntelligenceEngine
   - Returns calculated traits
8. Page requests tournament field for leaderboard
9. PlayerSkillIntelligenceService:
   - Fetches samples for each field player
   - Loads platform population
   - Calculates percentiles for each
   - Returns skill profiles + leaderboard
10. Page requests weather context
11. WeatherIntelligenceService:
    - Fetches WeatherSnapshot from repository
    - Normalizes forecast
    - Returns weather context
12. Page requests DFS rankings
13. DfsValueService:
    - For each player, calculates salary-adjusted value
    - Combines skill, course fit, field context
    - Returns ranked projections
14. Page renders Tournament Detail UI with all data
15. API routes called from React components:
    - GET /api/tournaments/:id
    - GET /api/intelligence/course/:id
    - GET /api/intelligence/player/:id/skill
    - GET /api/intelligence/weather/:id
    - GET /api/intelligence/dfs/:id
```

---

## Data Freshness & Refresh Strategy

| Data | Source | Refresh Cadence | Storage | TTL |
|------|--------|-----------------|---------|-----|
| Tournaments | External | Quarterly | Database | None (historical) |
| Players | SportsDataIO | Quarterly | Database | None (historical) |
| Course specs | GolfCourseAPI | Per-tournament | Database | None (historical) |
| Rounds/scores | SportsDataIO | Post-tournament | Database | None (historical) |
| Weather | Weather API | Every 6 hours | Database | 14 days |
| News | News provider | Hourly | Database | 90 days |
| Odds/salary | DraftKings | Every 15 min | Database | Tournament duration |
| Course Intel | Calculated | On-demand | Cache | Until next recalc |
| Player Skill | Calculated | Monthly build | Database | Until next build |
| DFS Value | Calculated | Per-request | Ephemeral | Request lifetime |

---

## Next Steps (Phase 16)

1. Trace each flow in detail (tournament, course, player, weather, DFS, odds)
2. Create sequence diagrams for major workflows
3. Document failure recovery paths
4. Identify cross-domain coupling points
5. Validate implementation vs. intended architecture

