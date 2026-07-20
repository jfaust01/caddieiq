# Tournament Data Flow

**File:** `docs/Tournament_Data_Flow.md`  
**Phase:** 15.3B — Data Flow Documentation  

## Flow Overview

```
SportsDataIO / CSV Import
         ↓
TournamentImporter
  • fetch() → raw tournament list
  • map() → normalize to Tournament model
  • validate() → check required fields
  • persist() → repository.bulkUpsert()
         ↓
Tournament Table (Database)
  • id, name, slug, status, startDate, endDate
  • courseId, tourId, season
         ↓
Tournament Relations Builder
  • Links to Course
  • Links to TournamentCourse
  • Links to TournamentField
         ↓
TournamentRepository
  • findContextById(id)
  • findUpcomingForPlayer(playerId)
  • findByStatus(status)
         ↓
TournamentContextService
  • getTournamentContext(id) → normalized TournamentContext
  • getPlayerActiveContext(playerId) → player's next event
         ↓
API Routes
  • GET /api/tournaments/:id
  • GET /api/tournaments
  • GET /api/tournaments/:id/field
         ↓
React Components
  • TournamentDetailPage
  • TournamentListPage
  • TournamentCommandCenter
```

## Database Schema

### Tournament Table
```typescript
model Tournament {
  id              String              @id
  slug            String              @unique
  name            String
  status          TournamentStatus    // "announced" | "field-set" | "in-progress" | "completed"
  startDate       DateTime
  endDate         DateTime
  tourId          String              // PGA Tour ID
  season          Int
  courseId        String?             // Host course
  course          Course?             @relation(fields: [courseId], references: [id])
  
  // Relations
  field           TournamentField[]
  rounds          Round[]
  courses         TournamentCourse[]
}

enum TournamentStatus {
  announced
  field_set
  in_progress
  completed
}
```

### Related Tables
- `TournamentField` - Player commitments (many-to-many: Tournament ↔ Player)
- `TournamentCourse` - Course hosts (one-to-many: Tournament → Course)
- `Round` - Competition rounds (one-to-many: Tournament → Round)

## Import Pipeline

### Step 1: Fetch
**Source:** SportsDataIO API or CSV upload  
**Provider:** `SportsDataIoProvider.listTournaments()`  
**Raw Output:**
```json
[
  {
    "tournamentId": "cadillac-championship-2026",
    "name": "Cadillac Championship",
    "startDate": "2026-11-12T00:00:00Z",
    "endDate": "2026-11-15T23:59:59Z",
    "courseId": "doral-blue-monster",
    "status": "announced"
  }
]
```

### Step 2: Map (Normalize)
**File:** `lib/imports/tournament-import.ts`  
**Mapper:** `mapSportsDataTournament(raw) → Tournament`  
**Normalization:**
- Convert date strings to DateTime
- Validate status enum
- Extract tour and season from ID
- Normalize slug (lowercase, hyphenated)

**Output:**
```typescript
{
  id: "cadillac-championship-2026",
  slug: "cadillac-championship-2026",
  name: "Cadillac Championship",
  status: "announced",
  startDate: DateTime(2026-11-12),
  endDate: DateTime(2026-11-15),
  tourId: "pga-tour",
  season: 2026,
  courseId: "doral"
}
```

### Step 3: Validate
**File:** `lib/data-quality/validate-tournaments.ts`  
**Checks:**
- ✓ id is non-empty string
- ✓ name is non-empty string
- ✓ startDate < endDate
- ✓ status is valid enum
- ✓ courseId is linked (or null)
- ✓ No duplicate ids

**Failure Mode:** Skip invalid tournament, log error

### Step 4: Persist
**Repository:** `TournamentRepository.bulkUpsert(tournaments)`  
**SQL:**
```sql
INSERT INTO "Tournament" (id, slug, name, status, startDate, endDate, tourId, season, courseId)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (id) DO UPDATE SET
  name = $3,
  status = $4,
  startDate = $5,
  endDate = $6,
  courseId = $9,
  updatedAt = NOW()
```

## Relations Builder

After tournaments are imported, relations builder links them:

### `tournament-relations.ts`
**Purpose:** Link tournaments to courses, create field relationship

1. For each tournament:
   - If courseId provided, verify Course exists
   - If missing, try to resolve via course name
   - Create TournamentCourse relationship
   - Create empty TournamentField

2. Orchestrates field import:
   - When field list arrives, link Player to Tournament via TournamentField

## Data Retrieval

### Repository Pattern
**File:** `lib/repositories/tournament-repository.ts`

