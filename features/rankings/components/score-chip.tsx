import { cn } from '@/lib/utils'

import { formatScore, scoreTone, type Tone } from '../utils/format'

const TONE_STYLES: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive/15 text-destructive',
}

interface ScoreChipProps {
  value: number
  className?: string
}

/** A compact 0–100 score pill, colored by band. */
export function ScoreChip({ value, className }: ScoreChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums',
        TONE_STYLES[scoreTone(value)],
        className,
      )}
    >
      {formatScore(value)}
    </span>
  )
}

interface ScoreBarProps {
  value: number
  className?: string
}

/** A labeled score with a thin progress track, used in the preview panel. */
export function ScoreBar({ value, className }: ScoreBarProps) {
  const tone = scoreTone(value)
  const trackTone: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    muted: 'bg-muted-foreground/50',
    default: 'bg-primary',
    destructive: 'bg-destructive',
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className={cn('h-full rounded-full', trackTone[tone])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">
        {formatScore(value)}
      </span>
    </div>
  )
}
