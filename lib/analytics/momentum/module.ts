/**
 * Momentum module — scaffold only.
 *
 * Captures short-term trajectory: whether a player is heating up (improving
 * round-over-round, climbing rankings) or cooling down. Distinct from Recent
 * Form, which measures level; momentum measures *direction and acceleration*.
 * Extends {@link BaseAnalyticsModule} for validation, logging, timing, and
 * error normalization.
 *
 * TODO(sportsdataio): replace the mock scoring in `compute()` with a real
 * calculation over normalized recent results (round-over-round deltas, ranking
 * movement, trajectory). No real math happens here yet.
 */

import { BaseAnalyticsModule } from "../shared/base-module"
import {
  hashSeed,
  round,
  seededConfidence,
  seededTrend,
  seededValue,
} from "../shared/mock"
import type {
  AnalyticsContext,
  AnalyticsModuleKey,
  AnalyticsResult,
} from "../shared/types"

export class MomentumModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "momentum"
  readonly label = "Momentum"
  readonly description =
    "Short-term trajectory — whether a player is heating up or cooling down."

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const seed = hashSeed(this.key, subject.id)

    // TODO(sportsdataio): derive from normalized round-over-round deltas and
    // ranking movement instead of the deterministic mock generator.
    const value = round(seededValue(seed + 1, 25, 98))
    const trend = seededTrend(seed + 2)
    const confidence = seededConfidence(seed + 3)

    const metrics = [
      this.buildScore("scoring-trajectory", "Scoring trajectory", round(seededValue(seed + 4, 20, 97)), {
        trend,
        confidence,
      }),
      this.buildScore("ranking-movement", "Ranking movement", round(seededValue(seed + 5, 20, 97)), {
        rawValue: Math.round(seededValue(seed + 6, -25, 25)),
        unit: "spots",
        trend,
        confidence,
      }),
    ]

    const score = this.buildScore("momentum", this.label, value, {
      trend,
      confidence,
      description: "Composite of scoring trajectory and ranking movement.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const trendWord =
      result.score.trend === "up"
        ? "building momentum"
        : result.score.trend === "down"
          ? "losing momentum"
          : "steady"
    return `Momentum scores ${Math.round(result.score.value)}/100 and is ${trendWord}. (mock)`
  }
}
