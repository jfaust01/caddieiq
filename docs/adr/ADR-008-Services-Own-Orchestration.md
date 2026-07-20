# ADR-008: Services Own Orchestration

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Architecture Team  

---

## Context

Complex operations often require multiple steps:
1. Validate input
2. Fetch related data
3. Call intelligence builders
4. Save results
5. Send notifications
6. Update cache

Where should this orchestration logic live?

Options:
1. **API routes** — Controllers orchestrate
2. **Services** — Business logic layer orchestrates
3. **Repositories** — Data layer orchestrates

---

## Decision

**Services own orchestration.** Services coordinate:
- Repositories (data access)
- Intelligence builders (calculations)
- Other services (cross-domain)
- Side effects (logging, notifications)

API routes are **thin controllers** that call services.

```typescript
// ✓ CORRECT: Thin controller in API route
export async function GET(request: Request, { params }: Props) {
  const result = await tournamentService.getTournamentContext(params.id)
  
  if (!result.ok) {
    return Response.json({ error: result.error.message }, { status: 404 })
  }
  
  return Response.json(result.data)
}

// ✓ CORRECT: Service orchestrates
export class TournamentService {
  async getTournamentContext(tournamentId: string): Promise<Result<TournamentContext>> {
    // 1. Validate
    if (!tournamentId) {
      return { ok: false, error: new ValidationError('Tournament ID required') }
    }
    
    // 2. Get tournament (repository)
    const tournamentResult = await this.tournamentRepository.findById(tournamentId)
    if (!tournamentResult.ok) return tournamentResult
    
    // 3. Get course (another service)
    const courseResult = await this.courseService.getCourse(
      tournamentResult.data.courseId
    )
    if (!courseResult.ok) {
      logger.warn('Course not found', { tournamentId })
    }
    
    // 4. Build field (repository)
    const fieldResult = await this.fieldRepository.findByTournament(tournamentId)
    if (!fieldResult.ok) return fieldResult
    
    // 5. Build context (orchestration)
    const context: TournamentContext = {
      tournament: tournamentResult.data,
      course: courseResult.ok ? courseResult.data : null,
      field: fieldResult.data
    }
    
    return { ok: true, data: context }
  }
}
```

---

## Rationale

### ✓ Advantages of Service Orchestration

1. **Single Responsibility**
   - API route: HTTP handling only
   - Service: business logic orchestration
   - Repository: data access only
   - Clear boundaries

2. **Reusability**
   - Service can be called from:
     - API routes
     - Other services
     - Scheduled jobs
     - Webhooks
   - Same logic everywhere

3. **Testability**
   - Can test business logic without HTTP
   - Can mock services in tests
   - Can focus on orchestration logic
   - No HTTP complexity

4. **Maintainability**
   - Business logic in one place
   - API routes stay thin
   - Easy to change orchestration
   - Easy to find where logic lives

5. **Error Handling**
   - Services handle errors gracefully
   - API routes just format responses
   - Consistent error handling
   - Clear error propagation

### ✗ Problems with Fat Controllers

```typescript
// ❌ WRONG: Controller orchestrates
export async function GET(request: Request, { params }: Props) {
  try {
    // Validation in controller
    if (!params.id) {
      return Response.json({ error: 'ID required' }, { status: 400 })
    }
    
    // Data fetching in controller
    const tournament = await prisma.tournament.findUnique(...)
    if (!tournament) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    
    // Business logic in controller
    const course = await prisma.course.findUnique(...)
    const fit = calculateFit(tournament, course)
    
    // Transformation in controller
    const response = {
      id: tournament.id,
      name: tournament.name,
      fit: fit
    }
    
    return Response.json(response)
  } catch (error) {
    // Error handling in controller
    logger.error('Error', { error })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// Problems:
// 1. Can't reuse logic elsewhere
// 2. Hard to test without HTTP
// 3. Business logic mixed with HTTP
// 4. Hard to find where logic lives
// 5. Difficult to change orchestration
```

---

## Orchestration Pattern

### Layer Separation

```
API Route (thin controller)
    ↓ calls
Service (orchestration)
    ├─ calls Repository (data)
    ├─ calls Intelligence Builder (calculation)
    ├─ calls Other Service (cross-domain)
    └─ coordinates everything
```

### Coordination Examples

