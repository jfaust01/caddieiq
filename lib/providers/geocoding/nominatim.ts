/**
 * OpenStreetMap Nominatim geocoding provider.
 *
 * The concrete, zero-config implementation of {@link GeocodingProvider}. It
 * honors Nominatim's usage policy (request spacing + identifying User-Agent),
 * maps failures onto the shared provider error taxonomy, and — critically —
 * only reports a `verified` match when the search resolves to an actual mapped
 * golf-course feature (`class=leisure`, `type=golf_course`/`golf`). A locality
 * centroid or unrelated POI yields `null`, never a fabricated coordinate.
 *
 * The match-selection rule is extracted as a pure function
 * ({@link selectVerifiedGolfMatch}) so the honesty guarantee is unit-testable
 * without any network.
 */

import { ProviderError, RateLimitError, toProviderError } from "../shared/errors"
import {
  loadNominatimConfig,
  type NominatimConfig,
  type NominatimConfigInput,
} from "./config"
import type { GeocodingProvider } from "./provider"
import type { GeocodeMatch, GeocodeQuery } from "./types"

export const NOMINATIM_PROVIDER_NAME = "osm-nominatim"

const MAX_ERROR_BODY = 500

/** A single raw Nominatim search result (jsonv2). Only fields we read are typed. */
export interface NominatimRawResult {
  lat?: string
  lon?: string
  /** Top-level feature category, e.g. "leisure", "place", "boundary". */
  class?: string
  /** Feature type within the class, e.g. "golf_course", "city". */
  type?: string
  display_name?: string
  importance?: number
}

/**
 * The OSM feature types that constitute a genuine golf course. `golf_course` is
 * the canonical `leisure` tag; `golf` appears on some older/edge features.
 */
const GOLF_FEATURE_TYPES = new Set(["golf_course", "golf"])

/**
 * Pure verification rule: pick the first result that is an actual golf-course
 * feature and carries a finite coordinate. Returns a `verified` {@link
 * GeocodeMatch} or `null`. No estimated fallback — honesty over coverage.
 *
 * Exported for unit testing; the client calls it after fetching.
 */
export function selectVerifiedGolfMatch(
  results: readonly NominatimRawResult[],
  source: string,
): GeocodeMatch | null {
  for (const r of results) {
    if (r.class !== "leisure" || !r.type || !GOLF_FEATURE_TYPES.has(r.type)) continue

    const latitude = Number(r.lat)
    const longitude = Number(r.lon)
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      continue
    }

    return {
      latitude,
      longitude,
      confidence: "verified",
      source,
      displayName: r.display_name ?? "",
      matchType: `${r.class}:${r.type}`,
    }
  }

  return null
}

/** Build the free-text query string from the structured course query. */
export function buildNominatimQuery(query: GeocodeQuery): string {
  return [query.courseName, query.city, query.stateProvince, query.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ")
}

export interface NominatimProviderDeps {
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class NominatimGeocodingProvider implements GeocodingProvider {
  readonly name = NOMINATIM_PROVIDER_NAME

  private readonly config: NominatimConfig
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  private lastRequestAt = 0

  constructor(config: NominatimConfig, deps: NominatimProviderDeps = {}) {
    this.config = config
    this.fetchImpl = deps.fetch ?? globalThis.fetch
    this.sleep = deps.sleep ?? defaultSleep
    this.now = deps.now ?? Date.now

    if (typeof this.fetchImpl !== "function") {
      throw new ProviderError("No fetch implementation available for Nominatim provider.", {
        provider: NOMINATIM_PROVIDER_NAME,
        code: "CONNECTION_ERROR",
      })
    }
  }

  /** Construct from environment configuration. */
  static fromEnv(
    overrides: NominatimConfigInput = {},
    deps: NominatimProviderDeps = {},
  ): NominatimGeocodingProvider {
    return new NominatimGeocodingProvider(loadNominatimConfig(overrides), deps)
  }

  async geocodeCourse(query: GeocodeQuery): Promise<GeocodeMatch | null> {
    const q = buildNominatimQuery(query)
    if (q === "") {
      throw new ProviderError("Nominatim geocode requires at least a course name.", {
        provider: NOMINATIM_PROVIDER_NAME,
        code: "VALIDATION_ERROR",
      })
    }

    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      addressdetails: "0",
      limit: "5",
    })
    const results = (await this.request(`/search?${params.toString()}`)) as
      | NominatimRawResult[]
      | null

    if (!Array.isArray(results)) return null
    return selectVerifiedGolfMatch(results, this.name)
  }

  // --- Internal ------------------------------------------------------------

  private async request(path: string): Promise<unknown> {
    await this.throttle()

    const url = `${this.config.baseUrl}${path}`
    const maxAttempts = this.config.maxRetries + 1
    let lastError: ProviderError | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)
      this.lastRequestAt = this.now()

      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            // Nominatim's usage policy requires an identifying User-Agent.
            "User-Agent": this.config.userAgent,
          },
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!response.ok) {
          const body = await this.safeBody(response)
          throw this.mapHttpError(response.status, body, response.headers.get("retry-after"))
        }

        return await response.json().catch(() => null)
      } catch (rawError) {
        clearTimeout(timer)
        const error =
          rawError instanceof ProviderError ? rawError : this.mapNetworkError(rawError)
        lastError = error

        const canRetry = error.retryable && attempt < maxAttempts
        if (!canRetry) throw error

        await this.sleep(this.backoffMs(attempt, error))
      }
    }

    throw lastError ?? new ProviderError("Nominatim request failed.", {
      provider: NOMINATIM_PROVIDER_NAME,
    })
  }

  private async throttle(): Promise<void> {
    const interval = this.config.minRequestIntervalMs
    if (interval <= 0) return
    const elapsed = this.now() - this.lastRequestAt
    if (elapsed < interval) await this.sleep(interval - elapsed)
  }

  private backoffMs(attempt: number, error: ProviderError): number {
    const retryAfter = (error as { retryAfterMs?: number }).retryAfterMs
    if (typeof retryAfter === "number") return retryAfter
    return 500 * 2 ** (attempt - 1)
  }

  private mapHttpError(status: number, body?: string, retryAfter?: string | null): ProviderError {
    if (status === 429) {
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined
      return new RateLimitError("Nominatim rate limit exceeded.", {
        provider: NOMINATIM_PROVIDER_NAME,
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
        details: { status, body },
      })
    }
    const retryable = status >= 500
    return new ProviderError(`Nominatim request failed with status ${status}.`, {
      provider: NOMINATIM_PROVIDER_NAME,
      code: retryable ? "NETWORK_ERROR" : "PROVIDER_ERROR",
      retryable,
      details: { status, body },
    })
  }

  private mapNetworkError(error: unknown): ProviderError {
    if (error instanceof Error && error.name === "AbortError") {
      return new ProviderError("Nominatim request timed out.", {
        provider: NOMINATIM_PROVIDER_NAME,
        code: "TIMEOUT_ERROR",
        retryable: true,
        cause: error,
      })
    }
    const mapped = toProviderError(error, NOMINATIM_PROVIDER_NAME)
    return new ProviderError(mapped.message, {
      provider: NOMINATIM_PROVIDER_NAME,
      code: "NETWORK_ERROR",
      retryable: true,
      cause: error,
    })
  }

  private async safeBody(response: Response): Promise<string | undefined> {
    try {
      return (await response.text()).slice(0, MAX_ERROR_BODY)
    } catch {
      return undefined
    }
  }
}
