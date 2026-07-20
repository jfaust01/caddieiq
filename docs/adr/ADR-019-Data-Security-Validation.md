# ADR-019: Data Security and Validation

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Security Team  

---

## Context

CaddieIQ handles:
- User authentication data
- Tournament information
- Player statistics
- Personal golf data

Security challenge: Prevent SQL injection, XSS, data tampering, unauthorized access.

---

## Decision

**Implement multi-layer validation and security:**

1. **Input Validation** — Zod schemas
2. **SQL Safety** — Parametrized queries (Drizzle)
3. **Authorization** — Session-based access checks
4. **Data Sanitization** — Remove malicious content
5. **HTTPS Only** — Secure transport

---

## Implementation

### Input Validation with Zod
```typescript
// lib/schemas/tournament.ts
import { z } from 'zod'

export const createTournamentSchema = z.object({
  name: z.string()
    .min(1, 'Tournament name required')
    .max(100, 'Tournament name too long')
    .trim(),
  
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  
  startDate: z.coerce.date()
    .min(new Date(), 'Start date must be in future'),
  
  courseId: z.string()
    .uuid('Invalid course ID'),
  
  par: z.number()
    .int()
    .min(36, 'Par must be at least 36')
    .max(72, 'Par must be at most 72')
})

// Server Action with validation
export async function createTournament(input: unknown) {
  // Validate schema
  const validated = createTournamentSchema.parse(input)
  
  // Process validated data
  return await tournamentService.create(validated)
}
```

### Authorization
```typescript
// lib/auth/permission.ts
import { auth } from '@/lib/auth'

export async function requireAuth() {
  const session = await auth.api.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
}

export async function requireRole(role: 'admin' | 'organizer') {
  const session = await requireAuth()
  
  if (session.user.role !== role) {
    throw new Error('Insufficient permissions')
  }
  
  return session
}

// Usage in Server Action
export async function deleteTournament(tournamentId: string) {
  const session = await requireRole('admin')
  
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId)
  })
  
  if (!tournament) {
    return { ok: false, error: 'Tournament not found' }
  }
  
  // Verify ownership or admin status
  if (tournament.createdBy !== session.user.id && session.user.role !== 'admin') {
    return { ok: false, error: 'Not authorized' }
  }
  
  await db.delete(tournaments).where(eq(tournaments.id, tournamentId))
  return { ok: true }
}
```

### SQL Safety (Drizzle Prevents Injection)
```typescript
// ✓ Safe: Parametrized query
const player = await db.query.players.findFirst({
  where: eq(players.userId, userInput)  // Safe, parametrized
})

// ❌ WRONG: Never concatenate SQL
const player = await db.raw(`
  SELECT * FROM players WHERE user_id = '${userInput}'  // Vulnerable!
`)
```

### HTTPS Configuration
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      { status: 301 }
    )
  }
  
  return NextResponse.next()
}
```

---

## Security Checklist

- [ ] All inputs validated with Zod
- [ ] Parametrized queries (no string concatenation)
- [ ] Authorization checks on sensitive operations
- [ ] HTTPS enforced in production
- [ ] Sensitive data not logged
- [ ] API keys stored in environment only
- [ ] CORS configured correctly
- [ ] Rate limiting for API endpoints

---

## Consequences

### ✓ Positive

- Prevents common attacks (SQL injection, XSS)
- Validation catches malformed data early
- Authorization prevents unauthorized access
- Type safety enables compiler checks

### ✗ Negative

- Validation adds development time
- More code to maintain
- Performance overhead (worth it)

---

## Related ADRs

- ADR-018: Environment variable management (secrets)
- ADR-005: Result<T> for error handling

