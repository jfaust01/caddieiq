# UI Component Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Component Types

### 1. Presentational Components (Pure)
Display data, no logic.

```typescript
// ✓ CORRECT
export function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="player-card">
      <h3>{player.name}</h3>
      <p>{player.bio}</p>
    </div>
  )
}
```

### 2. Container Components
Fetch data and manage state.

```typescript
// ✓ CORRECT (Server Component)
export default async function PlayerDetail({ params }: { params: { id: string } }) {
  const player = await playerService.getPlayer(params.id)
  return <PlayerCard player={player} />
}
```

### 3. Feature Components
Domain-specific, composed from presentational components.

```typescript
// ✓ CORRECT
export async function TournamentCommandCenter({ tournamentId }: Props) {
  const context = await tournamentService.getTournamentContext(tournamentId)
  return (
    <>
      <TournamentHeader tournament={context.tournament} />
      <FieldLeaderboard field={context.field} />
    </>
  )
}
```

---

## Server vs Client Components

### Server Components (Preferred)

Use for:
- Data fetching
- Sensitive operations
- Large dependencies

```typescript
// ✓ CORRECT
export default async function Page() {
  const data = await fetchData()  // Server-only
  return <Component data={data} />
}
```

### Client Components

Use only for:
- Interactivity (onClick, useState)
- Hooks (useEffect, useCallback)
- Context (useContext)

```typescript
// ✓ CORRECT
'use client'

export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

---

## States

Every component must handle states:

```typescript
export async function PlayerProfile({ playerId }: Props) {
  const result = await playerService.getProfile(playerId)
  
  // ERROR STATE
  if (!result.ok) {
    return <ErrorBoundary error={result.error} />
  }
  
  const profile = result.data
  
  // EMPTY STATE
  if (!profile || !profile.name) {
    return <EmptyStatePlayer />
  }
  
  // LOADING STATE (via Suspense)
  
  // SUCCESS STATE
  return (
    <div>
      <h1>{profile.name}</h1>
      {/* ... */}
    </div>
  )
}
```

---

## Performance

- Use Server Components for data fetching
- Memoize expensive computations
- Lazy load non-critical sections
- Stream data with Suspense

```typescript
// ✓ CORRECT: Suspense for streaming
export default async function TournamentDetail() {
  return (
    <>
      <TournamentHeader />
      <Suspense fallback={<Skeleton />}>
        <FieldLeaderboard />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <IntelligenceTabs />
      </Suspense>
    </>
  )
}
```

---

## Folder Structure

```
app/
  (app)/
    tournaments/
      [tournamentId]/
        page.tsx              # Entry point
        layout.tsx            # Layout
        components/
          header.tsx          # Local components
          field-leaderboard.tsx
    players/
      [playerId]/
        page.tsx
        components/
          profile-header.tsx

components/
  shared/
    empty-state.tsx           # Shared components
    error-boundary.tsx
    loading-skeleton.tsx
```

---

## Anti-Patterns

🚩 **Component calling service without API**
```typescript
// ❌ WRONG: Client component calling service
'use client'
import { playerService } from '@/lib/...'

export function Component() {
  const [data, setData] = useState()
  useEffect(() => {
    // ❌ Can't call service with 'server-only'
    playerService.getPlayer('123')
  }, [])
}
```

🚩 **Business logic in component**
```typescript
// ❌ WRONG
export function Component() {
  return (
    <div>
      {items.map(item => ({
        // ❌ Business logic in render
        calculatedValue: calculateSkill(item.data, population)
      }))}
    </div>
  )
}
```

🚩 **No error handling**
```typescript
// ❌ WRONG
export async function Component() {
  const data = await fetchData()  // Can throw
  return <Content data={data} />
}
```

