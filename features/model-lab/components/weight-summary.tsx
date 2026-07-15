'use client'

import { AlertTriangle, RotateCcw, Scale } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WeightSummaryProps {
  total: number
  overweight: boolean
  disabled?: boolean
  onReset: () => void
  onNormalize: () => void
}

/**
 * The weight-control footer: a live total-weight meter that warns when the sum
 * exceeds 100%, with Reset and Normalize actions.
 */
export function WeightSummary({
  total,
  overweight,
  disabled = false,
  onReset,
  onNormalize,
}: WeightSummaryProps) {
  const balanced = total === 100
  const barWidth = Math.min(100, total)

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-surface/60 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Total weight</span>
        </div>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            overweight
              ? 'text-destructive'
              : balanced
                ? 'text-success'
                : 'text-foreground',
          )}
        >
          {total}%
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Total model weight"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            overweight ? 'bg-destructive' : balanced ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {overweight ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          Weights exceed 100%. Normalize to rebalance to exactly 100%.
        </p>
      ) : balanced ? (
        <p className="text-xs text-muted-foreground">
          Balanced — weights sum to exactly 100%.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Weights are relative and will be normalized when the model runs.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="flex-1"
        >
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNormalize}
          disabled={disabled}
          className="flex-1"
        >
          <Scale data-icon="inline-start" />
          Normalize
        </Button>
      </div>
    </div>
  )
}
