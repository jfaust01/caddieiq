/**
 * Player season-statistics import & linking.
 *
 * A player's season statistics are the season-scoped companion to an existing
 * `Player` record, stored in `player_season_statistics`. SportsDataIO exposes
 * them per season via `/json/PlayerSeasonStats/{season}`, so this module drives
 * the full pipeline for each requested season:
 *
 *   Provider   → fetch every player's stats for the season
 *   Mapper     → map each raw row to a `PlayerSeasonStat`
 *   Validation → drop unreconcilable/duplicate rows, sanitize metrics
 *   Repository → resolve player slug → id, then upsert the (playerId, season) row
 *
 * Matching strategy (no external-id columns exist, so everything reconciles by
 * deterministic slug): row → `Player.id` via slugify(player name), mirroring the
 * field importer.
 *
 * Nothing is fabricated. A row is persisted only when its player already exists;
 * seasons the provider has no data for and players absent from our catalog are
 * counted and reported, never guessed.
 */

import { mapSportsDataSeasonStat } from "@/lib/domain/statistics/mapper"
import { slugify } from "@/lib/domain/shared/utils"
import { validateSeasonStats } from "@/lib/data-quality"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type { SdioPlayerSeasonStats } from "@/lib/providers/sportsdataio/types"
import {
  getStatisticsRepository,
  type StatisticsRepository,
  type ResolvedSeasonStat,
} from "@/lib/repositories"

/**
 * Seasons imported when a caller does not specify any. Recent seasons the
 * SportsDataIO tier is expected to cover; seasons with no data are skipped and
 * reported rather than treated as an error.
 */
export const DEFAULT_STAT_SEASONS: readonly number[] = [2022, 2023, 2024, 2025]

/** Outcome of a statistics import run, suitable for an import report. */
export interface StatisticsImportSummary {
  /** Seasons we attempted to fetch. */
  seasonsConsidered: number
  /** Seasons that returned at least one row. */
  seasonsWithData: number
  /** Raw stat rows seen across all seasons. */
  rowsSeen: number
  /** Rows dropped by validation (unreconcilable or duplicate). */
  rowsInvalid: number
  /** Rows skipped because their player is not in our catalog. */
  rowsUnmatchedPlayer: number
  /** Rows newly created. */
  inserted: number
  /** Existing rows updated (idempotent re-run). */
  updated: number
  /** Rows whose write failed. */
  failed: number
  /** Human-readable notes on skips/failures (bounded for log hygiene). */
  notes: string[]
}

export interface ImportStatisticsOptions {
  prisma?: PrismaClient
  provider?: SportsDataProvider
  repository?: StatisticsRepository
  /** Seasons to import. Defaults to {@link DEFAULT_STAT_SEASONS}. */
  seasons?: readonly number[]
  /** Max number of notes to retain. */
  maxNotes?: number
}

/**
 * Import player season statistics for the requested seasons. Idempotent: each
 * row reconciles on `(playerId, season)`.
 */
export async function importPlayerStatistics(
  options: ImportStatisticsOptions = {},
): Promise<StatisticsImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getStatisticsRepository()
  const seasons = options.seasons ?? DEFAULT_STAT_SEASONS
  const maxNotes = options.maxNotes ?? 25

  const summary: StatisticsImportSummary = {
    seasonsConsidered: 0,
    seasonsWithData: 0,
    rowsSeen: 0,
    rowsInvalid: 0,
    rowsUnmatchedPlayer: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // A slug → Player.id map (small table, load once).
  const players = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  })
  const playerIdBySlug = new Map(players.map((p) => [p.slug, p.id]))

  for (const season of seasons) {
    summary.seasonsConsidered += 1

    // Provider: fetch the season's stats.
    let rawRows: SdioPlayerSeasonStats[] = []
    try {
      const response = await provider.listPlayerSeasonStats(season)
      rawRows = response.data ?? []
    } catch (error) {
      note(`Season stats fetch failed for ${season}: ${(error as Error).message}`)
      continue
    }
    if (rawRows.length === 0) continue // provider has no data for this season
    summary.seasonsWithData += 1
    summary.rowsSeen += rawRows.length

    // Mapper: raw → domain rows.
    const mapped = rawRows.map((row) => mapSportsDataSeasonStat(row, season))

    // Validation: drop unreconcilable / duplicate rows, sanitize metrics.
    const { valid, dropped, duplicates } = validateSeasonStats(mapped)
    summary.rowsInvalid += dropped + duplicates

    // Repository: resolve each valid row's player slug → id, then persist.
    const resolved: ResolvedSeasonStat[] = []
    for (const stat of valid) {
      const playerId = playerIdBySlug.get(stat.playerSlug)
      if (!playerId) {
        summary.rowsUnmatchedPlayer += 1
        note(`Unmatched player "${stat.playerName}" for season ${season}`)
        continue
      }
      resolved.push({ playerId, stat })
    }

    const result = await repository.bulkUpsert(resolved)
    summary.inserted += result.inserted
    summary.updated += result.updated
    summary.failed += result.failed
    for (const err of result.errors) {
      note(`Persist failed (${err.reference ?? "?"}): ${err.error.message}`)
    }
  }

  return summary
}
