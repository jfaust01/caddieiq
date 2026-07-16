import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Zap, TrendingUp, Wind, MapPin, Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

interface ContextualEmptyStateProps {
  title: string
  reason: string
  nextStep: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: LucideIcon
}

/**
 * Renders a contextual empty state with:
 * - Why there's no data (reason)
 * - What happens next (expectation)
 * - Call to action (next step)
 */
export function ContextualEmptyState({
  title,
  reason,
  nextStep,
  action,
  icon: Icon = AlertCircle,
}: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={`${reason}\n\n${nextStep}`}
      action={
        action ? (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : undefined
      }
    />
  )
}

// Specific empty state patterns for common scenarios

export function EmptyWeatherState() {
  return (
    <ContextualEmptyState
      icon={Wind}
      title="No weather available"
      reason="Weather becomes available 5 days before tournament start."
      nextStep="Check back closer to tournament date or refresh the page."
      action={{
        label: 'Refresh',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function EmptyDfsState() {
  return (
    <ContextualEmptyState
      icon={Zap}
      title="No DFS salaries"
      reason="DraftKings has not released salaries for this tournament yet."
      nextStep="Salaries are automatically imported when available. Refresh to check."
      action={{
        label: 'Refresh',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function EmptyFieldState() {
  return (
    <ContextualEmptyState
      icon={Users}
      title="No field confirmed"
      reason="Players have until 5 p.m. ET on Friday before the tournament to commit."
      nextStep="The field will automatically update when available."
      action={{
        label: 'Refresh',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function EmptyFormState() {
  return (
    <ContextualEmptyState
      icon={TrendingUp}
      title="No form data"
      reason="Player form data is calculated from recent tournament performance."
      nextStep="Form rankings will be available once the tournament begins."
    />
  )
}

export function EmptyOddsState() {
  return (
    <ContextualEmptyState
      icon={TrendingUp}
      title="No odds available"
      reason="Sportsbook odds haven't been published for this tournament yet."
      nextStep="Odds typically appear 1-2 days before tournament start. Check back soon."
      action={{
        label: 'Refresh',
        onClick: () => window.location.reload(),
      }}
    />
  )
}

export function EmptyCourseFitState() {
  return (
    <ContextualEmptyState
      icon={MapPin}
      title="No course fit data"
      reason="Course fit analysis requires confirmed field and course data."
      nextStep="This will automatically calculate once the field and course are confirmed."
    />
  )
}

export function EmptyHistoryState() {
  return (
    <ContextualEmptyState
      icon={AlertCircle}
      title="No history available"
      reason="Historical data for this player hasn't been ingested yet."
      nextStep="Historical statistics will become available as tournament data is processed."
    />
  )
}

export function EmptyResultsState() {
  return (
    <ContextualEmptyState
      icon={AlertCircle}
      title="No results yet"
      reason="Tournament results are not available until the event concludes."
      nextStep="Scores and results will be updated in real-time during and after the tournament."
    />
  )
}
