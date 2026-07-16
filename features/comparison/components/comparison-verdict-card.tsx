"use client"

import { Trophy, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { VerdictData } from "@/lib/comparison/verdict-engine"
import { cn } from "@/lib/utils"

export interface ComparisonVerdictCardProps {
  verdict: VerdictData
  onViewFullComparison?: () => void
}

export function ComparisonVerdictCard({
  verdict,
  onViewFullComparison,
}: ComparisonVerdictCardProps) {
  const confidenceBadgeColor = {
    high: "bg-green-500/15 text-green-700 border-green-200",
    medium: "bg-amber-500/15 text-amber-700 border-amber-200",
    low: "bg-red-500/15 text-red-700 border-red-200",
  }

  const confidenceLabel = {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Header with Winner */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold text-muted-foreground">OVERALL WINNER</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{verdict.overallWinnerName}</h3>
              {verdict.overallRating !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  Overall Rating: <span className="font-semibold text-foreground">{verdict.overallRating}</span>
                </p>
              )}
            </div>
          </div>
          <Badge className={cn("border", confidenceBadgeColor[verdict.confidence])}>
            {confidenceLabel[verdict.confidence]}
          </Badge>
        </div>

        {/* Category Scoreboard */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/40">
          {verdict.categoryWins.map((player) => (
            <div key={player.playerId} className="text-center">
              <p className="text-lg font-bold">{player.wins}</p>
              <p className="text-xs text-muted-foreground">
                {player.playerName.split(" ")[0]}
              </p>
              <p className="text-xs text-muted-foreground">Category Wins</p>
            </div>
          ))}
          <div className="col-span-3 flex items-center justify-center pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">{verdict.ties}</span> Ties
            </p>
          </div>
        </div>

        {/* Why This Verdict */}
        {verdict.whyReasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Why This Verdict
            </h4>
            <ul className="space-y-1 ml-6">
              {verdict.whyReasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Advantages */}
        {verdict.keyAdvantages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Key Advantages
            </h4>
            <div className="flex flex-wrap gap-2">
              {verdict.keyAdvantages.map((advantage, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                  {advantage}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Risks & Concerns */}
        {verdict.risks.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Watch Out For
            </h4>
            <ul className="space-y-1 ml-6">
              {verdict.risks.map((risk, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contest Fit */}
        {verdict.contestFit.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Best For
            </h4>
            <div className="flex flex-wrap gap-2">
              {verdict.contestFit.map((fit, idx) => (
                <Badge key={idx} className="bg-primary/15 text-primary border-primary/30">
                  {fit}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-sm">
            <span className="font-semibold text-primary">{verdict.recommendation}</span>
            <span className="text-muted-foreground ml-2">— Our verdict for lineup construction</span>
          </p>
        </div>

        {/* View Full Comparison Button */}
        <Button
          onClick={onViewFullComparison}
          variant="outline"
          className="w-full"
        >
          View Full Comparison
        </Button>
      </CardContent>
    </Card>
  )
}
