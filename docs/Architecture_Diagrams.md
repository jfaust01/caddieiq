# CaddieIQ Architecture Diagrams

**Phase:** 15.3C — Platform Engineering Standards

---

## 1. Platform Layers

```mermaid
graph TD
    A["🎨 PRESENTATION LAYER<br/>React Components<br/>Next.js Pages<br/>Server Components<br/>Client Components"]
    
    B["🔌 API LAYER<br/>Route Handlers<br/>Validation<br/>Thin Controllers<br/>Error Handling"]
    
    C["⚙️ SERVICE LAYER<br/>Business Logic<br/>Orchestration<br/>Cross-Domain Coordination<br/>Caching Decision"]
    
    D["📊 REPOSITORY LAYER<br/>Data Access<br/>Query Building<br/>Error Mapping<br/>Caching Layer"]
    
    E["🗄️ DATABASE LAYER<br/>PostgreSQL<br/>Prisma ORM<br/>Models & Migrations<br/>Indexes & Constraints"]
    
    A -->|calls| B
    B -->|calls| C
    C -->|calls| D
    D -->|calls| E
    
    style A fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#0891b2,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#2563eb,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#1e40af,stroke:#333,stroke-width:2px,color:#fff
```

---

## 2. Dependency Hierarchy

```mermaid
graph LR
    A["Components<br/>Client & Server"]
    B["API Routes"]
    C["Services"]
    D["Intelligence<br/>Engines"]
    E["Repositories"]
    F["Prisma"]
    G["Database"]
    
    A -->|✓ Allowed| B
    B -->|✓ Allowed| C
    C -->|✓ Allowed| D
    C -->|✓ Allowed| E
    E -->|✓ Allowed| F
    F -->|✓ Allowed| G
    
    A -.->|✗ Forbidden| E
    A -.->|✗ Forbidden| F
    A -.->|✗ Forbidden| G
    B -.->|✗ Forbidden| F
    B -.->|✗ Forbidden| G
    C -.->|✗ Forbidden| F
    D -.->|✗ Forbidden| A
    D -.->|✗ Forbidden| E
    
    style A fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#0891b2,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#2563eb,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#1e40af,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#172554,stroke:#333,stroke-width:2px,color:#fff
```

---

## 3. Domain Ownership

```mermaid
graph TB
    Platform["🏢 PLATFORM DOMAINS"]
    Auth["🔐 Authentication<br/>Better Auth"]
    Admin["⚙️ Administration<br/>Imports & Debug"]
    Shared["🔧 Shared<br/>Utilities & Constants"]
    
    Core["💼 CORE BUSINESS DOMAINS"]
    Tournament["🏆 Tournament<br/>Events & Fields"]
    Course["⛳ Course<br/>Specs & Holes"]
    Player["🎯 Player<br/>Profiles & History"]
    Field["📊 Field<br/>Player Commitments"]
    Weather["🌦️ Weather<br/>Forecasts"]
    News["📰 News<br/>Articles"]
    Betting["💰 Betting<br/>Odds & Markets"]
    Rankings["📈 Rankings<br/>Leaderboards"]
    
    Intelligence["🧠 INTELLIGENCE DOMAINS"]
    PlayerSkill["🎲 Player Skill<br/>Profiles & Percentiles"]
    CourseIntel["📍 Course Intelligence<br/>Difficulty & Fit"]
    WeatherIntel["🌡️ Weather Intelligence<br/>Normalized Context"]
    DFS["💎 DFS Value<br/>Salary-Adjusted Scores"]
    OddsIntel["📊 Odds Intelligence<br/>Win Probability"]
    
    Platform --> Auth
    Platform --> Admin
    Platform --> Shared
    
    Core --> Tournament
    Core --> Course
    Core --> Player
    Core --> Field
    Core --> Weather
    Core --> News
    Core --> Betting
    Core --> Rankings
    
    Intelligence --> PlayerSkill
    Intelligence --> CourseIntel
    Intelligence --> WeatherIntel
    Intelligence --> DFS
    Intelligence --> OddsIntel
    
    PlayerSkill -.->|reads| Player
    CourseIntel -.->|reads| Course
    WeatherIntel -.->|reads| Weather
    DFS -.->|reads| PlayerSkill
    DFS -.->|reads| CourseIntel
    OddsIntel -.->|reads| Betting
    
    style Platform fill:#374151,stroke:#333,stroke-width:2px,color:#fff
    style Core fill:#374151,stroke:#333,stroke-width:2px,color:#fff
    style Intelligence fill:#374151,stroke:#333,stroke-width:2px,color:#fff
```

---

## 4. Request Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant Component as 📄 Component
    participant API as 🔌 API Route
    participant Service as ⚙️ Service
    participant Repo as 📊 Repository
    participant DB as 🗄️ Database
    
    Browser->>Component: Request data
    Component->>API: fetch('/api/tournament/123')
    API->>Service: await service.getContext(id)
    Service->>Repo: await repo.findById(id)
    Repo->>DB: SELECT * FROM Tournament
    DB-->>Repo: Tournament data
    Repo-->>Service: Result<Tournament>
    Service-->>API: Result<TournamentContext>
    API-->>Browser: Response.json(data)
    Browser-->>Component: Render component
