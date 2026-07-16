/**
 * AI Coach — explainable, bucketed recommendations.
 *
 * Sorts verified board entrants into decision buckets (cash plays, tournament
 * plays, contrarian looks, and players to monitor). Every pick carries a reason
 * that traces directly to the source board's own headline — no new claims are
 * synthesized. Empty buckets are dropped so the coach never pads its advice.
 */

import type { DfsValueField, DfsBoardEntry } from "@/lib/dfs-value"
import type { FieldFitBoard } from "@/lib/analytics/course-fit"

import type { CoachPick, CoachRecommendationGroup, CoachRecommendations } from "./types"

export interface BuildCoachInputs {
  readonly dfsField: DfsValueField
  readonly fitBoard: FieldFitBoard
}

const MAX_PICKS = 3

/** Build the coach's recommendation groups from verified boards. */
export function buildCoachRecommendations(inputs: BuildCoachInputs): CoachRecommendations {
  const { dfsField, fitBoard } = inputs
  const groups: CoachRecommendationGroup[] = []

  // Cash plays: highest-confidence value entrants.
  const cash = boardPicks(dfsField, "highestConfidence")
  if (cash.length > 0) {
    groups.push({
      key: "cashPlays",
      title: "Cash Plays",
      description: "High-confidence value the model trusts most.",
      picks: cash,
    })
  }

  // Tournament plays: higher-variance GPP targets.
  const gpp = boardPicks(dfsField, "riskyGppTargets")
  if (gpp.length > 0) {
    groups.push({
      key: "tournamentPlays",
      title: "Tournament Plays",
      description: "Higher-variance targets with tournament-winning upside.",
      picks: gpp,
    })
  }

  // Contrarian: strong recent momentum from the fit board's trending-up list.
  const contrarian: CoachPick[] = fitBoard.trendingUp
    .filter((e) => e.momentum !== null)
    .slice(0, MAX_PICKS)
    .map((e) => ({
      playerId: e.playerId,
      displayName: e.displayName,
      reason: `Ranking momentum ${Math.round(e.momentum as number)} / 100 — trending up`,
      confidence: e.result.confidence ?? null,
    }))
  if (contrarian.length > 0) {
    groups.push({
      key: "contrarian",
      title: "Contrarian Looks",
      description: "Improving form the field may be underrating.",
      picks: contrarian,
    })
  }

  // Monitor: least-certain fits worth watching before locking a decision.
  const monitor: CoachPick[] = fitBoard.mostUncertain
    .slice(0, MAX_PICKS)
    .map((e) => ({
      playerId: e.playerId,
      displayName: e.displayName,
      reason: "Course fit is uncertain — missing signals lower confidence",
      confidence: e.result.confidence ?? null,
    }))
  if (monitor.length > 0) {
    groups.push({
      key: "monitor",
      title: "Monitor",
      description: "Decisions to hold until more data lands.",
      picks: monitor,
    })
  }

  return { groups }
}

/** Map the top entries of a DFS board into coach picks. */
function boardPicks(dfsField: DfsValueField, key: string): CoachPick[] {
  const board = dfsField.boards.find((b) => b.key === key)
  if (!board) return []
  return board.entries.slice(0, MAX_PICKS).map((entry: DfsBoardEntry) => ({
    playerId: entry.playerId,
    displayName: entry.displayName,
    reason: entry.headline,
    confidence: entry.confidence ?? null,
  }))
}
