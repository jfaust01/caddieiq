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

/**
 * Raw SportsDataIO leaderboard **player** row.
 *
 * The `/json/Leaderboard/{tournamentid}` resource is the only feed that
 * enumerates a tournament's *field* — every player who teed off (for a
 * completed event) or is entered (for an upcoming one). Each row therefore
 * doubles as a field entry and a per-player result.
 *
 * `PlayerID` is the provider's native player id, but CaddieIQ has no external-id
 * column, so the field importer reconciles a row to an existing `Player` by the
 * deterministic slug of `Name` (see `lib/imports/field-relations.ts`).
 *
 * Note on `TournamentStatus`: in the current SportsDataIO tier this arrives
 * uniformly obfuscated (literally `"Scrambled"`), so it carries no signal. The
 * mapper derives a real status from `IsWithdrawn`/`IsAlternate`/`MadeCut`
 * instead of trusting this field.
 */
export interface SdioLeaderboardPlayer extends SdioRecord {
  PlayerID: number
  /** Display name — the field importer's reconciliation key (via slug). */
  Name?: string
  /** Finishing position / rank (1 = winner). */
  Rank?: number
  Country?: string
  /** Whether the player made the cut (null before/at cut for upcoming events). */
  MadeCut?: boolean
  /** Whether the player won the event. */
  Win?: boolean
  /** Standby/alternate entry rather than a confirmed starter. */
  IsAlternate?: boolean
  /** Player withdrew from the event. */
  IsWithdrawn?: boolean
  /** Prize money earned, when reported. */
  Earnings?: number
  /** First-round tee time (ISO-ish), when scheduled. */
  TeeTime?: string
  /** Obfuscated in the current tier — do not trust; kept for completeness. */
  TournamentStatus?: string
}

/**
 * Raw SportsDataIO leaderboard response: the tournament envelope plus its field.
 * `Tournament.IsOver` tells the mapper whether missed-cut / finished statuses
 * are meaningful yet.
 */
export interface SdioLeaderboard extends SdioRecord {
  Tournament?: SdioTournament
  Players?: SdioLeaderboardPlayer[]
}

/** Map of resource key → raw response element type, for typed requests. */
export interface SdioResourceMap {
  players: SdioPlayer
  tournaments: SdioTournament
  courses: SdioCourse
}

export type SdioResource = keyof SdioResourceMap