```typescript
export interface TournamentRepository {
  findContextById(id: string): Promise<Result<RawTournamentContext>>
  findByStatus(status: TournamentStatus): Promise<Result<Tournament[]>>
  findUpcomingForPlayer(playerId: string): Promise<Result<Tournament | null>>
  findByCoarse(courseId: string): Promise<Result<Tournament[]>>
  bulkUpsert(tournaments: Tournament[]): Promise<Result<number>>
}
```

### Service Layer
**File:** `lib/tournament-context/service.ts`

```typescript
export const tournamentContextService = {
  getTournamentContext(tournamentId: string): Promise<TournamentContext>,
  getPlayerActiveContext(playerId: string): Promise<TournamentContext>
}
```

**Pattern:** Reads through repository, uses React `cache()` for request-level deduplication

**Example Query Chain:**
```typescript
1. getTournamentContext("cadillac-championship-2026")
2. → TournamentRepository.findContextById()
3. → SELECT * FROM Tournament WHERE id = $1
4. → Normalize to TournamentContext
5. → Cache result
6. → Return to caller
```

## API Endpoint

### `GET /api/tournaments/:id`
**File:** `app/api/tournaments/[id]/route.ts`

**Handler Flow:**
```typescript
1. Extract tournamentId from params
2. Call tournamentContextService.getTournamentContext()
3. If not found, return 404
4. If error, return 500
5. Return { tournament, context } JSON
```

**Response:**
```json
{
  "tournament": {
    "id": "cadillac-championship-2026",
    "name": "Cadillac Championship",
    "slug": "cadillac-championship-2026",
    "status": "field-set",
    "startDate": "2026-11-12T00:00:00Z",
    "endDate": "2026-11-15T23:59:59Z",
    "courseId": "doral",
    "courseName": "Doral Blue Monster"
  },
  "context": {
    "tournament": { /* normalized */ },
    "course": { /* normalized */ },
    "fieldConfirmed": true,
    "fieldPlayerCount": 74
  }
}
```

## UI Components

### TournamentDetailPage (`app/(app)/tournaments/[tournamentId]/page.tsx`)
**Data Flow:**
```typescript
1. Page component accepts params: { tournamentId }
2. Calls tournamentContextService.getTournamentContext()
3. Passes context to TournamentCommandCenter
4. TournamentCommandCenter renders:
   - Header (tournament name, dates, status)
   - Overview tab (KPIs, compact leaderboard)
   - Tournament Intel tab (course fit, weather, DFS)
   - Field tab (full leaderboard)
   - News tab
```

### Tournament Header Component
**Data:** Tournament name, dates, status badge, course name

### Field Leaderboard Component
**Data:** TournamentField + Player skills + Course Fit scores
**Dependency:** Must load after Player Skill Intelligence

### Tournament Intel Tab
**Data Tabs:**
- Course Intelligence (linked from Course)
- Weather (linked from Weather Intelligence)
- DFS Value (linked from DFS Service)
- Odds (linked from Odds Intelligence)

## Failure Points

| Point | Failure | Handling | Recovery |
|-------|---------|----------|----------|
| Provider unavailable | API 5xx, timeout | Logged, retry scheduled | Backoff exponential |
| Import validation | Missing courseId | Logged, tournament skipped | Manual linkage required |
| Course not found | courseId doesn't exist | Create orphaned tournament | Link later via relations |
| Field sync fails | Player not found | Field entry skipped | Retry on next import |
| Repository error | DB constraint violated | Transaction rolled back | Data quality issue |
| Service error | Null tournament | Return unavailable context | UI shows placeholder |
| API error | Server exception | Return 500 | Client retry |
| UI load fails | Network timeout | Show cached data | Graceful degradation |

## Refresh Strategy

**Tournament Data:**
- Refresh: Quarterly (off-season)
- Trigger: Scheduled job or manual admin button
- Update: Upsert into existing records
- TTL: None (historical record)

**Tournament Field:**
- Refresh: Weekly during season
- Trigger: Scheduled job
- Update: Add/remove players, update status
- TTL: None (historical record)

**Tournament Status:**
- Refresh: Manual update by admin
- Trigger: PGA Tour announcement
- Update: Status enum change
- TTL: None

## Cross-Domain Dependencies

**Upstream (Required):**
- Course (must exist before tournament can link to it)
- Tour (optional reference)

**Downstream (Depends on Tournament):**
- Tournament Field (requires tournament ID)
- Round (requires tournament ID)
- Weather (tournament determines timing)
- News (scoped to tournament)
- DFS (tournament-specific projections)
- All UI pages (tournament context is entry point)

