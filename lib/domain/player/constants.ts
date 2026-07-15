/**
 * Player domain constants.
 *
 * Defaults and translation tables used when mapping a provider record into a
 * `Player`. Kept separate from the mapper so the mapping rules are declarative
 * and easy to review.
 */

import type { Handedness, PlayerStatus } from "./types"

/**
 * Default handedness when the source does not supply it. SportsDataIO's player
 * feed does not expose handedness, so mapped players start `UNKNOWN`.
 *
 * TODO(enrichment): backfill handedness from a provider that exposes it (e.g.
 * DataGolf) once multi-provider enrichment lands.
 */
export const DEFAULT_HANDEDNESS: Handedness = "UNKNOWN"

/**
 * Default lifecycle status for a freshly mapped player. Sources list players in
 * their active catalog; lifecycle transitions (injured/retired) are derived
 * downstream from participation and status feeds.
 *
 * TODO(enrichment): derive `INJURED`/`RETIRED`/`INACTIVE` from status feeds.
 */
export const DEFAULT_PLAYER_STATUS: PlayerStatus = "ACTIVE"

/** Placeholder used when the source supplies neither a name part nor a full name. */
export const UNKNOWN_PLAYER_NAME = "Unknown Player"
