/**
 * Course domain model.
 *
 * The CaddieIQ representation of a golf course, independent of any provider.
 * Field names mirror the persistence model so a repository can map 1:1, but this
 * type imports nothing from Prisma or a provider.
 */

import type { HasExternalReference } from "../shared/types"

/**
 * A golf course in the CaddieIQ domain.
 *
 * Produced by the domain mappers from a provider's raw response. Nullable fields
 * mean "not supplied by the source". Course *characteristics* (grass types,
 * green speed, importance weights) are a richer analytics record populated from
 * other sources and are intentionally not part of this base mapping.
 */
export interface Course extends HasExternalReference {
  name: string
  /** URL-safe slug candidate derived from the name (not guaranteed unique). */
  slug: string
  city: string | null
  stateProvince: string | null
  country: string | null
  par: number | null
  yardage: number | null
  /**
   * Provider-supplied coordinates, in decimal degrees, or `null` when the
   * source does not supply them (the norm today — SportsDataIO's golf feed
   * carries none). When BOTH are present and valid, they are the
   * highest-priority coordinate source and are persisted as `VERIFIED`
   * (`coordinateSource="sportsdataio"`), pre-empting geocoding. Otherwise
   * coordinates are owned by the Course Geolocation Engine and these stay null.
   */
  latitude: number | null
  longitude: number | null
}
