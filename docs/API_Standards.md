# API Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Thin Controller Pattern

API routes must be **thin controllers** that delegate to services.

```typescript
// ✓ CORRECT: Thin controller
import { tournamentService } from '@/lib/tournament-context/service'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await tournamentService.getTournamentContext(params.id)
    
    if (!result.ok) {
      return Response.json(
        { error: result.error.message },
        { status: 404 }
      )
    }
    
    return Response.json(result.data)
  } catch (error) {
    logger.error('API error', { error })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Response Format

All APIs must return consistent format:

```json
{
  "ok": true,
  "data": { /* ... */ }
}
```

or

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Tournament not found"
  }
}
```

---

## Status Codes

- `200` — Success
- `400` — Bad request (validation error)
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Not found
- `500` — Server error

---

## Validation

Validate all inputs:

```typescript
import { z } from 'zod'

const createTournamentSchema = z.object({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createTournamentSchema.parse(body)
    
    const result = await tournamentService.createTournament(validated)
    return Response.json(result.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}
```

---

## Error Codes

Document all possible error codes:

```typescript
// API error codes
const API_ERRORS = {
  TOURNAMENT_NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  INVALID_INPUT: { code: 'BAD_REQUEST', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 }
}
```

---

## Logging

Log all requests:

```typescript
export async function GET(request: Request, { params }: Props) {
  const start = Date.now()
  logger.info('API request', {
    method: 'GET',
    path: request.url,
    params
  })
  
  try {
    const result = await service.getData(params.id)
    const duration = Date.now() - start
    
    logger.info('API success', { duration, status: 200 })
    return Response.json(result.data)
  } catch (error) {
    const duration = Date.now() - start
    logger.error('API error', { error, duration })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

