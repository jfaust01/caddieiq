import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import type { RankingMovement as Movement } from '@/lib/ranking'
import { cn } from '@/lib/utils'

import { movementLabel } from '../utils/format'

const MOVEMENT_STYLES: Record<
  Movement,
  { icon: typeof ArrowUp; className: string }
> = {
  up: { icon: ArrowUp, className: 'text-success' },
  down: { icon: ArrowDown, className: 'text-destructive' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
}

interface RankingMovementProps {
  movement: Movement
  delta: number
  className?: string
}

/** Compact trend indicator: an arrow plus the signed positions moved. */
export function RankingMovement({
  movement,
  delta,
  className,
}: RankingMovementProps) {
  const { icon: Icon, className: tone } = MOVEMENT_STYLES[movement]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium tabular-nums',
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{movement === 'flat' ? '—' : Math.abs(delta)}</span>
      <span className="sr-only">{movementLabel(movement, delta)}</span>
    </span>
  )
}
