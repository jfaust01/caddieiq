/**
 * Two-tier composite geocoding provider.
 *
 * Composes a course-precise PRIMARY geocoder (OSM Nominatim, which returns
 * `verified` golf-course matches) with a city-level FALLBACK geocoder
 * (OpenWeather, which returns `estimated` locality centroids). The result is
 * the platform's honest coverage/precision trade-off:
 *
 *   1. Ask the primary. A `verified` course match always wins.
 *   2. Only if the primary finds nothing, ask the fallback for a city centroid.
 *   3. If neither locates the course, return `null` (a clean "not found").
 *
 * Resilience: a primary *infrastructure* failure (network, rate limit) does not
 * abort the attempt — the fallback is still tried so weather stays unblocked.
 * But a primary failure is never silently downgraded to "not found": if the
 * fallback also yields nothing, the original primary error is surfaced so the
 * course is reported as failed (and retried later), not as genuinely unmatched.
 */

import { ProviderError } from "../shared/errors"
import type { GeocodingProvider } from "./provider"
import type { GeocodeMatch, GeocodeQuery } from "./types"

export const COMPOSITE_PROVIDER_NAME = "composite-geocoding"

export class CompositeGeocodingProvider implements GeocodingProvider {
  readonly name = COMPOSITE_PROVIDER_NAME

  constructor(
    private readonly primary: GeocodingProvider,
    /** Optional city-level fallback; when absent, behaves as primary-only. */
    private readonly fallback?: GeocodingProvider,
  ) {}

  async geocodeCourse(query: GeocodeQuery): Promise<GeocodeMatch | null> {
    let primaryError: ProviderError | undefined

    try {
      const primaryMatch = await this.primary.geocodeCourse(query)
      if (primaryMatch) return primaryMatch
    } catch (error) {
      // Remember it, but still try the fallback (best-effort coverage).
      primaryError = error instanceof ProviderError ? error : toWrapped(error, this.primary.name)
    }

    if (!this.fallback) {
      if (primaryError) throw primaryError
      return null
    }

    const fallbackMatch = await this.fallback.geocodeCourse(query)
    if (fallbackMatch) return fallbackMatch

    // Fallback cleanly found nothing. If the primary had errored, we never truly
    // ruled out a verified match — surface that error instead of a false
    // "not found" so the course is retried rather than left silently unmatched.
    if (primaryError) throw primaryError
    return null
  }
}

/** Wrap a non-ProviderError thrown by a provider into the shared taxonomy. */
function toWrapped(error: unknown, provider: string): ProviderError {
  return new ProviderError(error instanceof Error ? error.message : String(error), {
    provider,
    code: "PROVIDER_ERROR",
    cause: error instanceof Error ? error : undefined,
  })
}
