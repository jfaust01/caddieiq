/**
 * Player domain model.
 *
 * The CaddieIQ representation of a golfer, independent of any provider. Field
 * names and enum values intentionally mirror the persistence model so a future
 * repository can map this object to storage 1:1, but this type imports nothing
 * from Prisma or a provider — it is the shape the rest of the application works
 * with.
 */

import type { HasExternalReference } from "../shared/types"

/** Which hand a player swings with. Mirrors the domain vocabulary. */
export type Handedness = "RIGHT" | "LEFT" | "UNKNOWN"

/** Lifecycle status of a player. */
export type PlayerStatus = "ACTIVE" | "INACTIVE" | "INJURED" | "RETIRED"

/**
 * A golfer in the CaddieIQ domain.
 *
 * Produced by the domain mappers from a provider's raw response. Nullable
 * fields represent "not supplied by the source"; the mapper never invents data.
 * Relationship resolution (nationality, tour history) and identity assignment
 * (the internal `id`, unique `slug`) are persistence concerns and are therefore
 * absent here — the mapper emits a `slug` *candidate* and provenance only.
 */
export interface Player extends HasExternalReference {
  firstName: string
  lastName: string
  /** Display name; derived from name parts when the source omits a full name. */
  fullName: string
  /** URL-safe slug candidate derived from the full name (not guaranteed unique). */
  slug: string
  birthDate: Date | null
  heightCm: number | null
  weightKg: number | null
  turnedProYear: number | null
  handedness: Handedness
  status: PlayerStatus
  headshotUrl: string | null
  /** Raw country label/code from the source; ISO normalization happens later. */
  countryCode: string | null
}
