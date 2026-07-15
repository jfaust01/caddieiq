import { Badge } from '@/components/ui/badge'
import type { FieldEntryStatus } from '@/features/tournaments/types'
import { fieldStatusLabel, fieldStatusTone } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<ReturnType<typeof fieldStatusTone>, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
}

interface FieldStatusBadgeProps {
  status: FieldEntryStatus
  className?: string
}

/** Compact badge for a field entry's participation status. */
export function FieldStatusBadge({ status, className }: FieldStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', TONE_STYLES[fieldStatusTone(status)], className)}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-80" />
      {fieldStatusLabel(status)}
    </Badge>
  )
}
