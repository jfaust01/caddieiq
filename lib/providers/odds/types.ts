/**
 * Raw The Odds API response shapes (v4).
 *
 * These mirror the upstream JSON exactly — no normalization or grading. The
 * Odds Intelligence engine consumes them. Fields the provider may omit are
 * optional so the mapper can treat absence honestly rather than assuming zero.
 *
 * Reference: https://the-odds-api.com/liveapi/guides/v4/
 */

/** An entry from `GET /v4/sports`. Free (does not consume request quota). */
export interface OddsApiSport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

/** A single selection within a market — for golf outrights, a player to win. */
export interface OddsApiOutcome {
  name: string
  /** Odds in the requested format (we always request decimal). */
  price: number
  /** Present on point-based markets (unused for outrights). */
  point?: number
}

/** A market offered by one bookmaker (e.g. `outrights`). */
export interface OddsApiMarket {
  key: string
  /** ISO timestamp of the bookmaker's last update for this market. */
  last_update?: string
  outcomes: OddsApiOutcome[]
}

/** One bookmaker's book for an event. */
export interface OddsApiBookmaker {
  key: string
  title: string
  /** ISO timestamp of the bookmaker's last update. */
  last_update?: string
  markets: OddsApiMarket[]
}

/** A single event from `GET /v4/sports/{sport}/odds`. */
export interface OddsApiEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string | null
  away_team: string | null
  bookmakers: OddsApiBookmaker[]
}

/** Quota accounting parsed from The Odds API response headers. */
export interface OddsApiQuota {
  /** `x-requests-remaining` — credits left in the billing window. */
  remaining: number | null
  /** `x-requests-used` — credits consumed so far. */
  used: number | null
  /** `x-requests-last` — cost of the most recent request. */
  last: number | null
}

/** An odds fetch plus the quota snapshot from its response headers. */
export interface OddsApiFetchResult {
  events: OddsApiEvent[]
  quota: OddsApiQuota
}
