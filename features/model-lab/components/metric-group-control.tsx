'use client'

import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import type { MetricGroupDefinition, ModelMetric } from '../types'

interface MetricGroupControlProps {
  definition: MetricGroupDefinition
  metric: ModelMetric
  /** Share of the model's total weight, as a percentage (0–100). */
  share: number
  disabled?: boolean
  onToggle: (enabled: boolean) => void
  onWeightChange: (weight: number) => void
}

/**
 * A single metric group's control: an enable toggle, a weight slider, and a
 * numeric percentage input, plus the group's share of total model weight.
 */
export function MetricGroupControl({
  definition,
  metric,
  share,
  disabled = false,
  onToggle,
  onWeightChange,
}: MetricGroupControlProps) {
  const controlsDisabled = disabled || !metric.enabled
  const inputId = `metric-${definition.key}`

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card px-3 py-3 ring-1 ring-transparent transition-colors',
        metric.enabled ? 'border-border' : 'border-dashed opacity-80',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {definition.label}
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            {definition.description}
          </p>
        </div>
        <Switch
          checked={metric.enabled}
          onCheckedChange={(checked) => onToggle(checked)}
          disabled={disabled}
          aria-label={`Enable ${definition.label}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <Slider
          className="flex-1"
          value={[metric.weight]}
          min={0}
          max={100}
          step={1}
          disabled={controlsDisabled}
          aria-label={`${definition.label} weight`}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            onWeightChange(next)
          }}
        />
        <div className="flex items-center gap-1">
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={metric.weight}
            disabled={controlsDisabled}
            onChange={(event) => onWeightChange(Number(event.target.value))}
            className="h-7 w-14 rounded-md border border-input bg-transparent px-2 text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {metric.enabled ? (
        <p className="text-xs text-muted-foreground">
          <span className="tabular-nums text-foreground">{share}%</span> of total
          model weight
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Disabled — not included in the model</p>
      )}
    </div>
  )
}
