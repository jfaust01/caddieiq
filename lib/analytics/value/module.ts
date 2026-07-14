/**
 * Value module — scaffold only.
 *
 * Compares a player's model-implied win/finish probability against market
 * odds to flag betting value (edge). Extends {@link BaseAnalyticsModule} for
 * validation, logging, timing, and error normalization.
 *
 * TODO(sportsdataio): supply the model-implied probability from the analytics
 * engine's aggregate. TODO(odds): supply market prices from the odds provider.
 * The edge is the difference between the two. No real math happens here yet.
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
  AnalyticsSubjectKind,
} from "../shared/types"

export class ValueModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "value"
  readonly label = "Value"
  readonly description =
    "Betting edge: model-implied probability versus market odds."

  protected override readonly supportedSubjects: AnalyticsSubjectKind[] = [
    "player",
    "tournament",
  ]

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const seed = hashSeed(this.key, subject.id, subject.tournamentId ?? "")

    // TODO(odds, sportsdataio): compute edge from model probability vs. market
    // price instead of the deterministic mock generator.
    const modelProb = round(seededValue(seed + 1, 1, 22), 1)
    const marketProb = round(seededValue(seed + 2, 1, 22), 1)
    const edge = round(modelProb - marketProb, 1)
    // Map an edge of roughly -6..+6 points into a 0–100 value score.
    const value = round(Math.max(0, Math.min(100, ((edge + 6) / 12) * 100)))
    const confidence = seededConfidence(seed + 3)

    const metrics = [
      this.buildScore("model-probability", "Model win probability", round(seededValue(seed + 4, 5, 95)), {
        rawValue: modelProb,
        unit: "%",
        confidence,
      }),
      this.buildScore("market-probability", "Market implied probability", round(seededValue(seed + 5, 5, 95)), {
        rawValue: marketProb,
        unit: "%",
        confidence,
      }),
    ]

    const score = this.buildScore("value", this.label, value, {
      rawValue: edge,
      unit: "% edge",
      trend: seededTrend(seed + 6),
      confidence,
      description: "Difference between model probability and market implied probability.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const edge = result.score.rawValue ?? 0
    if (edge > 1) return `Positive value: model sees a +${edge}% edge over the market. (mock)`
    if (edge < -1) return `Negative value: market is ${Math.abs(edge)}% richer than the model. (mock)`
    return `Fairly priced: model and market roughly agree. (mock)`
  }
}