```

---

## 5. Service Coordination

```mermaid
graph TB
    UI["🎨 UI Components"]
    
    TournamentService["⚙️ Tournament Service"]
    CourseService["⚙️ Course Service"]
    PlayerService["⚙️ Player Service"]
    
    PlayerSkillService["⚙️ Player Skill Intelligence"]
    CourseIntelService["⚙️ Course Intelligence"]
    DFSService["⚙️ DFS Value Service"]
    
    TournamentRepo["📊 Tournament Repository"]
    CourseRepo["📊 Course Repository"]
    PlayerRepo["📊 Player Repository"]
    
    UI --> TournamentService
    UI --> CourseService
    UI --> DFSService
    
    TournamentService --> TournamentRepo
    CourseService --> CourseRepo
    PlayerService --> PlayerRepo
    
    DFSService -->|calls| PlayerSkillService
    DFSService -->|calls| CourseIntelService
    DFSService -->|calls| TournamentService
    
    PlayerSkillService -->|reads| PlayerRepo
    CourseIntelService -->|reads| CourseRepo
    
    style UI fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style TournamentService fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style CourseService fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style PlayerService fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style PlayerSkillService fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
    style CourseIntelService fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
    style DFSService fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
```

---

## 6. Intelligence Engine Architecture

```mermaid
graph TB
    Input["📥 Input Data<br/>Samples, Specs, Forecast"]
    Engine["🧠 Pure Intelligence Engine<br/>Deterministic Function<br/>No Side Effects<br/>No External Calls"]
    Output["📤 Output<br/>Scores, Confidence, Metadata"]
    Cache["💾 Request Cache<br/>React cache()"]
    Service["⚙️ Service Layer<br/>Handles Side Effects<br/>Error Recovery<br/>Logging"]
    
    Input --> Engine
    Engine --> Output
    Output --> Cache
    Service -->|calls| Engine
    Service -.->|logs| Output
    Service -.->|persists| Output
    
    style Engine fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
    style Input fill:#16a34a,stroke:#333,stroke-width:2px,color:#fff
    style Output fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style Cache fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style Service fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
```

---

## 7. Error Handling Flow

```mermaid
graph TB
    Request["📥 Request"]
    Validate["✓ Validate Input"]
    ValidError["❌ Validation Error"]
    Query["🔍 Query Repository"]
    QueryError["❌ Query Error"]
    Service["⚙️ Service Logic"]
    ServiceError["❌ Service Error"]
    Success["✅ Success"]
    Response["📤 Response"]
    Log["📊 Logging"]
    
    Request --> Validate
    Validate -->|Error| ValidError
    Validate -->|OK| Query
    Query -->|Error| QueryError
    Query -->|OK| Service
    Service -->|Error| ServiceError
    Service -->|OK| Success
    
    ValidError --> Log
    QueryError --> Log
    ServiceError --> Log
    Success --> Log
    Log --> Response
    
    style Request fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style Success fill:#16a34a,stroke:#333,stroke-width:2px,color:#fff
    style ValidError fill:#dc2626,stroke:#333,stroke-width:2px,color:#fff
    style QueryError fill:#dc2626,stroke:#333,stroke-width:2px,color:#fff
    style ServiceError fill:#dc2626,stroke:#333,stroke-width:2px,color:#fff
    style Response fill:#0891b2,stroke:#333,stroke-width:2px,color:#fff
```

---

## 8. Data Flow: Get Tournament with Intelligence

```mermaid
graph TD
    Component["🎨 Tournament Detail Component"]
    API["🔌 GET /api/tournament/123"]
    Service["⚙️ TournamentService<br/>getTournamentContext"]
    TourRepo["📊 Tournament Repository"]
    CourseService["⚙️ Course Service"]
    SkillService["⚙️ Player Skill Service"]
    CourseIntelService["⚙️ Course Intelligence<br/>Pure Engine"]
    
    DB[(🗄️ Database)]
    Cache["💾 Cache Layer"]
    
    Component -->|fetch| API
    API -->|await| Service
    Service -->|find| TourRepo
    TourRepo -->|query| DB
    DB -->|tournament| TourRepo
    TourRepo -->|tournament| Service
    
    Service -->|getCourse| CourseService
    CourseService -->|getCourse| Cache
    Cache -->|cache miss| DB
    
    Service -->|intelligenceFor| SkillService
    SkillService -->|buildProfile| CourseIntelService
    CourseIntelService -->|pure function| Cache
    
    Service -->|combine| Service
    API -->|return| Component
    Component -->|render| Component
    
    style Component fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style API fill:#0891b2,stroke:#333,stroke-width:2px,color:#fff
    style Service fill:#0284c7,stroke:#333,stroke-width:2px,color:#fff
    style CourseIntelService fill:#ea580c,stroke:#333,stroke-width:2px,color:#fff
    style Cache fill:#7c3aed,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#172554,stroke:#333,stroke-width:2px,color:#fff
```

---

## Cross-Domain Call Patterns

### ✓ ALLOWED Patterns

```
Domain A Service
    ↓
Domain B Service (read-only data)
```

```
Domain A Intelligence Engine
    ↓
Domain A Repository (read-only)
```

```
Component
    ↓
API Route
    ↓
Domain Service
```

### ✗ FORBIDDEN Patterns

```
Component → Prisma (Direct)
Component → Repository
Service → Prisma (Direct)
Repository → Repository (different domain)
Intelligence → Component
Component → Service (Direct)
```

---

## Mermaid Diagram Usage

Copy any diagram above to view in:
- GitHub markdown
- Mermaid Live Editor: https://mermaid.live
- VS Code with Mermaid extension
- Notion, Confluence, etc.

All diagrams render automatically on GitHub markdown files.
