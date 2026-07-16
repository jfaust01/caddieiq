/**
 * AI Caddie answerers grounded in the Comparison + Explainability engines.
 *
 * These operate on already-resolved {@link PlayerAnalytics} (the service layer
 * matches the question's player-name fragments to real field members before
 * calling in, so a bad guess simply yields "no match" — never a fabricated
 * player). Pure and deterministic given their inputs.
 */

import type { PlayerAnalytics } from "@/lib/analytics/types"
import { buildComparison, generateVerdict } from "@/lib/comparison"
import { toOverallRatingExplanation } from "@/lib/explainability/adapters/overall-rating"
import type { CaddieAnswer } from "../types"
import { emptyAnswer, formatScore, playerEntity } from "./shared"

/** A resolved player: the name fragment matched to a real field member. */
export interface ResolvedPlayer {
  readonly playerId: string
  readonly displayName: string
  readonly analytics: PlayerAnalytics
}

/** "Compare X and Y" → comparison engine + verdict. */
export function answerCompare(players: readonly ResolvedPlayer[], tournamentName: string): CaddieAnswer {
  if (players.length < 2) {
    return emptyAnswer(
      "compare_players",
      tournamentName,
      "Comparison Engine",
      "I couldn't match two players in the field to compare",
      ["Best cash plays?", "Who fits the course?", "Who's in form?"],
    )
  }

  const picked = players.slice(0, 2)
  const analytics = picked.map((p) => p.analytics)
  const ids = picked.map((p) => p.playerId)
  const names = picked.map((p) => p.displayName)

  const comparison = buildComparison(analytics, ids, names)
  const verdict = generateVerdict(comparison, analytics, names)

  const bullets: string[] = []
  if (verdict.overallWinnerId) {
    bullets.push(`Edge: ${verdict.overallWinnerName} (Overall ${formatScore(verdict.overallRating)})`)
  }
  for (const cw of verdict.categoryWins) {
    bullets.push(`${cw.playerName}: wins ${cw.wins} categor${cw.wins === 1 ? "y" : "ies"}`)
  }
  for (const r of verdict.whyReasons.slice(0, 3)) bullets.push(r)

  const verdictConfidence = verdict.confidence === "low" ? "low" : verdict.confidence === "medium" ? "medium" : "high"

  return {
    intent: "compare_players",
    headline: `${names[0]} vs ${names[1]}`,
    summary: verdict.overallWinnerId
      ? `${verdict.overallWinnerName} has the overall edge for ${tournamentName}.`
      : `A close call between ${names[0]} and ${names[1]} for ${tournamentName}.`,
    bullets,
    entities: picked.map((p) => playerEntity(p.playerId, p.displayName, formatScore(p.analytics.overallRating))),
    citations: [{ engine: "Comparison Engine", confidence: verdictConfidence, detail: `${ids.length} players compared` }],
    confidence: verdictConfidence,
    followUps: [`Why is ${names[0]} rated that way?`, "Best cash plays?", "Who fits the course?"],
    isEmpty: false,
  }
}

/** "Why is X rated 82?" → overall-rating explanation. */
export function answerExplainRating(player: ResolvedPlayer | null, tournamentName: string): CaddieAnswer {
  if (!player) {
    return emptyAnswer(
      "explain_rating",
      tournamentName,
      "Explainability Engine",
      "I couldn't match that player to a field member",
      ["Best cash plays?", "Who fits the course?", "Compare two players"],
    )
  }

  const explanation = toOverallRatingExplanation(player.analytics, {
    kind: "player",
    id: player.playerId,
    label: player.displayName,
  })

  const bullets: string[] = []
  for (const c of explanation.contributors.slice(0, 5)) {
    bullets.push(`${c.label}: ${formatScore(c.normalizedValue)} — ${c.description}`)
  }
  for (const lim of explanation.limitations.slice(0, 2)) {
    bullets.push(`Limitation: ${lim.message}`)
  }

  const rating = player.analytics.overallRating
  const bandLabel = explanation.headline.band ? ` (${explanation.headline.band})` : ""
  return {
    intent: "explain_rating",
    headline: `Why ${player.displayName} is rated ${formatScore(rating)}`,
    summary: `Overall rating breakdown for ${player.displayName}${bandLabel}.`,
    bullets,
    entities: [playerEntity(player.playerId, player.displayName, formatScore(rating))],
    citations: [{ engine: "Explainability Engine", confidence: "high", detail: explanation.model.label }],
    confidence: "high",
    followUps: [`Compare ${player.displayName} with someone`, "Who fits the course?", "Best cash plays?"],
    isEmpty: false,
  }
}
