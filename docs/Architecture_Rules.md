# CaddieIQ Architecture Rules

**Documented:** July 20, 2026  
**Audience:** All engineers  
**Purpose:** Architectural rules and constraints

---

## Layer Responsibilities

### Presentation Layer (`app/` + `components/`)

**MUST:**
- Render UI
- Handle user input
- Manage client-side state (React hooks, Context)
- Call API routes or Server Actions
- Format data for display

**MUST NOT:**
- Query the database directly
- Perform business logic calculations
- Call external APIs (except through API routes)
- Validate against business rules
- Cache data
- Implement authentication logic

**Example:**
```typescript
// ✅ Correct
export default function PlayerPage({ params }: { params: { id: string } }) {
  const { player } = useSWR(`/api/players/${params.id}`, fetcher)
  return <PlayerDetail player={player} />
}

// ❌ Wrong: database query in component
export default function PlayerPage({ params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({ where: { id: params.id } })
  return <PlayerDetail player={player} />
}
```

---

### API Route Layer (`app/api/`)

**MUST:**
- Validate HTTP input (request body, query params)
- Authenticate requests (check auth token)
- Authorize actions (check user permissions)
- Call service layer or repositories
- Transform response to JSON/HTTP
- Handle errors and return HTTP status codes

**MUST NOT:**
- Perform intelligence calculations (call services)
- Access database directly (use repositories)
- Call external APIs directly (use providers)
- Implement business logic
- Directly query Prisma

**Example:**
```typescript
// ✅ Correct
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request)
  if (!user) return new Response('Unauthorized', { status: 401 })
  
  const playerService = new PlayerService(playerRepository)
  const player = await playerService.getPlayerById(params.id)
  
  return Response.json({ data: player })
}

// ❌ Wrong: database query in API route
export async function GET(request: Request) {
  const player = await prisma.player.findMany()
  return Response.json(player)
}
```

---

### Feature Module Layer (`features/`)

**MUST:**
- Encapsulate feature-specific logic
- Provide reusable components for the feature
- Manage feature-scoped state
- Coordinate with service layer
- Export public API from `index.ts`

**MUST NOT:**
- Query the database (use repositories)
- Call external APIs (use import system)
- Implement core business logic (use services)
- Depend on other features' private implementation
- Export implementation details

**Example:**
```typescript
// ✅ Correct: feature exports public API
// features/tournaments/index.ts
export { TournamentDetail } from './components/tournament-detail'
export { useTournamentData } from './hooks/use-tournament-data'
export type { TournamentDetailProps } from './types'

// ❌ Wrong: internal implementation exported
export { TournamentAnalyticsCalculator } from './services/analytics'
export { tournamentRepository } from './private/repository'
```

---

### Service Layer (`lib/services/`)

**MUST:**
- Orchestrate repositories
- Apply domain business rules
- Coordinate intelligence domains
- Call multiple repositories for complex operations
- Return domain models

**MUST NOT:**
- Query the database directly (use repositories)
- Call external APIs (use providers through import system)
- Format for presentation (transform to domain models only)
- Implement presentation logic
- Handle HTTP requests

**Example:**
```typescript
// ✅ Correct
export class TournamentService {
  async getTournamentWithAnalytics(tournamentId: string) {
    const tournament = await this.tournamentRepository.findById(tournamentId)
    const course = await this.courseRepository.findById(tournament.courseId)
    const analysis = await this.courseIntelligence.analyze(course)
    return { tournament, analysis }
  }
}

// ❌ Wrong: direct database query
export class TournamentService {
  async getTournament(tournamentId: string) {
    return prisma.tournament.findUnique({ where: { id: tournamentId } })
  }
}
```

---

### Repository Layer (`lib/repositories/`)

**MUST:**
- Query the database using Prisma
- Implement idempotent upsert by slug
- Handle bulk operations
- Log all operations
- Convert database errors to typed errors
- Return domain models (or structured results)

**MUST NOT:**
- Implement business logic
- Make decisions about what to update
- Call external APIs
- Call services
- Format for presentation

