/**
 * AI Caddie answerers grounded in the Course Fit Engine.
 *
 * "Who fits the course?" → the `topFits` list.
 * "Who should I fade?"   → the `fades` list.
 *
 * Reads only {@link FieldFitBoard}, cites the Course Fit Engine, and degrades
 * honestly when no fit could be scored for the field.
 */

import type { FieldFitBoard, FieldFitEntry } from "@/lib/analytics/course-fit/types"
import type { CaddieAnswer } from "../types"
import { emptyAnswer, formatScore, fromGradedConfidence, playerEntity } from "./shared"

const ENGINE = "Course Fit Engine"

function bandLabel(band: FieldFitEntry["result"]["band"]): string {
  if (!band) return "Unrated"
  return band
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function toEntities(entries: readonly FieldFitEntry[]) {
  return entries.map((e) =>
    playerEntity(e.playerId, e.displayName, `${formatScore(e.result.score)} · ${bandLabel(e.result.band)}`),
  )
}

/** "Who fits the course best?" */
export function answerCourseFit(fit: FieldFitBoard | null, tournamentName: string, courseName: string | null): CaddieAnswer {
  const venue = courseName ? ` at ${courseName}` : ""
  if (!fit || fit.scoredPlayers === 0 || fit.topFits.length === 0) {
    return emptyAnswer(
      "course_fit",
      tournamentName,
      ENGINE,
      "Course fit isn't scored yet",
      ["Who's in form?", "Best cash plays?", "Who should I fade?"],
    )
  }

  const top = fit.topFits.slice(0, 5)
  return {
    intent: "course_fit",
    headline: `Best course fits${venue}`,
    summary: `Highest demand-weighted course fits for ${tournamentName}${venue}.`,
    bullets: top.map(
      (e, i) => `${i + 1}. ${e.displayName} — fit ${formatScore(e.result.score)} (${bandLabel(e.result.band)})`,
    ),
    entities: toEntities(top),
    citations: [
      {
        engine: ENGINE,
        confidence: fromGradedConfidence(top[0].result.confidence),
        detail: `${fit.scoredPlayers} of ${fit.totalPlayers} players scored`,
      },
    ],
    confidence: fromGradedConfidence(top[0].result.confidence),
    followUps: ["Who should I fade?", "Best cash plays?", "Who's in form?"],
    isEmpty: false,
  }
}

/** "Who should I fade / avoid?" */
export function answerFades(fit: FieldFitBoard | null, tournamentName: string, courseName: string | null): CaddieAnswer {
  const venue = courseName ? ` at ${courseName}` : ""
  if (!fit || fit.scoredPlayers === 0 || fit.fades.length === 0) {
    return emptyAnswer(
      "fades",
      tournamentName,
      ENGINE,
      "Course fit isn't scored yet",
      ["Who fits the course?", "Best cash plays?", "Weather this week?"],
    )
  }

  const worst = fit.fades.slice(0, 5)
  return {
    intent: "fades",
    headline: `Potential fades${venue}`,
    summary: `Lowest demand-weighted course fits for ${tournamentName}${venue} — consider fading.`,
    bullets: worst.map(
      (e, i) => `${i + 1}. ${e.displayName} — fit ${formatScore(e.result.score)} (${bandLabel(e.result.band)})`,
    ),
    entities: toEntities(worst),
    citations: [
      {
        engine: ENGINE,
        confidence: fromGradedConfidence(worst[0].result.confidence),
        detail: `${fit.scoredPlayers} of ${fit.totalPlayers} players scored`,
      },
    ],
    confidence: fromGradedConfidence(worst[0].result.confidence),
    followUps: ["Who fits the course?", "Best GPP plays?", "Who's in form?"],
    isEmpty: false,
  }
}
