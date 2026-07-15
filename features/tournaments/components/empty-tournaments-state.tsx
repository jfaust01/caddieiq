import { CalendarX } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

interface EmptyTournamentsStateProps {
  /** Whether any filters are currently applied. */
  hasFilters: boolean
  onReset: () => void
}

/**
 * Empty state for the tournament directory. Distinguishes "no matches for your
 * filters" from the genuinely-empty schedule (no tournaments imported yet), so
 * the UI stays honest instead of fabricating events.
 */
export function EmptyTournamentsState({ hasFilters, onReset }: EmptyTournamentsStateProps) {
  return (
    <EmptyState
      icon={CalendarX}
      title={hasFilters ? 'No tournaments match your filters' : 'No tournaments yet'}
      description={
        hasFilters
          ? 'Try broadening your search or clearing a filter to see more of the schedule.'
          : 'The tournament schedule is empty. Once events are imported from your data source, they will appear here.'
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
