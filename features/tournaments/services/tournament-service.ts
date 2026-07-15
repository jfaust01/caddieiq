/**
 * TournamentService — live data access for the Tournament domain.
 *
 * The server-only read layer for the tournaments feature. It reads through
 * `TournamentRepository` (the only layer allowed to touch the database), which
 * executes search, filtering, sorting, and pagination *in SQL*, then maps the
 * returned page of rows into UI shapes via the pure `tournament-mapper`. The
 * full table is never loaded into memory — only the requested page is fetched.
 *
 * It never fabricates data: everything it returns originates from the live
 * database. The `server-only` import guarantees this module can never be pulled
 * into a client bundle — the UI reaches it through server actions instead.
 */

import 'server-only'

import { cache } from 'react'

import type {
  FieldLeader,
  FieldRankingLeaders,
  FilterOption,
  PaginatedResult,
  TournamentField,
  TournamentQuery,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'
import { analyticsService } from '@/lib/analytics/service'
import { rankingService } from '@/lib/rankings/service'
import type { RankingBoard, RankingBoardSet, RankingCategory } from '@/lib/rankings/types'
import { getFieldRepository } from '@/lib/repositories/field-repository'
import {
  getTournamentRepository,
  type TournamentSearchParams,
} from '@/lib/repositories/tournament-repository'

import { mapFieldEntrant, mapTournamentSummary } from './tournament-mapper'

/**
 * Load one tournament by id, mapped to the UI shape, or `null` when it does not
 * exist. Wrapped in React `cache` so a route that resolves it in both
 * `generateMetadata` and the page component only hits the database once per
 * request.
 */
const getTournamentByIdCached = cache(
  async (id: string): Promise<TournamentSummary | null> => {
    const row = await getTournamentRepository().findDetailById(id)
    if (!row) return null
    // Detail view adds the lifecycle timestamps on top of the shared summary
    // mapping; the list mapper intentionally leaves them undefined.
    return {
      ...mapTournamentSummary(row),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    }
  },
)

/** How many players each tournament-hub leader list shows. */
const LEADER_LIMIT = 5

/**
 * Turn one ranking board into a name-resolved leader list (top {@link
 * LEADER_LIMIT}). Rows whose player is missing from `nameById` (should not
 * happen for a field board) are skipped rather than shown without a name.
 */
function boardToLeaders(
  board: RankingBoard | undefined,
  nameById: Map<string, string>,
): FieldLeader[] {
  if (!board) return []
  const leaders: FieldLeader[] = []
  for (const row of board.rows) {
    const playerName = nameById.get(row.playerId)
    if (!playerName) continue
    leaders.push({
      rank: row.rank,
      playerId: row.playerId,
      playerName,
      score: row.score,
      band: row.band,
    })
    if (leaders.length >= LEADER_LIMIT) break
  }
  return leaders
}

/** Build the tournament-hub leader lists from a field-scoped ranking board set. */
function buildRankingLeaders(
  boards: RankingBoardSet,
  nameById: Map<string, string>,
): FieldRankingLeaders {
  const boardFor = (category: RankingCategory) =>
    boards.boards.find((board) => board.category === category)
  const overall = boardFor('overall')
  return {
    season: boards.season,
    ratedPlayers: overall?.totalRanked ?? 0,
    topRanked: boardToLeaders(overall, nameById),
    topForm: boardToLeaders(boardFor('recentForm'), nameById),
    topFantasy: boardToLeaders(boardFor('fantasy'), nameById),
  }
}

/**
 * Load a tournament's field (size + roster) mapped to UI shapes. Wrapped in
 * React `cache` so it is fetched at most once per request. Returns an empty
 * field (`size: 0`) when nothing has been imported, so the UI shows an honest
 * placeholder rather than fabricating entrants.
 */
const getTournamentFieldCached = cache(
  async (tournamentId: string): Promise<TournamentField> => {
    const repository = getFieldRepository()
    // The analytics summary is derived by the Analytics Engine (the single
    // source of derived intelligence) rather than computed here; it shares the
    // request-cached season population, so this adds no extra field-stats query.
    const [size, rows, analyticsSummary] = await Promise.all([
      repository.countByTournament(tournamentId),
      repository.listByTournament(tournamentId),
      analyticsService.getFieldAnalyticsSummary(tournamentId),
    ])

    const playerIds = rows.map((row) => row.playerId)

    // Attach each entrant's overall Ranking Engine score (for field sorting) and
    // build the hub leader lists. Both derive from the Ranking Engine ordering
    // the SAME season-normalized analytics used everywhere else, sharing the
    // request-cached population — so this issues no additional stats query.
    const [analytics, rankingBoards] = await Promise.all([
      analyticsService.getAnalyticsForPlayers(playerIds),
      rankingService.getBoardsForPlayers(playerIds),
    ])
    // One lookup per player carrying the three field-sort scores. All come from
    // the SAME analytics profile (overall + the recentForm/fantasyProduction
    // metrics), so field sorts agree with the rankings shown everywhere else.
    const scoresByPlayer = new Map(
      analytics.map((a) => {
        if (a.isEmpty) return [a.playerId, { overall: null, form: null, fantasy: null }] as const
        const metric = (key: string) =>
          a.scores.find((score) => score.key === key)?.value ?? null
        return [
          a.playerId,
          { overall: a.overallRating, form: metric('recentForm'), fantasy: metric('fantasyProduction') },
        ] as const
      }),
    )

    const entrants = rows.map((row) => {
      const scores = scoresByPlayer.get(row.playerId)
      return {
        ...mapFieldEntrant(row),
        rankingScore: scores?.overall ?? null,
        formScore: scores?.form ?? null,
        fantasyScore: scores?.fantasy ?? null,
      }
    })

    const nameById = new Map(entrants.map((entrant) => [entrant.playerId, entrant.playerName]))
    const rankingLeaders = buildRankingLeaders(rankingBoards, nameById)

    return { size, entrants, analyticsSummary, rankingLeaders }
  },
)

/** Translate UI query state (with its `"ALL"` sentinels) into DB search params. */
function toSearchParams(query: TournamentQuery): TournamentSearchParams {
  const { filters, page, pageSize } = query
  const search = filters.search.trim()
  const seasonYear = filters.season === 'ALL' ? undefined : Number.parseInt(filters.season, 10)
  return {
    search: search === '' ? undefined : search,
    status: filters.status === 'ALL' ? undefined : filters.status,
    tourType: filters.tour === 'ALL' ? undefined : filters.tour,
    seasonYear: Number.isFinite(seasonYear) ? seasonYear : undefined,
    skip: (Math.max(1, page) - 1) * pageSize,
    take: pageSize,
  }
}

export const tournamentService = {
  /**
   * Return a filtered, sorted, paginated page of the live tournament schedule.
   * All of the work happens in the database; this method only translates the
   * query, delegates to the repository, and maps the returned page.
   */
  async getTournaments(query: TournamentQuery): Promise<PaginatedResult<TournamentSummary>> {
    const { items, total } = await getTournamentRepository().search(toSearchParams(query))
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const safePage = Math.min(Math.max(1, query.page), totalPages)
    return {
      items: items.map(mapTournamentSummary),
      total,
      page: safePage,
      pageSize: query.pageSize,
      totalPages,
    }
  },

  /**
   * Return a single tournament by id for the detail page, or `null` when no
   * such tournament exists (so the route can respond with a proper 404). Reads
   * through the repository — never fabricates data.
   */
  getTournamentById(id: string): Promise<TournamentSummary | null> {
    return getTournamentByIdCached(id)
  },

  /**
   * Return a tournament's field (size + roster) for the detail page. Reads
   * through the field repository — never fabricates entrants.
   */
  getTournamentField(id: string): Promise<TournamentField> {
    return getTournamentFieldCached(id)
  },

  /** Tour filter options derived from the tours actually referenced by events. */
  async getTourOptions(): Promise<FilterOption<TourType | 'ALL'>[]> {
    const rows = await getTournamentRepository().listReferencedTours()
    const options = rows
      .filter((row): row is { type: TourType; name: string; code: string } =>
        ['PGA', 'DP_WORLD', 'LIV', 'KORN_FERRY', 'LPGA'].includes(row.type),
      )
      .map((row) => ({ value: row.type, label: row.name }))
    return [{ value: 'ALL', label: 'All tours' }, ...options]
  },

  /** Season filter options derived from the seasons actually referenced by events. */
  async getSeasonOptions(): Promise<FilterOption[]> {
    const years = await getTournamentRepository().listReferencedSeasons()
    const options = years.map((year) => ({ value: String(year), label: String(year) }))
    return [{ value: 'ALL', label: 'All seasons' }, ...options]
  },
}
