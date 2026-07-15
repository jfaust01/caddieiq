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
  PlayerCourseFit,
  PlayerDetail,
  PlayerQuery,
  RankingBand,
  Tour,
} from "@/features/players/types"
import { courseService } from "@/features/courses/services/course-service"
import { analyticsService } from "@/lib/analytics/service"
import { computeCourseFit } from "@/lib/analytics/course-fit"
import { rankingService } from "@/lib/rankings/service"
import { getNewsRepository, type NewsArticleView } from "@/lib/repositories"
import {
  getPlayerRepository,
  type PlayerCourseFitContextRow,
  type PlayerSearchParams,
} from "@/lib/repositories/player-repository"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import type { PlayerNewsItem } from "@/features/players/types"

import { buildPlayerSkillProfile } from "./player-course-fit"
import { mapPlayer, mapPlayerDetail } from "./player-mapper"

/** Number of recent articles surfaced on a player's profile. */
const PLAYER_NEWS_LIMIT = 6

/**
 * Resolve a player's Course Fit against the venue of their next **upcoming**
 * verified tournament entry. Returns `null` — so the UI shows a neutral
 * placeholder — whenever there is no such context: no upcoming entry, a
 * historical-only fallback, or an upcoming event without a linked host course.
 * Course Fit is forward-looking by design; we never compute or display it from a
 * past event, and we never fabricate a fit.
 *
 * The player's skill profile is built from verified analytics only (all-`null`
 * today, so the model reports low/none confidence), and the course profile is
 * sourced from the Course Intelligence Engine. This is the only place the two
 * halves of a player-vs-course fit are joined for the profile page.
 */
async function resolveCourseFit(
  playerId: string,
  analytics: PlayerAnalytics,
  contextRow: PlayerCourseFitContextRow | null,
): Promise<PlayerCourseFit | null> {
  // Only a verified upcoming entry yields a fit; a most-recent fallback does not.
  if (!contextRow || contextRow.timing !== 'UPCOMING') return null
  const courseProfile = await courseService.getCourseIntelligence(contextRow.courseId)
  if (!courseProfile) return null

  const result = computeCourseFit({
    playerId,
    courseProfile,
    skills: buildPlayerSkillProfile(analytics),
  })

  return {
    context: {
      tournamentId: contextRow.tournamentId,
      tournamentName: contextRow.tournamentName,
      tournamentSlug: contextRow.tournamentSlug,
      courseId: contextRow.courseId,
      courseName: contextRow.courseName,
      startDate: contextRow.startDate ? contextRow.startDate.toISOString() : null,
      timing: contextRow.timing,
    },
    result,
  }
}

/** Map a persisted news row into the UI news item (dates → ISO strings). */
function mapPlayerNews(row: NewsArticleView): PlayerNewsItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.content,
    url: row.url,
    outlet: row.outlet,
    author: row.author,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  }
}

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
 * Minimum share of players that must carry an active tour membership for the
 * tour filter to be meaningful. Tour classification is not provided by the
 * player import, so today only a handful of seeded players have it — filtering
 * on tour would silently hide every unclassified player and return misleading
 * results. Gating the filter on real coverage keeps it disabled until an import
 * actually populates tour memberships, then re-enables it automatically.
 */
const TOUR_FILTER_MIN_COVERAGE = 0.5

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

  /**
   * Return a full profile for a live player, or null when not found. The pure
   * mapper builds the persisted sections; the Analytics Engine supplies the
   * derived intelligence so analytics stay the platform's single source rather
   * than being recomputed here.
   */
  async getPlayerById(id: string): Promise<PlayerDetail | null> {
    const record = await getPlayerRepository().findDetailById(id)
    if (!record) return null
    // Analytics are the single source of derived intelligence; the Ranking
    // Engine orders those same analytics into the player's global placements.
    // News is live provider content linked to this player at import time.
    const [analytics, rankingProfile, newsRows, fitContext] = await Promise.all([
      analyticsService.getPlayerAnalytics(id),
      rankingService.getPlayerRankingProfile(id),
      getNewsRepository().listByPlayer(id, PLAYER_NEWS_LIMIT),
      getPlayerRepository().findNextCourseFitContextById(id),
    ])
    // Course Fit joins the verified player skill profile (from analytics) with
    // the host course's intelligence profile. Resolved after analytics so the
    // skill profile is available; still cheap (one course read at most).
    const courseFit = await resolveCourseFit(id, analytics, fitContext)
    return {
      ...mapPlayerDetail(record),
      analytics,
      rankingProfile,
      news: newsRows.map(mapPlayerNews),
      courseFit,
    }
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

  /**
   * Whether the tour filter should be offered, based on how much of the live
   * directory actually has tour classification. Returns `false` when tour data
   * is effectively absent (the case for imported players) so the UI can disable
   * the control instead of returning misleading, seed-only results.
   */
  async isTourFilterAvailable(): Promise<boolean> {
    const { withTour, total } = await getPlayerRepository().getActiveTourCoverage()
    if (total === 0) return false
    return withTour / total >= TOUR_FILTER_MIN_COVERAGE
  },

  /** Nationality filter options derived from the players actually in the database. */
  async getNationalityOptions(): Promise<FilterOption[]> {
    const rows = await getPlayerRepository().listReferencedNationalities()
    const options = rows.map((row) => ({ value: row.code, label: row.name }))
    return [{ value: "ALL", label: "All nationalities" }, ...options]
  },
}
