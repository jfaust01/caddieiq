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
  TournamentFieldReport,
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
import {
  getWeatherIntelligenceService,
  type WeatherImportStatus,
} from '@/lib/weather-intelligence/service'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import { getOddsIntelligenceService } from '@/lib/odds-intelligence/service'
import type { TournamentOddsView } from '@/lib/odds-intelligence'
import { getPlayerSkillIntelligenceService } from '@/lib/player-skill-intelligence/service'
import type { SkillLeaderboards } from '@/lib/player-skill-intelligence'
import { getDfsValueService } from '@/lib/dfs-value/service'
import type { DfsValueField } from '@/lib/dfs-value'
import type { FitSkillKey as CourseFitSkillKey } from '@/lib/analytics/course-fit/types'
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
 * - Player skills come from the Player Skill Intelligence engine (the fifth
 *   Signal Family) via its Course Fit adapter — Course Fit no longer re-derives
 *   skill itself. When no per-skill data is ingested those profiles are honestly
 *   all-`null`, so scored lists stay empty until real data exists; the board
 *   never pads Top Fits/Fades with guesses, and it lights up automatically the
 *   moment strokes-gained data flows.
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
    // analytic and the field's skill profiles are each batched once over the
    // whole field (same season-normalized engines used everywhere else).
    const [courseProfile, analytics, skillLeaderboards] = await Promise.all([
      courseId ? courseService.getCourseIntelligence(courseId) : Promise.resolve(null),
      analyticsService.getAnalyticsForPlayers(playerIds),
      // Reuse the leaderboards resolver purely to normalize the whole field's
      // skill profiles against the platform population in one pass.
      getSkillLeaderboardsForField(field),
    ])

    const momentumByPlayer = new Map(
      analytics.map((a) => {
        const value = a.isEmpty
          ? null
          : (a.scores.find((score) => score.key === 'rankingMomentum')?.value ?? null)
        return [a.playerId, value] as const
      }),
    )

    // The Player Skill engine's Course Fit adapter turns each entrant's rich
    // profile into the compact { fitKey → 0–100 | null } shape Course Fit reads.
    const skillProfileByPlayer = skillLeaderboards.profilesByPlayer

    const entries: FieldFitEntry[] = field.entrants.map((entrant) => ({
      playerId: entrant.playerId,
      displayName: entrant.playerName,
      result: computeCourseFit({
        playerId: entrant.playerId,
        courseProfile,
        skills:
          skillProfileByPlayer.get(entrant.playerId) ?? emptyPlayerSkillProfile(),
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

/**
 * Resolve a tournament's Odds Intelligence once per request. Wrapped in React
 * `cache` and keyed by tournament id, mirroring weather, so the engine runs at
 * most once per tournament per request.
 */
const getOddsForTournamentCached = cache(
  (tournamentId: string): Promise<TournamentOddsView> =>
    getOddsIntelligenceService().getTournamentOddsView(tournamentId),
)

/**
 * Resolve a tournament's DFS Value board once per request. Wrapped in React
 * `cache` and keyed by tournament id, mirroring the other intelligence engines,
 * so the flagship composite (which itself fans out across every Signal Family)
 * runs at most once per tournament per request.
 */
const getDfsValueForTournamentCached = cache(
  (tournamentId: string): Promise<DfsValueField> =>
    getDfsValueService().getFieldValueForTournament(tournamentId),
)

/**
 * Resolve an event's field-sync timestamps once per request, keyed by id.
 * Wrapped in React `cache` so the field banner and any other consumer share a
 * single read of the roster-import timestamps.
 */
const getFieldSyncStatsCached = cache((tournamentId: string) =>
  getTournamentRepository().getFieldSyncStats(tournamentId),
)

/**
 * The field's Player Skill Intelligence in a single pass: the tournament-hub
 * skill leaderboards PLUS the per-player Course-Fit-shaped skill profile the fit
 * board consumes. Both derive from the same normalized profiles, so the hub's
 * "Best Putters" list and the Course Fit board never disagree. Keyed by
 * tournament id via React `cache` so the field's profiles are built once per
 * request. Returns empty boards + an empty map when no skill data is held.
 */
interface FieldSkillIntelligence {
  boards: SkillLeaderboards
  profilesByPlayer: Map<string, Record<CourseFitSkillKey, number | null>>
}

const getSkillIntelligenceForField = cache(
  async (
    tournamentId: string,
    season: number | null,
  ): Promise<FieldSkillIntelligence> => {
    const field = await getTournamentFieldCached(tournamentId)
    return buildFieldSkillIntelligence(field, season)
  },
)

/** Pure-ish helper shared by the fit board and the public leaderboards API. */
async function buildFieldSkillIntelligence(
  field: TournamentField,
  season: number | null,
): Promise<FieldSkillIntelligence> {
  const service = getPlayerSkillIntelligenceService()
  const entrants = field.entrants.map((e) => ({
    playerId: e.playerId,
    playerName: e.playerName,
  }))
  const [boards, profilesByPlayer] = await Promise.all([
    service.getFieldLeaderboards(entrants, season),
    service.getCourseFitSkillProfilesForPlayers(entrants.map((e) => e.playerId)),
  ])
  return { boards, profilesByPlayer }
}

/** Adapter used by the fit board: resolve just the field's skill intelligence. */
function getSkillLeaderboardsForField(
  field: TournamentField,
): Promise<FieldSkillIntelligence> {
  return buildFieldSkillIntelligence(field, null)
}

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
   * The event's official-field lifecycle report for the Tournament Page banner:
   * the field status/confidence and commitment-deadline the Tournament Context
   * Engine derives, plus the roster-import timestamps (when the field was first
   * confirmed and last synced) from the repository. Every value is honest —
   * counts and times stay `null` until real field rows exist, and an
   * `unavailable` context yields an `unknown`/`unknown` report rather than a
   * fabricated one. Reads through the Context Engine and repository only.
   */
  async getFieldReport(id: string): Promise<TournamentFieldReport> {
    const [context, sync] = await Promise.all([
      tournamentContextService.getTournamentContext(id),
      getFieldSyncStatsCached(id),
    ])

    if (context.status !== 'available') {
      return {
        status: 'unknown',
        confidence: 'unknown',
        timing: null,
        releaseTime: null,
        playerCount: null,
        confirmedAt: null,
        lastUpdated: null,
      }
    }

    return {
      status: context.fieldStatus,
      confidence: context.fieldConfidence,
      timing: context.timing,
      releaseTime: context.fieldReleaseTime,
      // Prefer the context's count (already honest about null); the sync read is
      // the authority for the import timestamps.
      playerCount: context.fieldPlayerCount,
      confirmedAt: sync.firstImportedAt ? sync.firstImportedAt.toISOString() : null,
      lastUpdated: sync.lastUpdatedAt ? sync.lastUpdatedAt.toISOString() : null,
    }
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
   * Return this event's weather import history summary (last attempt/result,
   * last success, provider response). For admin surfaces only — the tournament
   * page uses it to render the Refresh Weather control and last-import metadata.
   * Every field is drawn from real rows; never a fabricated placeholder.
   */
  getWeatherImportStatus(id: string): Promise<WeatherImportStatus> {
    return getWeatherIntelligenceService().getWeatherImportStatus(id)
  },

  /**
   * Return this event's Odds Intelligence — a de-vigged, multi-book consensus
   * for the outright market with its own Verified/Partial/Unavailable
   * confidence. Keyed by tournament id to agree with the rest of the hub. Reads
   * through the Odds Intelligence Engine, which returns an `unavailable` view
   * (never a fabricated price) when no verified quotes have been captured.
   */
  getOddsIntelligence(id: string): Promise<TournamentOddsView> {
    return getOddsForTournamentCached(id)
  },

  /**
   * Return this event's Player Skill Intelligence leaderboards — the field's
   * best iron players, putters, scramblers, longest/most-accurate drivers, and
   * the players with the most complete skill profiles. Each entrant is
   * normalized against the platform population by the Player Skill engine (the
   * fifth Signal Family), the SAME profiles the Course Fit board consumes, so
   * the hub agrees with itself. Reads through the engine, which leaves boards
   * empty (never padded with guesses) when no strokes-gained data is held.
   */
  async getSkillLeaderboards(id: string): Promise<SkillLeaderboards> {
    const summary = await getTournamentByIdCached(id)
    const season = summary?.season ?? null
    const { boards } = await getSkillIntelligenceForField(id, season)
    return boards
  },

  /**
   * Return this event's DFS Value board — the flagship composite for the whole
   * field. Every entrant's salary-adjusted value is ranked into DFS leaderboards
   * (top values, high-end plays, mid-range, value plays, highest confidence,
   * risky GPP targets), fusing every Signal Family with the player's real
   * DraftKings salary. Keyed by tournament id so it agrees with the rest of the
   * hub. Reads through the DFS Value service, which returns an all-`unavailable`
   * board (never fabricated) when the field or its salaries are not yet held.
   */
  getDfsValueField(id: string): Promise<DfsValueField> {
    return getDfsValueForTournamentCached(id)
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

  /**
   * Compute course difficulty (0-10) from CourseProfile characteristics.
   * Weights: length (40%), green size (25%), hazards/OB (20%), wind (15%).
   */
  computeCourseDifficulty(profile: typeof import('@/lib/domain/course').CourseProfile | null): number {
    if (!profile) return 5 // Neutral if no profile

    let score = 5
    if (profile.avgYardage > 7300) score += 2
    else if (profile.avgYardage > 7000) score += 1.5
    else if (profile.avgYardage < 6500) score -= 1

    if (profile.avgGreenSize === 'small') score += 1.5
    else if (profile.avgGreenSize === 'tiny') score += 2.5

    if (profile.hazardCount > 50) score += 1.5
    else if (profile.hazardCount > 30) score += 1

    if (profile.windExposure === 'high') score += 1
    else if (profile.windExposure === 'moderate') score += 0.5

    return Math.max(0, Math.min(10, score))
  },

  /**
   * Extract dynamic characteristic chips from CourseProfile.
   * Returns concise, player-facing descriptors like "Tight Fairways", "Small Greens", etc.
   */
  extractCourseCharacteristics(profile: typeof import('@/lib/domain/course').CourseProfile | null): string[] {
    if (!profile) return []

    const chips: string[] = []

    if (profile.avgYardage > 7200) chips.push('Ultra-Long')
    else if (profile.avgYardage > 7000) chips.push('Long')

    if (profile.fairwayWidth === 'narrow') chips.push('Tight Fairways')
    else if (profile.fairwayWidth === 'very_narrow') chips.push('Very Narrow Fairways')

    if (profile.avgGreenSize === 'small') chips.push('Small Greens')
    else if (profile.avgGreenSize === 'tiny') chips.push('Tiny Greens')

    if (profile.hazardCount > 50) chips.push('Hazard-Heavy')
    if (profile.outOfBoundsCount > 15) chips.push('OB Risk')

    if (profile.windExposure === 'high') chips.push('Wind Sensitive')
    if (profile.elevationChange > 200) chips.push('Elevation Play')
    if (profile.waterHazards > 10) chips.push('Water in Play')

    if (profile.grassType?.includes('Bentgrass')) chips.push('Bentgrass Greens')
    if (profile.grassType?.includes('Poa')) chips.push('Poa Annua Greens')

    return chips.slice(0, 6)
  },

  /**
   * Generate 3-6 fantasy-relevant takeaways from CourseProfile and CourseDetails.
   * AI-style insights that help DFS players understand course demands.
   */
  generateFantasyTakeaways(
    profile: typeof import('@/lib/domain/course').CourseProfile | null,
    details: any, // CourseDetails shape
  ): string[] {
    if (!profile) return []

    const takeaways: string[] = []

    // Length takeaway
    if (profile.avgYardage > 7300) {
      takeaways.push('Bombers have an edge on this ultra-long track—accuracy matters but distance is king.')
    } else if (profile.avgYardage < 6500) {
      takeaways.push('This short course favors well-rounded players who can convert scoring opportunities.')
    }

    // Putting takeaway
    if (profile.avgGreenSize === 'small' || profile.avgGreenSize === 'tiny') {
      takeaways.push('Small greens demand precise approaches; elite putters can gain strokes on approach misses.')
    }

    // Driving accuracy
    if (profile.fairwayWidth === 'very_narrow' || profile.outOfBoundsCount > 15) {
      takeaways.push('Directional accuracy is critical—straight hitters outperform bombers off the tee.')
    }

    // Wind/elevation
    if (profile.windExposure === 'high' || profile.elevationChange > 200) {
      takeaways.push('Course conditions are volatile; players with consistent form may outpace high-ceiling targets.')
    }

    // Risk reward
    if (profile.waterHazards > 10 || profile.hazardCount > 50) {
      takeaways.push('High-risk holes reward conservative play—aggressive players face penalty strokes.')
    }

    // Tee grass
    if (details?.grassType?.includes('Poa')) {
      takeaways.push('Poa Annua greens can be unpredictable; factor in weather and green speed volatility.')
    }

    return takeaways.slice(0, 6)
  },

  /**
   * Generate skill importance explanations with confidence levels.
   * Returns object with driving, irons, short game, putting, course management skills
   * each with a band (low/medium/high) and explanation.
   */
  getSkillImportanceExplanations(profile: typeof import('@/lib/domain/course').CourseProfile | null): Record<string, { band: string; explanation: string }> {
    if (!profile) {
      return {
        driving: { band: 'medium', explanation: 'Data unavailable' },
        irons: { band: 'medium', explanation: 'Data unavailable' },
        shortGame: { band: 'medium', explanation: 'Data unavailable' },
        putting: { band: 'medium', explanation: 'Data unavailable' },
        courseManagement: { band: 'medium', explanation: 'Data unavailable' },
      }
    }

    return {
      driving: {
        band: profile.avgYardage > 7200 ? 'high' : profile.avgYardage < 6500 ? 'low' : 'medium',
        explanation: profile.avgYardage > 7200 
          ? 'Distance off the tee is critical on this ultra-long layout. Bombers gain a significant advantage.'
          : profile.avgYardage < 6500
          ? 'Distance is less important than accuracy and precision. Consistent ball strikers thrive here.'
          : 'Balanced importance of both distance and accuracy throughout the round.',
      },
      irons: {
        band: profile.fairwayWidth === 'narrow' || profile.fairwayWidth === 'very_narrow' ? 'high' : 'medium',
        explanation: profile.fairwayWidth === 'narrow' || profile.fairwayWidth === 'very_narrow'
          ? 'Tight fairways demand precise iron play. Poor approach shots result in difficult recoveries.'
          : 'Solid iron play helps but is not as critical as other skills on this course.',
      },
      shortGame: {
        band: profile.avgGreenSize === 'small' || profile.avgGreenSize === 'tiny' ? 'high' : 'medium',
        explanation: profile.avgGreenSize === 'small' || profile.avgGreenSize === 'tiny'
          ? 'Small greens punish approach misses severely. Elite chippers and wedge players gain significant strokes.'
          : 'Short game proficiency is important but not the primary differentiator.',
      },
      putting: {
        band: profile.greenSpeed === 'high' || profile.greenSpeed === 'very_high' ? 'high' : 'medium',
        explanation: profile.greenSpeed === 'high' || profile.greenSpeed === 'very_high'
          ? 'Fast greens require expert touch and reading. Elite putters can dominate scoring.'
          : 'Putting skill is important but greens are relatively forgiving for speed control.',
      },
      courseManagement: {
        band: profile.windExposure === 'high' || profile.elevationChange > 200 ? 'high' : 'medium',
        explanation: profile.windExposure === 'high' || profile.elevationChange > 200
          ? 'Weather conditions and elevation changes are highly variable. Smart club selection and course strategy matter greatly.'
          : 'Course management is a supporting skill; other factors are more impactful.',
      },
    }
  },

  /**
   * Generate a strategic one-paragraph summary of why this course matters for DFS.
   * Explains how the course characteristics translate to player selection strategy.
   */
  generateStrategySummary(profile: typeof import('@/lib/domain/course').CourseProfile | null, courseName: string): string {
    if (!profile) {
      return `Limited course data available for ${courseName}. Review player recent form and course history.`
    }

    const key = profile.avgYardage > 7200 ? 'length' : profile.fairwayWidth === 'narrow' ? 'accuracy' : profile.avgGreenSize === 'small' ? 'precision' : 'balance'

    const strategies: Record<string, string> = {
      length: `${courseName} is an ultra-long test that favors distance-based players and bombers off the tee. Target golfers with strong recent form in long-course conditions and proven accuracy in driving. Avoid short hitters unless they have elite short game skills to compensate. The length also means scoring will be lower, so stack multiple proven scorers.`,
      accuracy: `${courseName} demands directional precision with tight fairways and punishing rough. Build your lineup around accurate drivers and consistent ball strikers who minimize mistakes. Distance becomes secondary to accuracy here—value precision over power. Consider stacking proven performers who excel in accuracy-focused courses.`,
      precision: `${courseName} features small greens that severely punish approach misses. Prioritize players with elite approach play and short game proficiency. Look for golfers on hot streaks with strong GIR statistics and scoring averages. The small greens level the playing field—even mid-tier golfers can capitalize on good approach shots.`,
      balance: `${courseName} presents a balanced test where multiple skills are important in equal measure. Build a diverse lineup featuring distance, accuracy, and short game. Look for well-rounded players with consistent all-around statistics rather than specialists. This course rewards consistency and punishes volatility—fade high-variance plays.`,
    }

    return strategies[key] || strategies.balance
  },

  /**
   * Generate player archetypes for best fits and potential fades.
   * Returns { bestFits: string[], potentialFades: string[] } with explanations.
   */
  generatePlayerArchetypes(profile: typeof import('@/lib/domain/course').CourseProfile | null): { bestFits: Array<{ name: string; why: string }>; potentialFades: Array<{ name: string; why: string }> } {
    if (!profile) {
      return {
        bestFits: [{ name: 'Balanced Players', why: 'Data unavailable for detailed analysis' }],
        potentialFades: [],
      }
    }

    const bestFits: Array<{ name: string; why: string }> = []
    const potentialFades: Array<{ name: string; why: string }> = []

    // Length-based archetypes
    if (profile.avgYardage > 7200) {
      bestFits.push({ name: 'Long Hitters with Accuracy', why: 'Ultra-long course rewards distance without sacrificing control' })
      potentialFades.push({ name: 'Short Hitters', why: 'Length becomes a significant disadvantage on 7,400+ yard courses' })
    } else if (profile.avgYardage < 6500) {
      bestFits.push({ name: 'Precision Ball Strikers', why: 'Shorter courses emphasize accuracy over pure distance' })
      potentialFades.push({ name: 'Pure Bombers', why: 'Distance is a wasted advantage when the course is relatively short' })
    }

    // Accuracy-based archetypes
    if (profile.fairwayWidth === 'narrow' || profile.fairwayWidth === 'very_narrow') {
      bestFits.push({ name: 'Directionally Accurate Drivers', why: 'Tight fairways heavily punish wild tee shots' })
      potentialFades.push({ name: 'Aggressive Risk-Takers', why: 'Missing fairways on narrow layouts leads to severe penalties' })
    }

    // Greens-based archetypes
    if (profile.avgGreenSize === 'small' || profile.avgGreenSize === 'tiny') {
      bestFits.push({ name: 'Elite Approach Players', why: 'Small greens reward precise approach play and punish misses' })
      bestFits.push({ name: 'Short Game Specialists', why: 'Chipping and wedge play become critical with limited target areas' })
      potentialFades.push({ name: 'Inconsistent Approach Players', why: 'Poor ball striking is amplified when greens are tiny' })
    } else {
      bestFits.push({ name: 'Elite Putters', why: 'Larger greens provide more room for putting skill to shine' })
    }

    // Wind/elevation archetypes
    if (profile.windExposure === 'high' || profile.elevationChange > 200) {
      bestFits.push({ name: 'Course Management Masters', why: 'Variable conditions reward smart club selection and strategy' })
      potentialFades.push({ name: 'Wind-Sensitive Players', why: 'High-wind or elevation variance penalizes inconsistent ball striking' })
    }

    return { bestFits, potentialFades }
  },
}
