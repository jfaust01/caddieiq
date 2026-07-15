/**
 * PlayerService — live data access for the Player domain.
 *
 * This is the server-only read layer for the players feature. It reads through
 * `PlayerRepository` (the only layer allowed to touch the database), maps the
 * rows into the UI domain shapes via the pure `player-mapper`, and applies
 * search / filter / sort / pagination against those mapped objects.
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
import { getPlayerRepository } from "@/lib/repositories/player-repository"

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

/** Does a mapped player satisfy every active filter in the query? */
function matchesQuery(player: Player, query: PlayerQuery): boolean {
  const { filters } = query
  const search = filters.search.trim().toLowerCase()

  if (search && !player.fullName.toLowerCase().includes(search)) return false
  if (filters.tour !== "ALL" && player.tour !== filters.tour) return false
  if (filters.nationality !== "ALL" && player.nationality?.code !== filters.nationality) {
    return false
  }
  if (filters.handedness !== "ALL" && player.handedness !== filters.handedness) {
    return false
  }
  if (filters.status !== "ALL" && player.status !== filters.status) return false

  if (filters.rankingBand !== "ALL") {
    const limit = RANKING_BAND_LIMIT[filters.rankingBand]
    // Unranked players never satisfy a "top N" band.
    if (player.worldRanking === null || player.worldRanking > limit) return false
  }

  return true
}

/** Sort by world ranking ascending, unranked players last, then by name. */
function byRanking(a: Player, b: Player): number {
  const ra = a.worldRanking
  const rb = b.worldRanking
  if (ra !== null && rb !== null && ra !== rb) return ra - rb
  if (ra === null && rb !== null) return 1
  if (ra !== null && rb === null) return -1
  return a.fullName.localeCompare(b.fullName)
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

export const playerService = {
  /** Return a filtered, paginated slice of the live player directory. */
  async getPlayers(query: PlayerQuery): Promise<PaginatedResult<Player>> {
    const records = await getPlayerRepository().listWithRelations()
    const players = records.map(mapPlayer)
    const filtered = players.filter((player) => matchesQuery(player, query)).sort(byRanking)
    return paginate(filtered, query.page, query.pageSize)
  },

  /** Return a full profile for a live player, or null when not found. */
  async getPlayerById(id: string): Promise<PlayerDetail | null> {
    const record = await getPlayerRepository().findDetailById(id)
    return record ? mapPlayerDetail(record) : null
  },

  /** All non-deleted player ids — useful for future static generation. */
  async getPlayerIds(): Promise<string[]> {
    const records = await getPlayerRepository().listWithRelations()
    return records.map((record) => record.id)
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
    const records = await getPlayerRepository().listWithRelations()
    const unique = new Map<string, string>()
    for (const record of records) {
      const nationality = mapPlayer(record).nationality
      if (nationality) unique.set(nationality.code, nationality.name)
    }
    const options = Array.from(unique.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
    return [{ value: "ALL", label: "All nationalities" }, ...options]
  },
}
