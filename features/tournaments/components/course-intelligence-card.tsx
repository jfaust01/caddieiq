/**
 * Course Intelligence Card Component.
 *
 * Displays course intelligence metrics in Tournament Command Center.
 * Shows star ratings and numeric scores for all metrics.
 */

"use client"

import { Zap, Wind, Target, BarChart3, AlertTriangle } from "lucide-react"
import type { CourseIntelligence } from "@/lib/course-intelligence"
import { formatTimestamp } from '@/features/tournaments/utils/format'

interface CourseIntelligenceCardProps {
  intelligence: CourseIntelligence
}

/**
 * Star rating component (1-5 stars).
 */
function StarRating({ stars }: { stars: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-lg ${i <= stars ? "text-amber-400" : "text-muted-foreground/30"}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

/**
 * Metric display component.
 */
function MetricDisplay({
  label,
  stars,
  score,
  icon: Icon,
}: {
  label: string
  stars: 1 | 2 | 3 | 4 | 5
  score: number
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{Icon}</div>
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          <StarRating stars={stars} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{score}</p>
      </div>
    </div>
  )
}

/**
 * Course Intelligence Card.
 *
 * Displays all nine course intelligence metrics with star ratings and scores.
 */
export function CourseIntelligenceCard({ intelligence }: CourseIntelligenceCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Course Intelligence</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Generated {formatTimestamp(intelligence.generatedAt)}
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Difficulty & Skills</p>

        <MetricDisplay
          label="Overall Difficulty"
          stars={intelligence.overallDifficulty.stars}
          score={intelligence.overallDifficulty.score}
          icon={<AlertTriangle className="size-4" />}
        />

        <MetricDisplay
          label="Driving Importance"
          stars={intelligence.drivingImportance.stars}
          score={intelligence.drivingImportance.score}
          icon={<Zap className="size-4" />}
        />

        <MetricDisplay
          label="Approach Importance"
          stars={intelligence.approachImportance.stars}
          score={intelligence.approachImportance.score}
          icon={<Target className="size-4" />}
        />

        <MetricDisplay
          label="Short Game Importance"
          stars={intelligence.shortGameImportance.stars}
          score={intelligence.shortGameImportance.score}
          icon={<BarChart3 className="size-4" />}
        />

        <MetricDisplay
          label="Putting Importance"
          stars={intelligence.puttingImportance.stars}
          score={intelligence.puttingImportance.score}
          icon={<Target className="size-4" />}
        />
      </div>

      {/* Environmental Factors */}
      <div className="space-y-3 border-t border-border/50 pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Environmental</p>

        <MetricDisplay
          label="Wind Sensitivity"
          stars={intelligence.windSensitivity.stars}
          score={intelligence.windSensitivity.score}
          icon={<Wind className="size-4" />}
        />

        <MetricDisplay
          label="Penalty Severity"
          stars={intelligence.penaltySeverity.stars}
          score={intelligence.penaltySeverity.score}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      {/* Scoring Environment */}
      <div className="space-y-3 border-t border-border/50 pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scoring</p>

        <MetricDisplay
          label="Birdie Potential"
          stars={intelligence.birdiePotential.stars}
          score={intelligence.birdiePotential.score}
          icon={<Zap className="size-4" />}
        />

        <MetricDisplay
          label="Scoring Volatility"
          stars={intelligence.scoringVolatility.stars}
          score={intelligence.scoringVolatility.score}
          icon={<BarChart3 className="size-4" />}
        />
      </div>
    </div>
  )
}
