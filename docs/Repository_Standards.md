# Repository Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Definition

Repositories are the **exclusive interface** to the database. All data access must go through repositories.

**Rule:** No Prisma calls outside of repositories.

---

## Responsibilities

### ✓ DO

- Query data from database
- Transform raw data to domain models
- Handle pagination and filtering
- Implement caching at this level
- Handle database errors
- Log data access (security/audit)
- Validate database constraints
- Implement soft deletes (if needed)
- Provide transaction support

### ✗ DON'T

- Business logic calculations
- Data formatting for UI
- Cross-domain queries
- Validation business rules
- Logging business events
- Intelligence calculations
- Rendering or presentation
- Service orchestration

---

## Standard Interface

Every repository must implement:

```typescript
interface Repository<T> {
  // Single entity
  findById(id: string): Promise<Result<T>>
  findByIdOrThrow(id: string): Promise<T>
  
  // Multiple entities
  findMany(query?: Query<T>): Promise<Result<T[]>>
  findAll(): Promise<Result<T[]>>
  
  // Creation
  create(entity: T): Promise<Result<T>>
  createMany(entities: T[]): Promise<Result<T[]>>
  
  // Update
  update(entity: T): Promise<Result<T>>
  updateMany(entities: T[]): Promise<Result<number>>
  
  // Upsert (insert or update)
  upsert(entity: T): Promise<Result<T>>
  bulkUpsert(entities: T[]): Promise<Result<number>>
  
  // Delete
  delete(id: string): Promise<Result<boolean>>
  deleteMany(ids: string[]): Promise<Result<number>>
  
  // Pagination
  findPaginated(query: Query<T>, page: number, limit: number): Promise<Result<Paginated<T>>>
}
```

---

## Naming Conventions

- **Repositories:** `<Entity>Repository`
  - `PlayerRepository`
  - `TournamentRepository`
  - `CourseRepository`

- **Methods:** Verb + Entity
  - `findById(id)`
  - `findMany(query)`
  - `create(entity)`
  - `update(entity)`
  - `delete(id)`

- **Complex queries:** `findBy<Field>`
  - `findBySlug(slug)`
  - `findByEmail(email)`
  - `findByTournamentId(id)`

---

## Error Handling

All repositories must return `Result<T>`:

```typescript
type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError }

class RepositoryError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}
```

**Standard error codes:**
- `NOT_FOUND` — Entity doesn't exist
- `CONSTRAINT_VIOLATION` — Unique/foreign key constraint failed
- `INVALID_INPUT` — Data doesn't match schema
- `DATABASE_ERROR` — Unrecoverable database error
- `UNAUTHORIZED` — Permission denied
- `INTERNAL_ERROR` — Unexpected error

Example:

```typescript
async findById(id: string): Promise<Result<Tournament>> {
  try {
    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return {
        ok: false,
        error: new RepositoryError('NOT_FOUND', `Tournament ${id} not found`)
      }
    }
    return { ok: true, data: tournament }
  } catch (error) {
    logger.error('Tournament repository error', { id, error })
    return {
      ok: false,
      error: new RepositoryError('DATABASE_ERROR', 'Failed to find tournament')
    }
  }
}
```

---

## Transactions

For multi-entity operations, use transactions:

```typescript
async createTournamentWithField(tournament: Tournament, fields: TournamentField[]): Promise<Result<void>> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.tournament.create({ data: tournament })
      await tx.tournamentField.createMany({ data: fields })
    })
    return { ok: true, data: undefined }
  } catch (error) {
    logger.error('Transaction failed', { error })
    return { ok: false, error: new RepositoryError('DATABASE_ERROR', 'Transaction failed') }
  }
}
```

---

## Pagination

Implement consistent pagination:

```typescript
interface Query<T> {
  where?: Prisma.TournamentWhereInput
  orderBy?: Prisma.TournamentOrderByWithRelationInput
}

interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

async findPaginated(
  query: Query<Tournament>,
  page: number = 1,
  limit: number = 20
): Promise<Result<Paginated<Tournament>>> {
  try {
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      prisma.tournament.findMany({ ...query, skip, take: limit }),
      prisma.tournament.count({ where: query.where })
    ])
    return {
      ok: true,
      data: {
        items,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error('Pagination failed', { error })
    return { ok: false, error: new RepositoryError('DATABASE_ERROR', 'Pagination failed') }
  }
}
```

