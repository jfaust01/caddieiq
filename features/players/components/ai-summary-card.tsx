"use client"

import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import { deterministicNarrator, toOverallRatingExplanation } from "@/lib/explainability"
import { WhyButton } from "@/features/explainability/components/why-button"

interface AiSummaryCardProps {
  analytics: PlayerAnalytics
  playerName: string
}

/**
 * AI Player Insight — a grounded, plain-language read of the player's Overall
 * Rating. The prose is produced by the deterministic Explanation narrator from
 * the same canonical Explanation that powers the "Why?" breakdown, so the
 * summary can never disagree with the numbers or invent a factor. When the
 * platform has no rating for the player, the card says so honestly instead of
 * fabricating an insight. The narrator sits behind a swappable interface, so an
 * LLM narrator can later produce richer prose from the identical Explanation.
 */
export function AiSummaryCard({ analytics, playerName }: AiSummaryCardProps) {
  const explanation = toOverallRatingExplanation(analytics, {
    kind: "player",
    id: analytics.playerId,
    label: playerName,
  })
  const narrative = deterministicNarrator.narrate(explanation)
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
        {narrative.bullets.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {narrative.bullets.map((bullet, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground text-pretty"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[0.6875rem] text-muted-foreground/70 text-pretty">
          Generated deterministically from CaddieIQ&apos;s Overall Rating explanation — every statement
          is grounded in the model&apos;s own data, never invented.
        </p>
      </CardContent>
    </Card>
  )
}
