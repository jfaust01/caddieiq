import { Badge } from '@/components/ui/badge'
import type { TournamentStatus } from '@/features/tournaments/types'
import { statusLabel, statusTone } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<ReturnType<typeof statusTone>, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
}

interface TournamentStatusBadgeProps {
  status: TournamentStatus
  className?: string
}

export function TournamentStatusBadge({ status, className }: TournamentStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', TONE_STYLES[statusTone(status)], className)}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-80" />
      {statusLabel(status)}
    </Badge>
  )
}
