# Service Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Definition

Services contain **business logic and orchestration**. Services coordinate repositories, intelligence engines, and cross-domain interactions.

**Rule:** All business logic lives in services, not repositories or components.

---

## Responsibilities

### ✓ DO

- Orchestrate repositories
- Implement business rules
- Call intelligence engines
- Validate input data
- Coordinate transactions
- Handle errors and logging
- Cache results (with React cache())
- Use server-only imports for security

### ✗ DON'T

- Call Prisma directly
- Render UI or return React components
- Format data for presentation
- Perform database queries directly
- Contain presentation logic
- Access HTTP context (use API routes for that)

---

## Standard Pattern

```typescript
import 'server-only'

type Result<T> = { ok: true; data: T } | { ok: false; error: Error }

export class TournamentService {
  constructor(
    private tournamentRepository: TournamentRepository,
    private courseService: CourseService
  ) {}
  
  async getTournamentContext(tournamentId: string): Promise<Result<TournamentContext>> {
    try {
      // 1. Validate input
      if (!tournamentId || typeof tournamentId !== 'string') {
        return { ok: false, error: new Error('Invalid tournament ID') }
      }
      
      // 2. Call repository
      const tournamentResult = await this.tournamentRepository.findById(tournamentId)
      if (!tournamentResult.ok) {
        return tournamentResult
      }
      const tournament = tournamentResult.data
      
      // 3. Get related data from other services
      const courseResult = await this.courseService.getCourse(tournament.courseId)
      if (!courseResult.ok) {
        // Handle gracefully
        logger.warn('Course not found', { tournamentId, courseId: tournament.courseId })
      }
      
      // 4. Build context
      const context: TournamentContext = {
        tournament,
        course: courseResult.ok ? courseResult.data : null,
        field: { /* ... */ }
      }
      
      return { ok: true, data: context }
    } catch (error) {
      logger.error('Error getting tournament context', { tournamentId, error })
      return { ok: false, error: new Error('Failed to get tournament context') }
    }
  }
}
```

---

## Request-Level Deduplication

Use React `cache()` to prevent duplicate queries within one request:

```typescript
import { cache } from 'react'

const getTournamentCached = cache(
  async (tournamentId: string): Promise<Tournament> => {
    const result = await tournamentRepository.findById(tournamentId)
    if (!result.ok) throw result.error
    return result.data
  }
)

export const tournamentService = {
  getTournament: getTournamentCached
}
```

**Why:** If multiple components request the same tournament in one request:
- First call: hits database
- Subsequent calls: returns cached result
- Result: Only one database query per request

---

## Server-Only Security

All core services must use `server-only` import:

```typescript
import 'server-only'
import { apiKey } from '@/lib/env' // Secret

export const golfCourseApiService = {
  async fetchCourse(courseId: string) {
    // This code will never run in the browser
    const response = await fetch('https://golfcourseapi.com/...', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    return response.json()
  }
}
```

**Without `'server-only'`:**
- Service code gets included in JavaScript bundle sent to browser
- Secrets are exposed
- Business logic is visible to users
- Security vulnerability

**With `'server-only'`:**
- Build fails if component tries to import service
- Secrets stay on server
- Business logic never leaves server
- Secure

---

## Error Handling

All services must handle errors consistently:

```typescript
export class PlayerSkillIntelligenceService {
  async getPlayerProfile(playerId: string): Promise<Result<PlayerSkillProfile>> {
    try {
      // 1. Validate input
      if (!playerId) {
        logger.error('Invalid player ID', { playerId })
        return unavailableSkillProfile(
          playerId,
          [{ code: 'invalid-input', detail: 'Player ID required' }],
          'Cannot build profile without valid player ID'
        )
      }
      
      // 2. Check if player exists
      const playerResult = await this.playerRepository.findById(playerId)
      if (!playerResult.ok) {
        return unavailableSkillProfile(
          playerId,
          [{ code: 'not-found', detail: playerResult.error.message }],
          'Player not found'
        )
      }
      
      // 3. Get samples
      const samplesResult = await this.playerRepository.findSamples(playerId)
      if (!samplesResult.ok) {
        logger.error('Failed to get samples', { playerId, error: samplesResult.error })
        return unavailableSkillProfile(
          playerId,
          [{ code: 'no-samples', detail: 'Could not retrieve round history' }],
          'No verified round statistics available'
        )
      }
      
      // 4. Return honest unavailable if insufficient data
      if (samplesResult.data.length < MINIMUM_SAMPLES) {
        return unavailableSkillProfile(
          playerId,
          [{ code: 'insufficient-samples', detail: `Only ${samplesResult.data.length} rounds` }],
          'Requires minimum round history to build profile'
        )
      }
      
      // 5. Build profile
      const population = await this.playerRepository.getPopulation()
      const profile = buildPlayerSkillProfile(samplesResult.data, population)
      
      return { ok: true, data: profile }
    } catch (error) {
      logger.error('Unexpected error building profile', { playerId, error })
      return unavailableSkillProfile(
        playerId,
        [{ code: 'internal-error', detail: String(error) }],
        'Internal error building profile'
      )
    }
  }
}

function unavailableSkillProfile(
  playerId: string,
  errors: ErrorDetail[],
  message: string
): Result<PlayerSkillProfile> {
  return {
    ok: false,
    error: new ServiceError(
      'UNAVAILABLE',
      message,
      { playerId, reasons: errors }
    )
  }
}
```

