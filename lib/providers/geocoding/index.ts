/**
 * Geocoding provider package.
 *
 * Public surface for the Course Geolocation Engine. Consumers depend on the
 * {@link GeocodingProvider} interface and the {@link createGeocodingProvider}
 * factory — never a concrete class — so the vendor can be swapped without
 * touching the engine.
 *
 * Default provider: OpenStreetMap Nominatim (zero-config, no API key). To add
 * Google Places / Mapbox, implement {@link GeocodingProvider} and extend the
 * factory's switch on `GEOCODING_PROVIDER`.
 */

export type { GeocodingProvider } from "./provider"
export type { GeocodeMatch, GeocodeQuery, GeocodeConfidence } from "./types"
export {
  NominatimGeocodingProvider,
  NOMINATIM_PROVIDER_NAME,
  selectVerifiedGolfMatch,
  buildNominatimQuery,
  type NominatimRawResult,
} from "./nominatim"
export {
  loadNominatimConfig,
  validateNominatimConfig,
  type NominatimConfig,
  type NominatimConfigInput,
} from "./config"

import { NominatimGeocodingProvider } from "./nominatim"
import type { GeocodingProvider } from "./provider"

/**
 * Construct the configured geocoding provider. Selection is driven by the
 * `GEOCODING_PROVIDER` env var and defaults to Nominatim, which needs no key
 * and therefore works everywhere out of the box.
 *
 * Adding a provider is a one-line `case` here plus a new class — no caller
 * changes. Unknown values fall back to the default rather than throwing, so a
 * typo never takes geolocation offline.
 */
export function createGeocodingProvider(): GeocodingProvider {
  const selected = (process.env.GEOCODING_PROVIDER ?? "").trim().toLowerCase()

  switch (selected) {
    // case "google-places": return GooglePlacesProvider.fromEnv()
    // case "mapbox":        return MapboxGeocodingProvider.fromEnv()
    case "":
    case "osm":
    case "nominatim":
    case "osm-nominatim":
    default:
      return NominatimGeocodingProvider.fromEnv()
  }
}
