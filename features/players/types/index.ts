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

/** Full profile payload for the detail page. */
export interface PlayerDetail extends Player {
  /** Headline career figures, or null when no historical data is ingested. */
  careerSummary: CareerSummary | null
  rankings: PlayerRanking[]
  statistics: PlayerStatistic[]
  courseHistory: CourseHistoryEntry[]
  tournamentHistory: TournamentHistoryEntry[]
  activity: ActivityEntry[]
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
