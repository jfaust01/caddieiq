# CaddieIQ Dependency Rules

**Phase:** 15.3C — Platform Engineering Standards

---

## Dependency Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  (React Components, Next.js Pages, Page Layouts)            │
├─────────────────────────────────────────────────────────────┤
│  ✓ May call: API Routes                                     │
│  ✗ May NOT call: Services, Repositories, Prisma            │
│  ✗ May NOT contain: Business logic, calculations           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  API LAYER                                                  │
│  (Route handlers in app/api/)                              │
├─────────────────────────────────────────────────────────────┤
│  ✓ May call: Services                                       │
│  ✓ May call: Own domain repositories (limited)             │
│  ✗ May NOT call: Prisma directly                           │
│  ✗ May NOT contain: Business logic (thin controller)       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  SERVICE LAYER                                              │
│  (Business logic, orchestration)                           │
├─────────────────────────────────────────────────────────────┤
│  ✓ May call: Repositories (own domain)                     │
│  ✓ May call: Intelligence engines (pure functions)         │
│  ✓ May call: Other services (controlled coupling)          │
│  ✗ May NOT call: Prisma directly                           │
│  ✗ May NOT call: Components                                │
│  ✗ May NOT render: UI                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  REPOSITORY LAYER                                           │
│  (Data access, queries)                                    │
├─────────────────────────────────────────────────────────────┤
│  ✓ May call: Prisma ORM                                    │
│  ✓ May call: Own domain repositories                       │
│  ✗ May NOT call: Services                                  │
│  ✗ May NOT call: Components                                │
│  ✗ May NOT contain: Business logic                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  DATABASE LAYER                                             │
│  (PostgreSQL via Prisma ORM)                               │
├─────────────────────────────────────────────────────────────┤
│  All queries must go through repositories                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Allowed Communication Patterns

### Pattern 1: Component → API Route → Service → Repository

✓ **ALLOWED**

```typescript
// Component
const { data } = useFetch('/api/tournaments/123')

// API Route
export async function GET(req) {
  const service = new TournamentService()
  const data = await service.getTournamentContext(id)
  return Response.json(data)
}

// Service
class TournamentService {
  async getTournamentContext(id) {
    return this.repository.findContextById(id)
  }
}

// Repository
class TournamentRepository {
  async findContextById(id) {
    return prisma.tournament.findUnique({ where: { id } })
  }
}
```

### Pattern 2: Service → Intelligence Engine (Pure Function)

✓ **ALLOWED**

```typescript
// Service
class PlayerSkillIntelligenceService {
  async getPlayerProfile(playerId) {
    const samples = await this.repository.getSamples(playerId)
    const population = await this.repository.getPopulation()
    // Pure function call
    return playerSkillEngine.buildProfile(samples, population)
  }
}

// Pure Intelligence Engine
function buildProfile(samples, population) {
  // No side effects, no external calls
  return { skills: {...}, percentiles: {...} }
}
```

### Pattern 3: Server Component → Service (Request-Level)

✓ **ALLOWED**

```typescript
// Server Component
import { tournamentContextService } from '@/lib/tournament-context/service'

export default async function TournamentDetail({ params }) {
  const context = await tournamentContextService.getTournamentContext(params.id)
  return <Layout tournament={context.tournament} />
}
```

---

## Forbidden Communication Patterns

### Pattern 1: Component → Prisma (PROHIBITED)

❌ **NOT ALLOWED**

```typescript
// ❌ DO NOT DO THIS
'use client'
import { prisma } from '@/lib/prisma'

export function PlayerCard() {
  const [player, setPlayer] = useState(null)
  useEffect(() => {
    // ❌ FORBIDDEN: Direct Prisma call from component
    prisma.player.findUnique({ where: { id: '123' } })
  }, [])
}
```

**Why:** Exposes business logic, creates security vulnerabilities, breaks layer abstraction.

**Fix:** Use API route instead.

### Pattern 2: Service → Prisma (PROHIBITED)

❌ **NOT ALLOWED**

```typescript
// ❌ DO NOT DO THIS
class TournamentService {
  async getTournament(id) {
    // ❌ FORBIDDEN: Direct Prisma call from service
    return prisma.tournament.findUnique({ where: { id } })
  }
}
```

**Why:** Violates repository pattern, prevents consistent error handling.

**Fix:** Use repository instead.

```typescript
// ✓ CORRECT
class TournamentService {
  async getTournament(id) {
    return this.repository.findById(id)  // Repository handles Prisma
  }
}
```

### Pattern 3: Cross-Domain Repository Calls (PROHIBITED)

❌ **NOT ALLOWED**

```typescript
// ❌ DO NOT DO THIS
class CourseIntelligenceService {
  async buildIntelligence(courseId) {
    // ❌ FORBIDDEN: Service calling another domain's repository
    const playerSamples = this.playerRepository.getSamples()
    ...
  }
}
```

**Why:** Violates domain boundaries, creates tight coupling.

**Fix:** Call other domain's service instead.

```typescript
// ✓ CORRECT
class CourseIntelligenceService {
  async buildIntelligence(courseId) {
    // Call another domain's service (if needed)
    const context = await playerIntelligenceService.getContext()
    ...
  }
}
```

### Pattern 4: Intelligence Engine with Side Effects (PROHIBITED)

❌ **NOT ALLOWED**

```typescript
// ❌ DO NOT DO THIS
function buildPlayerSkillProfile(samples, population) {
  // ❌ FORBIDDEN: Side effect in pure engine
  logToDatabase('build-started')
  
  // ❌ FORBIDDEN: External call
  const external = await fetch('...')
  
  return { skills: {...} }
}
```

