/**
 * PlayerService — live data access for the Player domain.
 *
 * This is the server-only read layer for the players feature. It reads through
 * `PlayerRepository` (the only layer allowed to touch the database), which
 * executes search, filtering, sorting, and pagination *in SQL*, and then maps
 * the returned page of rows into the UI domain shapes via the pure
 * `player-mapper`. The full table (thousands of players) is never loaded into
 * memory — only the requested page is fetched.
 *
 * It never fabricates data: everything it returns originates from the live
 * database. The `server-only` import guarantees this module can never be pulled
 * into a client bundle — the UI reaches it through server actions instead.
 */

import "server-only"

import type {
  FilterOption,
  PaginatedResult,
  Player,
  PlayerDetail,
  PlayerQuery,
  RankingBand,
  Tour,
} from "@/features/players/types"
import { getPlayerRepository, type PlayerSearchParams } from "@/lib/repositories/player-repository"

import { mapPlayer, mapPlayerDetail } from "./player-mapper"

const TOUR_LABELS: Record<Tour, string> = {
  PGA: "PGA Tour",
  DP_WORLD: "DP World Tour",
  LIV: "LIV Golf",
  KORN_FERRY: "Korn Ferry Tour",
  CHAMPIONS: "PGA Tour Champions",
}

const RANKING_BAND_LIMIT: Record<Exclude<RankingBand, "ALL">, number> = {
  TOP_10: 10,
  TOP_25: 25,
  TOP_50: 50,
  TOP_100: 100,
}

/**
 * Database statuses to include for a given UI status filter. The mapper folds
 * the database `RETIRED` status into the UI `INACTIVE`, so filtering for
 * `INACTIVE` must include both to stay consistent with what the UI displays.
 */
const STATUS_DB_VALUES: Record<Player["status"], string[]> = {
  ACTIVE: ["ACTIVE"],
  INJURED: ["INJURED"],
  INACTIVE: ["INACTIVE", "RETIRED"],
}

/** Translate UI query state (with its `"ALL"` sentinels) into DB search params. */
function toSearchParams(query: PlayerQuery): PlayerSearchParams {
  const { filters, page, pageSize } = query
  const search = filters.search.trim()
  return {
    search: search === "" ? undefined : search,
    tourType: filters.tour === "ALL" ? undefined : filters.tour,
    nationality: filters.nationality === "ALL" ? undefined : filters.nationality,
    handedness: filters.handedness === "ALL" ? undefined : filters.handedness,
    statuses: filters.status === "ALL" ? undefined : STATUS_DB_VALUES[filters.status],
    rankingLimit: filters.rankingBand === "ALL" ? undefined : RANKING_BAND_LIMIT[filters.rankingBand],
    skip: (Math.max(1, page) - 1) * pageSize,
    take: pageSize,
  }
}

export const playerService = {
  /**
   * Return a filtered, sorted, paginated page of the live player directory.
   * All of the work happens in the database; this method only translates the
   * query, delegates to the repository, and maps the returned page.
   */
  async getPlayers(query: PlayerQuery): Promise<PaginatedResult<Player>> {
    const { items, total } = await getPlayerRepository().search(toSearchParams(query))
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const safePage = Math.min(Math.max(1, query.page), totalPages)
    return {
      items: items.map(mapPlayer),
      total,
      page: safePage,
      pageSize: query.pageSize,
      totalPages,
    }
  },

  /** Return a full profile for a live player, or null when not found. */
  async getPlayerById(id: string): Promise<PlayerDetail | null> {
    const record = await getPlayerRepository().findDetailById(id)
    return record ? mapPlayerDetail(record) : null
  },

  /** Tour filter options, including the "All" sentinel. */
  getTourOptions(): FilterOption<Tour | "ALL">[] {
    return [
      { value: "ALL", label: "All tours" },
      ...(Object.entries(TOUR_LABELS) as [Tour, string][]).map(([value, label]) => ({
        value,
        label,
      })),
    ]
  },

  /** Nationality filter options derived from the players actually in the database. */
  async getNationalityOptions(): Promise<FilterOption[]> {
    const rows = await getPlayerRepository().listReferencedNationalities()
    const options = rows.map((row) => ({ value: row.code, label: row.name }))
    return [{ value: "ALL", label: "All nationalities" }, ...options]
  },
}
