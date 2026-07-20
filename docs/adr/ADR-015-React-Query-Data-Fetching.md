# ADR-015: React Query (TanStack Query) for Data Fetching

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Frontend Architecture Team  

---

## Context

CaddieIQ client needs to:
- Fetch data from Server Actions and API routes
- Cache data efficiently
- Handle loading/error states
- Synchronize data across components
- Update UI when data changes

---

## Decision

**Use TanStack Query (React Query v5) for client-side data fetching and caching.**

```typescript
// lib/queries/tournaments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Define query keys for consistent caching
export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (filters: TournamentFilters) => [...tournamentKeys.lists(), filters] as const,
  details: () => [...tournamentKeys.all, 'detail'] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
}

// Query hooks
export function useTournaments(filters: TournamentFilters) {
  return useQuery({
    queryKey: tournamentKeys.list(filters),
    queryFn: async () => {
      const response = await getTournaments(filters)
      if (!response.ok) throw response.error
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: async () => {
      const response = await getTournament(id)
      if (!response.ok) throw response.error
      return response.data
    },
    enabled: !!id,
  })
}

// Mutation hooks
export function useCreateTournament() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: TournamentInput) => {
      const response = await createTournament(input)
      if (!response.ok) throw response.error
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() })
      // Update detail cache
      queryClient.setQueryData(tournamentKeys.detail(data.id), data)
    },
    onError: (error) => {
      toast.error(`Failed to create tournament: ${error.message}`)
    }
  })
}
```

### Usage in Components
```typescript
'use client'

export function TournamentsList() {
  const [filters, setFilters] = useState<TournamentFilters>({})
  
  // Query data
  const { data: tournaments, isLoading, error } = useTournaments(filters)
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div className="grid gap-4">
      {tournaments?.map(t => (
        <TournamentCard key={t.id} tournament={t} />
      ))}
    </div>
  )
}

export function CreateTournamentButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutate: create, isPending } = useCreateTournament()
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>New Tournament</Button>
      
      <CreateTournamentDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => {
          create(data, {
            onSuccess: () => {
              setIsOpen(false)
              toast.success('Tournament created')
            }
          })
        }}
      />
    </>
  )
}
```

---

## Consequences

### ✓ Positive

- Automatic caching and deduplication
- Background refetching
- Optimistic updates possible
- Synchronizes data across components
- Built-in loading/error states
- Great devtools

### ✗ Negative

- Another library to learn
- Query key management overhead
- Can have stale data issues if not configured right

---

## Related ADRs

- ADR-011: Next.js App Router (Server Actions)
- ADR-012: API Response Standardization

