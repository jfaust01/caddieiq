/**
 * Wind module — scaffold only.
 *
 * Estimates how wind exposure affects scoring: a player's historical
 * performance in wind, and a tournament/course's expected wind difficulty.
 * Extends {@link BaseAnalyticsModule} for validation, logging, timing, and
 * error normalization.
 *
 * TODO(sportsdataio): replace the mock scoring in `compute()` with a real
 * calculation over normalized weather/round data (wind speed by round, scoring
 * deltas in wind). TODO(weather): fold in the forecast from the weather
 * provider. No real math happens here yet.
 */

import { BaseAnalyticsModule } from "../shared/base-module"
import {
  hashSeed,
  round,
  seededConfidence,
  seededValue,
} from "../shared/mock"
import type {
  AnalyticsContext,
  AnalyticsModuleKey,
  AnalyticsResult,
  AnalyticsSubjectKind,
} from "../shared/types"

export class WindModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "wind"
  readonly label = "Wind"
  readonly description =
    "Wind exposure and a subject's resilience to windy scoring conditions."

  protected override readonly supportedSubjects: AnalyticsSubjectKind[] = [
    "player",
    "tournament",
    "course",
  ]

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const seed = hashSeed(this.key, subject.id, subject.tournamentId ?? "")

    // TODO(sportsdataio, weather): derive from normalized weather + round data
    // instead of the deterministic mock generator.
    const value = round(seededValue(seed + 1, 30, 95))
    const confidence = seededConfidence(seed + 2)

    const metrics = [
      this.buildScore("expected-wind", "Expected wind", round(seededValue(seed + 3, 20, 90)), {
        rawValue: round(seededValue(seed + 4, 4, 28), 0),
        unit: "mph",
        confidence,
      }),
      this.buildScore("wind-resilience", "Wind resilience", round(seededValue(seed + 5, 25, 96)), {
        percentile: Math.round(seededValue(seed + 6, 5, 99)),
        confidence,
      }),
    ]

    const score = this.buildScore("wind", this.label, value, {
      confidence,
      description: "Composite of expected wind and the subject's wind resilience.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const v = Math.round(result.score.value)
    const band = v >= 70 ? "handles wind well" : v >= 45 ? "is average in wind" : "struggles in wind"
    return `Wind score ${v}/100 — subject ${band}. (mock)`
  }
}
