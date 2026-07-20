# ADR-010: Drizzle ORM for Type Safety

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Data Architecture Team  

---

## Context

CaddieIQ requires:
- Database schema as source of truth
- Type-safe queries (catch errors at compile time)
- Minimal runtime overhead
- Migrations that version the schema

Three ORM approaches were considered for Neon Postgres.

---

## Decision

**Use Drizzle ORM** for all database operations in CaddieIQ.

```typescript
// lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  userId: text('user_id').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  golfHandicap: integer('golf_handicap'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const db = drizzle(process.env.DATABASE_URL!, { schema })

export async function getPlayer(userId: string) {
  const result = await db.query.players.findFirst({
    where: eq(players.userId, userId)
  })
  return result
}
```

---

## Rationale

### ✓ Why Drizzle

1. **SQL as First Class** — Write SQL or use query builder, not OOP
2. **Type-Safe Queries** — Compiler catches query errors
3. **Lightweight** — ~20KB bundle, minimal dependencies
4. **Auto Migrations** — Schema changes generate migrations
5. **Zero Magic** — Understand exactly what SQL is generated
6. **Works with Edge** — Neon serverless optimized
7. **Explicit Relations** — No lazy loading surprises

### Example: Type Safety

```typescript
// ✓ Type-safe query
const player = await db.query.players.findFirst({
  where: eq(players.userId, userId)
})
// player is { id: number; userId: string; ... } | undefined

// ✓ Compile-time error if column doesn't exist
const player = await db.query.players.findFirst({
  where: eq(players.invalidColumn, 'value')  // ❌ ERROR
})

// ✓ Type-safe inserts
await db.insert(players).values({
  userId: '123',
  firstName: 'John',
  // handicap: 'invalid string'  // ❌ ERROR: must be number | null
})
```

---

## Alternatives Considered

### Alternative 1: Prisma ORM
```typescript
// Pros: Popular, good tooling, auto migrations
// Cons:
//   - More overhead (~100KB)
//   - Lazy loading pitfalls
//   - Less control over SQL
//   - Overkill for simple schemas
```
**Rejected:** Too much overhead, less control, potential N+1 queries.

### Alternative 2: Raw SQL with typed helpers
```typescript
// Pros: Full control, minimal overhead
// Cons:
//   - Manual type definitions needed
//   - Error-prone string queries
//   - No schema validation
//   - Manual migrations
```
**Rejected:** Too error-prone, manual migrations burden.

### Alternative 3: TypeORM
```typescript
// Pros: Full ORM, decorators
// Cons:
//   - Heavy (~300KB)
//   - Complex for simple schemas
//   - More magic, less clarity
```
**Rejected:** Overhead not worth it, too much magic.

---

## Implementation Pattern

### Schema Definition
```typescript
// lib/db/schema.ts
import {
  pgTable, pgEnum, serial, text, timestamp,
  integer, real, boolean, jsonb, uniqueIndex
} from 'drizzle-orm/pg-core'

export const courseEnum = pgEnum('course_difficulty', [
  'beginner', 'intermediate', 'advanced', 'expert'
])

export const courses = pgTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    location: text('location').notNull(),
    difficulty: courseEnum('difficulty').notNull(),
    par: integer('par').notNull(),
    length: integer('length').notNull(),
    handicapIndex: real('handicap_index'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    nameIndex: uniqueIndex().on(table.name)
  })
)
```

### Query Patterns
```typescript
// lib/db/queries.ts
import { db } from './index'
import { courses, players } from './schema'
import { eq, and, gt } from 'drizzle-orm'

// Simple select
export async function getCourseById(id: number) {
  return db.query.courses.findFirst({
    where: eq(courses.id, id)
  })
}

// Filtering
export async function getAdvancedCourses() {
  return db.query.courses.findMany({
    where: eq(courses.difficulty, 'advanced'),
    limit: 50
  })
}

// Joins (relations)
export async function getPlayerWithCourses(userId: string) {
  return db.query.players.findFirst({
    where: eq(players.userId, userId),
    with: {
      courseRounds: {
        with: {
          course: true
        }
      }
    }
  })
}

// Insert with result
export async function createPlayer(data: NewPlayer) {
  const result = await db.insert(players).values(data).returning()
  return result[0]
}

// Update
export async function updatePlayerHandicap(userId: string, handicap: number) {
  return db.update(players)
    .set({ golfHandicap: handicap })
    .where(eq(players.userId, userId))
    .returning()
}

// Delete
export async function deleteCourseIfUnused(courseId: number) {
  const used = await db.query.courseRounds.findFirst({
    where: eq(courseRounds.courseId, courseId)
  })
  
  if (used) return { deleted: false, reason: 'Course has associated rounds' }
  
  await db.delete(courses).where(eq(courses.id, courseId))
  return { deleted: true }
}
```

### Migrations
```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Verify schema
npx drizzle-kit push

# Introspect existing database
npx drizzle-kit introspect
```

---

## Consequences

### ✓ Positive

- Type-safe queries (compile-time errors)
- Generated migrations versioned
- Clear what SQL is being generated
- Lightweight runtime overhead
- Works excellently with serverless
- Easy to debug queries
- Explicit over implicit

### ✗ Negative

- Less "magic" means more ceremony
- Relations require explicit fetching
- No lazy loading (prevents N+1 but explicit)
- Smaller ecosystem than Prisma

---

## Related ADRs

- ADR-009: Neon + Better Auth stack
- ADR-005: Result<T> for error handling
- ADR-003: Repositories own database queries

