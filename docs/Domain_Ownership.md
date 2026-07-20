# CaddieIQ Domain Ownership

**Phase:** 15.3C — Platform Engineering Standards  
**Status:** Complete  

---

## Domain Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CaddieIQ Platform Domains                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         CORE BUSINESS DOMAINS (User-Facing)                 │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ • Tournament    • Course       • Player       • Rankings    │  │
│  │ • DFS/Betting   • Weather      • News         • Field       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │    INTELLIGENCE DOMAINS (Calculated Features)               │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ • Player Skill Intelligence                                 │  │
│  │ • Course Intelligence                                       │  │
│  │ • Player Intelligence (Match, Projection)                   │  │
│  │ • Odds Intelligence                                         │  │
│  │ • Weather Intelligence                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │        PLATFORM DOMAINS (Infrastructure)                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ • Authentication (Better Auth)                              │  │
│  │ • Administration (Imports, Debug)                           │  │
│  │ • Data Quality (Validation, Rules)                          │  │
│  │ • Shared Utilities (Constants, Helpers)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Domain Definitions

### 1. **Tournament Domain**

**Purpose:** Event scheduling, field management, tournament context

**Ownership:**
- Owner: Tournament Team
- Path: `/lib/domain/tournament/`, `/lib/tournament-context/`
- Database: `Tournament`, `TournamentCourse`, `TournamentField`

**Repositories:**
- `TournamentRepository`
- `TournamentFieldRepository`

**Services:**
- `TournamentContextService`

**Builders:**
- `TournamentImporter`
- `TournamentRelationsBuilder`

**Allowed Dependencies:**
- May depend on: Player, Course, Field
- May be depended on by: All intelligence, DFS, Weather, News, Rankings

**Forbidden Dependencies:**
- Cannot depend on: Intelligence engines, DFS calculations
- Cannot be depended on by: Core platform (Auth, Admin)

**UI Entry Points:**
- Tournament Detail Page
- Tournament List Page
- Tournament Command Center

**External Providers:**
- SportsDataIO (primary)

**Future Expansion:**
- Live leaderboard updates
- Tournament scheduling automation
- Multi-course tournaments

---

### 2. **Course Domain**

**Purpose:** Course specifications, scoring characteristics, fit analysis

**Ownership:**
- Owner: Course Intelligence Team
- Path: `/lib/analytics/course-fit/`, `/lib/course-intelligence/`
- Database: `Course` + 7 detail tables (Details, Holes, Tees, Coordinates, Address, Specifications, Metadata)

**Repositories:**
- `CourseRepository`
- `CourseDetailsRepository`
- `CourseHoleRepository`
- `CourseTeeRepository`
- `CourseCoordinatesRepository`
- `CourseAddressRepository`
- `CourseSpecificationsRepository`
- `CourseMetadataRepository`

**Services:**
- `CourseAnalyticsService`
- `CourseEnrichmentService`

**Builders:**
- `CourseImporter`
- `CourseIntelligenceBuilder`
- `GolfCourseAPIImporter`

**Allowed Dependencies:**
- May depend on: None (foundational)
- May be depended on by: All domains

**Forbidden Dependencies:**
- Cannot depend on: Player, Tournament, Intelligence (except self)

**UI Entry Points:**
- Course Detail Page
- Course Intelligence Card
- Tournament Intel Tab (course subsection)

**External Providers:**
- GolfCourseAPI (primary)
- Geocoding API (coordinates)

**Future Expansion:**
- Historic course conditions
- Course renovation tracking
- Advanced turf analysis

---

### 3. **Player Domain**

**Purpose:** Player profiles, statistics, tournament history

**Ownership:**
- Owner: Player Data Team
- Path: `/lib/domain/player/`
- Database: `Player`, `PlayerTourHistory`, `PlayerSeasonStatistic`, `PlayerRound`, `RoundStatistic`

**Repositories:**
- `PlayerRepository`
- `PlayerTourHistoryRepository`
- `PlayerSeasonStatisticRepository`
- `RoundRepository`
- `RoundStatisticRepository`

**Services:**
- `PlayerService`

**Builders:**
- `PlayerImporter`
- `HistoricalResultsImporter`
- `StatisticsRelationsBuilder`

