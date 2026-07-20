# CaddieIQ Platform Architecture

**Documented:** July 20, 2026  
**Status:** Production - Phase 15.3A Audit  
**Next Review:** Phase 16

---

## Executive Summary

CaddieIQ is a full-stack golf intelligence platform built on Next.js 16 with a PostgreSQL database (Neon). The architecture follows a layered design with clear separation of concerns: presentation layer (Next.js + React), business logic layer (services + intelligence modules), persistence layer (repositories + Prisma), and external integration layer (providers + import system).

The platform is organized into **16 major feature modules**, **25+ intelligence domains**, **36 repositories**, **4 core services**, and **29 API endpoints**.

---

## Layer 1: Presentation (Next.js App Router)

### Structure
```
app/
├── (app)/           # Protected routes
│   ├── admin/       # Admin dashboard
│   ├── caddie/      # AI caddie interface
│   ├── compare/     # Player comparison
│   ├── courses/     # Course browser
│   ├── dashboard/   # Main dashboard
│   ├── players/     # Player directory
│   ├── rankings/    # Ranking pages
│   ├── settings/    # User settings
│   ├── tournaments/ # Tournament details
│   ├── analytics/   # Analytics pages
│   ├── help/        # Help center
│   ├── model-lab/   # Model experimentation
│   └── models/      # Model management
├── (auth)/          # Public auth routes
│   ├── login/
│   └── register/
├── api/             # Route handlers
├── actions/         # Server actions
└── admin/           # Admin setup tools
```

### Responsibilities
- Route handling and page rendering
- User interface composition
- Client-side state management (React hooks + Context)
- Form handling and validation
- Authentication flow (Better Auth integration)

### What SHOULD exist here
- Route definitions
- Page components
- API route handlers
- Server actions for mutations
- Layout composition

