/**
 * Tournament feature types.
 *
 * The shapes the Tournaments directory renders against. They are
 * provider-agnostic: the server-only `tournamentService` maps live database
 * rows (via `TournamentRepository.search`) into these types. Fields sourced
 * from optional columns/relations are nullable so the UI degrades gracefully
 * (renders an em-dash) rather than fabricating a value.
 */

import type { AnalyticsBand, FieldAnalyticsSummary } from '@/lib/analytics/types'

/** Lifecycle status of a tournament (mirrors the database enum). */
export type TournamentStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'

/** Professional tours an event can belong to (mirrors the database enum). */
export type TourType = 'PGA' | 'DP_WORLD' | 'LIV' | 'KORN_FERRY' | 'LPGA'

/** Resolved owning tour for an event. */
export interface TournamentTour {
  /** Database tour type, or null when the tour is unclassified. */
  type: TourType | null
  /** Display name, e.g. "PGA Tour". */
  name: string
  /** Short code, e.g. "PGA". */
  code: string
}

/** Host-venue location, assembled from the linked course. */
export interface TournamentLocation {
  city: string | null
  stateProvince: string | null
  country: string | null
}

/**
 * The host course as a first-class, navigable entity. Present only when the
 * event is linked to a course; `par`/`yardage` are null when the source omits
 * them. `id` powers the link to the course detail page.
 */
export interface TournamentCourseRef {
  id: string
  name: string
  par: number | null
  yardage: number | null
}

/**
 * A tournament as shown in the directory. Only optional/relation-backed fields
 * are nullable; `name`, `slug`, and `status` are always present.
 */
export interface TournamentSummary {
  id: string
  name: string
  officialName: string | null
  slug: string
  status: TournamentStatus
  /** ISO date string, or null when not supplied by the source. */
  startDate: string | null
  /** ISO date string, or null when not supplied by the source. */
  endDate: string | null
  /** Season year, or null when the event is not linked to a season. */
  season: number | null
  /** Owning tour, or null when unresolved. */
  tour: TournamentTour | null
  /** Host course name, or null when no venue is linked. */
  course: string | null
  /**
   * The linked host course as a navigable entity (id + par/yardage), or null
   * when no venue is linked. `course` (the name) is retained for compact list
   * rendering; `courseRef` powers the detail-page link and course stats.
   */
  courseRef: TournamentCourseRef | null
  /** Host location, or null when no venue is linked. */
  location: TournamentLocation | null
  /** Prize purse in source currency units, or null when unsupplied. */
  purse: number | null
  /** Winner of the prior edition, or null when not derivable. */
  defendingChampion: string | null
  /**
   * Record lifecycle timestamps (ISO strings). Only populated on the detail
   * view; the directory list omits them, so they are optional.
   */
  createdAt?: string | null
  updatedAt?: string | null
}

/** Participation status of a field entry (mirrors the database enum). */
export type FieldEntryStatus =
  | 'CONFIRMED'
  | 'ALTERNATE'
  | 'WITHDRAWN'
  | 'DISQUALIFIED'
  | 'CUT'
  | 'FINISHED'

/**
 * One player in a tournament's field, as shown in the UI. `playerId` links to
 * the player profile. Finishing position is intentionally absent: the provider
 * tier obfuscates it, so the field is presented as a roster with reliable
 * participation status rather than fabricated standings.
 */
export interface FieldEntrant {
  playerId: string
  playerName: string
  /** Raw ISO-ish country code, or null when unknown. */
  countryCode: string | null
  status: FieldEntryStatus
  isAlternate: boolean
  withdrawn: boolean
  cutMade: boolean | null
  /**
   * The player's most recent season World Golf Ranking, or null when none has
   * been imported. Sourced live from season stats — never fabricated — and
   * treated as indicative given the provider tier's known rank obfuscation.
   */
  worldRanking: number | null
  /**
   * The player's overall Ranking Engine score (0–100) for the current season,
   * or null when they have no season data (unrated). This is the same score the
   * Ranking Engine orders global rankings by, so sorting the field by it mirrors
   * the platform ranking rather than being a separate calculation.
   */
  rankingScore: number | null
  /**
   * The player's Recent Form score (0–100), or null when unrated. Lets the
   * field be sorted by who is playing best right now, using the same analytic
   * the Form ranking is built from.
   */
  formScore: number | null
  /**
   * The player's Fantasy Production score (0–100), or null when unrated. Lets
   * the field be sorted by fantasy value, using the same analytic the Fantasy
   * ranking is built from.
   */
  fantasyScore: number | null
}

/**
 * One player's placement in a tournament-hub leader list. `band` is the
 * qualitative tier reused from the Analytics Engine, so leaders read
 * consistently with player pages.
 */
export interface FieldLeader {
  rank: number
  playerId: string
  playerName: string
  score: number
  band: AnalyticsBand
}

/**
 * Field-scoped ranking leaders for the tournament hub, produced by the Ranking
 * Engine over just this field's entrants. Each list is empty when no entrant
 * has season data, so the hub degrades honestly rather than inventing leaders.
 */
export interface FieldRankingLeaders {
  /** The season the rankings were normalized against, or null when none. */
  season: number | null
  /** How many entrants were rankable (the denominator behind the lists). */
  ratedPlayers: number
  /** Highest overall CaddieIQ rating in the field, best-first. */
  topRanked: FieldLeader[]
  /** Best recent form in the field, best-first. */
  topForm: FieldLeader[]
  /** Best fantasy production ("best value") in the field, best-first. */
  topFantasy: FieldLeader[]
}

/**
 * A tournament's field for the detail page: the total size plus the roster.
 * `size` counts every entry (alternates included). When no field has been
 * imported, `size` is 0 and `entrants` is empty so the UI can show an honest
 * "awaiting import" state.
 */
export interface TournamentField {
  size: number
  entrants: FieldEntrant[]
  /**
   * Field-level analytics from the Analytics Engine (average strength, form,
   * and reliability of the assembled field). Consumes the same per-player
   * analytics as every other surface — never a parallel computation. Its
   * `ratedPlayers` is 0 when no entrant has season data, so the UI can stay
   * honest instead of showing invented aggregates.
   */
  analyticsSummary: FieldAnalyticsSummary
  /**
   * Field-scoped ranking leaders (top overall + top form) from the Ranking
   * Engine, shown on the tournament hub. Ordered from the same analytics as
   * every other surface — never a separate calculation.
   */
  rankingLeaders: FieldRankingLeaders
}

/**
 * A news article surfaced on the tournament hub, sourced live from the provider
 * news feed and linked to a player in this event's field. Carries the player
 * attribution (`playerId`/`playerName`) so the hub can label and link each
 * headline. Every field except `title`/`playerName` is nullable and means "not
 * reported by the source" — the UI never fabricates a summary, outlet, or date.
 */
export interface TournamentNewsItem {
  id: string
  title: string
  summary: string | null
  url: string | null
  outlet: string | null
  publishedAt: string | null
  /** The field player this article is about. */
  playerId: string
  playerName: string
}

/** Directory filter state. `ALL` sentinels keep the controls fully typed. */
export interface TournamentFilters {
  search: string
  status: TournamentStatus | 'ALL'
  tour: TourType | 'ALL'
  /** Season year as a string, or `'ALL'` — keeps the `<Select>` value typed. */
  season: string
}

/** A paginated query against the tournament directory. */
export interface TournamentQuery {
  filters: TournamentFilters
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
