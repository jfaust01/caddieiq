/**
 * Course Fit module — scaffold only.
 *
 * Estimates how well a player's skill profile matches the demands of a course
 * (distance off the tee, approach precision, scrambling, putting surface).
 * Extends {@link BaseAnalyticsModule} for validation, logging, timing, and
 * error normalization.
 *
 * TODO(sportsdataio): replace the mock scoring in `compute()` with a real
 * calculation that compares normalized player skill vectors against course
 * characteristics. No real math happens here yet.
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

export class CourseFitModule extends BaseAnalyticsModule {
  readonly key: AnalyticsModuleKey = "course-fit"
  readonly label = "Course Fit"
  readonly description =
    "How well a player's skill profile matches a course's demands."

  // Course fit is meaningful for both a player (vs. a course) and a course
  // (which archetypes it rewards).
  protected override readonly supportedSubjects: AnalyticsSubjectKind[] = [
    "player",
    "course",
  ]

  protected async compute(context: AnalyticsContext): Promise<AnalyticsResult> {
    const { subject } = context
    const seed = hashSeed(this.key, subject.id, subject.courseId ?? "")

    // TODO(sportsdataio): derive fit from normalized player skills + course
    // characteristics instead of the deterministic mock generator.
    const value = round(seededValue(seed + 1, 35, 96))
    const confidence = seededConfidence(seed + 2)

    const metrics = [
      this.buildScore("driving-fit", "Driving fit", round(seededValue(seed + 3, 30, 98)), {
        percentile: Math.round(seededValue(seed + 4, 10, 99)),
        confidence,
      }),
      this.buildScore("approach-fit", "Approach fit", round(seededValue(seed + 5, 30, 98)), {
        percentile: Math.round(seededValue(seed + 6, 10, 99)),
        confidence,
      }),
      this.buildScore("around-green-fit", "Around-green fit", round(seededValue(seed + 7, 30, 98)), {
        percentile: Math.round(seededValue(seed + 8, 10, 99)),
        confidence,
      }),
    ]

    const score = this.buildScore("course-fit", this.label, value, {
      confidence,
      description: "Composite match of player skills to course demands.",
    })

    const result = this.buildResult(context, score, metrics, "", confidence)
    return { ...result, summary: this.summarize(result) }
  }

  summarize(result: AnalyticsResult): string {
    const v = Math.round(result.score.value)
    const grade = v >= 75 ? "a strong fit" : v >= 50 ? "a moderate fit" : "a weak fit"
    return `Course fit scores ${v}/100 — ${grade} for this setup. (mock)`
  }
}
