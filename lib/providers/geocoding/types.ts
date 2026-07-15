/**
 * Provider-agnostic geocoding contracts.
 *
 * These types are the isolation boundary for the Course Geolocation Engine: the
 * service and repository speak only this vocabulary, never a concrete
 * provider's wire shape. A new provider (Google Places, Mapbox, …) is added by
 * implementing {@link GeocodingProvider} and returning {@link GeocodeMatch}
 * values — nothing downstream changes.
 */

/**
 * A provider's own trust assessment of a match.
 *
 * - `verified` — the provider resolved the query to an actual golf-course
 *   feature (not a locality centroid or unrelated POI). Only these are ever
 *   persisted.
 * - `estimated` — a plausible but non-authoritative location (e.g. a town
 *   centroid). Reserved for a future sprint; never persisted automatically.
 *
 * There is no `unknown` member: the absence of a match is expressed as `null`,
 * not a low-confidence object, so callers cannot accidentally trust nothing.
 */
export type GeocodeConfidence = "verified" | "estimated"

/** A course to locate. Locality fields sharpen the match and disambiguate. */
export interface GeocodeQuery {
  /** The course name, e.g. "Pebble Beach Golf Links". Required. */
  courseName: string
  city?: string | null
  stateProvince?: string | null
  country?: string | null
}

/**
 * A located coordinate with provenance. Providers return this only when they
 * have a genuine candidate; `null` means "could not locate", never a fabricated
 * or zeroed coordinate.
 */
export interface GeocodeMatch {
  latitude: number
  longitude: number
  /** The provider's trust assessment (see {@link GeocodeConfidence}). */
  confidence: GeocodeConfidence
  /** Stable provider identity, persisted as `coordinateSource` (e.g. "osm-nominatim"). */
  source: string
  /** Human-readable matched feature, for logs and debugging. */
  displayName: string
  /** The provider-specific feature classification that earned the confidence. */
  matchType: string
}
