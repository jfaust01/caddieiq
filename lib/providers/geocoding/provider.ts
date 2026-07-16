/**
 * The swappable geocoding provider contract.
 *
 * The Course Geolocation Engine depends on this interface, not on any concrete
 * provider. This is the single seam that keeps the platform from being coupled
 * to OpenStreetMap, Google Places, Mapbox, or any other vendor: to switch or
 * add a provider, implement this interface and wire it into the factory.
 */

import type { GeocodeMatch, GeocodeQuery } from "./types"

export interface GeocodingProvider {
  /** Stable identity for logs and the persisted `coordinateSource`. */
  readonly name: string

  /**
   * Resolve a course to a coordinate.
   *
   * Contract:
   *  - Returns a {@link GeocodeMatch} ONLY when the provider genuinely locates
   *    the venue. Whether that match is trustworthy enough to persist is
   *    conveyed by `match.confidence` — the service decides what to do with it.
   *  - Returns `null` when nothing suitable is found. "Not found" is a normal
   *    outcome, never an error.
   *  - Throws only for infrastructure failures (network, timeout, rate limit,
   *    auth), always as a `ProviderError` from the shared taxonomy — so the
   *    service can degrade gracefully and never surfaces a raw vendor error.
   */
  geocodeCourse(query: GeocodeQuery): Promise<GeocodeMatch | null>
}