---

## Logging

Services must log important operations:

```typescript
import { logger } from '@/lib/logger'

export class TournamentService {
  async createTournament(data: TournamentInput): Promise<Result<Tournament>> {
    logger.info('Creating tournament', { name: data.name, status: 'started' })
    
    try {
      const result = await this.tournamentRepository.create(data)
      if (result.ok) {
        logger.info('Tournament created', { id: result.data.id, name: data.name })
      } else {
        logger.error('Failed to create tournament', { error: result.error })
      }
      return result
    } catch (error) {
      logger.error('Error creating tournament', { error, data })
      throw error
    }
  }
}
```

---

## Testing

All services must have integration tests:

```typescript
describe('TournamentService', () => {
  let service: TournamentService
  let mockRepository: jest.Mocked<TournamentRepository>
  let mockCourseService: jest.Mocked<CourseService>
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn()
    } as any
    
    mockCourseService = {
      getCourse: jest.fn()
    } as any
    
    service = new TournamentService(mockRepository, mockCourseService)
  })
  
  describe('getTournamentContext', () => {
    it('returns context when tournament found', async () => {
      const tournament = { id: '123', name: 'Cadillac', courseId: 'doral' }
      mockRepository.findById.mockResolvedValue({ ok: true, data: tournament })
      mockCourseService.getCourse.mockResolvedValue({ 
        ok: true, 
        data: { id: 'doral', name: 'Doral' } 
      })
      
      const result = await service.getTournamentContext('123')
      
      expect(result.ok).toBe(true)
      expect(result.data.tournament).toEqual(tournament)
    })
    
    it('handles course not found gracefully', async () => {
      const tournament = { id: '123', name: 'Cadillac', courseId: 'missing' }
      mockRepository.findById.mockResolvedValue({ ok: true, data: tournament })
      mockCourseService.getCourse.mockResolvedValue({ 
        ok: false, 
        error: new Error('Not found') 
      })
      
      const result = await service.getTournamentContext('123')
      
      expect(result.ok).toBe(true)
      expect(result.data.course).toBeNull()
    })
  })
})
```

---

## Anti-Patterns

🚩 **Service calling Prisma directly**
```typescript
// ❌ WRONG
export class TournamentService {
  async getTournament(id: string) {
    return prisma.tournament.findUnique({ where: { id } })
  }
}
```

🚩 **Service rendering components**
```typescript
// ❌ WRONG
export async function getTournamentView(id: string) {
  const tournament = await getContext(id)
  return <TournamentComponent tournament={tournament} />
}
```

🚩 **No error handling**
```typescript
// ❌ WRONG
export class PlayerService {
  async getPlayer(id: string) {
    return this.repository.findById(id) // Errors not caught
  }
}
```

🚩 **Side effects mixed with logic**
```typescript
// ❌ WRONG
export async function updateTournament(id: string, data: any) {
  const result = await this.repository.update({ id, ...data })
  // Direct side effect, hard to test
  await analytics.track('tournament-updated', { id })
  return result
}
```

---

## Checklist

Before submitting a service for review:

- [ ] Implements business logic clearly
- [ ] No Prisma calls (uses repositories)
- [ ] No React components or presentation
- [ ] Uses `server-only` import
- [ ] All methods return Result<T>
- [ ] Proper error handling and logging
- [ ] Coordinate related services well
- [ ] Request-level caching with React cache()
- [ ] Integration tests with 80%+ coverage
- [ ] Follows naming conventions
- [ ] Clear responsibility boundaries

