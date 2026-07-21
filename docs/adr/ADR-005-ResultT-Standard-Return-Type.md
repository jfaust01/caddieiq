# ADR-005: Result<T> is the Standard Return Type

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Architecture Team  

---

## Context

How should functions handle errors and exceptional cases?

1. **Throw exceptions** — Traditional approach
2. **Return null** — JavaScript convention
3. **Return Result<T>** — Rust/Go approach

The challenge: CaddieIQ has intelligence calculations that can fail gracefully (e.g., insufficient data), API operations that need clear error information, and complex workflows requiring error details.

---

## Decision

**All functions must return Result<T>**, never throw exceptions or return null/undefined.

```typescript
type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: Error }

// ✓ CORRECT
async function getPlayer(id: string): Promise<Result<Player>> {
  if (!id) {
    return {
      ok: false,
      error: new ValidationError('Player ID required')
    }
  }
  
  const player = await repository.findById(id)
  if (!player) {
    return {
      ok: false,
      error: new NotFoundError(`Player ${id} not found`)
    }
  }
  
  return { ok: true, data: player }
}
```

---

## Rationale

### ✓ Advantages of Result<T>

1. **Forced Error Handling**
   - Type system forces handling both cases
   - Can't accidentally ignore errors
   - Must explicitly handle failure

2. **Clear Semantics**
   - `ok: true` means success
   - `ok: false` means failure
   - No ambiguity (null vs false vs undefined)

3. **Rich Error Information**
   - Can include error code, message, context
   - Errors are first-class values
   - Can pass through multiple layers

4. **Async-Friendly**
   - No unhandled promise rejections
   - No try-catch hell
   - Error propagation clear

5. **Composability**
   - Easy to chain operations
   - Can transform results
   - Can recover from errors

6. **Testing**
   - Easy to test both success and failure
   - No exceptions to mock
   - Clear assertions

### ✗ Problems with Exceptions

```typescript
// ❌ WRONG: Throws exceptions
async function getPlayer(id: string): Promise<Player> {
  const player = await prisma.player.findUnique({ where: { id } })
  if (!player) throw new Error('Not found')  // ❌
  return player
}

// Problems:
// 1. Caller must remember to try-catch
// 2. Can throw unexpected exceptions
// 3. No type safety
// 4. Hard to handle gracefully
// 5. Stack traces are misleading
```

### ✗ Problems with Null

```typescript
// ❌ WRONG: Returns null
async function getPlayer(id: string): Promise<Player | null> {
  return prisma.player.findUnique({ where: { id } })
}

// Problems:
// 1. Caller might forget null check
// 2. No error information
// 3. Null === not found? Null === validation error?
// 4. Hard to debug ("why is this null?")
// 5. No error context
```

---

## Implementation Pattern

### Basic Result Handler
```typescript
// Helper to extract data or throw
function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data
  throw result.error
}

// Helper to chain results
async function chain<T, U>(
  result: Result<T>,
  fn: (data: T) => Promise<Result<U>>
): Promise<Result<U>> {
  if (!result.ok) return result
  return fn(result.data)
}

// Usage
const player = await getPlayer('123')
if (!player.ok) {
  return Response.json(
    { error: player.error.message },
    { status: 404 }
  )
}

return { name: player.data.name }
```

### Error Types
```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}

class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', message, context)
  }
}

class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('NOT_FOUND', message, context)
  }
}

class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('DATABASE_ERROR', message, context)
  }
}
```

### Service Example
```typescript
export class PlayerService {
  async getProfile(playerId: string): Promise<Result<PlayerProfile>> {
    // Validate
    if (!playerId) {
      return {
        ok: false,
        error: new ValidationError('Player ID required')
      }
    }
    
    // Get data
    const playerResult = await this.playerRepository.findById(playerId)
    if (!playerResult.ok) {
      return playerResult  // Pass error through
    }
    
    const samplesResult = await this.playerRepository.getSamples(playerId)
    if (!samplesResult.ok) {
      return {
        ok: false,
        error: new DatabaseError('Failed to get samples')
      }
    }
    
    // Build result
    const profile = buildProfile(playerResult.data, samplesResult.data)
    return { ok: true, data: profile }
  }
}
```

---

## API Usage
```typescript
export async function GET(request: Request) {
  const result = await playerService.getProfile(playerId)
  
  if (!result.ok) {
    // Error result
    const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500
    return Response.json(
      {
        error: result.error.code,
        message: result.error.message,
        context: result.error.context
      },
      { status: statusCode }
    )
  }
  
  // Success result
  return Response.json(result.data)
}
```

---

## Consequences

### ✓ Positive

- Type-safe error handling
- Forced to handle both cases
- Rich error information
- No unhandled exceptions
- Easy to compose operations
- Clear error semantics

### ✗ Negative

- More verbose than throwing
- Requires pattern matching
- Needs error type hierarchy
- Team discipline required
- Can't use try-finally easily

---

## Related ADRs

- ADR-001: Feature-based architecture enables consistent Result handling
- ADR-003: Repositories use Result<T>
- ADR-007: Builders use Result<T>

---

## Code Review Checklist

- [ ] No functions throw (except catastrophic failures)
- [ ] All public functions return Result<T>
- [ ] Error cases handled explicitly
- [ ] Error codes consistent
- [ ] Error context useful
- [ ] Callers check ok: true/false

