/**
 * Tournament field domain model.
 *
 * A `TournamentFieldEntry` is the CaddieIQ representation of one player's place
 * in a tournament's field — the join between a `Tournament` and a `Player`,
 * independent of any provider. It mirrors the persistence model
 * (`TournamentField`) so a repository can map it 1:1, but imports nothing from
 * Prisma or a provider.
 *
 * The entry deliberately does NOT carry internal ids. Like the other domain
 * models, it emits reconciliation keys only: `playerSlug` (a deterministic slug
 * of the player's name) plus provenance (`externalRef`). Resolving those keys to
 * a real `Player.id` and `Tournament.id` is a persistence concern handled by the
 * field importer, so no player record is ever duplicated — entries link to
 * players that already exist.
 */

import type { HasExternalReference } from "../shared/types"

/**
 * Lifecycle/participation status of a field entry. Values mirror the
 * `TournamentFieldStatus` database enum exactly so the repository maps them
 * without translation.
 */
export type TournamentFieldStatus =
  | "CONFIRMED"
  | "ALTERNATE"
  | "WITHDRAWN"
  | "DISQUALIFIED"
  | "CUT"
  | "FINISHED"

/**
 * One player's entry in a tournament's field.
 *
 * Nullable fields represent "not supplied by the source"; the mapper never
 * invents data. `playerSlug` is the reconciliation key against `Player.slug`.
 */
export interface TournamentFieldEntry extends HasExternalReference {
  /** Display name as reported by the source (for logs/diagnostics). */
  playerName: string
  /** Deterministic slug of the player name — reconciled to `Player.slug`. */
  playerSlug: string
  /** Raw country label/code from the source, when present. */
  countryCode: string | null
  /** Derived participation status (never trusts the obfuscated wire status). */
  status: TournamentFieldStatus
  /** Whether the player withdrew. */
  withdrawn: boolean
  /** Whether the player was disqualified. */
  disqualified: boolean
  /** Whether the entry is a standby/alternate rather than a confirmed starter. */
  isAlternate: boolean
  /** Whether the player made the cut; `null` when not yet meaningful. */
  cutMade: boolean | null
  /** Finishing position (1 = winner); `null` when the event has no result yet. */
  finalPosition: number | null
  /** Prize money earned, when reported. */
  earnings: number | null
  /** First-round tee time, when scheduled. */
  teeTime: Date | null
}
