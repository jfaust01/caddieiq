# Performance Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Database Optimization

- Create indexes on frequently queried fields
- Avoid N+1 queries (batch load)
- Use pagination for large result sets
- Monitor slow queries

```typescript
// ✓ CORRECT: Batch load
const players = await playerRepository.findMany({
  where: { ids: playerIds }
})

// ❌ WRONG: N+1 query
for (const id of playerIds) {
  await playerRepository.findById(id)  // Multiple queries!
}
```

---

## Caching Strategy

- Request-level: React cache()
- Session-level: In-memory cache
- Cross-request: Redis (if needed)

---

## Server Components

Use Server Components for data fetching:

```typescript
// ✓ CORRECT: Server component
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}

// ❌ WRONG: Client component with fetch
'use client'
export default function Page() {
  useEffect(() => {
    fetch('/api/data')  // Fetches after page renders
  }, [])
}
```

