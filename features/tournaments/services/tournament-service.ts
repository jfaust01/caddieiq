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
  TournamentNewsItem,
  TournamentQuery,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'
import { analyticsService } from '@/lib/analytics/service'
import {
  buildFieldFitBoard,
  computeCourseFit,
  emptyPlayerSkillProfile,
  type FieldFitBoard,
  type FieldFitEntry,
} from '@/lib/analytics/course-fit'
import { courseService } from '@/features/courses/services/course-service'
import { rankingService } from '@/lib/rankings/service'
import {
  hasCourseContext,
  tournamentContextService,
  type TournamentContext,
} from '@/lib/tournament-context'
import { getWeatherIntelligenceService } from '@/lib/weather-intelligence/service'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import type { RankingBoard, RankingBoardSet, RankingCategory } from '@/lib/rankings/types'
import { getFieldRepository } from '@/lib/repositories/field-repository'
import { getNewsRepository } from '@/lib/repositories'
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

/** How many players each fit list (Top Fits / Fades / etc.) shows. */
const FIT_LIST_LIMIT = 5

/**
 * Build the tournament's Course Fit board: every field entrant evaluated by the
 * Course Fit Model against the host course, then ranked into the hub lists (top
 * fits, fades, trending-up by verified momentum, most-uncertain).
 *
 * Honest by construction:
 * - The host course is taken from the shared Tournament Context Engine — the
 *   single authority for the event's context — not resolved independently here.
 *   When the context has no linked course, `courseId` is `null` and every
 *   entrant's fit degrades to "course-demand-missing" rather than being invented.
 * - Reuses the request-cached field, so it adds no roster query. Analytics for
 *   `momentum` are batched in one call over the field.
 * - Player skill profiles are the honest all-`null` default today (no per-skill
 *   data is ingested), so scored lists stay empty until real data exists — the
 *   board never pads Top Fits/Fades with guesses.
 *
 * Wrapped in React `cache`, keyed by tournament + course id, so it resolves at
 * most once per request.
 */
const getFieldFitBoardCached = cache(
  async (tournamentId: string, courseId: string | null): Promise<FieldFitBoard> => {
    const field = await getTournamentFieldCached(tournamentId)
    if (field.entrants.length === 0) {
      return buildFieldFitBoard([], FIT_LIST_LIMIT)
    }

    const playerIds = field.entrants.map((entrant) => entrant.playerId)
    // The host course profile is shared across every entrant; the momentum
    // analytic is batched once over the whole field (same season-normalized
    // engine used everywhere), so this stays a two-call resolve.
    const [courseProfile, analytics] = await Promise.all([
      courseId ? courseService.getCourseIntelligence(courseId) : Promise.resolve(null),
      analyticsService.getAnalyticsForPlayers(playerIds),
    ])

    const momentumByPlayer = new Map(
      analytics.map((a) => {
        const value = a.isEmpty
          ? null
          : (a.scores.find((score) => score.key === 'rankingMomentum')?.value ?? null)
        return [a.playerId, value] as const
      }),
    )

    const entries: FieldFitEntry[] = field.entrants.map((entrant) => ({
      playerId: entrant.playerId,
      displayName: entrant.playerName,
      // No per-skill player data is ingested yet — use the honest empty profile.
      result: computeCourseFit({
        playerId: entrant.playerId,
        courseProfile,
        skills: emptyPlayerSkillProfile(),
      }),
      momentum: momentumByPlayer.get(entrant.playerId) ?? null,
    }))

    return buildFieldFitBoard(entries, FIT_LIST_LIMIT)
  },
)

/**
 * Resolve a tournament's Weather Intelligence once per request. Wrapped in React
 * `cache` and keyed by tournament id so a route that reads it in both
 * `generateMetadata` and the page only runs the engine once.
 */
const getWeatherForTournamentCached = cache(
  (tournamentId: string): Promise<WeatherIntelligence> =>
    getWeatherIntelligenceService().getForTournament(tournamentId),
)

