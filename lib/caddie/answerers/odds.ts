/**
 * AI Caddie answerer grounded in the Odds Intelligence Engine.
 *
 * "Who are the favorites / best to win?" → the outright market's selections,
 * already sorted by de-vigged fair probability. Cites the Odds Engine and its
 * book coverage, and degrades honestly when no market is captured.
 */

import type { MarketView, TournamentOddsView } from "@/lib/odds-intelligence/types"
import type { CaddieAnswer } from "../types"
import { emptyAnswer, fromOddsConfidence, playerEntity } from "./shared"

const ENGINE = "Odds Intelligence Engine"

/** Prefer the tournament-winner market; fall back to the first market present. */
function pickOutrightMarket(odds: TournamentOddsView): MarketView | null {
  if (odds.markets.length === 0) return null
  const outright = odds.markets.find((m) => m.market === "TOURNAMENT_WINNER")
  return outright ?? odds.markets[0]
}

function formatProbability(p: number): string {
  return `${Math.round(p * 100)}%`
}

export function answerOddsFavorites(odds: TournamentOddsView | null, tournamentName: string): CaddieAnswer {
  if (!odds || odds.confidence === "unavailable" || odds.markets.length === 0) {
    return emptyAnswer(
      "odds_favorites",
      tournamentName,
      ENGINE,
      "Betting markets aren't captured yet",
      ["Best cash plays?", "Who fits the course?", "Who's in form?"],
    )
  }

  const market = pickOutrightMarket(odds)
  if (!market || market.selections.length === 0) {
    return emptyAnswer(
      "odds_favorites",
      tournamentName,
      ENGINE,
      "No outright market is captured yet",
      ["Best cash plays?", "Who fits the course?", "Who's in form?"],
    )
  }

  const top = market.selections.slice(0, 6)
  return {
    intent: "odds_favorites",
    headline: "Betting favorites",
    summary: `Consensus outright favorites for ${tournamentName}, by de-vigged win probability.`,
    bullets: top.map(
      (s, i) =>
        `${i + 1}. ${s.selection} — ${formatProbability(s.fairProbability)} (${s.consensusAmerican > 0 ? "+" : ""}${s.consensusAmerican})`,
    ),
    entities: top.map((s) =>
      playerEntity(s.playerId ?? "", s.selection, formatProbability(s.fairProbability)),
    ),
    citations: [
      {
        engine: ENGINE,
        confidence: fromOddsConfidence(odds.confidence),
        detail: `${market.bookCount} book${market.bookCount === 1 ? "" : "s"}`,
      },
    ],
    confidence: fromOddsConfidence(odds.confidence),
    followUps: ["Who's underpriced?", "Best GPP plays?", "Weather this week?"],
    isEmpty: false,
  }
}
