/**
 * DFS Value — field leaderboards.
 *
 * Pure ranking of a scored field into the six tournament-hub boards. Every board
 * is honest: it lists only players with a computable value score and explains
 * each placement, so a board stays short (or empty) rather than padded with
 * guesses. No I/O, deterministic.
 */

import type {
  DfsBoard,
  DfsBoardEntry,
  DfsConfidence,
  DfsValueResult,
} from "./types"
import { TIER_LABEL } from "./model"

/** How many entrants each board surfaces. */
const BOARD_LIMIT = 8

const CONF_RANK: Record<DfsConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 }

/** Build a board entry from a result, with a board-specific headline. */
function toEntry(result: DfsValueResult, rank: number, headline: string): DfsBoardEntry {
  return {
    rank,
    playerId: result.playerId,
    displayName: result.displayName,
    score: result.score,
    tier: result.tier,
    confidence: result.confidence,
    strength: result.strength,
    salary: result.salary,
    salaryTier: result.salaryTier,
    headline,
  }
}

function rankInto(
  results: readonly DfsValueResult[],
  headlineOf: (r: DfsValueResult) => string,
  limit = BOARD_LIMIT,
): DfsBoardEntry[] {
  return results.slice(0, limit).map((r, i) => toEntry(r, i + 1, headlineOf(r)))
}

/** A player's leading driver text, or a neutral fallback. */
function leadDriver(r: DfsValueResult): string {
  return r.drivers[0] ? `${r.drivers[0].label}: ${r.drivers[0].detail}` : `${TIER_LABEL[r.tier ?? "C"]} value`
}

/**
 * Rank a scored field (results with `status: "available"`) into the six DFS
 * boards. Input order does not matter — each board sorts independently.
 */
export function buildDfsBoards(rated: readonly DfsValueResult[]): DfsBoard[] {
  // A stable playerId tiebreaker keeps every board fully deterministic — board
  // output must not depend on the order the field happened to arrive in.
  const tie = (a: DfsValueResult, b: DfsValueResult) => a.playerId.localeCompare(b.playerId)
  const byValue = (a: DfsValueResult, b: DfsValueResult) =>
    (b.score ?? 0) - (a.score ?? 0) || tie(a, b)

  const sortedByValue = [...rated].sort(byValue)

  const highEnd = sortedByValue.filter((r) => r.salaryTier === "high")
  const midRange = sortedByValue.filter((r) => r.salaryTier === "mid")
  const valueTier = sortedByValue.filter((r) => r.salaryTier === "value")

  const byConfidenceThenValue = [...rated].sort(
    (a, b) =>
      CONF_RANK[b.confidence] - CONF_RANK[a.confidence] ||
      (b.score ?? 0) - (a.score ?? 0) ||
      tie(a, b),
  )

  // GPP targets: high projected quality but lower certainty — boom potential the
  // field may under-own. Rank by strength, biased toward less certain plays.
  const riskyGpp = [...rated]
    .filter((r) => r.strength != null && (r.confidence === "low" || r.confidence === "medium"))
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0) || tie(a, b))

  return [
    {
      key: "topValues",
      title: "Top DFS Values",
      description: "Best projected quality per salary dollar across the whole slate.",
      entries: rankInto(sortedByValue, leadDriver),
    },
    {
      key: "highEndValues",
      title: "Best High-End Values",
      description: "The most efficient studs — top-tier salaries that still return their price.",
      entries: rankInto(highEnd, leadDriver),
    },
    {
      key: "midRangeValues",
      title: "Best Mid-Range Values",
      description: "Mid-salary players offering the strongest value edge.",
      entries: rankInto(midRange, leadDriver),
    },
    {
      key: "valuePlays",
      title: "Best Value Plays",
      description: "Lowest-salary players punching above their price — salary-savers.",
      entries: rankInto(valueTier, leadDriver),
    },
    {
      key: "highestConfidence",
      title: "Highest Confidence Plays",
      description: "Values backed by the most verified signals — the safest reads.",
      entries: rankInto(byConfidenceThenValue, (r) => `${r.confidence} confidence`),
    },
    {
      key: "riskyGppTargets",
      title: "Risky GPP Targets",
      description: "High-upside plays with less certain data — leverage for tournaments.",
      entries: rankInto(riskyGpp, (r) => `Strength ${Math.round(r.strength ?? 0)}, ${r.confidence} confidence`),
    },
  ]
}
