/**
 * RankingService — the single entry point to the Ranking Engine.
 *
 * This server-only orchestration layer produces every ranking the product
 * surfaces (player-page badges, tournament-field sorting, tournament-hub
 * leaders). It is a thin, reusable layer ON TOP OF the Analytics Engine: it
 * asks {@link analyticsService} for the relevant analytics, then runs the pure
 * {@link buildBoardSet} calculator to order them. It performs no database
 * access and no performance math of its own — analytics remain the platform's
 * single source of truth, and rankings are simply their ordering.
 *
 * There is deliberately NO RankingRepository: rankings are fully derived and
 * never persisted (mirroring the Analytics Engine, where analytics are derived
 * and never stored). The player universes a ranking needs — the whole season
 * population for global rankings, or a tournament's entrants for field
 * rankings — are resolved through the Analytics Engine, so there is nothing for
 * a ranking-specific read layer to own.
 *
 * The `server-only` import guarantees this module can never be pulled into a
 * client bundle; the UI reaches it through server actions and server
 * components. Reads inherit the Analytics Engine's request-level caching, so
 * resolving rankings shares the single season-population load.
 */

import "server-only"

import { analyticsService } from "@/lib/analytics/service"

import { buildBoardSet, ranksByPlayer, selectPlayerProfile } from "./calculator"
import type {
  PlayerRankingProfile,
  RankingBoardSet,
  RankingCategory,
} from "./types"

export const rankingService = {
  /**
   * Global ranking boards over every player with data in the current season —
   * the reusable leaderboard set behind global rankings.
   */
  async getGlobalBoards(): Promise<RankingBoardSet> {
    const { season, players } = await analyticsService.getPopulationAnalytics()
    return buildBoardSet(players, "global", season)
  },

  /**
   * One player's placement across every ranking category within the global
   * population — the data the player page renders as badges. Returns an
   * unranked profile (all `null` ranks, `isRanked: false`) when the player has
   * no season data, so the UI stays honest.
   */
  async getPlayerRankingProfile(playerId: string): Promise<PlayerRankingProfile> {
    const boards = await this.getGlobalBoards()
    return selectPlayerProfile(boards, playerId)
  },

  /**
   * Ranking boards computed over a specific set of players (e.g. a tournament
   * field), ordering them by the SAME season-normalized analytics used
   * everywhere else. Input order does not affect ranks. Used for field sorting
   * and tournament-hub leaders.
   */
  async getBoardsForPlayers(playerIds: readonly string[]): Promise<RankingBoardSet> {
    const analytics = await analyticsService.getAnalyticsForPlayers(playerIds)
    const season = analytics.find((entry) => entry.season !== null)?.season ?? null
    return buildBoardSet(analytics, "field", season)
  },

  /**
   * Field ranks indexed by player id, for a roster that needs to be sorted by
   * rankings. Returns `playerId → { category → rank | null }`.
   */
  async getFieldRanksByPlayer(
    playerIds: readonly string[],
  ): Promise<Map<string, Record<RankingCategory, number | null>>> {
    const boards = await this.getBoardsForPlayers(playerIds)
    return ranksByPlayer(boards)
  },
}
