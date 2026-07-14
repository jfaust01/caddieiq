import { SearchX } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

interface EmptyPlayersStateProps {
  /** Whether any filters are currently applied. */
  hasFilters: boolean
  onReset: () => void
}

/** Empty state for the player directory, tuned for the "no matches" case. */
export function EmptyPlayersState({ hasFilters, onReset }: EmptyPlayersStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      title={hasFilters ? 'No players match your filters' : 'No players found'}
      description={
        hasFilters
          ? 'Try broadening your search or clearing a filter to see more of the player universe.'
          : 'The player universe is empty. Connect a data source to populate players.'
      }
      action={
        hasFilters ? (
          <Button variant="outline" onClick={onReset}>
            Clear filters
          </Button>
        ) : null
      }
    />
  )
}