---

## Caching

Implement caching for expensive queries:

```typescript
import NodeCache from 'node-cache'

class PlayerRepository {
  private cache = new NodeCache({ stdTTL: 3600 }) // 1 hour
  
  async findById(id: string): Promise<Result<Player>> {
    // Check cache first
    const cached = this.cache.get(`player:${id}`)
    if (cached) {
      return { ok: true, data: cached }
    }
    
    try {
      const player = await prisma.player.findUnique({ where: { id } })
      if (!player) {
        return { ok: false, error: new RepositoryError('NOT_FOUND', ...) }
      }
      
      // Store in cache
      this.cache.set(`player:${id}`, player)
      return { ok: true, data: player }
    } catch (error) {
      return { ok: false, error: ... }
    }
  }
  
  invalidateCache(id: string) {
    this.cache.del(`player:${id}`)
  }
}
```

---

## Filtering

Implement flexible filtering:

```typescript
interface FilterOptions {
  search?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

async find(options: FilterOptions): Promise<Result<Tournament[]>> {
  try {
    const where: Prisma.TournamentWhereInput = {}
    
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } }
      ]
    }
    
    if (options.status) {
      where.status = options.status
    }
    
    if (options.startDate) {
      where.startDate = { gte: options.startDate }
    }
    
    const tournaments = await prisma.tournament.findMany({
      where,
      take: options.limit || 20,
      skip: options.offset || 0,
      orderBy: { startDate: 'desc' }
    })
    
    return { ok: true, data: tournaments }
  } catch (error) {
    logger.error('Find tournaments failed', { error })
    return { ok: false, error: new RepositoryError('DATABASE_ERROR', ...) }
  }
}
```

---

## Testing

All repositories must have unit tests:

```typescript
describe('PlayerRepository', () => {
  let repository: PlayerRepository
  let mockPrisma: jest.Mocked<PrismaClient>
  
  beforeEach(() => {
    mockPrisma = {
      player: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    } as any
    repository = new PlayerRepository(mockPrisma)
  })
  
  describe('findById', () => {
    it('returns player when found', async () => {
      const player = { id: '123', name: 'Rory McIlroy' }
      mockPrisma.player.findUnique.mockResolvedValue(player)
      
      const result = await repository.findById('123')
      
      expect(result.ok).toBe(true)
      expect(result.data).toEqual(player)
    })
    
    it('returns NOT_FOUND error when player not found', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)
      
      const result = await repository.findById('999')
      
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('NOT_FOUND')
    })
    
    it('returns DATABASE_ERROR on exception', async () => {
      mockPrisma.player.findUnique.mockRejectedValue(new Error('DB error'))
      
      const result = await repository.findById('123')
      
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('DATABASE_ERROR')
    })
  })
})
```

---

## Anti-Patterns

🚩 **Service logic in repository**
```typescript
// ❌ WRONG
class PlayerRepository {
  async calculateSkillProfile(playerId: string) {
    // Service logic in repository!
    const samples = await this.findSamples(playerId)
    return { skills: ... }
  }
}
```

🚩 **Direct Prisma usage in services**
```typescript
// ❌ WRONG
class PlayerService {
  async getPlayer(id: string) {
    return prisma.player.findUnique({ where: { id } })
  }
}
```

🚩 **Cross-domain repository calls**
```typescript
// ❌ WRONG
class CourseRepository {
  async getPlayersForCourse(courseId: string) {
    // Don't call another domain's repository
    return this.playerRepository.findMany(...)
  }
}
```

🚩 **No error handling**
```typescript
// ❌ WRONG
class TournamentRepository {
  async findById(id: string) {
    return prisma.tournament.findUnique({ where: { id } })
  }
}
```

---

## Checklist

Before submitting a repository for review:

- [ ] Implements standard interface
- [ ] No Prisma calls outside this repository
- [ ] All methods return Result<T>
- [ ] Proper error handling and logging
- [ ] Transaction support (if multi-entity)
- [ ] Pagination support (if list method)
- [ ] Caching (if expensive query)
- [ ] Unit tests with 80%+ coverage
- [ ] No business logic
- [ ] No service logic
- [ ] No presentation logic
- [ ] Follows naming conventions

