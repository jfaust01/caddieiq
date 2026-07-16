"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { extractWhyThisPickInsight, type Explanation } from "@/lib/explainability"
import { WhyButton } from "./why-button"

export interface WhyThisPickCardProps {
  explanation: Explanation
  playerName?: string
  className?: string
}

export function WhyThisPickCard({ explanation, playerName, className }: WhyThisPickCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const insight = extractWhyThisPickInsight(explanation)

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base">{insight.insight}</CardTitle>
            <CardDescription className="mt-1 text-xs">{insight.confidenceReasoning}</CardDescription>
          </div>
          {insight.hasConfidence && (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-green-100/40 px-2 py-1 dark:bg-green-900/20">
              <div className="size-1.5 rounded-full bg-green-600 dark:bg-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">High Conviction</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Top Factors */}
        {insight.topFactors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why This Pick</span>
            <ul className="flex flex-col gap-1.5">
              {insight.topFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.625rem] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {insight.risks.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg bg-destructive/5 p-3 dark:bg-destructive/10">
            <span className="text-xs font-semibold uppercase tracking-wide text-destructive">Risks & Concerns</span>
            <ul className="flex flex-col gap-1">
              {insight.risks.map((risk, i) => (
                <li key={i} className="text-xs text-destructive/80">
                  • {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable Reveal */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-xs"
        >
          <span>{isExpanded ? "Hide Full Analysis" : "Show Full Analysis"}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        </Button>

        {/* Full Analysis */}
        {isExpanded && (
          <div className="flex flex-col gap-3 border-t pt-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confidence Reasoning</span>
              <p className="text-sm text-muted-foreground">{insight.confidenceReasoning}</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Coverage</span>
              <p className="text-sm text-muted-foreground">
                {insight.factorCount} influential factors analyzed
                {!insight.hasConfidence && " (some data gaps detected)"}
              </p>
            </div>

            <div className="pt-2">
              <WhyButton explanation={explanation} label="View Decision Trace" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