**Allowed Dependencies:**
- May depend on: None (foundational)
- May be depended on by: All domains

**Forbidden Dependencies:**
- Cannot depend on: Tournament, Course, Intelligence (except self)

**UI Entry Points:**
- Player Profile Page
- Player Card Component
- Field Leaderboard

**External Providers:**
- SportsDataIO (primary)

**Future Expansion:**
- Player biography and media
- Social media integration
- Injury tracking
- Equipment preferences

---

### 4. **Field Domain**

**Purpose:** Tournament field management, player commitments

**Ownership:**
- Owner: Tournament Team
- Path: `/lib/repositories/field-repository.ts`
- Database: `TournamentField` (junction table)

**Repositories:**
- `FieldRepository`

**Services:**
- Handled by `TournamentContextService`

**Builders:**
- `FieldRelationsBuilder`

**Allowed Dependencies:**
- May depend on: Tournament, Player

**Forbidden Dependencies:**
- Cannot be depended on by core logic (only used in tournament context)

**UI Entry Points:**
- Tournament Field Leaderboard

---

### 5. **Player Skill Intelligence Domain**

**Purpose:** Calculate normalized player skill profiles

**Ownership:**
- Owner: Intelligence Team
- Path: `/lib/player-skill-intelligence/`
- Database: `PlayerIntelligenceBuild`, `PlayerIntelligence`

**Repositories:**
- `PlayerSkillRepository`
- `PlayerIntelligenceBuildRepository`

**Services:**
- `PlayerSkillIntelligenceService`

**Builders:**
- `PlayerSkillIntelligenceBuilder` (pure engine)

**Allowed Dependencies:**
- May depend on: Player (read-only), Platform shared
- May be depended on by: DFS, Course Intelligence, Rankings

**Forbidden Dependencies:**
- Cannot depend on: Tournament, Course, Service logic
- Cannot contain: UI logic, presentation

**Intelligence Characteristics:**
- Inputs: Round statistics for player + population samples
- Outputs: 5-dimension skill profile (Long, Short, Overall, Consistency, Comfort)
- Versioning: Numbered builds with active selection
- Refresh: Monthly automatic build
- Confidence: Based on sample count

**Future Expansion:**
- Real-time skill updates
- Injury-adjusted skill models
- Course-specific skill profiles

---

### 6. **Course Intelligence Domain**

**Purpose:** Calculate course difficulty and fit scores

**Ownership:**
- Owner: Intelligence Team
- Path: `/lib/course-intelligence/`
- Database: `CourseIntelligence`, `CourseInsight`, `CourseMetricExplanation`

**Repositories:**
- `CourseIntelligenceRepository`

**Services:**
- `CourseIntelligenceService`

**Builders:**
- `CourseIntelligenceBuilder` (pure engine)

**Allowed Dependencies:**
- May depend on: Course (read-only), Platform shared
- May be depended on by: DFS, Player Intelligence, Rankings

**Forbidden Dependencies:**
- Cannot depend on: Player, Tournament, Service logic
- Cannot contain: UI logic, presentation

**Intelligence Characteristics:**
- Inputs: Course specs (par, yardage, rating, holes, tees, grass)
- Outputs: Trait scores (Birdie, Accuracy, Distance, Firmness)
- Refresh: On-demand (lazy)
- Confidence: Based on data completeness

---

### 7. **Weather Intelligence Domain**

**Purpose:** Forecast normalization and weather context

**Ownership:**
- Owner: Data Services Team
- Path: `/lib/weather-intelligence/`
- Database: `WeatherSnapshot`, `WeatherPeriod`

**Repositories:**
- `WeatherRepository`

**Services:**
- `WeatherIntelligenceService`

**Builders:**
- `WeatherImporter`
- `WeatherIntelligenceBuilder` (pure engine)

**Allowed Dependencies:**
- May depend on: Tournament (read-only), Platform shared
- May be depended on by: DFS, UI

**Forbidden Dependencies:**
- Cannot depend on: Player, Course, Service logic
- Cannot contain: UI logic, presentation

**Intelligence Characteristics:**
- Inputs: Raw 5-day forecast from OpenWeather
- Outputs: Normalized forecast by round/wave
- Refresh: Every 6 hours during tournament
- Fallback: Secondary weather provider