**Example:**
```typescript
// ✅ Correct
export class PlayerRepository extends BaseRepository {
  async upsertPlayer(player: Player): Promise<RepositoryResult<StoredPlayer>> {
    return this.upsertBySlug(
      this.prisma.player,
      {
        slug: player.externalRef.slug,
        create: { /* map domain to create input */ },
        update: { /* map domain to update input */ }
      },
      'player'
    )
  }
}

// ❌ Wrong: business logic in repository
export class PlayerRepository {
  async updatePlayerIfSkillChanged(player: Player) {
    const existing = await this.getPlayer(player.id)
    if (existing.skill !== player.skill) {
      // Don't add business logic here
      return await this.updatePlayer(player)
    }
  }
}
```

---

### Intelligence Domain Layer (`lib/*-intelligence/`)

**MUST:**
- Perform analytical calculations
- Generate confidence/probability estimates
- Produce explanations for results
- Use consistent scoring/rating scales
- Cache expensive calculations
- Document assumptions and formulas

**MUST NOT:**
- Access the database except through repositories
- Call external APIs
- Make business decisions (only provide analysis)
- Format for presentation
- Perform validation

**Example:**
```typescript
// ✅ Correct
export class CourseIntelligence {
  async analyzeForPlayer(course: Course, player: Player): Promise<CourseAnalysis> {
    const fit = this.calculateFit(course, player)
    const confidence = this.estimateConfidence(fit.score)
    const explanation = this.generateExplanation(fit, player)
    return { fit, confidence, explanation }
  }
  
  private calculateFit(course: Course, player: Player): FitScore {
    // Pure calculation logic
    const strengthMatch = this.scoreStrengthMatch(course, player)
    const styleMatch = this.scoreStyleMatch(course, player)
    return this.aggregate(strengthMatch, styleMatch)
  }
}

// ❌ Wrong: intelligence modifying database
export class CourseIntelligence {
  async analyzeAndSave(courseId: string, playerId: string) {
    const analysis = await this.analyze(courseId, playerId)
    await prisma.courseAnalysis.create({ data: analysis })  // Don't do this
  }
}
```

---

### Provider Layer (`lib/providers/`)

**MUST:**
- Handle API authentication
- Perform HTTP requests
- Parse API responses
- Handle API errors and retry logic
- Rate limit requests
- Return typed raw responses

**MUST NOT:**
- Map to domain models (domain mappers do that)
- Query the database
- Call other providers directly
- Implement business logic
- Validate data against business rules

**Example:**
```typescript
// ✅ Correct
export class SportsDataIOProvider extends BaseProvider {
  async getPlayer(playerExternalId: string): Promise<SportsDataIOPlayerPayload> {
    const response = await this.request('GET', `/players/${playerExternalId}`)
    return response as SportsDataIOPlayerPayload
  }
}

// In domain/player/mapper.ts
export function mapSportsDataPlayer(payload: SportsDataIOPlayerPayload): Player {
  // Domain mapping happens here, not in provider
  return { /* ... */ }
}

// ❌ Wrong: domain mapping in provider
export class SportsDataIOProvider {
  async getPlayer(playerExternalId: string): Promise<Player> {
    const response = await this.request('GET', `/players/${playerExternalId}`)
    return mapToPlayer(response)  // Don't do this
  }
}
```

---

### Import System Layer (`lib/imports/`)

**MUST:**
- Coordinate provider calls
- Call domain mappers
- Validate domain objects (when validation exists)
- Call repositories to persist
- Log import progress
- Track results (successes, failures, partial)

**MUST NOT:**
- Implement complex business logic
- Make decisions (pass decisions to services)
- Update derived data (only import source data)
- Directly manipulate Prisma

**Example:**
```typescript
// ✅ Correct
export async function importPlayers(externalPlayerIds: string[]) {
  const results: BulkResult<Player> = []
  
  for (const externalId of externalPlayerIds) {
    try {
      const rawPlayer = await sportsDataIO.getPlayer(externalId)
      const player = mapSportsDataPlayer(rawPlayer)
      const result = await playerRepository.upsertPlayer(player)
      results.push(result)
    } catch (error) {
      results.push(fail(`player-${externalId}`, error))
    }
  }
  
  return results
}

// ❌ Wrong: complex logic in importer
export async function importAndAnalyzePlayers() {
  const players = await importPlayers()
  // Don't add complex logic here, use services
  for (const player of players) {
    const analysis = await courseIntelligence.analyze(player)
    await persistAnalysis(analysis)  // Wrong place
  }
}
```

