import type { FormResult } from '@/features/players/types'
import { formLabel, formTone, type Tone } from '@/features/players/utils/format'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  default: 'bg-accent text-accent-foreground',
}

interface RecentFormProps {
  form: FormResult[]
  /** Cap the number of pills rendered. */
  limit?: number
  className?: string
}

/**
 * Compact recent-form strip: one pill per recent finish, colored by result.
 * Newest result is first.
 */
export function RecentForm({ form, limit, className }: RecentFormProps) {
  const entries = typeof limit === 'number' ? form.slice(0, limit) : form

  if (entries.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No recent results</span>
    )
  }

  return (
    <ul
      className={cn('flex flex-wrap items-center gap-1', className)}
      aria-label="Recent form, newest first"
    >
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={cn(
            'inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums',
            TONE_STYLES[formTone(entry.position)],
          )}
          title={`${entry.event}: ${
            typeof entry.position === 'number'
              ? `finished ${entry.position}`
              : entry.position
          }`}
        >
          {formLabel(entry.position)}
        </li>
      ))}
    </ul>
  )
}
