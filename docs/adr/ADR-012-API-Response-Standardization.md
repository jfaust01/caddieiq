# ADR-012: API Response Standardization

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** API Architecture Team  

---

## Context

CaddieIQ exposes APIs through:
- Server Actions (form submissions, data mutations)
- API routes (webhooks, third-party integrations)
- GraphQL (future consideration)

The challenge: Inconsistent response formats lead to:
- Client-side error handling bugs
- Confusion about response structure
- Difficult debugging

---

## Decision

**All API responses follow a standard envelope structure:**

```typescript
// Success response
{
  ok: true,
  data: {
    id: '123',
    name: 'Cadillac Championship',
    // ... resource fields
  },
  meta?: {
    timestamp: '2026-07-20T14:30:00Z',
    version: 'v1'
  }
}

// Error response
{
  ok: false,
  error: {
    code: 'TOURNAMENT_NOT_FOUND',
    message: 'Tournament with ID 123 not found',
    details?: {
      tournamentId: '123'
    }
  },
  meta?: {
    timestamp: '2026-07-20T14:30:00Z'
  }
}
```

---

## Implementation

### Response Types
```typescript
// lib/api/response.ts
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type ApiSuccess<T> = {
  ok: true
  data: T
  meta?: {
    timestamp?: string
    version?: string
  }
}

export type ApiError = {
  ok: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    timestamp?: string
  }
}

// Helper to create responses
export function success<T>(data: T): ApiSuccess<T> {
  return {
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  }
}

export function error(
  code: string,
  message: string,
  details?: Record<string, any>
): ApiError {
  return {
    ok: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString()
    }
  }
}
```

### Server Action Example
```typescript
'use server'

import { success, error } from '@/lib/api/response'
import { tournamentService } from '@/lib/tournament/service'

export async function createTournament(
  input: TournamentInput
): Promise<ApiResponse<Tournament>> {
  const result = await tournamentService.create(input)
  
  if (!result.ok) {
    return error(
      'TOURNAMENT_CREATE_FAILED',
      'Failed to create tournament',
      { cause: result.error.message }
    )
  }
  
  return success(result.data)
}
```

### API Route Example
```typescript
// app/api/tournaments/route.ts
import { success, error } from '@/lib/api/response'
import { tournamentService } from '@/lib/tournament/service'

export async function POST(request: Request) {
  try {
    const input = await request.json()
    
    const result = await tournamentService.create(input)
    
    if (!result.ok) {
      return Response.json(
        error('TOURNAMENT_CREATE_FAILED', result.error.message),
        { status: 400 }
      )
    }
    
    return Response.json(success(result.data), { status: 201 })
  } catch (err) {
    return Response.json(
      error('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
```

### Client-Side Handling
```typescript
'use client'

import { createTournament } from '@/app/actions/tournaments'
import { ApiResponse } from '@/lib/api/response'

export function CreateTournamentForm() {
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    const response: ApiResponse<Tournament> = await createTournament(formData)
    
    if (!response.ok) {
      // All errors handled same way
      setError(response.error.message)
      return
    }
    
    // Success handling
    toast.success(`Created: ${response.data.name}`)
    redirect(`/tournaments/${response.data.id}`)
  }
  
  return (
    <form action={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

---

## Error Codes

```typescript
// Standard error codes for CaddieIQ
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Not found errors
  NOT_FOUND: 'NOT_FOUND',
  TOURNAMENT_NOT_FOUND: 'TOURNAMENT_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  
  // Conflict errors
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  TOURNAMENT_ALREADY_EXISTS: 'TOURNAMENT_ALREADY_EXISTS',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const
```

---

## Status Codes

| Scenario | Status | Error Code |
|----------|--------|-----------|
| Successful GET/POST | 200/201 | N/A |
| Invalid input | 400 | VALIDATION_ERROR |
| Not authenticated | 401 | UNAUTHORIZED |
| Not authorized | 403 | FORBIDDEN |
| Not found | 404 | NOT_FOUND |
| Conflict (duplicate) | 409 | ALREADY_EXISTS |
| Server error | 500 | INTERNAL_SERVER_ERROR |

---

## Consequences

### ✓ Positive

- Consistent response format everywhere
- Type-safe error handling (TypeScript)
- Client knows exactly what to expect
- Easy debugging (structured error info)
- Uniform error handling patterns

### ✗ Negative

- More verbose responses (extra `ok` field)
- Small overhead for simple operations
- Requires discipline to follow

---

## Related ADRs

- ADR-005: Result<T> standard return type (server side)
- ADR-008: Services own orchestration
- ADR-011: Next.js App Router (Server Actions)

