/**
 * Trending — the field's standout players by category.
 *
 * Each category surfaces the single verified leader of an existing board (DFS
 * value, betting edge, course fit, model confidence). When a board holds no
 * scored entrant the category's `player` is `null`, and the widget shows an
 * honest "no data" chip rather than a guess.
 */

import type { DfsValueField } from "@/lib/dfs-value"
import type { TournamentOddsView } from "@/lib/odds-intelligence"
import type { FieldFitBoard } from "@/lib/analytics/course-fit"

import type { Trending, TrendingCategory, TrendingPlayer } from "./types"

export interface BuildTrendingInputs {
  readonly dfsField: DfsValueField
  readonly odds: TournamentOddsView
  readonly fitBoard: FieldFitBoard
}

/** Build the trending categories from verified board leaders. */
export function buildTrending(inputs: BuildTrendingInputs): Trending {
  const { dfsField, odds, fitBoard } = inputs

  const categories: TrendingCategory[] = [
    { key: "topValue", title: "Top DFS Value", icon: "dfs", player: topDfsValue(dfsField) },
    { key: "bettingEdge", title: "Betting Edge", icon: "odds", player: bestBettingEdge(odds) },
    { key: "strongestFit", title: "Strongest Fit", icon: "course", player: strongestFit(fitBoard) },
    { key: "highestConfidence", title: "Highest Confidence", icon: "trending", player: highestConfidence(dfsField) },
  ]

  return { categories }
}

function topDfsValue(dfsField: DfsValueField): TrendingPlayer | null {
  const entry = dfsField.boards.find((b) => b.key === "topValues")?.entries[0]
  if (!entry || entry.score === null) return null
  return {
    playerId: entry.playerId,
    displayName: entry.displayName,
    value: `${entry.tier ? tierLabel(entry.tier) + " \u00b7 " : ""}${Math.round(entry.score)}`,
    detail: entry.headline,
  }
}

function highestConfidence(dfsField: DfsValueField): TrendingPlayer | null {
  const entry = dfsField.boards.find((b) => b.key === "highestConfidence")?.entries[0]
  if (!entry || entry.score === null) return null
  return {
    playerId: entry.playerId,
    displayName: entry.displayName,
    value: `${entry.confidence} confidence`,
    detail: entry.headline,
  }
}

function bestBettingEdge(odds: TournamentOddsView): TrendingPlayer | null {
  if (odds.confidence === "unavailable") return null
  // Prefer an explicit "value" signal; fall back to the market favorite.
  for (const market of odds.markets) {
    const valueSignal = market.signals.find((s) => s.kind === "value" && s.playerId)
    if (valueSignal) {
      const consensus = market.selections.find((sel) => sel.playerId === valueSignal.playerId)
      return {
        playerId: valueSignal.playerId as string,
        displayName: valueSignal.selection,
        value: consensus ? `${Math.round(consensus.fairProbability * 100)}% fair` : "Value",
        detail: valueSignal.detail,
      }
    }
  }
  const fav = odds.markets[0]?.selections[0]
  if (!fav) return null
  return {
    playerId: fav.playerId ?? fav.selectionSlug,
    displayName: fav.selection,
    value: `${Math.round(fav.fairProbability * 100)}% fair`,
    detail: `Market favorite across ${fav.bookCount} book${fav.bookCount === 1 ? "" : "s"}`,
  }
}

function strongestFit(fitBoard: FieldFitBoard): TrendingPlayer | null {
  const entry = fitBoard.topFits[0]
  if (!entry || entry.result.score === null) return null
  return {
    playerId: entry.playerId,
    displayName: entry.displayName,
    value: entry.result.band ? `${entry.result.band}` : `${Math.round(entry.result.score)}`,
    detail: `Course fit ${Math.round(entry.result.score)} / 100`,
  }
}

/** Human label for a DFS value tier enum. */
function tierLabel(tier: string): string {
  switch (tier) {
    case "A_PLUS":
      return "A+"
    case "B_PLUS":
      return "B+"
    default:
      return tier
  }
}
