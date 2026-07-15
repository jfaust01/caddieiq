/**
 * Tournament domain model.
 *
 * The CaddieIQ representation of a professional golf tournament, independent of
 * any provider. Field names and enum values mirror the persistence model so a
 * repository can map 1:1, but this type imports nothing from Prisma or a
 * provider.
 */

import type { HasExternalReference } from "../shared/types"

/** Lifecycle status of a tournament. */
export type TournamentStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"

/** Competition format. */
export type TournamentFormat =
  | "STROKE_PLAY"
  | "MATCH_PLAY"
  | "TEAM"
  | "STABLEFORD"

/**
 * A tournament in the CaddieIQ domain.
 *
 * Produced by the domain mappers from a provider's raw response. Nullable fields
 * mean "not supplied by the source". Venue/course linkage (`TournamentCourse`)
 * and tour/season association are relationship concerns resolved on persist and
 * are therefore not part of this base mapping.
 */
export interface Tournament extends HasExternalReference {
  name: string
  officialName: string | null
  /** URL-safe slug candidate derived from the name (not guaranteed unique). */
  slug: string
  status: TournamentStatus
  format: TournamentFormat
  startDate: Date | null
  endDate: Date | null
  /** Prize purse in the source's currency units, when supplied. */
  purse: number | null
}
