# ADR-003: Repositories Contain No Business Logic

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Architecture Team  

---

## Context

Where should business logic live? Three options:

1. **Repositories** — Data access layer
2. **Services** — Business logic layer
3. **Both** — Some logic in repositories, some in services

The challenge is preventing repositories from becoming "fat" while keeping data access clean.

---

## Decision

**Repositories contain ONLY data access logic. All business logic lives in services.**

**Repositories are responsible for:**
- Query construction
- Data mapping
- Transaction handling
- Error handling for database errors
- Caching (performance only)

**Services are responsible for:**
- Validation
- Business rules
- Calculations
- Orchestration
- Cross-domain calls

---

## Rationale

### ✓ Advantages

1. **Single Responsibility**
   - Repository: "How do we access data?"
   - Service: "What should we do with data?"
   - Clear separation

2. **Testability**
   - Mock repositories in service tests
   - Mock services in component tests
   - Business logic isolated for testing

3. **Reusability**
   - Same repository used by multiple services
   - Each service has different business logic
   - No duplicate logic

4. **Debugging**
   - Error in calculation? Check service
   - Error in query? Check repository
   - Clear ownership

5. **Performance**
   - Can optimize queries without changing logic
   - Can add caching without affecting business rules
   - Can change storage without changing business

### ✗ Alternative: Business Logic in Repository

```typescript
// ❌ WRONG: Business logic in repository
class PlayerRepository {
  async getPlayerSkill(playerId: string) {
    const player = await prisma.player.findUnique(...)
    
    // Business logic in repository!
    const samples = await prisma.playerRound.findMany(...)
    const skills = calculateSkills(samples)  // ❌
    const percentiles = normalizePercentiles(skills)  // ❌
    
    return { skills, percentiles }
  }
}
```

**Problems:**
- Can't reuse calculation logic elsewhere
- Can't test calculation without database
- Repository does too much
- Hard to change calculation logic

---

## Alternatives Considered

### Alternative 1: Repository with Business Logic
**Rejected:** Makes repositories fat, hard to test, low cohesion.

### Alternative 2: Service with Database Access
```typescript
// ❌ WRONG: Service calling Prisma directly
class PlayerService {
  async getSkill(playerId: string) {
    const player = await prisma.player.findUnique(...)
    // ...
  }
}
```
**Rejected:** No repository abstraction, hard to change database, harder to test.

### Alternative 3: Utility Functions for Logic
```typescript
// ✓ OK but inferior to services
const calculateSkills = (samples) => { ... }

class PlayerService {
  async getSkill(playerId: string) {
    const samples = await this.repository.getSamples(playerId)
    return calculateSkills(samples)
  }
}
```
**Better but rejected:** Loses dependency injection, harder to orchestrate, utilities scattered.

---

## Consequences

### ✓ Positive

- Clear responsibility boundaries
- Easy to test business logic
- Easy to test data access
- Repositories can be reused
- Can change storage without changing logic
- Services orchestrate clearly

### ✗ Negative

- Need repositories for most entities
- More files to maintain
- Requires discipline to keep separate
- Some code duplication possible
- Team needs to understand pattern

---

## Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Business logic in repository
class CourseRepository {
  async getCourseForPlayer(courseId: string, playerId: string) {
    const course = await prisma.course.findUnique(...)
    const player = await prisma.player.findUnique(...)
    
    // Business logic!
    const fit = calculateFit(course, player)
    
    return { course, fit }
  }
}

// ✓ CORRECT: Keep in service
class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private playerRepository: PlayerRepository
  ) {}
  
  async getCourseForPlayer(courseId: string, playerId: string) {
    const course = await this.courseRepository.findById(courseId)
    const player = await this.playerRepository.findById(playerId)
    
    // Business logic in service!
    const fit = calculateFit(course.data, player.data)
    
    return { course: course.data, fit }
  }
}
```

---

## Code Review Checklist

- [ ] Repository only queries/maps/transforms data
- [ ] No calculations in repository
- [ ] No validation business rules in repository
- [ ] No cross-entity logic in repository
- [ ] All business logic in service
- [ ] Service calls repository for data
- [ ] Service doesn't call Prisma directly

---

## Related ADRs

- ADR-001: Feature-based architecture enforces domain boundaries
- ADR-005: Result<T> enables consistent error handling

