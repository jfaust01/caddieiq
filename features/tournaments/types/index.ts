/**
 * Tournament feature types.
 *
 * The shapes the Tournaments directory renders against. They are
 * provider-agnostic: the server-only `tournamentService` maps live database
 * rows (via `TournamentRepository.search`) into these types. Fields sourced
 * from optional columns/relations are nullable so the UI degrades gracefully
 * (renders an em-dash) rather than fabricating a value.
 */

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
  /** Host location, or null when no venue is linked. */
  location: TournamentLocation | null
  /** Prize purse in source currency units, or null when unsupplied. */
  purse: number | null
  /** Winner of the prior edition, or null when not derivable. */
  defendingChampion: string | null
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
