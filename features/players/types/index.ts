/**
 * Player domain types.
 *
 * These describe the shapes the Player feature renders against. They are
 * intentionally provider-agnostic: the mock `PlayerService` returns them today
 * and the SportsDataIO / DataGolf normalizers will map into them later.
 *
 * TODO(data): reconcile with the Prisma `Player` model + provider normalizers
 * when the live data layer is connected.
 */

import type { CourseFitResult } from '@/lib/analytics/course-fit'
import type { PlayerAnalytics } from '@/lib/analytics/types'
import type { PlayerRankingProfile } from '@/lib/rankings/types'

/** Professional tours a player can compete on. */
export type Tour = 'PGA' | 'DP_WORLD' | 'LIV' | 'KORN_FERRY' | 'CHAMPIONS'

/** Dominant hand — placeholder dimension until sourced from a provider. */
export type Handedness = 'RIGHT' | 'LEFT'

/** Competitive status used for filtering and status badges. */
export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'INACTIVE'

/** A single recent-event finish, used to render the "recent form" strip. */
export interface FormResult {
  /** Stable id for list rendering. */
  id: string
  /** Short event label, e.g. "The Open". */
  event: string
  /**
   * Finishing position. A positive integer is a numeric finish; the string
   * variants capture non-numeric outcomes.
   */
  position: number | 'CUT' | 'WD' | 'DQ'
  /** ISO date of the event's final round. */
  date: string
}

/** Nationality descriptor. `code` is an ISO 3166-1 alpha-3 style key. */
export interface Nationality {
  code: string
  name: string
}

/**
 * Core player record shown in directory cards and profile headers.
 *
 * Fields sourced from optional columns/relations in the live database are
 * nullable: the UI must degrade gracefully (render an em-dash or "Unranked")
 * when a value has not been ingested yet rather than fabricate one.
 */
export interface Player {
  id: string
  firstName: string
  lastName: string
  fullName: string
  /** Resolved nationality, or null when the player has no linked country. */
  nationality: Nationality | null
  /** Active tour, or null when no active tour membership is recorded. */
  tour: Tour | null
  /** Official World Golf Ranking position, or null when unranked. */
  worldRanking: number | null
  /** Dominant hand, or null when unknown. */
  handedness: Handedness | null
  status: PlayerStatus
  /** Age in years derived from birth date, or null when unknown. */
  age: number | null
  /** Year the player turned professional, or null when unknown. */
  turnedPro: number | null
  /** Remote headshot URL when available; null renders an initials placeholder. */
  headshotUrl: string | null
  /** Most-recent finishes, newest first. Empty until round data is ingested. */
  recentForm: FormResult[]
}

/** Ranking systems surfaced in the rankings panel. */
export type RankingSystem = 'OWGR' | 'DATAGOLF' | 'CADDIEIQ' | 'MODEL'

/** Direction a ranking has moved since the previous update. */
export type RankingMovement = 'up' | 'down' | 'flat'

/** A single ranking entry for the rankings panel. */
export interface PlayerRanking {
  system: RankingSystem
  label: string
  /** Current position, or null when the system is not yet available. */
  rank: number | null
  movement: RankingMovement
  /** Positions gained/lost since last update. */
  delta: number
  /** Marks systems that are scaffolded but not yet live. */
  comingSoon?: boolean
}

/** Grouping for statistic cards. */
export type StatCategory = 'STROKES_GAINED' | 'TRADITIONAL'

/** A single statistic card value. */
export interface PlayerStatistic {
  key: string
  label: string
  /** Formatted display value, e.g. "+1.42" or "68.4%". */
  value: string
  /** Optional rank within the field for this statistic. */
  rank: number | null
  category: StatCategory
}

/**
 * A player's season-level statistics as reported by the data provider.
 *
 * IMPORTANT — coverage: this reflects only what the current SportsDataIO tier
 * returns at season level. Money, FedEx Cup points, wins, top-10s, cuts made,
 * scoring average, and strokes-gained are NOT provided by the source and are
 * therefore intentionally absent — the UI never fabricates them. `worldRanking`
 * is stored verbatim but the upstream tier is known to obfuscate its precision
 * (ties), so it is presented as indicative, not authoritative.
 */
export interface PlayerSeasonStat {
  /** Calendar season year, e.g. 2025. */
  season: number
  /** Official World Golf Ranking position, or null when not reported. */
  worldRanking: number | null
  /** World ranking the previous week, or null when not reported. */
  worldRankingLastWeek: number | null
  /** Events played, or null when not reported. */
  events: number | null
  /** Average fantasy points per event, or null when not reported. */
  averagePoints: number | null
  /** Total fantasy points across the season, or null when not reported. */
  totalPoints: number | null
  /** Fantasy points gained, or null when not reported. */
  pointsGained: number | null
  /** Fantasy points lost, or null when not reported. */
  pointsLost: number | null
}

/** Career summary headline figures. */
export interface CareerSummary {
  events: number
  wins: number
  topTens: number
  cutsMade: number
  cutsPossible: number
  careerEarnings: string
  bestFinish: string
}

/** A course the player has a notable history at (placeholder). */
export interface CourseHistoryEntry {
  id: string
  course: string
  rounds: number
  bestFinish: string
  scoringAverage: number
}

