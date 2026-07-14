/**
 * Recent Form module — scaffold only.
 *
 * Measures how well a player has scored across their most recent starts,
 * weighting newer results more heavily. Extends {@link BaseAnalyticsModule} for
 * validation, logging, timing, and error normalization.
 *
 * TODO(sportsdataio): replace the mock scoring in `compute()` with a real
 * calculation over normalized recent-round data (finish positions, SG totals,
 * rounds-to-par) sourced from the data platform. No real math happens here yet.
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

export class RecentFormModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "recent-form"
  readonly label = "Recent Form"
  readonly description =
    "Weighted scoring performance across a player's most recent starts."

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const seed = hashSeed(this.key, subject.id)

    // TODO(sportsdataio): derive these from normalized recent rounds instead of
    // the deterministic mock generator.
    const value = round(seededValue(seed + 1, 40, 95))
    const trend = seededTrend(seed + 2)
    const confidence = seededConfidence(seed + 3)

    const metrics = [
      this.buildScore("last-5-scoring", "Last 5 scoring avg", round(seededValue(seed + 4, 45, 92)), {
        rawValue: round(seededValue(seed + 5, 68, 73), 1),
        unit: "strokes",
        trend,
        confidence,
      }),
      this.buildScore("finish-trend", "Finish trend", round(seededValue(seed + 6, 40, 96)), {
        percentile: Math.round(seededValue(seed + 7, 20, 99)),
        trend,
        confidence,
      }),
    ]

    const score = this.buildScore("recent-form", this.label, value, {
      trend,
      confidence,
      description: "Composite of recent scoring average and finishing trend.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const trendWord =
      result.score.trend === "up"
        ? "trending up"
        : result.score.trend === "down"
          ? "cooling off"
          : "holding steady"
    return `Recent form scores ${Math.round(result.score.value)}/100 and is ${trendWord}. (mock)`
  }
}
