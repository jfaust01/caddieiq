# CaddieIQ Architecture Diagram

**Documented:** July 20, 2026  
**Format:** Mermaid diagrams + ASCII art  
**Purpose:** Visual reference for platform architecture

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        UI["Browser / React App"]
        SC["Server Components"]
    end
    
    subgraph AppRouter["Next.js App Router"]
        Pages["Pages & Routes"]
        APIRoutes["API Routes"]
        ServerActions["Server Actions"]
    end
    
    subgraph BusinessLogic["Business Logic Layer"]
        Services["Services"]
        Intelligence["Intelligence Domains"]
        Analytics["Analytics"]
        Imports["Import System"]
    end
    
    subgraph DataAccess["Data Access Layer"]
        Repositories["Repositories"]
        Validation["Validation"]
    end
    
    subgraph Persistence["Persistence Layer"]
        Prisma["Prisma ORM"]
        PostgreSQL["PostgreSQL<br/>Neon"]
    end
    
    subgraph External["External Systems"]
        SportsDataIO["SportsDataIO<br/>Tournament Data"]
        GolfCourseAPI["GolfCourseAPI<br/>Course Data"]
        Weather["Weather API<br/>Weather Data"]
        DataGolf["DataGolf<br/>Analytics"]
        Odds["Odds Provider<br/>Betting Data"]
        Geocoding["Geocoding API<br/>Coordinates"]
    end
    
    Client -->|Request| Pages
    Client -->|Request| APIRoutes
    Pages -->|Call| Services
    Pages -->|Call| Intelligence
    APIRoutes -->|Call| Services
    APIRoutes -->|Call| Repositories
    ServerActions -->|Call| Services
    ServerActions -->|Call| Repositories
    
    Services -->|Orchestrate| Repositories
    Services -->|Use| Intelligence
    Intelligence -->|Query| Repositories
    Analytics -->|Query| Repositories
    Imports -->|Map| BusinessLogic
    Imports -->|Call| Providers
    
    Repositories -->|Query/Persist| Validation
    Validation -->|Validate| Prisma
    Prisma -->|SQL| PostgreSQL
    
    External -->|Raw Data| Providers["Provider Layer"]
    Providers -->|Typed Response| Imports
    
    style Client fill:#e1f5ff
    style AppRouter fill:#f3e5f5
    style BusinessLogic fill:#e8f5e9
    style DataAccess fill:#fff3e0
    style Persistence fill:#fce4ec
    style External fill:#f1f8e9
    style Providers fill:#ede7f6
```

---

## 2. Data Flow: Tournament Import

```mermaid
graph LR
    A["SportsDataIO API"] -->|Raw JSON| B["SportsDataIO<br/>Provider"]
    B -->|RawTournamentPayload| C["Domain Mapper<br/>tournament/mapper.ts"]
    C -->|Tournament| D["Import Manager"]
    D -->|Validate| E["Tournament<br/>Validator"]
    E -->|Valid| F["Tournament<br/>Repository"]
    F -->|Upsert| G["Prisma<br/>upsert"]
    G -->|SQL| H["PostgreSQL"]
    D -->|Build Relations| I["Field Relations<br/>Builder"]
    I -->|Link Players| F
    D -->|Log Result| J["Import Logger<br/>ImportRun"]
    J -->|Record| H
```

---

## 3. Service Orchestration Pattern

```mermaid
graph TB
    A["API Route<br/>POST /api/tournaments/:id/analyze"] -->|Request| B["Authentication<br/>Middleware"]
    B -->|Authorized User| C["Input Validation"]
    C -->|Valid Input| D["TournamentService"]
    
    D -->|Get| E["TournamentRepository"]
    D -->|Get| F["CourseRepository"]
    D -->|Analyze| G["CourseIntelligence"]
    D -->|Calculate| H["Analytics/<br/>StrokesGained"]
    D -->|Get Odds| I["BettingRepository"]
    
    E -->|Player[]| D
    F -->|Course| D
    G -->|Analysis| D
    H -->|SG Metrics| D
    I -->|Odds[]| D
    
    D -->|Combined Result| J["Response DTO"]
    J -->|JSON| K["Response"]
    
    style D fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