### What should NEVER exist here
- Business logic (should be in services)
- Database queries (should be in repositories)
- Intelligence calculations (should be in lib/*-intelligence)
- Data transformations (should be in domain mappers)

---

## Layer 2: Feature Modules (`features/`)

### Structure
```
features/
├── admin/              # Admin capabilities
├── analytics/          # Analytics features
├── auth/               # Authentication flows
├── caddie/             # AI caddie system
├── comparison/         # Player comparison
├── courses/            # Course browsing
├── dashboard/          # Dashboard presentation
├── explainability/     # Explainability UI
├── help/               # Help content
├── model-lab/          # Model experimentation
├── models/             # Model management
├── players/            # Player features
├── rankings/           # Rankings display
├── settings/           # Settings management
├── setup/              # Initial setup flow
└── tournaments/        # Tournament display
```

### Responsibilities
- Feature-scoped components
- Feature-scoped hooks
- Feature-scoped services
- Feature-scoped types
- Feature-scoped utilities

### Pattern
Each feature module contains:
- `components/` - UI components specific to this feature
- `hooks/` - Custom React hooks (data fetching, state management)
- `services/` - Business logic specific to this feature
- `types/` - TypeScript types and interfaces
- `utils/` - Utility functions for this feature

### Examples

**Tournament Feature** (`features/tournaments/`)
- Components: TournamentDetail, TournamentCard, TournamentHeader
- Services: TournamentService, TournamentAnalyticsService
- Types: Tournament, TournamentStatus, TournamentFormat
- Utils: date formatting, tournament helpers

**Player Feature** (`features/players/`)
- Components: PlayerCard, PlayerStats, PlayerComparison
- Services: PlayerRankingService, PlayerStatsService
- Types: Player, PlayerSkill, PlayerTrend
- Utils: player sorting, filtering helpers

---

## Layer 3: Business Logic (`lib/`)

### 3A. Domain Models (`lib/domain/`)

The canonical representation of core business objects. These are the "language" of the platform.

**Models:**
- `Player` - Golfer with skill ratings and personal data
- `Course` - Golf course with hole details and characteristics
- `Tournament` - Event with field, schedule, and results
- `TournamentFieldEntry` - Player participation in a tournament
- `Round` - 18-hole performance record
- `RoundStatistic` - Individual hole score and statistics
- `News` - Tournament or player news item
- `Betting` - Betting odds and lines
- `Fantasy` - DFS slate and lineup information

**Key principle:** Domain models are data structures, NOT logic. They include:
- Type definitions
- Constants (enums, defaults)
- Mappers (provider → domain)
- Validators (PLANNED)

**Mappers** translate external provider payloads into domain models:
```typescript
mapSportsDataPlayer(rawPlayer) → Player
mapSportsDataCourse(rawCourse) → Course
mapSportsDataTournament(rawTournament) → Tournament
```

### 3B. Intelligence Domains

Specialized business logic for different analytical areas.

**Course Intelligence** (`lib/course-intelligence/`)
- Analyzes course characteristics
- Calculates course-fit metrics
- Identifies player strengths/weaknesses for specific courses
- Generates explanations for predictions

**Player Intelligence** (`lib/player-intelligence/`)
- Calculates player skill ratings
- Generates player projections
- Identifies trends and momentum

**Player Skill Intelligence** (`lib/player-skill-intelligence/`)
- Models player skill at different statistics
- Calibrates confidence levels

**DFS Value** (`lib/dfs-value/`)
- Calculates fantasy points
- Determines DFS salary efficiency
- Generates DFS recommendations

**Odds Intelligence** (`lib/odds-intelligence/`)
- Models betting odds
- Calculates implied probabilities
- Generates betting signals

**Weather Intelligence** (`lib/weather-intelligence/`)
- Processes weather data
- Analyzes weather impact on scoring
- Generates weather-adjusted projections

**Analytics** (`lib/analytics/`)
- Strokes Gained analysis
- Recent Form analysis
- Momentum analysis
- Value analysis
- Wind impact analysis
- Consistency analysis

### 3C. Services (`lib/services/`)

Orchestration layer that coordinates repositories and domain logic.

**Core Services:**
- `CourseAnalyticsService` - Orchestrates course analysis
- `CourseEnrichmentService` - Enriches course with external data
- `TournamentMappingConfidenceService` - Validates tournament mappings

**Responsibilities:**
- Coordinate repository calls
- Apply domain rules
- Orchestrate intelligence calculations
- Coordinate external API calls

**Pattern:**
```typescript
export class CourseAnalyticsService {
  constructor(
    private courseRepository: CourseRepository,
    private courseIntelligence: CourseIntelligence
  ) {}
  
  async analyzeForTournament(courseId: string, tournamentId: string) {
    const course = await this.courseRepository.findById(courseId)
    const analysis = await this.courseIntelligence.analyze(course)
    return analysis
  }
}
```

### 3D. Repositories (`lib/repositories/`)

Data access layer. The ONLY place database queries occur.

**Architecture:**
- Base class: `BaseRepository` - Shared upsert templates, logging, error handling
- Concrete repositories: One per Prisma model type
- Slug-based idempotent upsert pattern

**Responsibilities:**
- Database queries only
- Idempotent upsert by slug (source-derived unique key)
- Bulk operations with result tracking
- Error handling and logging
- Relationship resolution

**Examples:**
- `PlayerRepository` - Player persistence
- `CourseRepository` - Course persistence
- `TournamentRepository` - Tournament persistence
- `TournamentFieldRepository` - Field entry persistence
- `RoundRepository` - Round data persistence
- 30+ specialized repositories

**Pattern:**
```typescript
export class PlayerRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'player')
  }
  
  async upsertPlayer(player: Player): Promise<RepositoryResult<StoredPlayer>> {
    return this.upsertBySlug(
      this.prisma.player,
      {
        slug: player.externalRef.slug,
        create: { /* map to create */ },
        update: { /* map to update */ }
      },
      'player'
    )
  }
}
```

### 3E. Providers (`lib/providers/`)

External data source adapters. Isolated from the rest of the codebase.

**Providers:**
- `SportsDataIO` - Tournament, player, course, news data
- `GolfCourseAPI` - Course details and geolocation
- `Weather` - Current and forecast weather
- `DataGolf` - Strokes Gained statistics
- `Odds` - Betting lines
- `Geocoding` - Address to coordinates

**Responsibilities:**
- API authentication
- Request/response handling
- Error handling and retry logic
- Rate limiting
- Response typing (provider-specific, never exported)

**Pattern:**
```typescript
export class SportsDataIOProvider extends BaseProvider {
  async getPlayer(id: string): Promise<RawPlayerPayload> {
    // Call API, return raw typed response
  }
  
