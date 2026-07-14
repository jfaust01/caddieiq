import { Badge } from '@/components/ui/badge'
import type { PlayerStatus } from '@/features/players/types'
import { statusLabel, statusTone } from '@/features/players/utils/format'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<ReturnType<typeof statusTone>, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
}

interface PlayerStatusBadgeProps {
  status: PlayerStatus
  className?: string
}

export function PlayerStatusBadge({ status, className }: PlayerStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', TONE_STYLES[statusTone(status)], className)}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current opacity-80"
      />
      {statusLabel(status)}
    </Badge>
  )
}
