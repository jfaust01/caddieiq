import { Badge } from '@/components/ui/badge'
import { fieldLifecycleLabel, fieldLifecycleTone } from '@/features/tournaments/utils/format'
import type { FieldStatus } from '@/lib/tournament-context/types'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<ReturnType<typeof fieldLifecycleTone>, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
}

interface FieldLifecycleBadgeProps {
  status: FieldStatus
  className?: string
}

/**
 * Compact chip for an event's official-field lifecycle status ("Field pending",
 * "Field confirmed", "Field set", …). Reusable across the schedule, the
 * Tournament Page, and anywhere a field state needs a consistent visual. The
 * label and tone come from the shared format helpers so every surface agrees.
 */
export function FieldLifecycleBadge({ status, className }: FieldLifecycleBadgeProps) {
  // A cancelled/unknown field is genuinely absent, not a live state; the pulse
  // dot is reserved for the "pending" case to signal it is still expected.
  const showPulse = status === 'awaiting'
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', TONE_STYLES[fieldLifecycleTone(status)], className)}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full bg-current opacity-80',
          showPulse && 'animate-pulse opacity-100',
        )}
      />
      {fieldLifecycleLabel(status)}
    </Badge>
  )
}