---

### 8. **News Domain**

**Purpose:** Tournament-scoped news aggregation

**Ownership:**
- Owner: Data Services Team
- Path: `/lib/repositories/news-repository.ts`
- Database: `NewsArticle`

**Repositories:**
- `NewsRepository`

**Services:**
- Handled through routes

**Builders:**
- `NewsImporter`

**Allowed Dependencies:**
- May depend on: Platform shared
- May be depended on by: UI

**Forbidden Dependencies:**
- Cannot depend on: Business logic
- Cannot contain: Intelligence

---

### 9. **DFS/Betting Domain**

**Purpose:** Fantasy salary analysis, value scoring, betting lines

**Ownership:**
- Owner: Analytics Team
- Path: `/lib/analytics/dfs-value/`
- Database: `DfsSalary`, `OddsEvent`, `OddsQuote`, `BettingMarket`

**Repositories:**
- `DFSRepository`
- `OddsRepository`
- `BettingRepository`

**Services:**
- `DfsValueService`
- `OddsIntelligenceService`

**Builders:**
- `OddsImporter`
- `DfsIntelligenceBuilder`

**Allowed Dependencies:**
- May depend on: Tournament, Player, Course, Intelligence (read-only)
- May be depended on by: UI

**Forbidden Dependencies:**
- Cannot depend on: Platform logic
- Cannot contain: UI logic

**Intelligence Characteristics:**
- Inputs: Salary, player skill, course fit, field strength, weather
- Outputs: Salary-adjusted value scores
- Refresh: Per-request (ephemeral)
- Confidence: Based on data availability

---

### 10. **Rankings Domain**

**Purpose:** Leaderboard construction, ranking calculations

**Ownership:**
- Owner: Analytics Team
- Path: TBD (future domain)
- Database: TBD

**Characteristics:**
- Not yet fully formalized
- Uses components from other domains
- Future expansion area

---

### 11. **Authentication Domain**

**Purpose:** User authentication, sessions, authorization

**Ownership:**
- Owner: Platform Team
- Path: `/app/auth/`
- Provider: Better Auth

**Characteristics:**
- Managed by Better Auth
- No custom repositories
- Uses standard Better Auth patterns

---

### 12. **Administration Domain**

**Purpose:** Import orchestration, debugging, monitoring

**Ownership:**
- Owner: Platform Team
- Path: `/app/api/admin/`, `/lib/admin/`

**Services:**
- Import management
- Diagnostic tools
- Data coverage reporting

**Allowed Dependencies:**
- May depend on: All domains (read-write)

**Forbidden Dependencies:**
- Cannot be imported by: Business logic

---

## Cross-Domain Communication Rules

### Allowed Dependencies

```
UI Components
    ↓
API Routes
    ↓
Services (Tournament, Course, DFS, Weather, etc.)
    ↓
Intelligence Services (read-only)
    ↓
Repositories (domain-specific)
    ↓
Database
```

### Forbidden Patterns

❌ Component → Prisma (use repository)  
❌ Component → Service (use API route)  
❌ Service → Prisma (use repository)  
❌ Service → Component (use return value)  
❌ Intelligence → Component (use service)  
❌ Domain A Repository → Domain B Service  

### Allowed Patterns

✓ Component → API Route  
✓ API Route → Service  
✓ Service → Repository (own domain)  
✓ Service → Intelligence Engine (read-only)  
✓ Repository → Prisma  

---

## New Domain Checklist

When creating a new domain:

- [ ] Define purpose and ownership
- [ ] Create domain folder structure
- [ ] Identify repositories needed
- [ ] Identify services needed
- [ ] Identify builders if intelligence-related
- [ ] Document allowed dependencies
- [ ] Document forbidden dependencies
- [ ] Create database models (if needed)
- [ ] Document external providers (if any)
- [ ] Create UI entry points (if user-facing)
- [ ] Add tests
- [ ] Document in this file
- [ ] Get architecture review

---

## Architecture Consistency

All domains must follow:

✓ 4-layer import pattern (fetch → map → validate → persist)  
✓ Repository abstraction for data access  
✓ Service layer for business logic  
✓ Consistent error handling  
✓ Consistent logging  
✓ Testing requirements  
✓ Security standards  

