/**
 * Pure ranking math for the Model Lab preview.
 *
 * Given the real per-player analytics for the season population and a model's
 * normalized pillar weights, this blends each player's actual analytics scores
 * into a single composite and orders the field. It performs NO data access and
 * NO fabrication: a player only receives a composite from the pillars they have
 * real data for, and players with none of the model's pillars are left unranked.
 * Keeping it pure makes the blend unit-testable and lets the server action stay
 * a thin orchestration layer over the Analytics Engine.
 */

import { letterGradeForScore } from '@/lib/rankings/calculator'
import type { PlayerAnalytics } from '@/lib/analytics/types'

import type { MetricGroupKey, ModelWeightMap } from '../types'

/** One player's placement under a model, before display metadata is joined. */
export interface ModelRankedEntry {
  rank: number
  playerId: string
  /** Composite 0–100 score, rounded. */
  score: number
  /** Letter grade mapped from `score`. */
  grade: string
}

/**
 * Blend one player's analytics into a composite under the given weights.
 *
 * Only pillars with a weight AND a non-null score for this player contribute;
 * the composite is renormalized over that available weight so a player missing
 * one pillar is scored fairly on the rest (rather than penalised to zero).
 * Returns `null` when the player has none of the model's weighted pillars.
 */
function compositeFor(
  player: PlayerAnalytics,
  weights: ModelWeightMap,
): number | null {
  let weighted = 0
  let available = 0

  for (const key of Object.keys(weights) as MetricGroupKey[]) {
    const weight = weights[key]
    if (!weight || weight <= 0) continue
    const score = player.scores.find((entry) => entry.key === key)
    if (!score || score.value === null) continue
    weighted += score.value * weight
    available += weight
  }

  if (available <= 0) return null
  return weighted / available
}

/**
 * Order the whole population by a model's weighted blend of their real
 * analytics. Unrated players (no composite) are excluded. Ranks use competition
 * ("1224") semantics; ties break by player id for deterministic output.
 */
export function rankPopulationByModel(
  players: readonly PlayerAnalytics[],
  weights: ModelWeightMap,
): ModelRankedEntry[] {
  const scored = players
    .map((player) => ({ playerId: player.playerId, composite: compositeFor(player, weights) }))
    .filter((entry): entry is { playerId: string; composite: number } => entry.composite !== null)
    .sort((a, b) => b.composite - a.composite || a.playerId.localeCompare(b.playerId))

  const entries: ModelRankedEntry[] = []
  let lastScore: number | null = null
  let lastRank = 0

  scored.forEach((entry, index) => {
    const rounded = Math.round(entry.composite)
    // Competition ranking: equal composites (pre-rounding) share a rank.
    const rank = lastScore !== null && entry.composite === lastScore ? lastRank : index + 1
    lastScore = entry.composite
    lastRank = rank
    entries.push({
      rank,
      playerId: entry.playerId,
      score: rounded,
      grade: letterGradeForScore(rounded),
    })
  })

  return entries
}
