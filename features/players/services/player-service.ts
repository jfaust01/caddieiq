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
  CourseIntelSummary,
  FilterOption,
  PaginatedResult,
  Player,
  PlayerDetail,
  PlayerQuery,
  PlayerUpcomingContext,
  RankingBand,
  Tour,
} from "@/features/players/types"
import { courseService } from "@/features/courses/services/course-service"
import { analyticsService } from "@/lib/analytics/service"
import { computeCourseFit } from "@/lib/analytics/course-fit"
import type { CourseProfile } from "@/lib/domain/course"
import { rankingService } from "@/lib/rankings/service"
import { getNewsRepository, type NewsArticleView } from "@/lib/repositories"
import {
  getPlayerRepository,
  type PlayerSearchParams,
} from "@/lib/repositories/player-repository"
import {
  hasCourseContext,
  isContextAvailable,
  tournamentContextService,
  type TournamentContext,
} from "@/lib/tournament-context"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import type { PlayerNewsItem } from "@/features/players/types"

import { buildPlayerSkillProfile } from "./player-course-fit"
import { mapPlayer, mapPlayerDetail } from "./player-mapper"

/** Number of recent articles surfaced on a player's profile. */
const PLAYER_NEWS_LIMIT = 6

/** One-line, coverage-based read of a course's verified intelligence. */
function summarizeCourseIntel(profile: CourseProfile): CourseIntelSummary {
  const { verified, total } = profile.coverage
  return {
    verified: verified > 0,
    scored: verified,
    total,
    headline:
      verified > 0
        ? `${verified} of ${total} course attributes verified`
        : 'Course profile pending verification',
  }
}

/**
 * Turn the player's shared {@link TournamentContext} into the profile-ready
 * {@link PlayerUpcomingContext}, computing Course Fit **only** when the context
 * is `verified` (a linked host course exists).
 *
 * Course selection is not decided here — it flows in from the Tournament Context
 * Engine, the single authority for a player's active event. This function just
 * attaches the event-specific Course Fit, whose confidence is capped by the
 * context's confidence. It never fabricates: no upcoming context yields an
 * `unavailable` state, and a course-less (`partial`) context skips Course Fit
 * rather than inventing one. The player's skill profile is built from verified
 * analytics only (all-`null` today, so the model reports low/none confidence).
 */
async function buildUpcomingContext(
  playerId: string,
  analytics: PlayerAnalytics,
  context: TournamentContext,
): Promise<PlayerUpcomingContext> {
  if (!isContextAvailable(context)) {
    return {
      status: 'unavailable',
      confidence: 'unavailable',
      tournament: null,
      course: null,
      courseIntelligence: null,
      fit: null,
      detail: context.detail,
    }
  }

  const tournament = {
    id: context.tournament.id,
    name: context.tournament.name,
    slug: context.tournament.slug,
    startDate: context.tournament.startDate,
    endDate: context.tournament.endDate,
    status: context.tournament.status,
    timing: context.timing,
  }

  // Partial context: an upcoming event with no linked host course yet — Course
  // Fit and Course Intelligence are not available, and are never guessed.
  if (!hasCourseContext(context)) {
    return {
      status: 'available',
      confidence: context.confidence,
      tournament,
      course: context.course,
      courseIntelligence: null,
      fit: null,
      detail: 'Course Fit becomes available once a host course is linked to this tournament.',
    }
  }

  // Verified context: join the verified player skill profile with the host
  // course's intelligence profile — the only place the two halves of a
  // player-vs-course fit meet for the profile page.
  const courseProfile = await courseService.getCourseIntelligence(context.course.id)
  if (!courseProfile) {
    return {
      status: 'available',
      confidence: 'partial',
      tournament,
      course: context.course,
      courseIntelligence: null,
      fit: null,
      detail: 'The linked host course could not be loaded, so Course Fit is unavailable.',
    }
  }

  const fit = computeCourseFit({
    playerId,
    courseProfile,
    skills: buildPlayerSkillProfile(analytics),
  })

  return {
    status: 'available',
    confidence: 'verified',
    tournament,
    course: context.course,
    courseIntelligence: summarizeCourseIntel(courseProfile),
    fit,
    detail: null,
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
