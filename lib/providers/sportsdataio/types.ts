/**
 * SportsDataIO wire types.
 *
 * These describe the **raw** shapes SportsDataIO returns over the wire, using
 * the provider's own field names (PascalCase). They are intentionally partial
 * and permissive — we only type the fields CaddieIQ cares about and keep an
 * index signature so unexpected fields never break a fetch. Mapping these into
 * CaddieIQ domain models is the job of the normalization layer, not this
 * module.
 *
 * @see https://sportsdata.io/developers/api-documentation/golf
 */

/** Fields common to most SportsDataIO records. */
export interface SdioRecord {
  [key: string]: unknown
}

/** Raw SportsDataIO player. */
export interface SdioPlayer extends SdioRecord {
  PlayerID: number
  FirstName?: string
  LastName?: string
  Country?: string
  DraftKingsName?: string
  BirthCity?: string
  BirthState?: string
  PhotoUrl?: string
}

/** Raw SportsDataIO tournament. */
export interface SdioTournament extends SdioRecord {
  TournamentID: number
  Name?: string
  StartDate?: string
  EndDate?: string
  IsOver?: boolean
  Venue?: string
  Location?: string
  Par?: number
  Yards?: number
  Purse?: number
}

/**
 * Raw SportsDataIO course.
 *
 * SportsDataIO's golf feed has no standalone course catalog: the `/json/Courses`
 * resource returns the same venue-bearing tournament rows as `/json/Tournaments`
 * (verified: identical `TournamentID` set, one row per event). The *course* is
 * therefore the `Venue` field, with `Location`/`City`/`State`/`Country`/`Par`/
 * `Yards` describing it. There is no upstream `CourseID`, so course identity is
 * reconciled downstream from the venue name (via the deterministic slug).
 *
 * `Name` and `StartDate` are the *tournament's* name and date; they are not used
 * by the course mapper but are retained because they are the only keys available
 * to resolve the tournament ↔ course relationship (see
 * `lib/imports/course-relations.ts`).
 */
export interface SdioCourse extends SdioRecord {
  /** Upstream tournament id (the feed is tournament-shaped). */
  TournamentID: number
  /** Tournament name — used only for relationship resolution, not the course. */
  Name?: string
  /** Tournament start date (ISO-ish) — used to key the tournament↔course year. */
  StartDate?: string
  /** The course/venue name — the course's identity in this feed. */
  Venue?: string
  /** Free-text locality, e.g. "Pebble Beach, CA". Fallback for City/State. */
  Location?: string
  City?: string
  State?: string
  Country?: string
  Par?: number
  Yards?: number
}

/** Map of resource key → raw response element type, for typed requests. */
export interface SdioResourceMap {
  players: SdioPlayer
  tournaments: SdioTournament
  courses: SdioCourse
}

export type SdioResource = keyof SdioResourceMap
