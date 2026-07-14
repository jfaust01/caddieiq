/**
 * Strokes Gained module — scaffold only.
 *
 * Breaks a player's performance into the four strokes-gained categories
 * (off-the-tee, approach, around-the-green, putting) plus a total. Extends
 * {@link BaseAnalyticsModule} for validation, logging, timing, and error
 * normalization.
 *
 * TODO(sportsdataio): replace the mock scoring in `compute()` with real
 * strokes-gained figures derived from normalized shot/round data. No real math
 * happens here yet.
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
  MetricScore,
} from "../shared/types"

/** The canonical strokes-gained categories. */
const SG_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "sg-ott", label: "SG: Off-the-Tee" },
  { key: "sg-app", label: "SG: Approach" },
  { key: "sg-arg", label: "SG: Around-the-Green" },
  { key: "sg-putt", label: "SG: Putting" },
]

export class StrokesGainedModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "strokes-gained"
  readonly label = "Strokes Gained"
  readonly description =
    "Performance decomposed into the four strokes-gained categories plus total."

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const baseSeed = hashSeed(this.key, subject.id)

    // TODO(sportsdataio): compute each SG category from normalized round data
    // instead of the deterministic mock generator.
    const metrics: MetricScore[] = SG_CATEGORIES.map((category, index) => {
      const seed = baseSeed + index * 10
      const raw = round(seededValue(seed + 1, -0.8, 1.8), 2)
      // Normalize roughly -1..+2 strokes into a 0–100 score.
      const value = round(Math.max(0, Math.min(100, ((raw + 1) / 3) * 100)))
      return this.buildScore(category.key, category.label, value, {
        rawValue: raw,
        unit: "strokes",
        percentile: Math.round(seededValue(seed + 2, 5, 99)),
        trend: seededTrend(seed + 3),
        confidence: seededConfidence(seed + 4),
      })
    })

    const totalRaw = round(
      metrics.reduce((sum, metric) => sum + (metric.rawValue ?? 0), 0),
      2,
    )
    const totalValue = round(
      metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length,
    )
    const confidence = seededConfidence(baseSeed + 99)

    const score = this.buildScore("sg-total", "SG: Total", totalValue, {
      rawValue: totalRaw,
      unit: "strokes",
      confidence,
      description: "Sum of the four strokes-gained categories.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const raw = result.score.rawValue ?? 0
    const sign = raw >= 0 ? "+" : ""
    return `Strokes gained total is ${sign}${raw} per round across all categories. (mock)`
  }
}
