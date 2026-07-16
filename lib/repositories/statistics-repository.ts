/**
 * Player season-statistics repository.
 *
 * The only layer permitted to persist player season statistics (stored in
 * `player_season_statistics`). It accepts already-validated
 * {@link PlayerSeasonStat} domain objects whose `playerId` has already been
 * resolved to a CaddieIQ id by the statistics linker — it never maps,
 * validates, or fetches.
 *
 * Idempotency: reconciliation is keyed by the composite unique
 * `(playerId, season)`, so re-importing a season updates each row in place
 * rather than duplicating it. Like the field repository (and unlike the
 * slug-keyed repositories) it upserts directly rather than via `upsertBySlug`.
 */

import type { PlayerSeasonStat } from "@/lib/domain/statistics/types"
import type {
  PlayerSeasonStatistic as PlayerSeasonStatisticRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import {
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * A validated season-stat row whose player reconciliation key has already been
 * resolved to a CaddieIQ id by the statistics importer. The domain
 * {@link PlayerSeasonStat} intentionally carries no id (it emits a slug +
 * provenance only); resolving that to a real `Player.id` is a persistence-time
 * concern, so the linker pairs each row with its resolved id before calling the
 * repository. This keeps the "stats only ever link to players that already
 * exist" invariant enforced upstream of any write.
 */
export interface ResolvedSeasonStat {
  playerId: string
  stat: PlayerSeasonStat
}

/** One season's statistics for a player, flattened for UI rendering. */
export interface PlayerSeasonStatRow {
  season: number
  worldRanking: number | null
  worldRankingLastWeek: number | null
  events: number | null
  averagePoints: number | null
  totalPoints: number | null
  pointsGained: number | null
  pointsLost: number | null
}

export class StatisticsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "statistics", sink)
  }

  /**
   * Idempotently persist one resolved season-stat row, reconciled on the
   * composite `(playerId, season)` key.
   */
  async upsert(
    resolved: ResolvedSeasonStat,
  ): Promise<RepositoryResult<PlayerSeasonStatisticRecord>> {
    const { playerId, stat } = resolved
    const reference = `${playerId}:${stat.season}`
    const data = {
      worldRanking: stat.worldRanking,
      worldRankingLastWeek: stat.worldRankingLastWeek,
      events: stat.events,
      averagePoints: stat.averagePoints,
      totalPoints: stat.totalPoints,
      pointsGained: stat.pointsGained,
      pointsLost: stat.pointsLost,
      source: stat.externalRef.source,
      externalId: stat.externalRef.externalId,
    }
    try {
      const existing = await this.prisma.playerSeasonStatistic.findUnique({
        where: { playerId_season: { playerId, season: stat.season } },
      })
      // Backward-compat / anti-regression guard: never let a null incoming world
      // ranking overwrite a real stored one. On the trial tier the ranking field
      // scrambles intermittently (mapped to null by `cleanRanking`), so a
      // re-import must preserve the last good rank rather than wipe it. Other
      // fields update normally. See docs/DATA_CATALOG.md §7.
      const update = {
        ...data,
        worldRanking: data.worldRanking ?? existing?.worldRanking ?? null,
        worldRankingLastWeek:
          data.worldRankingLastWeek ?? existing?.worldRankingLastWeek ?? null,
      }
      const record = await this.prisma.playerSeasonStatistic.upsert({
        where: { playerId_season: { playerId, season: stat.season } },
        create: { playerId, season: stat.season, ...data },
        update,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "playerSeasonStatistic",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<PlayerSeasonStatisticRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved season-stat rows. Never throws per item. */
  async bulkUpsert(
    rows: readonly ResolvedSeasonStat[],
  ): Promise<BulkRepositoryResult<PlayerSeasonStatisticRecord>> {
    return this.runBulk(
      rows,
      (r) => `${r.playerId}:${r.stat.season}`,
      (r) => this.upsert(r),
    )
  }

  /**
   * All season-statistics rows for a player, most recent season first.
   * Read-only.
   */
  async listByPlayer(playerId: string): Promise<PlayerSeasonStatRow[]> {
    const rows = await this.prisma.playerSeasonStatistic.findMany({
      where: { playerId },
      orderBy: { season: "desc" },
      select: {
        season: true,
        worldRanking: true,
        worldRankingLastWeek: true,
        events: true,
        averagePoints: true,
        totalPoints: true,
        pointsGained: true,
        pointsLost: true,
      },
    })
    return rows
  }

  /**
   * The single most recent season-statistics row per player for the given
   * player ids, returned as a `playerId → row` map. Used to decorate a
   * tournament field with each entrant's latest available stats without an
   * N+1 query. Read-only.
   */
  async latestForPlayers(
    playerIds: readonly string[],
  ): Promise<Map<string, PlayerSeasonStatRow>> {
    const result = new Map<string, PlayerSeasonStatRow>()
    if (playerIds.length === 0) return result

    // Most recent season per player: order by season desc and keep the first
    // row seen for each player id.
    const rows = await this.prisma.playerSeasonStatistic.findMany({
      where: { playerId: { in: [...playerIds] } },
      orderBy: { season: "desc" },
      select: {
        playerId: true,
        season: true,
        worldRanking: true,
        worldRankingLastWeek: true,
        events: true,
        averagePoints: true,
        totalPoints: true,
        pointsGained: true,
        pointsLost: true,
      },
    })
    for (const { playerId, ...stat } of rows) {
      if (!result.has(playerId)) result.set(playerId, stat)
    }
    return result
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _statisticsRepository: StatisticsRepository | undefined
export function getStatisticsRepository(): StatisticsRepository {
  return (_statisticsRepository ??= new StatisticsRepository())
}