/** A past tournament result (placeholder). */
export interface TournamentHistoryEntry {
  id: string
  tournament: string
  season: number
  result: string
  toPar: string
}

/** An activity-feed entry (placeholder). */
export interface ActivityEntry {
  id: string
  label: string
  detail: string
  date: string
}

/**
 * A news article about the player, sourced live from the provider news feed and
 * associated via the provider's native player id. Every field except `title`
 * is nullable and means "not reported by the source"; the UI never fabricates a
 * summary, outlet, or date.
 */
export interface PlayerNewsItem {
  id: string
  /** Headline. */
  title: string
  /** Body / summary, or null when the source supplied none. */
  summary: string | null
  /** Canonical article URL, or null when unavailable. */
  url: string | null
  /** Publishing outlet (e.g. "RotoBaller"), or null when unavailable. */
  outlet: string | null
  /** Byline, or null when unavailable. */
  author: string | null
  /** ISO publish timestamp, or null when unreported. */
  publishedAt: string | null
}

/** Full profile payload for the detail page. */
export interface PlayerDetail extends Player {
  /** Headline career figures, or null when no historical data is ingested. */
  careerSummary: CareerSummary | null
  rankings: PlayerRanking[]
  statistics: PlayerStatistic[]
  /** Season statistics (newest first), sourced live. Empty until imported. */
  seasonStatistics: PlayerSeasonStat[]
  /**
   * Derived analytics from the Analytics Engine, normalized against the current
   * season's field. The engine is the single source of this intelligence; the
   * profile is honest (its `isEmpty` flag is set) when the player has no data
   * in the normalization season.
   */
  analytics: PlayerAnalytics
  /**
   * The player's placements across every ranking category, from the Ranking
   * Engine (global scope). Rendered as ranking badges. Built by ordering the
   * same analytics above — never a parallel calculation — and honestly
   * unranked (`isRanked: false`) when the player has no season data.
   */
  rankingProfile: PlayerRankingProfile
  courseHistory: CourseHistoryEntry[]
  tournamentHistory: TournamentHistoryEntry[]
  activity: ActivityEntry[]
  /**
   * The player's single active Tournament Context — their next verified upcoming
   * event — resolved by the Tournament Context Engine, together with the Course
   * Fit computed for it. Always present; `status: 'unavailable'` when the player
   * is in no verified upcoming field (in which case Course Fit is not
   * calculated). This is the shared context every event-specific model reads.
   */
  upcoming: PlayerUpcomingContext
  /**
   * Recent news about the player, newest first, sourced live from the provider
   * news feed. Empty until news has been imported or when the provider has no
   * articles linked to this player.
   */
  news: PlayerNewsItem[]
}

/**
 * A one-line read of how much verified Course Intelligence a host course has.
 * Sourced from the Course Intelligence Engine's coverage — never estimated.
 */
export interface CourseIntelSummary {
  /** Whether at least one course characteristic is verified. */
  verified: boolean
  /** Verified characteristic count and the total tracked. */
  scored: number
  total: number
  /** Plain-English headline, e.g. "3 of 12 course attributes verified". */
  headline: string
}

/** The resolved event on a player's Tournament Context. */
export interface PlayerUpcomingTournament {
  id: string
  name: string
  slug: string
  /** ISO start date of the event, or null when unscheduled. */
  startDate: string | null
  /** ISO end date of the event, or null when unknown. */
  endDate: string | null
  /** Database tournament status text (e.g. "SCHEDULED"). */
  status: string
  timing: 'UPCOMING' | 'LIVE' | 'COMPLETED'
}

/**
 * The player's active Tournament Context, ready for the profile UI. Produced by
 * the player service from the shared Tournament Context Engine. `confidence` is
 * the ceiling for the Course Fit shown alongside it; `fit` is populated only
 * when the context is `verified` (a linked host course exists). `detail`
 * explains partial/unavailable states in plain English.
 */
export interface PlayerUpcomingContext {
  status: 'available' | 'unavailable'
  confidence: 'verified' | 'partial' | 'unavailable'
  tournament: PlayerUpcomingTournament | null
  course: { id: string; name: string } | null
  courseIntelligence: CourseIntelSummary | null
  fit: CourseFitResult | null
  detail: string | null
}

/** Optional world-ranking band used by the directory filters. */
export type RankingBand = 'ALL' | 'TOP_10' | 'TOP_25' | 'TOP_50' | 'TOP_100'

/** Directory filter state. `ALL` sentinels keep the controls fully typed. */
export interface PlayerFilters {
  search: string
  tour: Tour | 'ALL'
  nationality: string | 'ALL'
  rankingBand: RankingBand
  handedness: Handedness | 'ALL'
  status: PlayerStatus | 'ALL'
}

/** Directory layout mode. */
export type ViewMode = 'grid' | 'list'

/** A paginated query against the player directory. */
export interface PlayerQuery {
  filters: PlayerFilters
  page: number
  pageSize: number
}

/** Generic paginated result wrapper. */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** A `<Select>` option descriptor. */
export interface FilterOption<T extends string = string> {
  value: T
  label: string
}