**1. Simple orchestration**
```typescript
async function getSingleTournament(id: string) {
  const result = await repository.findById(id)
  if (!result.ok) return result
  
  return { ok: true, data: result.data }
}
```

**2. Cross-domain coordination**
```typescript
async function getTournamentWithCourse(tournamentId: string) {
  const tournament = await this.tournamentRepository.findById(tournamentId)
  if (!tournament.ok) return tournament
  
  const course = await this.courseService.getCourse(tournament.data.courseId)
  
  return {
    ok: true,
    data: {
      tournament: tournament.data,
      course: course.ok ? course.data : null
    }
  }
}
```

**3. Intelligence coordination**
```typescript
async function getPlayerSkill(playerId: string) {
  const player = await this.playerRepository.findById(playerId)
  if (!player.ok) return player
  
  const samples = await this.playerRepository.getSamples(playerId)
  if (!samples.ok) return samples
  
  const population = await this.playerRepository.getPopulation()
  if (!population.ok) return population
  
  // Call pure builder
  const profile = buildPlayerSkillProfile(samples.data, population.data)
  
  return profile
}
```

**4. Multi-step transaction**
```typescript
async function createTournamentWithField(
  tournamentData: TournamentInput,
  fieldData: FieldInput[]
) {
  try {
    // 1. Create tournament
    const tournament = await this.tournamentRepository.create(tournamentData)
    if (!tournament.ok) return tournament
    
    // 2. Create field entries
    const field = await this.fieldRepository.createMany(
      fieldData.map(f => ({
        ...f,
        tournamentId: tournament.data.id
      }))
    )
    if (!field.ok) {
      // Rollback tournament
      await this.tournamentRepository.delete(tournament.data.id)
      return field
    }
    
    // 3. Notify stakeholders
    await this.notificationService.sendTournamentCreated(tournament.data)
    
    return { ok: true, data: { tournament: tournament.data, field: field.data } }
  } catch (error) {
    logger.error('Error creating tournament', { error })
    return { ok: false, error: new Error('Failed to create tournament') }
  }
}
```

---

## API Route Pattern

```typescript
import { tournamentService } from '@/lib/tournament-context/service'

export async function GET(request: Request, { params }: Props) {
  const result = await tournamentService.getTournamentContext(params.id)
  
  // Only formatting, no logic
  if (!result.ok) {
    const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500
    return Response.json(
      {
        error: result.error.code,
        message: result.error.message
      },
      { status: statusCode }
    )
  }
  
  return Response.json(result.data)
}
```

---

## Testing Service Orchestration

```typescript
describe('TournamentService', () => {
  let service: TournamentService
  let mockTournamentRepo: jest.Mocked<TournamentRepository>
  let mockCourseService: jest.Mocked<CourseService>
  
  beforeEach(() => {
    mockTournamentRepo = { findById: jest.fn() } as any
    mockCourseService = { getCourse: jest.fn() } as any
    
    service = new TournamentService(mockTournamentRepo, mockCourseService)
  })
  
  it('returns tournament with course when both found', async () => {
    mockTournamentRepo.findById.mockResolvedValue({
      ok: true,
      data: { id: '123', courseId: 'doral' }
    })
    mockCourseService.getCourse.mockResolvedValue({
      ok: true,
      data: { id: 'doral', name: 'Doral' }
    })
    
    const result = await service.getTournamentContext('123')
    
    expect(result.ok).toBe(true)
    expect(result.data.tournament.id).toBe('123')
    expect(result.data.course.name).toBe('Doral')
  })
  
  it('handles missing course gracefully', async () => {
    mockTournamentRepo.findById.mockResolvedValue({
      ok: true,
      data: { id: '123', courseId: 'missing' }
    })
    mockCourseService.getCourse.mockResolvedValue({
      ok: false,
      error: new Error('Not found')
    })
    
    const result = await service.getTournamentContext('123')
    
    expect(result.ok).toBe(true)
    expect(result.data.course).toBeNull()
  })
})
```

---

## Consequences

### ✓ Positive

- API routes stay thin
- Business logic centralized
- Reusable across entry points
- Easy to test
- Clear orchestration
- Easy to change coordination

### ✗ Negative

- More service files
- Requires service layer discipline
- Need to resist putting logic in API
- Team needs understanding

---

## Related ADRs

- ADR-001: Feature-based architecture enables service ownership
- ADR-003: Repositories don't orchestrate
- ADR-005: Result<T> enables clear orchestration

