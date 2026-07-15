/**
 * Field domain constants.
 *
 * Defaults and fallbacks used by the field mapper so a mapped
 * {@link import("./types").TournamentFieldEntry} always has a well-defined
 * status and a non-empty display name.
 */

import type { TournamentFieldStatus } from "./types"

/**
 * Status for an entry that is neither withdrawn, alternate, nor resolved by a
 * finished event — i.e. a confirmed starter with no terminal outcome yet.
 */
export const DEFAULT_FIELD_STATUS: TournamentFieldStatus = "CONFIRMED"

/** Placeholder when the source supplies no usable player name. */
export const UNKNOWN_FIELD_PLAYER_NAME = "Unknown Player"
