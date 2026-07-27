import { cn } from '@/lib/utils'

/**
 * The single, consistent representation of a missing value inside a supported
 * column: a muted em-dash. Never fabricate data — render this instead.
 *
 * NOTE: this is for occasional missing values within a column that IS
 * supported. Entire unsupported columns are omitted from the phase config, not
 * rendered as full columns of em-dashes.
 */
export function MetricEmptyState({ className }: { className?: string }) {
  return (
    <span
      aria-label="No data"
      className={cn('text-sm text-muted-foreground', className)}
    >
      —
    </span>
  )
}
