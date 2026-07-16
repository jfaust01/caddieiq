/**
 * Geocoding provider package.
 *
 * Public surface for the Course Geolocation Engine. Consumers depend on the
 * {@link GeocodingProvider} interface and the {@link createGeocodingProvider}
 * factory — never a concrete class — so the vendor can be swapped without
 * touching the engine.
 *
 * Default provider: a two-tier COMPOSITE — OSM Nominatim for course-precise
 * `verified` matches, with OpenWeather city geocoding as a `estimated`
 * (city-level) fallback. Nominatim needs no key; the OpenWeather fallback is
 * enabled only when `OPENWEATHER_API_KEY` is set, and its absence degrades the
 * composite to primary-only rather than failing.
 */

export type { GeocodingProvider } from "./provider"
export type { GeocodeMatch, GeocodeQuery, GeocodeConfidence } from "./types"
export {
  NominatimGeocodingProvider,
  NOMINATIM_PROVIDER_NAME,
  isGolfCourseFeature,
  selectVerifiedGolfMatch,
  buildNominatimQuery,
  buildNominatimQueryVariants,
  normalizeCourseName,
  type NominatimRawResult,
} from "./nominatim"
export {
  OpenWeatherGeocodingProvider,
  OPENWEATHER_GEOCODING_PROVIDER_NAME,
  buildOpenWeatherQuery,
  selectCityMatch,
  loadOpenWeatherGeocodingConfig,
  validateOpenWeatherGeocodingConfig,
  type OpenWeatherGeoResult,
  type OpenWeatherGeocodingConfig,
  type OpenWeatherGeocodingConfigInput,
} from "./openweather"
export { CompositeGeocodingProvider, COMPOSITE_PROVIDER_NAME } from "./composite"
export { toIso2CountryCode, isUsStateCode } from "./country-codes"
export {
  loadNominatimConfig,
  validateNominatimConfig,
  type NominatimConfig,
  type NominatimConfigInput,
} from "./config"

import { CompositeGeocodingProvider } from "./composite"
import { NominatimGeocodingProvider } from "./nominatim"
import { OpenWeatherGeocodingProvider } from "./openweather"
import type { GeocodingProvider } from "./provider"

/**
 * Build the OpenWeather city-level fallback, or `undefined` when it cannot be
 * configured (typically because `OPENWEATHER_API_KEY` is unset). Never throws:
 * a missing key simply means the composite runs primary-only, so a course still
 * gets `verified` coordinates when OSM matches — it just won't get a city-level
 * fallback until the key is provided.
 */
function tryBuildOpenWeatherFallback(): GeocodingProvider | undefined {
  try {
    return OpenWeatherGeocodingProvider.fromEnv()
  } catch {
    return undefined
  }
}

/**
 * Construct the configured geocoding provider. Selection is driven by the
 * `GEOCODING_PROVIDER` env var and defaults to the two-tier composite.
 *
 * Adding a provider is a one-line `case` here plus a new class — no caller
 * changes. Unknown values fall back to the default rather than throwing, so a
 * typo never takes geolocation offline.
 */
export function createGeocodingProvider(): GeocodingProvider {
  const selected = (process.env.GEOCODING_PROVIDER ?? "").trim().toLowerCase()

  switch (selected) {
    // Course-precise only; no city-level fallback.
    case "osm":
    case "nominatim":
    case "osm-nominatim":
      return NominatimGeocodingProvider.fromEnv()
    // City-level only (rarely useful on its own; mainly for testing).
    case "openweather":
    case "openweather-geocoding":
      return OpenWeatherGeocodingProvider.fromEnv()
    // Two-tier composite (default).
    case "":
    case "composite":
    default:
      return new CompositeGeocodingProvider(
        NominatimGeocodingProvider.fromEnv(),
        tryBuildOpenWeatherFallback(),
      )
  }
}
