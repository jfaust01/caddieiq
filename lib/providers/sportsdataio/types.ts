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

/** Raw SportsDataIO course (nested under tournaments in the upstream API). */
export interface SdioCourse extends SdioRecord {
  CourseID: number
  Name?: string
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
