"use client"

import { Info } from "lucide-react"

import type { MetricDefinition } from "@/lib/explainability/metric-glossary"
import { getMetricDefinition } from "@/lib/explainability/metric-glossary"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export interface MetricInfoProps {
  /** The metric key to look up in the glossary. */
  readonly metricKey: string
  /** Optional label to display inline; if omitted, uses the glossary label. */
  readonly label?: string
  /** Optional override of the glossary definition (for context-specific variants). */
  readonly definition?: MetricDefinition
  /** Optional CSS class for the icon. */
  readonly iconClassName?: string
  /** Optional CSS class for the wrapper. */
  readonly className?: string
}

/**
 * MetricInfo — a reusable component that displays a metric label with an
 * informational icon. On hover/focus, a tooltip appears with the full definition,
 * interpretation, and optional example/docs link. Fully accessible: keyboard
 * (Tab/Space/Enter), screen reader, touch, and mobile-friendly.
 *
 * The tooltip is powered by Base UI's Tooltip primitive, which provides:
 * - Focus trapping (none — tooltip doesn't trap focus)
 * - ESC to close
 * - ARIA labels and roles
 * - Viewport-constrained positioning
 * - Delay before appearing (configurable at provider level)
 *
 * Usage:
 * ```tsx
 * <MetricInfo metricKey="weight-percentage" label="Weight %" />
 * <MetricInfo metricKey="confidence-level" />
 * <MetricInfo
 *   metricKey="overall-rating"
 *   definition={overrideDefinition}
 *   iconClassName="w-4 h-4 text-primary"
 * />
 * ```
 */
export function MetricInfo({
  metricKey,
  label,
  definition,
  iconClassName = "w-4 h-4",
  className = "",
}: MetricInfoProps) {
  // Resolve the definition: use override, then glossary lookup, then dummy.
  const resolved = definition ?? getMetricDefinition(metricKey)

  // If no definition found, render nothing gracefully.
  if (!resolved) {
    return null
  }

  const displayLabel = label ?? resolved.label

  // Build tooltip content: definition + interpretation + example + docs link.
  const tooltipContent = [
    resolved.definition,
    resolved.interpretation ? `Interpretation: ${resolved.interpretation}` : null,
    resolved.example ? `Example: ${resolved.example}` : null,
  ]
    .filter(Boolean)
    .join("\n\n")

  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex items-center gap-1 cursor-help outline-none ring-1 ring-transparent focus-visible:ring-primary rounded-sm transition-[box-shadow] ${className}`}
        aria-label={`${displayLabel} — click for details`}
        aria-describedby={`metric-info-${metricKey}`}
      >
        <span>{displayLabel}</span>
        <Info className={`${iconClassName} text-muted-foreground hover:text-foreground transition-colors`} />
      </TooltipTrigger>
      <TooltipContent
        id={`metric-info-${metricKey}`}
        side="top"
        className="max-w-sm"
      >
        <div className="flex flex-col gap-2 whitespace-normal text-background">
          <p className="text-xs leading-relaxed">{resolved.definition}</p>
          {resolved.interpretation && (
            <p className="text-xs leading-relaxed">
              <span className="font-medium">→ </span>
              {resolved.interpretation}
            </p>
          )}
          {resolved.example && (
            <p className="text-[0.7rem] leading-relaxed text-background/80 italic">
              E.g.: {resolved.example}
            </p>
          )}
          {resolved.docsLink && (
            <a
              href={resolved.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.7rem] underline text-background/70 hover:text-background transition-colors"
            >
              Learn more →
            </a>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * MetricLabel — a simpler variant that just displays the label with an info icon
 * next to it, without wrapping in a clickable button. Useful for read-only contexts.
 */
export function MetricLabel({
  metricKey,
  label,
  definition,
  iconClassName = "w-3.5 h-3.5",
}: Omit<MetricInfoProps, "className">) {
  const resolved = definition ?? getMetricDefinition(metricKey)

  if (!resolved) {
    return null
  }

  const displayLabel = label ?? resolved.label

  const tooltipContent = [
    resolved.definition,
    resolved.interpretation ? `Interpretation: ${resolved.interpretation}` : null,
  ]
    .filter(Boolean)
    .join("\n\n")

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center gap-1 cursor-help outline-none ring-1 ring-transparent focus-visible:ring-primary rounded-sm transition-[box-shadow]"
        aria-label={`${displayLabel} — click for details`}
        aria-describedby={`metric-label-${metricKey}`}
      >
        <span className="text-xs font-medium text-foreground">
          {displayLabel}
        </span>
        <Info className={`${iconClassName} text-muted-foreground hover:text-foreground transition-colors`} />
      </TooltipTrigger>
      <TooltipContent
        id={`metric-label-${metricKey}`}
        side="top"
        className="max-w-sm"
      >
        <div className="flex flex-col gap-1 whitespace-normal text-background">
          <p className="text-xs leading-relaxed">{resolved.definition}</p>
          {resolved.interpretation && (
            <p className="text-xs leading-relaxed">
              <span className="font-medium">→ </span>
              {resolved.interpretation}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
