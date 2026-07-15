/**
 * Tournament domain constants.
 *
 * Defaults and translation tables used when mapping a provider record into a
 * `Tournament`.
 */

import type { TournamentFormat, TournamentStatus } from "./types"

/** Placeholder used when the source supplies no tournament name. */
export const UNKNOWN_TOURNAMENT_NAME = "Unknown Tournament"

/**
 * Default format. SportsDataIO's tournament feed does not describe the
 * competition format, and the overwhelming majority of events are stroke play.
 *
 * TODO(enrichment): detect `MATCH_PLAY`/`TEAM`/`STABLEFORD` events (e.g. Ryder
 * Cup, WGC Match Play) from a richer source or a curated override table.
 */
export const DEFAULT_TOURNAMENT_FORMAT: TournamentFormat = "STROKE_PLAY"

/**
 * Deterministic status derivation from the provider's `IsOver` flag.
 *
 * The mapper stays pure (no dependence on the current time), so a not-yet-over
 * event maps to `SCHEDULED` rather than `ACTIVE`.
 *
 * TODO(enrichment): promote in-window events to `ACTIVE`, and detect `CANCELED`
 * events, in a time-aware layer that consumes this domain object.
 */
export const TOURNAMENT_STATUS_BY_IS_OVER: Record<
  "true" | "false",
  TournamentStatus
> = {
  true: "COMPLETED",
  false: "SCHEDULED",
}
