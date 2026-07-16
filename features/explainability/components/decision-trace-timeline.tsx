"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronDown, Flag, Info, Minus, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  toDecisionTrace,
  type DecisionTrace,
  type DecisionTraceStage,
  type Explanation,
  type ExplanationConfidence,
  type TraceImpact,
} from "@/lib/explainability"

/** Confidence → chip tone, reusing the app's semantic tokens (no new colors). */
const CONFIDENCE_CHIP: Record<ExplanationConfidence, string> = {
  high: "bg-success/15 text-success border-success/20",
  medium: "bg-primary/15 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
}

const CONFIDENCE_LABEL: Record<ExplanationConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "Unavailable",
}

/** Impact → tone for icons and figures. */
const IMPACT_TONE: Record<TraceImpact, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

/** Impact → tone for the timeline node ring. */
const IMPACT_NODE: Record<TraceImpact, string> = {
  positive: "border-success/40 bg-success/10 text-success",
  negative: "border-destructive/40 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
}

function ImpactIcon({ impact }: { impact: TraceImpact }) {
  const Icon = impact === "positive" ? ArrowUp : impact === "negative" ? ArrowDown : Minus
  return <Icon className="size-3.5 shrink-0" aria-hidden />
}

/** Discrete 0–5 star weight. Renders nothing when the stage has no weight. */
function WeightStars({ stars }: { stars: DecisionTraceStage["weightStars"] }) {
  if (stars === null) return null
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`Weight ${stars} of 5`}
      title={`Weight ${stars} of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < stars ? "fill-primary text-primary" : "fill-transparent text-muted-foreground/40",
          )}
          aria-hidden
        />
      ))}
    </span>
  )
}

function StageCard({ stage, isLast }: { stage: DecisionTraceStage; isLast: boolean }) {
  const isFinal = stage.category === "final"
  const hasDetail = stage.evidence.length > 0 || stage.summary.length > 0

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* Rail + node */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border",
            isFinal ? "border-primary/50 bg-primary/15 text-primary" : IMPACT_NODE[stage.impact],
          )}
        >
          {isFinal ? <Flag className="size-3.5" aria-hidden /> : <ImpactIcon impact={stage.impact} />}
        </span>
        {!isLast ? <span className="mt-1 w-px flex-1 bg-border" aria-hidden /> : null}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 pt-0.5">
        <details className="group" open={isFinal}>
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start justify-between gap-2",
              hasDetail ? "" : "cursor-default",
            )}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                {stage.categoryLabel}
              </span>
              <span className="text-sm font-medium tracking-tight text-pretty">{stage.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!stage.influencesOutcome && !isFinal ? (
                <Badge variant="outline" className="text-[0.625rem] text-muted-foreground">
                  Context only
                </Badge>
              ) : null}
              <WeightStars stars={stage.weightStars} />
              {hasDetail ? (
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              ) : null}
            </div>
          </summary>

          {hasDetail ? (
            <div className="mt-2 flex flex-col gap-2">
              {stage.summary ? (
                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                  {stage.summary}
                </p>
              ) : null}
              {stage.evidence.length > 0 ? (
                <dl className="flex flex-wrap gap-x-4 gap-y-1">
                  {stage.evidence.map((e) => (
                    <div key={e.label} className="flex items-baseline gap-1.5">
                      <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                        {e.label}
                      </dt>
                      <dd
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          e.label === "Contribution" ? IMPACT_TONE[stage.impact] : "text-foreground",
                        )}
                      >
                        {e.display ?? "\u2014"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {!isFinal ? (
                <Tooltip>
                  <TooltipTrigger
                    className={cn("border text-[0.625rem] cursor-help", CONFIDENCE_CHIP[stage.confidence], "rounded-full px-2 py-0.5 inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50")}
                  >
                    {CONFIDENCE_LABEL[stage.confidence]} confidence
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      {stage.confidence === "high" &&
                        "High confidence: Strong agreement between input signals and minimal missing data."}
                      {stage.confidence === "medium" &&
                        "Medium confidence: Some signals agree or minor missing data affects the result."}
                      {stage.confidence === "low" &&
                        "Low confidence: Signals are mixed or substantial data is unavailable."}
                      {stage.confidence === "none" &&
                        "No confidence: Insufficient data to assess reliability."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          ) : null}
        </details>
      </div>
    </li>
  )
}

export interface DecisionTraceTimelineProps {
  /** Either a prebuilt trace, or an explanation to derive one from. */
  trace?: DecisionTrace
  explanation?: Explanation
  className?: string
}

/**
 * The Decision Trace timeline: an ordered, expandable pipeline view of how a
 * model reached its result. Presentational only — it renders a {@link
 * DecisionTrace} derived purely from a canonical {@link Explanation}, so it can
 * never disagree with the "Why?" breakdown. Limitations are always shown.
 */
export function DecisionTraceTimeline({
  trace: traceProp,
  explanation,
  className,
}: DecisionTraceTimelineProps) {
  const trace = React.useMemo(
    () => traceProp ?? (explanation ? toDecisionTrace(explanation) : null),
    [traceProp, explanation],
  )

  if (!trace) return null

  const unavailable = trace.headlineValue === null

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Headline */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {trace.modelLabel}
          </span>
          <span className="text-sm font-medium text-pretty">{trace.subject.label}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-3xl font-semibold tabular-nums">{trace.headlineDisplay}</span>
          <Badge
            className={cn("border text-[0.625rem]", CONFIDENCE_CHIP[trace.overallConfidence])}
          >
            {trace.overallConfidenceLabel}
          </Badge>
        </div>
      </div>

      {/* Pipeline */}
      {unavailable && trace.stages.length <= 1 ? (
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          No decision pipeline is available because the model could not produce a grounded score.
          See the limitations below.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Decision pipeline
          </span>
          <ol className="flex flex-col pt-1">
            {trace.stages.map((stage, i) => (
              <StageCard key={stage.id} stage={stage} isLast={i === trace.stages.length - 1} />
            ))}
          </ol>
        </div>
      )}

      {/* Limitations — always shown when present, never hidden. */}
      {trace.limitations.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Limitations
          </span>
          <ul className="flex flex-col gap-1">
            {trace.limitations.map((l) => (
              <li key={l.code} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="leading-relaxed text-pretty">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
