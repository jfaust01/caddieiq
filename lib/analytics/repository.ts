/**
 * AnalyticsRepository — the read layer for the Analytics Engine.
 *
 * Analytics are DERIVED, never stored: this repository only READS the raw
 * inputs the calculator needs and never writes. Its single responsibility is to
 * assemble the normalization population (the field of players a given player is
 * scored against) and to resolve which players belong to a tournament field, so
 * the pure calculator can stay free of any database concern.
 *
 * Normalization is season-scoped: comparing players across different seasons
 * would be misleading, so the repository anchors on the most recent season that
 * has any statistics and returns every player's sample for exactly that season.
 * Only season aggregates are read — the engine emits nothing it can't ground in
 * real, ingested data.
 */

import { Prisma } from "@/lib/generated/prisma/client"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"

import { BaseRepository } from "@/lib/repositories/base-repository"
import type { RepositoryLogSink } from "@/lib/repositories/logger"

import type { SeasonStatSample } from "./calculator"

/** The season population plus the season it was drawn from. */
export interface AnalyticsPopulation {
  /** Most recent season with statistics, or `null` when none exists. */
  season: number | null
  /** Every player's season-stat sample for `season` (empty when none). */
  samples: SeasonStatSample[]
}

export class AnalyticsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "analytics", sink)
  }

  /**
   * The most recent season for which any player season-statistics exist, or
   * `null` when none have been imported. Read-only.
   */
  async getLatestStatSeason(): Promise<number | null> {
    const rows = await this.prisma.playerSeasonStatistic.aggregate({
      _max: { season: true },
    })
    return rows._max.season ?? null
  }

  /**
   * Load the normalization population: every player's season-stat sample for
   * the most recent season that has data. Returns an empty population (with
   * `season: null`) when nothing has been imported, so callers get a stable
   * shape rather than having to special-case `null`. Read-only.
   */
  async loadLatestPopulation(): Promise<AnalyticsPopulation> {
    const season = await this.getLatestStatSeason()
    if (season === null) return { season: null, samples: [] }

    const rows = await this.prisma.playerSeasonStatistic.findMany({
      where: { season },
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
    return { season, samples: rows }
  }

  /**
   * Player ids entered in a tournament field (alternates included), so the
   * engine can score exactly the assembled field. Read-only.
   */
  async getFieldPlayerIds(tournamentId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ playerId: string }>>(Prisma.sql`
      SELECT tf."playerId" AS "playerId"
      FROM tournament_fields tf
      JOIN players p ON p.id = tf."playerId" AND p."deletedAt" IS NULL
      WHERE tf."tournamentId" = ${tournamentId}
    `)
    return rows.map((row) => row.playerId)
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _analyticsRepository: AnalyticsRepository | undefined
export function getAnalyticsRepository(): AnalyticsRepository {
  return (_analyticsRepository ??= new AnalyticsRepository())
}