/** How many articles the tournament-hub field-news rail shows in total. */
const FIELD_NEWS_LIMIT = 6
/** How many articles per player feed the rail before the global cap. */
const FIELD_NEWS_PER_PLAYER = 1

/**
 * Assemble the tournament-hub "Field news" rail: recent articles about the
 * players in this event's field, newest first, capped at {@link
 * FIELD_NEWS_LIMIT}. Reuses the request-cached field (so it issues no extra
 * roster query) for player ids + names, then reads the news repository. Returns
 * an empty list when the field is empty or no linked articles exist, so the hub
 * degrades to its placeholder rather than fabricating headlines.
 */
const getFieldNewsCached = cache(
  async (tournamentId: string): Promise<TournamentNewsItem[]> => {
    const field = await getTournamentFieldCached(tournamentId)
    if (field.entrants.length === 0) return []

    const nameById = new Map(
      field.entrants.map((entrant) => [entrant.playerId, entrant.playerName]),
    )
    const byPlayer = await getNewsRepository().latestForPlayers(
      [...nameById.keys()],
      FIELD_NEWS_PER_PLAYER,
    )

    const items: TournamentNewsItem[] = []
    for (const [playerId, articles] of byPlayer) {
      const playerName = nameById.get(playerId)
      if (!playerName) continue
      for (const article of articles) {
        items.push({
          id: article.id,
          title: article.title,
          summary: article.content,
          url: article.url,
          outlet: article.outlet,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
          playerId,
          playerName,
        })
      }
    }

    // Newest first; articles without a published date sort last but are kept.
    items.sort((a, b) => {
      const at = a.publishedAt ? Date.parse(a.publishedAt) : Number.NEGATIVE_INFINITY
      const bt = b.publishedAt ? Date.parse(b.publishedAt) : Number.NEGATIVE_INFINITY
      return bt - at
    })
    return items.slice(0, FIELD_NEWS_LIMIT)
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

  /**
   * The event's normalized Tournament Context (identity, dates, host course,
   * field size) with a Verified/Partial/Unavailable confidence grade. This is
   * the shared context every event-specific model reads; the hub surfaces it and
   * passes it to Course Fit so the whole page agrees on one course and one
   * confidence. Reads through the Tournament Context Engine.
   */
  getTournamentContext(id: string): Promise<TournamentContext> {
    return tournamentContextService.getTournamentContext(id)
  },

  /**
   * Return the tournament's Course Fit board (top fits, fades, trending-up,
   * most-uncertain). The host course is taken from the shared Tournament Context
   * Engine — never resolved independently — so the board always agrees with the
   * rest of the hub. Reads through the Course Fit Model and Course Intelligence
   * Engine; never fabricates fits.
   */
  async getFieldFitBoard(id: string): Promise<FieldFitBoard> {
    const context = await tournamentContextService.getTournamentContext(id)
    const courseId = hasCourseContext(context) ? context.course.id : null
    return getFieldFitBoardCached(id, courseId)
  },

  /**
   * The event's Weather Intelligence — a shared signal family attached to the
   * tournament context (current conditions, per-round forecast, wind/rain
   * timelines, morning/afternoon wave advantage) with its own
   * Verified/Partial/Unavailable confidence. Keyed by tournament id, the natural
   * key for an event's conditions, so it agrees with the rest of the hub. Reads
   * through the Weather Intelligence Engine; returns an `unavailable` profile
   * (never a fabricated forecast) when no snapshot has been imported.
   */
  getWeatherIntelligence(id: string): Promise<WeatherIntelligence> {
    return getWeatherForTournamentCached(id)
  },

  /**
   * Return recent news about this event's field players for the hub research
   * rail. Reads through the news repository — never fabricates headlines.
   */
  getFieldNews(id: string): Promise<TournamentNewsItem[]> {
    return getFieldNewsCached(id)
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
