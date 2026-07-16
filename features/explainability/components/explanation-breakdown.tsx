"use client"

import { ArrowDown, ArrowUp, Minus, Info } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  type Contributor,
  type ContributorDirection,
  type Explanation,
  type ExplanationConfidence,
  deterministicNarrator,
} from "@/lib/explainability"

/** Confidence → chip tone, reusing the app's semantic tokens (no new colors). */
const CONFIDENCE_CHIP: Record<ExplanationConfidence, string> = {
  high: "bg-success/15 text-success border-success/20",
  medium: "bg-primary/15 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
}

/** Direction → tone for the contribution figure and icon. */
const DIRECTION_TONE: Record<ContributorDirection, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

function DirectionIcon({ direction }: { direction: ContributorDirection }) {
  const Icon = direction === "positive" ? ArrowUp : direction === "negative" ? ArrowDown : Minus
  return <Icon className={cn("size-3.5 shrink-0", DIRECTION_TONE[direction])} aria-hidden />
}

/** Render the headline value in its correct unit, or an em-dash when absent. */
function headlineValue(explanation: Explanation): string {
  const { value, unit } = explanation.headline
  if (value === null) return "\u2014"
  if (unit === "probability") return `${value}%`
  if (unit === "score-100") return `${value}`
  return `${value}`
}

function ContributorRow({ contributor }: { contributor: Contributor }) {
  const { label, description, normalizedValue, weightPct, contribution, direction, independent } =
    contributor
  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <DirectionIcon direction={direction} />
          <span className="text-sm font-medium tracking-tight">{label}</span>
          {independent ? (
            <Badge variant="outline" className="text-[0.625rem] text-muted-foreground">
              Context only
            </Badge>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums">
          {normalizedValue !== null ? (
            <span className="text-sm font-semibold">{normalizedValue}</span>
          ) : null}
          {contribution !== null ? (
            <span className={cn("text-xs font-medium", DIRECTION_TONE[direction])}>
              {contribution > 0 ? "+" : ""}
              {contribution}
            </span>
          ) : null}
        </div>
      </div>

      {/* Weight bar — only for weighted (composite) contributors. */}
      {weightPct !== null ? (
        <div className="flex items-center gap-2">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={weightPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} weight`}
          >
            <div
              className={cn(
                "h-full rounded-full",
                direction === "negative" ? "bg-destructive/70" : "bg-primary/70",
              )}
              style={{ width: `${weightPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.625rem] tabular-nums text-muted-foreground">
            {weightPct}%
          </span>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{description}</p>
    </li>
  )
}

export interface ExplanationBreakdownProps {
  explanation: Explanation
  className?: string
}

/**
 * The full, presentational breakdown of a single model Explanation. Pure props,
 * no data fetching. If the passed explanation has no narrative yet, the
 * deterministic narrator fills it here so the summary is never blank — the
 * component and any caller therefore always agree on the prose.
 */
export function ExplanationBreakdown({ explanation, className }: ExplanationBreakdownProps) {
  const narrated =
    explanation.narrative.summary.length > 0
      ? explanation
      : { ...explanation, narrative: deterministicNarrator.narrate(explanation) }

  const { model, subject, headline, contributors, assumptions, limitations, provenance, narrative } =
    narrated

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Headline */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {model.label}
          </span>
          <span className="text-sm font-medium text-pretty">{subject.label}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">{headlineValue(narrated)}</span>
            {headline.unit === "score-100" ? (
              <span className="text-xs text-muted-foreground">/ 100</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            {headline.band ? (
              <Badge variant="secondary" className="text-[0.625rem]">
                {headline.band}
              </Badge>
            ) : null}
            <Badge className={cn("border text-[0.625rem]", CONFIDENCE_CHIP[headline.confidence])}>
              {headline.confidenceLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Narrative summary */}
      <p className="text-sm leading-relaxed text-foreground text-pretty">{narrative.summary}</p>

      {/* Contributors */}
      {contributors.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contributing signals
          </span>
          <ul className="flex flex-col divide-y divide-border">
            {contributors.map((c) => (
              <ContributorRow key={c.key} contributor={c} />
            ))}
          </ul>
        </div>
      ) : null}

      {/* Limitations — always shown when present, never hidden. */}
      {limitations.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Limitations
          </span>
          <ul className="flex flex-col gap-1">
            {limitations.map((l) => (
              <li key={l.code} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="leading-relaxed text-pretty">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Assumptions */}
      {assumptions.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Assumptions
          </span>
          <ul className="flex flex-col gap-1">
            {assumptions.map((a) => (
              <li key={a.code} className="text-xs leading-relaxed text-muted-foreground text-pretty">
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Separator />

      {/* Provenance */}
      <div className="flex flex-col gap-0.5 text-[0.6875rem] text-muted-foreground/80">
        <span>Sources: {provenance.sources.join(", ")}</span>
        {provenance.asOf ? <span>Data as of {provenance.asOf.slice(0, 10)}</span> : null}
      </div>
    </div>
  )
}
