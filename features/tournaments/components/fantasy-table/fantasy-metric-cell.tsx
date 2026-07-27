import { cn } from '@/lib/utils'
import { MetricEmptyState } from './metric-empty-state'

/** Small colored 0–100 bar rendered behind rating/fit numbers. */
export function ScoreMeter({ value, tone }: { value: number | null; tone: string }) {
  return (
    <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-white/[0.08]">
      {value != null && (
        <div
          className={cn('h-full rounded-full', tone)}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      )}
    </div>
  )
}

/**
 * A centered numeric fantasy metric (e.g. CaddieIQ rating, course fit) with an
 * optional 0–100 meter. Renders MetricEmptyState when the value is missing —
 * the value is always authoritative, never fabricated. Uses medium weight for
 * normal values, optionally semibold via valueClassName.
 */
export function FantasyMetricCell({
  value,
  meterTone,
  valueClassName,
  isSemibold = false,
}: {
  value: number | null
  /** When provided, renders a ScoreMeter beneath the value. */
  meterTone?: string
  /** Applied to the value text when a value exists. */
  valueClassName?: string
  /** If true, uses font-semibold instead of font-medium. */
  isSemibold?: boolean
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      {value == null ? (
        <MetricEmptyState />
      ) : (
        <span className={cn('text-sm tabular-nums', isSemibold ? 'font-semibold' : 'font-medium', valueClassName)}>
          {Math.round(value)}
        </span>
      )}
      {meterTone && <ScoreMeter value={value} tone={meterTone} />}
    </div>
  )
}