  async getTournament(id: string): Promise<RawTournamentPayload> {
    // Call API, return raw typed response
  }
}
```

---

## Layer 4: Data Persistence

### Prisma Schema (`prisma/schema.prisma`)

**Key Design Decisions:**
- CUID primary keys (never auto-increment integers)
- Snake_case table names via `@@map`
- Slug-based unique constraints for idempotent upserts
- Audit fields: `createdAt`, `updatedAt` on all models
- Soft deletes: `deletedAt` where semantically appropriate
- Enums: TourType, PlayerStatus, TournamentStatus, etc.

**Core Models:**
- User, Profile, Subscription (Auth + Billing)
- Tournament, TournamentField, Round, RoundStatistic
- Player, Course, CourseCharacteristic
- News, Betting, Fantasy (Derived data)
- ImportRun, ImportMapping (Import tracking)

**Relationships:**
- Tournament → (Player many-to-many via TournamentField)
- Tournament → Course (one-to-one)
- Round → (RoundStatistic many via RoundStatistic)
- Course → (CourseCharacteristic many)
- Player → (Statistics many)

### Database (`PostgreSQL` via Neon)

**Connection:** `DATABASE_URL` environment variable  
**Type:** PostgreSQL with Neon compatibility  
**Provider:** Neon (serverless PostgreSQL)  
**Migrations:** Prisma migrations (version-controlled in `prisma/migrations/`)

---

## Layer 5: Import System (`lib/imports/`)

Orchestrates the flow of external data into the database.

**Flow:**
1. **Import Manager** (`import-manager.ts`) - Entry point, coordinates all imports
2. **Provider Call** - Fetch raw data from external APIs
3. **Domain Mapper** - Map provider payload → domain model
4. **Validation** (PLANNED) - Validate domain model properties
5. **Repository Upsert** - Persist via repository layer
6. **Relation Building** - Resolve foreign keys (e.g., player → nationality)
7. **Run Recording** - Log import result (success/partial/failure)

**Specialized Importers:**
- `player-import.ts` - Players from SportsDataIO
- `course-import.ts` - Courses from SportsDataIO
- `tournament-import.ts` - Tournaments from SportsDataIO
- `course-geolocation.ts` - Course coordinates from GolfCourseAPI
- `weather-import.ts` - Weather from Weather API
- `news-import.ts` - News from SportsDataIO
- `odds-import.ts` - Betting odds from Odds provider
- `fantasy-import.ts` - DFS slates from SportsDataIO
- `historical-results-import.ts` - Past results
- `course-intelligence-import.ts` - Pre-calculated course intelligence

**Relation Builders:**
- `tournament-relations.ts` - Link tournaments to courses, resolve field players
- `field-relations.ts` - Link players to tournament fields
- `course-relations.ts` - Resolve course relationships (nationality, location)
- `statistics-relations.ts` - Link round statistics to rounds/holes

---

## Layer 6: API Routes (`app/api/`)

Route handlers for client requests.

**Categories:**
- `api/auth/` - Better Auth endpoints
- `api/caddie/` - AI caddie endpoints
- `api/admin/` - Admin-only endpoints
- `api/imports/` - Data import endpoints
- `api/phase-*/` - Temporary phase-specific endpoints
- `api/setup/` - Initial setup endpoints

**Pattern:**
```typescript
// Validate auth
// Validate input
// Call service layer
// Transform to response DTOs
// Return response
```

---

## Layer 7: UI Components (`components/`)

Reusable presentation components.

**Categories:**
- `auth/` - Authentication UI (login, register)
- `cards/` - Card-based layouts
- `charts/` - Data visualization (Recharts-based)
- `empty-states/` - No-data states
- `feedback/` - User feedback (notifications, toasts)
- `layout/` - Layout primitives
- `loaders/` - Loading states
- `navigation/` - Navigation UI
- `shared/` - Shared utilities (section headers, etc.)
- `ui/` - Shadcn UI component library

---

## External Integrations

### SportsDataIO
- **Purpose:** Primary tournament, player, and course data
- **Authentication:** API key via header
- **Importer:** `player-import.ts`, `course-import.ts`, `tournament-import.ts`
- **Consumers:** Most features depend on this data
- **Failure Handling:** Partial import continues, reports failures
- **Refresh:** Ad-hoc via admin endpoints, scheduled imports (PLANNED)

### GolfCourseAPI
- **Purpose:** Course coordinates and detailed characteristics
- **Authentication:** API key
- **Importer:** `course-geolocation.ts`
- **Consumers:** Course analysis, mapping
- **Failure Handling:** Marks as missing, retries later
- **Refresh:** Daily refresh via import manager

### Weather API
- **Purpose:** Current weather for tournament venues
- **Authentication:** API key
- **Importer:** `weather-import.ts`
- **Consumers:** Weather intelligence, player predictions
- **Failure Handling:** Uses historical data as fallback
- **Refresh:** Real-time polling during active tournaments

### DataGolf
- **Purpose:** Advanced statistical models (Strokes Gained)
- **Authentication:** API key
- **Importer:** (via `analytics/strokes-gained`)
- **Consumers:** Player intelligence, rankings
- **Failure Handling:** Falls back to internal models
- **Refresh:** Daily updates

### Geocoding (Google/Open Street Map)
- **Purpose:** Address → coordinates mapping
- **Authentication:** API key
- **Importer:** Part of `course-geolocation.ts`
- **Consumers:** Course mapping, location-based features
- **Failure Handling:** Manual coordinate entry (admin)
- **Refresh:** One-time per course

---

## Cross-Cutting Concerns

### Authentication & Authorization
- **System:** Better Auth (NextAuth compatible)
- **Models:** User, Account, Session, VerificationToken
- **Flow:** OAuth + email/password (email/password default)
- **Guards:** Middleware in `lib/auth/middleware`

### Logging
- **Repository Logging:** `RepositoryLogger` - logs all persistence operations
- **Import Logging:** `ImportLogger` - logs import progress and failures
- **Structured:** JSON format for parsing
- **Verbosity:** Configurable per component

### Error Handling
- **Repository Errors:** Typed `RepositoryError` with operation + model
- **Import Errors:** Detailed error tracking per record
- **API Errors:** Standardized HTTP responses
- **Strategy:** Fail-safe with partial success tracking

### Testing
- **Unit Tests:** Alongside implementation files (`__tests__/`)
- **Framework:** Jest
- **Coverage:** Intelligence modules, services, repositories
- **Mocking:** Mock providers and repositories

---

## Architecture Decisions

### Why This Structure?

1. **Layered Architecture** - Clear separation of concerns, testable layers
2. **Domain-Driven Design** - Domain models as the centerpiece
3. **Slug-Based Upserts** - Idempotent imports (re-run same import safely)
4. **Isolated Providers** - Easy to add/swap external integrations
5. **Feature Modules** - Scalable, team-independent development
6. **Repository Pattern** - Database abstraction, testability

### What's NOT Here (Yet)

- Background jobs system (current: import on-demand via API)
- WebSocket/real-time updates (current: polling)
- Advanced caching layer (current: database + API-level caching)
- GraphQL (current: REST API routes + Server Actions)
- Multi-tenant support (current: single-tenant)
- RBAC (current: basic admin/user roles)
- Audit trail (current: timestamps only)

---

## Deployment Architecture

### Environment Variables
```
DATABASE_URL              # PostgreSQL connection (Neon)
AUTH_URL                  # Better Auth configuration
NEXT_PUBLIC_APP_URL       # Frontend URL for redirects
SPORTSDATAIO_API_KEY      # SportsDataIO authentication
WEATHER_API_KEY           # Weather API authentication
GOLFCOURSEAPI_KEY         # GolfCourseAPI authentication
DATAGOLF_API_KEY          # DataGolf authentication
# ... additional provider keys
```

### Build Process
- Next.js 16 with Turbopack
- TypeScript compilation
- Environment variable validation
- Prisma client generation

### Runtime
- Node.js 18+
- Neon PostgreSQL connection
- Vercel deployment
- Edge runtime available for middleware

---

## Known Limitations

1. **No Background Jobs** - Imports run in foreground, blocking
2. **No Event Bus** - Tight coupling between features
3. **No Cache Layer** - All queries hit database directly
4. **No Advanced Telemetry** - Basic logging only
5. **No GraphQL** - REST + Server Actions only
6. **No Websockets** - Polling-based only
7. **Import Coordination** - No distributed import locking
8. **Soft Deletes** - Not consistently applied

---

## Future Architectural Phases

- **Phase 16:** Background jobs (Bull, SQS, or similar)
- **Phase 17:** Event-driven architecture (event bus, webhooks)
- **Phase 18:** Advanced caching (Redis, query result caching)
- **Phase 19:** Telemetry and observability (Sentry, DataDog)
- **Phase 20:** GraphQL layer on top of REST API
- **Phase 21:** Real-time updates (WebSocket, Server-Sent Events)

