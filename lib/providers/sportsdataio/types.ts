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

/**
 * Raw SportsDataIO player season-statistics row from
 * `/json/PlayerSeasonStats/{season}`.
 *
 * IMPORTANT — coverage at the current tier: this feed returns ONLY the fields
 * typed below. The richer PGA metrics one might expect at season level (money,
 * FedEx Cup points, wins, top-10s, cuts made, scoring average, strokes gained,
 * driving accuracy/distance, greens in regulation, scrambling, sand saves) are
 * NOT present in the response, so they are intentionally absent here rather
 * than typed-as-optional-and-always-undefined. The mapper persists only what is
 * present and never fabricates the missing metrics.
 *
 * `PlayerID` is the provider's native player id; CaddieIQ has no external-id
 * column, so the statistics importer reconciles a row to an existing `Player`
 * by the deterministic slug of `Name` (mirroring the field importer).
 *
 * Note on `WorldGolfRank`: the current tier is known to obfuscate its precision
 * (multiple players can share a rank). It is stored verbatim but downstream
 * consumers treat it as indicative, not authoritative.
 */
export interface SdioPlayerSeasonStats extends SdioRecord {
  /** Provider's native id for this player-season row. */
  PlayerSeasonID?: number
  /** Season year (e.g. 2025). */
  Season?: number
  /** Provider's native player id. */
  PlayerID: number
  /** Display name — the statistics importer's reconciliation key (via slug). */
  Name?: string
  /** Official World Golf Ranking position for the season. */
  WorldGolfRank?: number
  /** World ranking as of the previous week (movement context). */
  WorldGolfRankLastWeek?: number
  /** Events played in the season. */
  Events?: number
  /** Average fantasy points per event. */
  AveragePoints?: number
  /** Total fantasy points across the season. */
  TotalPoints?: number
  /** Fantasy points lost. */
  PointsLost?: number
  /** Fantasy points gained. */
  PointsGained?: number
}

/**
 * Raw SportsDataIO news article from `/json/News`.
 *
 * The feed carries only the provider's native numeric `PlayerID` to associate
 * an article with a player — never a name. Since CaddieIQ has no external-id
 * column, the news importer bridges `PlayerID → deterministic slug` using the
 * Players feed, then resolves that slug to a `Player.id`. Articles whose
 * `PlayerID` does not resolve (general / tournament-wide news, or a player not
 * in our catalog) are retained with a null player rather than discarded.
 *
 * Every field is optional except the ids; the mapper persists only what is
 * present and never fabricates missing fields.
 */
export interface SdioNewsArticle extends SdioRecord {
  /** Provider's native news id. Idempotency key for re-imports. */
  NewsID: number
  Title?: string
  /** Article body / summary. */
  Content?: string
  Url?: string
  /** Publishing outlet (e.g. "RotoBaller"). */
  Source?: string
  Author?: string
  /** Comma-separated provider categories. */
  Categories?: string
  /** When the provider last updated the article (ISO-ish). */
  Updated?: string
  /** Native player id this article is about (0 / absent = general news). */
  PlayerID?: number
}

/** Map of resource key → raw response element type, for typed requests. */
export interface SdioResourceMap {
  players: SdioPlayer
  tournaments: SdioTournament
  courses: SdioCourse
}

export type SdioResource = keyof SdioResourceMap
