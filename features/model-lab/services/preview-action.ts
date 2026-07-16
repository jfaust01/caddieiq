'use server'

/**
 * Model Lab preview — the server action that turns a model's weights into a
 * real ranking.
 *
 * It asks the Analytics Engine for the entire season population (the exact same
 * analytics that power player pages, the tournament hub, and the Rankings
 * directory), blends each player's real scores by the model's weights via the
 * pure {@link rankPopulationByModel} calculator, then joins live display
 * metadata for the top rows. Nothing here is fabricated: ordering and scores
 * come from analytics, labels come from the database, and players without the
 * data a model needs are simply left unranked.
 *
 * Running on the server keeps `analyticsService` (and Prisma) out of the client
 * bundle; the client hook calls this action directly.
 */

import { analyticsService } from '@/lib/analytics/service'
import { getPlayerRepository } from '@/lib/repositories/player-repository'

import type { ModelPreview, ModelPreviewRow, ModelWeightMap } from '../types'
import { rankPopulationByModel } from './model-preview-calculator'

export interface RunModelPreviewInput {
  /** Normalized pillar weights (fractions summing to 1); empty = nothing enabled. */
  weights: ModelWeightMap
  /** Cap the number of preview rows (e.g. Top 12). */
  limit?: number
}

/** Run a model against the live season population and return a ranking preview. */
export async function runModelPreview(
  input: RunModelPreviewInput,
): Promise<ModelPreview> {
  const { weights, limit } = input
  const generatedAt = new Date().toISOString()

  // No enabled pillars → nothing to rank. Return an honest empty preview
  // without touching the database.
  if (Object.keys(weights).length === 0) {
    return { rows: [], weights, season: null, ratedPlayers: 0, generatedAt }
  }

  const { season, players } = await analyticsService.getPopulationAnalytics()
  const ranked = rankPopulationByModel(players, weights)

  const top = typeof limit === 'number' ? ranked.slice(0, limit) : ranked
  const metadata = await getPlayerRepository().findDirectoryMetadataByIds(
    top.map((entry) => entry.playerId),
  )
  const metaById = new Map(metadata.map((entry) => [entry.id, entry]))

  const rows: ModelPreviewRow[] = top.map((entry) => {
    const meta = metaById.get(entry.playerId)
    return {
      rank: entry.rank,
      playerId: entry.playerId,
      // A ranked player should always resolve; fall back to the id so a row
      // still renders rather than throwing if metadata is unexpectedly missing.
      name: meta?.fullName ?? entry.playerId,
      countryCode: meta?.countryCode ?? null,
      score: entry.score,
      grade: entry.grade,
    }
  })

  return { rows, weights, season, ratedPlayers: ranked.length, generatedAt }
}
