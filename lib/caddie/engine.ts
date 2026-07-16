/**
 * AI Caddie — deterministic engine orchestrator.
 *
 * `askCaddie` classifies the question, then dispatches to the pure answerer for
 * that intent using the verified {@link CaddieDataBundle}. Board/field intents
 * are answered entirely from the bundle. Player-specific intents (compare,
 * explain) require analytics the server resolves by name against the field; the
 * caller passes those in via `resolvedPlayers`. When they're absent, the engine
 * degrades honestly rather than fabricating.
 *
 * Pure and deterministic: same question + same inputs ⇒ same answer.
 */

import type { CaddieAnswer, CaddieDataBundle, CaddieRouteResult } from "./types"
import { routeCaddieQuestion } from "./intent-router"
import { answerBestCashPlays, answerBestGppPlays, answerUnderpriced } from "./answerers/dfs"
import { answerCourseFit, answerFades } from "./answerers/course-fit"
import { answerTopForm } from "./answerers/form"
import { answerOddsFavorites } from "./answerers/odds"
import { answerWeather } from "./answerers/weather"
import { answerCompare, answerExplainRating, type ResolvedPlayer } from "./answerers/players"
import { answerCapabilities, CADDIE_EXAMPLE_QUESTIONS } from "./answerers/capabilities"

/** Optional, server-resolved players for compare/explain intents. */
export interface CaddieResolvedInputs {
  /** Players matched (by name) to real field members, in question order. */
  readonly resolvedPlayers?: readonly ResolvedPlayer[]
}

/** Classify a question without answering (exposed for the UI / tests). */
export function routeCaddie(raw: string): CaddieRouteResult {
  return routeCaddieQuestion(raw)
}

/** The canonical example questions, for empty-state prompts. */
export function getCaddieCapabilities(): readonly string[] {
  return CADDIE_EXAMPLE_QUESTIONS
}

/**
 * Answer a natural-language question, grounded in the bundle.
 * @param raw   The user's question.
 * @param bundle Verified engine output for the active tournament.
 * @param inputs Optional server-resolved players (compare/explain).
 */
export function askCaddie(
  raw: string,
  bundle: CaddieDataBundle,
  inputs: CaddieResolvedInputs = {},
): CaddieAnswer {
  const route = routeCaddieQuestion(raw)
  const { tournamentName, courseName } = bundle
  const resolved = inputs.resolvedPlayers ?? []

  switch (route.intent) {
    case "best_cash_plays":
      return answerBestCashPlays(bundle.dfs, tournamentName)
    case "best_gpp_plays":
      return answerBestGppPlays(bundle.dfs, tournamentName)
    case "underpriced":
      return answerUnderpriced(bundle.dfs, tournamentName)
    case "course_fit":
      return answerCourseFit(bundle.fit, tournamentName, courseName)
    case "fades":
      return answerFades(bundle.fit, tournamentName, courseName)
    case "top_form":
      return answerTopForm(bundle.skill, tournamentName, route.params.raw)
    case "odds_favorites":
      return answerOddsFavorites(bundle.odds, tournamentName)
    case "weather":
      return answerWeather(bundle.weather, tournamentName)
    case "compare_players":
      return answerCompare(resolved, tournamentName)
    case "explain_rating":
      return answerExplainRating(resolved[0] ?? null, tournamentName)
    case "capabilities":
      return answerCapabilities(tournamentName, "capabilities")
    case "unknown":
    default:
      return answerCapabilities(tournamentName, "unknown")
  }
}