**Why:** Breaks determinism, breaks testability, breaks reproducibility.

**Fix:** Move side effects to service, keep engine pure.

```typescript
// ✓ CORRECT
async function buildProfileWithLogging(playerId) {
  // Service handles side effects
  logToDatabase('build-started')
  
  const samples = await repository.getSamples(playerId)
  const population = await repository.getPopulation()
  
  // Pure function call
  const profile = buildPlayerSkillProfile(samples, population)
  
  logToDatabase('build-completed')
  return profile
}
```

### Pattern 5: Circular Dependencies (PROHIBITED)

❌ **NOT ALLOWED**

```typescript
// ❌ DO NOT DO THIS
// tournament-service.ts
import { courseService } from './course-service'
export const tournamentService = { ... }

// course-service.ts
import { tournamentService } from './tournament-service'
export const courseService = { ... }
```

**Why:** Creates infinite loops, breaks module loading, prevents testing.

**Fix:** Use dependency injection or refactor into shared service.

```typescript
// ✓ CORRECT
// shared-service.ts
export const sharedService = { ... }

// tournament-service.ts
import { sharedService } from './shared-service'
export const tournamentService = { ... }

// course-service.ts
import { sharedService } from './shared-service'
export const courseService = { ... }
```

---

## Cross-Domain Dependencies

### Allowed Dependencies Between Domains

```
Tournament Domain
    ↓
Player Domain (read-only)
    ↓
Course Domain (read-only)

Player Skill Intelligence
    ↓
Player Domain (read-only)

Course Intelligence
    ↓
Course Domain (read-only)

DFS Value Service
    ├→ Player Skill Intelligence (read-only)
    ├→ Course Intelligence (read-only)
    └→ Tournament Domain (read-only)
```

### Forbidden Cross-Domain Dependencies

```
❌ Player Domain → Tournament Domain (no upstream)
❌ Course Domain → Player Domain (independent)
❌ Intelligence → Components (use service)
❌ Repository A → Repository B (different domains)
❌ Admin → Business logic domains (unidirectional)
```

---

## Layer Violation Detection

### Red Flags in Code Reviews

🚩 **Component imports Prisma** → Violation  
🚩 **Component imports Repository** → Violation  
🚩 **Component imports Service directly** → Violation (use API)  
🚩 **Service imports Prisma** → Violation  
🚩 **Service contains `prisma.*` calls** → Violation  
🚩 **Repository contains business logic** → Violation  
🚩 **Repository calls other Repository** → Potential violation  
🚩 **API route contains complex logic** → Violation (move to service)  
🚩 **Intelligence engine has side effects** → Violation  
🚩 **Service returns React components** → Violation  
🚩 **Two services import each other** → Circular dependency  

---

## Dependency Injection Pattern

For controlled dependencies between services:

```typescript
// ✓ CORRECT: Dependency injection
class DfsValueService {
  constructor(
    private playerSkillService: PlayerSkillIntelligenceService,
    private courseIntelligenceService: CourseIntelligenceService,
    private tournamentService: TournamentService
  ) {}
  
  async calculateValue(playerId, tournamentId) {
    const skill = await this.playerSkillService.getProfile(playerId)
    const courseIntel = await this.courseIntelligenceService.getIntelligence(...)
    const tournament = await this.tournamentService.getContext(tournamentId)
    
    return { value: ... }
  }
}
```

---

## Testing Dependency Isolation

Each layer must be testable in isolation:

```typescript
// ✓ CORRECT: Test repository with mock data
describe('TournamentRepository', () => {
  it('finds tournament by id', async () => {
    const repo = new TournamentRepository()
    // Mock Prisma
    jest.mock('@/lib/prisma', () => ({
      tournament: {
        findUnique: jest.fn().mockResolvedValue({ id: '123', name: 'Test' })
      }
    }))
    
    const result = await repo.findById('123')
    expect(result.id).toBe('123')
  })
})

// ✓ CORRECT: Test service with mock repository
describe('TournamentService', () => {
  it('gets tournament context', async () => {
    const mockRepo = { findContextById: jest.fn().mockResolvedValue(...) }
    const service = new TournamentService(mockRepo)
    
    const result = await service.getTournamentContext('123')
    expect(mockRepo.findContextById).toHaveBeenCalledWith('123')
  })
})

// ✓ CORRECT: Test API with mock service
describe('Tournament API', () => {
  it('returns tournament data', async () => {
    const mockService = { getTournamentContext: jest.fn().mockResolvedValue(...) }
    
    const req = { params: { id: '123' } }
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

---

## Enforcement

### Automated Checks
- ESLint rule: No direct Prisma imports outside `/lib/repositories/`
- ESLint rule: No Prisma calls outside repository layer
- TypeScript: Strict typing prevents cross-layer calls

### Manual Code Review
- Architecture review for structural changes
- Dependency diagram validation
- Circular dependency detection

### Tools
- `npm run lint:deps` — Check dependency violations
- `npm run lint:arch` — Check layer violations

---

## When You Need to Break a Rule

If a legitimate case requires breaking a dependency rule:

1. **Document the exception**
   - Why the exception is needed
   - Why the normal pattern doesn't work
   - Approval from architecture team

2. **Add a comment explaining**
   ```typescript
   // EXCEPTION: Direct Prisma call needed for performance
   // See: https://github.com/.../issues/1234
   // Approved by: @architecture-team
   const result = await prisma.player.findMany(...)
   ```

3. **Create an issue for later refactoring**
   - Track technical debt
   - Plan remediation

4. **Get architecture review**
   - Exceptions require explicit approval
   - Document in Architecture_Governance.md