```

---

## 4. Intelligence Domain Architecture

```mermaid
graph TB
    subgraph Input["Input Data"]
        Player["Player<br/>Skills"]
        Course["Course<br/>Characteristics"]
        History["Historical<br/>Results"]
        Weather["Weather<br/>Conditions"]
    end
    
    subgraph Intelligence["Intelligence Domains"]
        PI["Player<br/>Intelligence"]
        CI["Course<br/>Intelligence"]
        DFS["DFS Value<br/>Intelligence"]
        OI["Odds<br/>Intelligence"]
        WI["Weather<br/>Intelligence"]
    end
    
    subgraph Output["Predictions & Analysis"]
        PProj["Player Projections"]
        CFit["Course Fit Score"]
        DValue["DFS Value & Rank"]
        OProb["Win Probability"]
        WAdj["Weather Adjustments"]
    end
    
    subgraph UI["UI & Features"]
        UPlayer["Player Page"]
        UCourse["Course Page"]
        UDFS["DFS Page"]
        UBetting["Betting Page"]
        UDashboard["Dashboard"]
    end
    
    Input -->|Data| Intelligence
    Intelligence -->|Results| Output
    Output -->|Display| UI
    
    PI -.->|Inputs| CI
    CI -.->|Inputs| DFS
    WI -.->|Adjust| PI
    WI -.->|Adjust| CI
    
    style Input fill:#e3f2fd
    style Intelligence fill:#e8f5e9
    style Output fill:#f3e5f5
    style UI fill:#fff3e0
```

---

## 5. Feature Module Boundaries

```mermaid
graph TB
    subgraph AppLayer["App Router (pages + routes)"]
        direction LR
        Dashboard["Dashboard"]
        Tournament["Tournament"]
        Players["Players"]
        Courses["Courses"]
        Caddie["Caddie"]
        Admin["Admin"]
    end
    
    subgraph Features["Feature Modules"]
        direction TB
        F1["features/tournaments/"]
        F2["features/players/"]
        F3["features/courses/"]
        F4["features/caddie/"]
        F5["features/admin/"]
    end
    
    subgraph Shared["Shared Layer"]
        direction TB
        Components["components/"]
        Hooks["hooks/"]
        Utils["lib/utils/"]
    end
    
    subgraph Business["Business Logic"]
        direction TB
        Services["lib/services/"]
        Repositories["lib/repositories/"]
        Intelligence["lib/*-intelligence/"]
    end
    
    Dashboard -->|imports| F1
    Tournament -->|imports| F1
    Players -->|imports| F2
    Courses -->|imports| F3
    Caddie -->|imports| F4
    Admin -->|imports| F5
    
    F1 -->|imports| Shared
    F2 -->|imports| Shared
    F3 -->|imports| Shared
    F4 -->|imports| Shared
    F5 -->|imports| Shared
    
    Shared -->|imports| Business
    F1 -->|imports| Business
    F2 -->|imports| Business
    F3 -->|imports| Business
    F4 -->|imports| Business
    F5 -->|imports| Business
    
    style Dashboard fill:#bbdefb
    style Tournament fill:#bbdefb
    style Players fill:#bbdefb
    style F1 fill:#c8e6c9
    style F2 fill:#c8e6c9
    style F3 fill:#c8e6c9
    style F4 fill:#c8e6c9
    style F5 fill:#c8e6c9
    style Shared fill:#fff9c4
    style Business fill:#ffccbc
