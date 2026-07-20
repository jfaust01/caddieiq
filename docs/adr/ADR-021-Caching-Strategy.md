# ADR-021: Caching Strategy

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Performance Team  

---

## Context

CaddieIQ needs caching at multiple levels:
- Database queries (expensive calculations)
- API responses (frequently accessed data)
- Browser cache (static assets)

---

## Decision

**Use multi-layer caching:**

1. **React Query** — Client-side query caching
2. **Request cache** — Per-request memoization (React cache)
3. **Data cache** — Revalidate tags for ISR
4. **HTTP Cache** — Browser cache headers

---

## Implementation

### Request Cache
```typescript
// lib/cache/request.ts
import { cache } from 'react'

// Memoize within single request
export const getPlayerWithCache = cache(
  async (playerId: string) => {
    return await db.query.players.findFirst({
      where: eq(players.id, playerId)
    })
  }
)

// Usage: multiple calls in same request use cache
async function PlayerProfile({ playerId }: Props) {
  const player = await getPlayerWithCache(playerId)  // DB query
  return <div>{player.name}</div>
}

async function PlayerStats({ playerId }: Props) {
  const player = await getPlayerWithCache(playerId)  // Cached!
  return <div>{player.golfHandicap}</div>
}
```

### HTTP Cache Headers
```typescript
// app/api/tournaments/[id]/route.ts
export async function GET(request: Request, { params }: Props) {
  const tournament = await getTournament(params.id)
  
  return Response.json(tournament.data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

### React Query Caching
```typescript
// See ADR-015 for detailed examples
```

---

## Cache Invalidation Strategy

```typescript
// When tournament updates, invalidate cache
export async function updateTournament(id: string, data: TournamentUpdate) {
  const result = await tournamentService.update(id, data)
  
  if (result.ok) {
    // Revalidate ISR cache
    revalidateTag(`tournament-${id}`)
    
    // Invalidate React Query cache
    queryClient.invalidateQueries({
      queryKey: tournamentKeys.detail(id)
    })
  }
  
  return result
}
```

---

## Consequences

### ✓ Positive

- Reduced database load
- Faster response times
- Better user experience
- Scalable to more users

### ✗ Negative

- Cache invalidation complexity
- Stale data possible
- Memory overhead

---

## Related ADRs

- ADR-015: React Query data fetching
- ADR-002: Versioned builds (uses caching)

