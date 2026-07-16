"use client"

import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import { toDecisionTrace, narrateFromTrace, toOverallRatingExplanation } from "@/lib/explainability"
import { WhyButton } from "@/features/explainability/components/why-button"

interface AiSummaryCardProps {
  analytics: PlayerAnalytics
  playerName: string
}

/**
 * AI Player Insight — a grounded, plain-language walkthrough of how the player's
 * Overall Rating was decided. The prose is produced by narrating the model's
 * Decision Trace (the same ordered pipeline that powers the "Why?" timeline),
 * which is itself derived from the canonical Explanation. It therefore restates
 * only verified stages — a step-by-step read that can never disagree with the
 * timeline or invent a factor. When the platform has no rating, the card says so
 * honestly. The narrator is a pure function, so an LLM narrator can later produce
 * richer prose from the identical trace.
 */
export function AiSummaryCard({ analytics, playerName }: AiSummaryCardProps) {
  const explanation = toOverallRatingExplanation(analytics, {
    kind: "player",
    id: analytics.playerId,
    label: playerName,
  })
  const trace = toDecisionTrace(explanation)
  const narrative = narrateFromTrace(trace)
  const hasRating = explanation.headline.value !== null

  return (
    <Card className="ring-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <CardTitle>AI Player Insight</CardTitle>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">Grounded</Badge>
            {hasRating ? (
              <WhyButton explanation={explanation} label="Details" srContext={playerName} />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-foreground text-pretty">{narrative.summary}</p>
        {narrative.steps.length > 0 ? (
          <ol className="flex flex-col gap-1.5">
            {narrative.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground text-pretty"
              >
                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-medium text-primary"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {narrative.caveat ? (
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            <span className="font-medium text-foreground">Caveat: </span>
            {narrative.caveat}
          </p>
        ) : null}
        <p className="text-[0.6875rem] text-muted-foreground/70 text-pretty">
          Narrated deterministically from CaddieIQ&apos;s Overall Rating decision trace — every statement
          restates a verified pipeline stage, never invented.
        </p>
      </CardContent>
    </Card>
  )
}
