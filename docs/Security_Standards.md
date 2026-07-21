# Security Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Secrets Management

- Never commit secrets
- Use environment variables
- Document required secrets
- Rotate credentials regularly

---

## Input Validation

All user inputs must be validated:

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email()
})

const validated = schema.parse(userInput)
```

---

## SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✓ CORRECT: Prisma handles parameterization
const player = await prisma.player.findUnique({
  where: { id: playerId }  // Parameterized
})

// ❌ WRONG: Never concatenate SQL
const player = await prisma.$queryRaw`
  SELECT * FROM Player WHERE id = '${id}'  // VULNERABLE!
`
```

---

## Authentication

Use Better Auth:

```typescript
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Process authenticated request
}
```

---

## Authorization

Check permissions before operations:

```typescript
async function updateTournament(id: string, data: any) {
  const user = await getCurrentUser()
  const tournament = await tournamentRepository.findById(id)
  
  if (tournament.createdById !== user.id) {
    throw new Error('Unauthorized')
  }
  
  return tournamentRepository.update({ id, ...data })
}
```

