# ADR-011: Next.js App Router with React Server Components

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Frontend Architecture Team  

---

## Context

Next.js 16 offers two routing systems:
1. **Pages Router** — Traditional file-based routing (pages/api/)
2. **App Router** — Modern routing with RSC (app/)

CaddieIQ needed to choose the foundation for all UI and API routes.

---

## Decision

**Use Next.js 16 App Router with React Server Components (RSC)**.

```typescript
// app/tournaments/[id]/page.tsx
import { Suspense } from 'react'
import { getTournamentContext } from '@/lib/tournament/service'

export async function generateMetadata({ params }: Props) {
  const tournament = await getTournamentContext(params.id)
  return {
    title: tournament.name,
    description: `${tournament.courseId} tournament`
  }
}

export default async function TournamentPage({ params }: Props) {
  // ✓ Server Component: runs on server, can access database
  const context = await getTournamentContext(params.id)
  
  return (
    <main>
      <TournamentHeader tournament={context.tournament} />
      
      {/* ✓ Suspense boundary for streaming */}
      <Suspense fallback={<LoadingFieldCard />}>
        <FieldCard field={context.field} />
      </Suspense>
      
      {/* ✓ Client component for interactivity */}
      <ClientLeaderboard rounds={context.rounds} />
    </main>
  )
}
```

---

## Rationale

### ✓ Why App Router + RSC

1. **Server-First by Default**
   - Database queries run on server, not browser
   - Secrets stay safe (no .env.NEXT_PUBLIC)
   - Reduced client bundle size

2. **Streaming & Suspense**
   - Pages load faster with progressive rendering
   - User sees UI before data loads
   - Better perceived performance

3. **Better DX**
   - File-based routing is more organized
   - `generateMetadata` for SEO
   - Built-in middleware

4. **Security**
   - Database queries server-only by default
   - Can't accidentally expose API keys

5. **Performance**
   - Less JavaScript shipped to browser
   - Server components generate static HTML
   - Smaller JavaScript bundles

6. **Future-Proof**
   - Vercel investing heavily in App Router
   - Pages Router in maintenance mode
   - New features only in App Router

### Tradeoff: Complexity

```typescript
// ❌ More complex: mixing server and client patterns
'use client'  // Client component for interactivity

import { useState } from 'react'

export function ClientLeaderboard({ rounds }) {
  const [filter, setFilter] = useState('all')  // Client state
  
  // Need API route to fetch data
  const { data } = useSWR(`/api/rounds?filter=${filter}`)
  
  return (
    <div>
      {data?.map(round => (...))}
    </div>
  )
}

// ✓ But gives us interactivity: useState, useEffect, etc.
```

---

## Alternatives Considered

### Alternative 1: Pages Router
```typescript
// Pros: Simpler mental model, less new concepts
// Cons:
//   - Pages Router in maintenance mode
//   - No RSC benefits
//   - Default to client-side rendering
//   - More JavaScript shipped
```
**Rejected:** Legacy, no RSC benefits, Vercel not investing.

### Alternative 2: Static Site Generation (SSG)
```typescript
// Pros: Maximum performance
// Cons:
//   - Can't have dynamic data
//   - Rebuild required for changes
//   - Not suitable for tournaments/live data
```
**Rejected:** CaddieIQ needs dynamic data, real-time updates.

---

## File Structure

```
app/
  ├── (auth)/                    # Grouped routes for auth pages
  │   ├── login/
  │   ├── signup/
  │   └── layout.tsx             # Auth layout
  │
  ├── (dashboard)/               # Grouped routes for dashboard
  │   ├── tournaments/
  │   ├── players/
  │   ├── courses/
  │   └── layout.tsx             # Dashboard layout with sidebar
  │
  ├── api/                       # Server Actions and API routes
  │   ├── tournaments/
  │   ├── players/
  │   └── auth/
  │
  ├── layout.tsx                 # Root layout (HTML, fonts, providers)
  ├── page.tsx                   # Home page
  └── error.tsx                  # Error boundary
```

## API Routes vs Server Actions

```typescript
// ✓ Prefer Server Actions for most operations
'use server'

export async function createTournament(data: TournamentInput) {
  const result = await tournamentService.create(data)
  return result
}

// Use API routes only for:
// 1. Third-party webhooks (Stripe, GitHub)
// 2. Mobile app API (different than web UI)
// 3. Complex streaming (multipart streams)
// 4. Legacy integrations

export async function POST(request: Request) {
  // Handle webhook from external service
  const body = await request.json()
  await handleStripeWebhook(body)
  return Response.json({ received: true })
}
```

---

## Consequences

### ✓ Positive

- Server-first security model
- Better performance (less JavaScript)
- Streaming and progressive rendering
- Better SEO with metadata
- File-based routing is intuitive
- Future-proof investment

### ✗ Negative

- Requires thinking in client/server layers
- 'use client' boundary can be confusing
- Not all libraries support RSC yet
- Slightly more overhead if misused

---

## Related ADRs

- ADR-001: Feature-based architecture applies to app router structure
- ADR-008: Services own business logic (called from Server Components)
- ADR-005: Result<T> for error handling in Server Actions