---

### Domain Model Layer (`lib/domain/`)

**MUST:**
- Define canonical data structures
- Include type definitions
- Include constants and enums
- Include mappers (provider raw → domain)
- Be immutable (readonly properties)
- Include documentation

**MUST NOT:**
- Implement methods with side effects
- Query the database
- Call external APIs
- Depend on repositories
- Implement business logic

**Example:**
```typescript
// ✅ Correct
export type Player = {
  readonly id: string
  readonly externalRef: ExternalReference
  readonly name: string
  readonly nationality: string
  readonly handedness: Handedness
}

export function mapSportsDataPlayer(raw: SportsDataIOPayload): Player {
  return {
    id: '',  // Assigned by repository
    externalRef: {
      source: 'sportsdataio',
      id: raw.player_id,
      slug: slugify(`sportsdataio-${raw.player_id}`)
    },
    name: cleanString(raw.first_name + ' ' + raw.last_name),
    nationality: raw.nationality,
    handedness: parseHandedness(raw.plays)
  }
}

// ❌ Wrong: logic in domain
export type Player = {
  readonly id: string
  
  async fetchStats(): Promise<PlayerStats> {
    // Don't do this
  }
}
```

---

## Cross-Cutting Rules

### Database Access

**Rule:** Only repositories may access the database.

```typescript
// ✅ Correct
const player = await playerRepository.findById(id)

// ❌ Wrong
const player = await prisma.player.findUnique({ where: { id } })

// ❌ Wrong: in a component
const player = await db.query.player({ where: { id } })
```

### External API Calls

**Rule:** Only providers call external APIs; imports coordinate providers.

```typescript
// ✅ Correct: in provider
const data = await fetch(API_URL, { headers })

// ✅ Correct: in import
const raw = await sportsDataIO.getPlayer(id)

// ❌ Wrong: direct fetch in service
const data = await fetch(EXTERNAL_API, ...)

// ❌ Wrong: direct fetch in feature
const response = await fetch(API_URL)
```

### Business Logic Location

**Rule:** Logic belongs in the layer appropriate to its scope.

| Logic Type | Location | Example |
|-----------|----------|---------|
| Feature UI | Feature components | Conditional rendering, tabs |
| Feature state | Feature hooks | useTournamentData hook |
| Orchestration | Services | Call 3 repos, aggregate result |
| Single entity op | Repository | Create/update single record |
| Analysis | Intelligence | Score a course-fit |
| External fetch | Provider | Call SportsDataIO |
| Mapping | Domain mapper | Raw → domain model |
| Coordination | Import | Provider → mapper → repo |

### Error Handling

**Rule:** Catch and handle errors at the appropriate layer.

```typescript
// ✅ Provider: catch API errors
try {
  return await fetch(url)
} catch (error) {
  // Handle API error, retry, etc.
}

// ✅ Repository: catch Prisma errors
try {
  return await prisma.player.update(...)
} catch (error) {
  throw new RepositoryError('update', 'player', error)
}

// ✅ API Route: catch service errors
try {
  const result = await service.doSomething()
} catch (error) {
  return new Response(JSON.stringify(error), { status: 500 })
}

// ❌ Don't: swallow errors
try {
  // operation
} catch {
  // silence
}
```

### Data Validation

**Rule:** Validate at entry points; trust once validated.

```typescript
// ✅ Validate in API route
export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name || typeof body.name !== 'string') {
    return new Response('Invalid name', { status: 400 })
  }
  // Trust name from here on
}

// ✅ Validate in import before persistence
const player = mapSportsDataPlayer(raw)
if (!player.name || !player.nationality) {
  return fail(`Invalid player`, error)
}

// ❌ Don't: validate in multiple layers
// Avoid repeating the same validation everywhere
```

### Dependency Injection

**Rule:** Inject dependencies; don't instantiate globally.

```typescript
// ✅ Correct: inject repository
export class PlayerService {
  constructor(private repository: PlayerRepository) {}
  
  async getPlayer(id: string) {
    return this.repository.findById(id)
  }
}

// ❌ Wrong: global instance
const repository = new PlayerRepository()

export class PlayerService {
  async getPlayer(id: string) {
    return repository.findById(id)
  }
}
```

