# ADR-017: Testing Strategy with Vitest

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** QA & Engineering Team  

---

## Context

CaddieIQ needs tests for:
- Business logic (builders, services, calculations)
- API endpoints
- React components (future)

---

## Decision

**Use Vitest for unit tests and integration tests.**

```typescript
// lib/tournament/service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TournamentService } from './service'

describe('TournamentService', () => {
  let service: TournamentService
  let mockRepository: jest.Mocked<TournamentRepository>
  
  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      list: vi.fn()
    } as any
    
    service = new TournamentService(mockRepository)
  })
  
  describe('create', () => {
    it('creates tournament with valid input', async () => {
      mockRepository.create.mockResolvedValue({
        ok: true,
        data: { id: '1', name: 'Test Tournament' }
      })
      
      const result = await service.create({ name: 'Test Tournament' })
      
      expect(result.ok).toBe(true)
      expect(result.data.name).toBe('Test Tournament')
    })
    
    it('returns error for invalid input', async () => {
      const result = await service.create({ name: '' })
      
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
```

---

## Test Categories

### 1. Unit Tests (Pure Functions)
```typescript
describe('buildPlayerSkillProfile', () => {
  it('calculates correct percentiles', () => {
    const profile = buildPlayerSkillProfile(sampleRounds, population)
    
    expect(profile.percentiles.long).toBe(0.85)
  })
})
```

### 2. Integration Tests (Service + Repository)
```typescript
describe('TournamentService with real repository', () => {
  it('creates and retrieves tournament', async () => {
    const created = await service.create(data)
    const retrieved = await service.getById(created.data.id)
    
    expect(retrieved.data).toEqual(created.data)
  })
})
```

### 3. API Tests (Server Actions)
```typescript
describe('createTournament Server Action', () => {
  it('returns structured response', async () => {
    const response = await createTournament(validInput)
    
    expect(response).toHaveProperty('ok')
    expect(response).toHaveProperty('data')
  })
})
```

---

## Consequences

### ✓ Positive

- Catches regressions early
- Enables refactoring with confidence
- Documents expected behavior
- Vitest is fast and modern
- Works with Next.js

### ✗ Negative

- Tests add development time
- Maintenance burden
- Requires discipline

---

## Related ADRs

- ADR-007: Builders are pure functions (easy to test)
- ADR-005: Result<T> enables consistent testing