```

---

## 6. Data Model Entity Relationship

```mermaid
erDiagram
    USER ||--o{ SUBSCRIPTION : has
    USER ||--o{ SESSION : has
    USER ||--|| PROFILE : has
    
    TOURNAMENT ||--o{ TOURNAMENT_FIELD : contains
    TOURNAMENT ||--|| COURSE : played_at
    TOURNAMENT ||--o{ ROUND : schedules
    
    PLAYER ||--o{ TOURNAMENT_FIELD : participates
    PLAYER ||--o{ ROUND : plays
    PLAYER ||--o{ PLAYER_STATISTIC : has
    
    COURSE ||--o{ COURSE_CHARACTERISTIC : describes
    COURSE ||--o{ HOLE : has
    
    ROUND ||--o{ ROUND_STATISTIC : tracks
    ROUND_STATISTIC ||--o{ STATISTIC : measures
    
    TOURNAMENT_FIELD ||--|| PLAYER : includes
    
    TOURNAMENT ||--o{ NEWS : references
    PLAYER ||--o{ NEWS : references
    
    TOURNAMENT ||--o{ BETTING : odds_for
    PLAYER ||--o{ BETTING : odds_on
    
    TOURNAMENT ||--o{ FANTASY : has_slate
    FANTASY ||--o{ DFS_PLAYER : contains
    PLAYER ||--o{ DFS_PLAYER : allocated_to
    
    TOURNAMENT ||--o{ IMPORT_RUN : imports
    PLAYER ||--o{ IMPORT_MAPPING : tracks_external_id
```

---

## 7. API Route Organization

```
app/api/
├── auth/                    # Better Auth endpoints
│   └── [auth routes]
├── admin/                   # Admin-only operations
│   ├── tournaments/
│   ├── players/
│   ├── courses/
│   └── data-coverage/
├── caddie/                  # AI Caddie endpoints
│   └── analyze/
├── imports/                 # Data import operations
│   ├── tournaments
│   ├── players
│   ├── courses
│   └── [type]/
├── analytics/               # Analytics queries
│   ├── strokes-gained/
│   ├── rankings/
│   └── course-fit/
├── tournaments/             # Tournament queries
│   ├── [id]/
│   └── [id]/analyze
├── players/                 # Player queries
│   ├── [id]/
│   └── [id]/compare
├── courses/                 # Course queries
│   └── [id]/analyze
├── setup/                   # Initial setup
├── system-health/           # System monitoring
│   └── providers
└── audit/                   # Audit logs
```

---

## 8. Layer Dependencies Graph

```
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                              │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ app/           Components       Pages       API Routes    │   │
│ │ - UI rendering - Event handling - Data fetching - Auth   │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │ imports
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ FEATURE MODULES LAYER                                           │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ features/[feature]/                                      │   │
│ │ - Feature components - Feature hooks - Feature services  │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │ imports
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER                                            │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Services (orchestration)                                 │   │
│ │ Intelligence Domains (analysis)                          │   │
│ │ Analytics (statistics)                                   │   │
│ │ Imports (data coordination)                              │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │ imports
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATA ACCESS LAYER                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Repositories (database abstraction)                      │   │
│ │ Validation (data integrity)                              │   │
│ │ Domain Models (mappers)                                  │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │ imports
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ PERSISTENCE LAYER                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Prisma (ORM)                                             │   │
│ │ PostgreSQL (Database)                                    │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
             ↕ (bidirectional through providers)
┌─────────────────────────────────────────────────────────────────┐
│ EXTERNAL INTEGRATION LAYER                                      │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Providers (isolated API adapters)                        │   │
│ │ External APIs (SportsDataIO, Weather, etc.)              │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Key Rule: Each layer can only import from layers below (✓)
          Never import from layers above or same-level features (✗)
```

---

## 9. Request Flow: Get Player with Analysis

```
GET /api/players/123

    │
    ├─ [Auth Middleware]
    │  └─ Verify user authenticated
    │
    ├─ [Input Validation]
    │  └─ Validate player ID format
    │
    ├─ [API Route Handler]
    │  └─ app/api/players/[id]/route.ts
    │
    ├─ [Call Service Layer]
    │  └─ playerService.getPlayerWithAnalysis(123)
    │
    ├─ [Service Orchestrates]
    │  ├─ playerRepository.findById(123)
    │  │  └─ Prisma query
    │  ├─ playerIntelligence.analyze(player)
    │  │  ├─ playerSkillIntelligence.calculateRatings(player)
    │  │  └─ playerStatistics.getTrend(player)
    │  └─ analytics.getRecentForm(player)
    │
    ├─ [Return Response]
    │  └─ {
    │      player: {...},
    │      analysis: {...},
    │      trend: {...}
    │     }
    │
    └─ [Client]
       └─ Display player detail with analysis
```

---

## 10. Repository Pattern

```mermaid
graph TB
    A["Domain Object<br/>Player"] -->|Input| B["UpsertPlan<br/>{slug, create, update}"]
    B -->|Passed to| C["BaseRepository<br/>upsertBySlug"]
    
    C -->|Check if exists| D["findUnique<br/>by slug"]
    D -->|Not found| E["Create"]
    D -->|Found| F["Update"]
    
    E -->|Persist| G["Prisma"]
    F -->|Persist| G
    
    G -->|Success| H["RepositoryResult<br/>{ ok: true, data }"]
    G -->|Error| I["Coerce to<br/>RepositoryError"]
    I -->|Return| J["RepositoryResult<br/>{ ok: false, error }"]
    
    H -->|Caller checks| K["if result.ok"]
    J -->|Caller checks| L["Handle error"]
    
    H -->|Log| M["RepositoryLogger"]
    J -->|Log| M
    
    style C fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style H fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style J fill:#ffccbc,stroke:#ff7043,stroke-width:2px
```

---

## 11. Import Pipeline

```mermaid
graph LR
    A["Provider<br/>API"] -->|Raw Data| B["Provider<br/>Layer"]
    B -->|Typed Response| C["Domain<br/>Mapper"]
    C -->|Domain Model| D["Validation<br/>Layer"]
    D -->|Valid| E["Repository<br/>Upsert"]
    E -->|Stored| F["Database"]
    
    D -->|Invalid| G["Error Log"]
    G -->|Record Failure| H["ImportRun"]
    
    E -->|Success| H
    
    I["Relation<br/>Builders"] -->|Foreign Keys| E
    J["Import<br/>Logger"] -->|Progress| H
    
    H -->|Persist| F
    
    F -->|Results| K["Admin<br/>Dashboard"]
    
    style B fill:#ede7f6
    style C fill:#e1f5ff
    style D fill:#fff3e0
    style E fill:#e8f5e9
    style F fill:#fce4ec
```

---

## 12. Intelligence Stack

```
User Request
    ↓
┌─────────────────────────────────────────────┐
│ Feature Component (e.g., PlayerDetail)      │
│ "Show player fit for this course"           │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Service Layer                               │
│ playerService.getPlayerWithCourseAnalysis() │
└──────────────┬──────────────────────────────┘
               ↓
         ┌─────┴─────┐
         ↓           ↓
    ┌────────────┐ ┌──────────────────┐
    │Repository  │ │Intelligence      │
    │getPlayer() │ │courseIntelligence│
    │            │ │.fitScore()       │
    └────────────┘ └──────────────────┘
         ↓              ↓
    ┌────────────────────────────────┐
    │ Input Data                     │
    │ - Player skills (from DB)      │
    │ - Course characteristics (DB)  │
    │ - Historical results (DB)      │
    │ - Weather (if available)       │
    └────────────────────────────────┘
         ↓
    ┌────────────────────────────────┐
    │ Calculation                    │
    │ 1. Score player strengths      │
    │ 2. Match to course needs       │
    │ 3. Apply weather adjustments   │
    │ 4. Generate explanation        │
    └────────────────────────────────┘
         ↓
    ┌────────────────────────────────┐
    │ Result                         │
    │ {                              │
    │   fitScore: 8.2,               │
    │   confidence: 0.85,            │
    │   explanation: "..."           │
    │ }                              │
    └────────────────────────────────┘
         ↓
    Display to User
```

---

## 13. Folder Hierarchy Tree

```
caddieiq/
├── app/                           # Next.js App Router
│   ├── (app)/                     # Protected routes
│   ├── (auth)/                    # Public auth routes
│   ├── api/                       # API endpoints
│   ├── actions/                   # Server actions
│   ├── admin/                     # Admin tools
│   └── setup/                     # Setup flow
│
├── components/                    # Shared UI components
│   ├── auth/
│   ├── cards/
│   ├── charts/
│   ├── layout/
│   ├── navigation/
│   ├── shared/
│   └── ui/                        # Shadcn components
│
├── features/                      # Feature modules
│   ├── admin/                     # Admin feature
│   ├── tournaments/               # Tournaments feature
│   ├── players/                   # Players feature
│   ├── courses/                   # Courses feature
│   ├── caddie/                    # AI caddie feature
│   ├── analytics/                 # Analytics feature
│   ├── rankings/                  # Rankings feature
│   └── [13 more features]
│
├── lib/                           # Business logic
│   ├── domain/                    # Domain models
│   │   ├── player/
│   │   ├── course/
│   │   ├── tournament/
│   │   └── [more domains]
│   ├── repositories/              # Data access
│   │   └── [36 repository files]
│   ├── services/                  # Orchestration
│   ├── providers/                 # External APIs
│   │   ├── sportsdataio/
│   │   ├── golfcourseapi/
│   │   ├── weather/
│   │   └── [more providers]
│   ├── imports/                   # Import system
│   ├── [5x]-intelligence/         # Intelligence domains
│   │   ├── player-intelligence/
│   │   ├── course-intelligence/
│   │   ├── dfs-value/
│   │   ├── odds-intelligence/
│   │   └── weather-intelligence/
│   ├── analytics/                 # Analytics utilities
│   ├── utils/                     # Shared utilities
│   ├── types/                     # Shared types
│   └── generated/
│       └── prisma/                # Prisma client (generated)
│
├── hooks/                         # Global React hooks
├── constants/                     # Global constants
├── prisma/                        # Database schema
│   ├── schema.prisma
│   └── migrations/
├── docs/                          # Architecture documentation
└── public/                        # Static assets
```

---

## Summary

The architecture follows a **strict layered model** with clear boundaries:

1. **Presentation** (Next.js/React) - User interface
2. **Features** - Domain-specific UI and hooks
3. **Business Logic** - Services, intelligence, analysis
4. **Data Access** - Repositories, validation
5. **Persistence** - Prisma, PostgreSQL
6. **External** - Providers, third-party APIs

Each layer depends only on layers below it. Data flows from presentation downward; responses flow upward. External integrations are isolated in the provider layer, making them easy to swap.