### Testing

**Rule:** All business logic layers must be testable.

```typescript
// ✅ Testable: mocked repositories
describe('PlayerService', () => {
  it('fetches player', async () => {
    const mockRepo = { findById: jest.fn() }
    const service = new PlayerService(mockRepo)
    await service.getPlayer('123')
    expect(mockRepo.findById).toHaveBeenCalledWith('123')
  })
})

// ❌ Non-testable: global dependencies
describe('PlayerService', () => {
  it('fetches player', async () => {
    // Can't test without real database
    const player = await globalPlayerRepository.findById('123')
  })
})
```

---

## Architectural Violations

### Common Violations

1. **Database query in service/component**
   - ❌ `const user = await prisma.user.findUnique(...)`
   - ✅ `const user = await userRepository.findById(...)`

2. **Business logic in repository**
   - ❌ `if (player.skill > 50) { /* update logic */ }`
   - ✅ `return this.upsertBySlug(plan)`

3. **API call in service**
   - ❌ `const data = await fetch(EXTERNAL_API)`
   - ✅ `const data = await provider.getData()`

4. **Intelligence in component**
   - ❌ `const fit = scoreCourseFit(course, player)`
   - ✅ `const fit = await courseIntelligence.analyze(course, player)`

5. **Direct Prisma in API route**
   - ❌ `const player = await prisma.player.findMany()`
   - ✅ `const player = await playerService.getPlayers()`

### Detecting Violations

```bash
# Search for Prisma usage outside repositories
grep -r "prisma\." app/ features/ lib/ --include="*.ts" | grep -v "lib/repositories" | grep -v "\.test"

# Search for external API calls outside providers
grep -r "fetch(" lib/ --include="*.ts" | grep -v "lib/providers"

# Search for imports from "next/db" or similar
grep -r "from.*prisma" app/ components/ features/ --include="*.ts"
```

---

## Performance Rules

### Database Queries

1. **N+1 Problem:** Use `include` to fetch related data
   ```typescript
   // ✅ Correct: single query
   const tournament = await prisma.tournament.findUnique({
     where: { id },
     include: { course: true, field: true }
   })
   
   // ❌ Wrong: N+1
   const tournament = await prisma.tournament.findUnique({ where: { id } })
   const course = await prisma.course.findUnique({ where: { id: tournament.courseId } })
   ```

2. **Pagination:** Use `skip` and `take` for large result sets
   ```typescript
   // ✅ Correct
   const players = await playerRepository.find({ skip: 0, take: 20 })
   
   // ❌ Wrong: fetching entire table
   const players = await playerRepository.findAll()
   ```

3. **Indexing:** Add database indexes for frequently queried fields
   - Done in Prisma schema via `@@index`

### API Performance

1. **Server Components:** Use by default to reduce client JavaScript
2. **Caching:** Cache at repository/service level (planned: Redis)
3. **Lazy Loading:** Load related data on-demand, not upfront

---

## Security Rules

### Authentication

1. **Check auth in API routes**
   ```typescript
   const user = await getAuthenticatedUser(request)
   if (!user) return new Response('Unauthorized', { status: 401 })
   ```

2. **Never trust client input**
   ```typescript
   const input = await request.json()
   if (typeof input.name !== 'string') return error
   ```

### Authorization

1. **Check permissions**
   ```typescript
   if (user.id !== userId && user.role !== 'ADMIN') {
     return new Response('Forbidden', { status: 403 })
   }
   ```

### Data Validation

1. **Validate before persistence**
2. **Sanitize user input**
3. **Use parameterized queries** (Prisma handles this)

---

## Documentation Rules

### Code Documentation

1. **Complex functions:** Include JSDoc
2. **Public APIs:** Document parameters and return types
3. **Architectural decisions:** Add comments explaining why

### Folder Documentation

1. Each folder should have `README.md` if complex
2. Link new folders from architecture docs
3. Update this guide when architecture changes

---

## Review Checklist

When reviewing code, verify:

- [ ] Database queries only in repositories
- [ ] External APIs only in providers
- [ ] Business logic in services or intelligence
- [ ] No circular dependencies
- [ ] Components accept data as props
- [ ] Tests mock dependencies
- [ ] Errors handled appropriately
- [ ] Documentation updated

