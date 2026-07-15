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
  /**
   * Top-level feature category in `jsonv2` responses, e.g. "leisure", "place".
   * (In the legacy `json` format this same value is returned as `class`; we read
   * both so the verification rule is format-agnostic.)
   */
  category?: string
  /** Legacy alias for {@link NominatimRawResult.category} (format=json). */
  class?: string
  /** Feature type within the category, e.g. "golf_course", "city", "restaurant". */
  type?: string
  /** `addresstype` echoes the category for the primary feature (e.g. "leisure"). */
  addresstype?: string
  display_name?: string
  importance?: number
}

/**
 * The OSM feature types that constitute a genuine golf course. `golf_course` is
 * the canonical `leisure=golf_course` tag; `golf` appears on some older/edge
 * features.
 */
const GOLF_FEATURE_TYPES = new Set(["golf_course", "golf"])

/**
 * True only when a raw result IS an actual mapped golf-course feature
 * (`leisure=golf_course`). Reads the category from `category` (jsonv2),
 * `class` (legacy json), or `addresstype`, so the rule is response-format
 * agnostic. A clubhouse POI tagged `restaurant`, a locality centroid, or any
 * non-golf feature returns `false` — those are never auto-verified.
 */
export function isGolfCourseFeature(r: NominatimRawResult): boolean {
  const category = r.category ?? r.class ?? r.addresstype
  return category === "leisure" && typeof r.type === "string" && GOLF_FEATURE_TYPES.has(r.type)
}

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
    if (!isGolfCourseFeature(r)) continue

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

    const category = r.category ?? r.class ?? r.addresstype ?? "leisure"
    return {
      latitude,
      longitude,
      confidence: "verified",
      source,
      displayName: r.display_name ?? "",
      matchType: `${category}:${r.type}`,
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

/** Common golf-course name abbreviations → their full OSM-friendly form. */
const NAME_EXPANSIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bG&CC\b/gi, "Golf and Country Club"],
  [/\bG&\s?C\b/gi, "Golf and Country Club"],
  [/\bGC&C\b/gi, "Golf and Country Club"],
  [/\bCC\b/gi, "Country Club"],
  [/\bG\.?C\.?\b/gi, "Golf Course"],
  [/\bGL\b/gi, "Golf Links"],
  [/\bTPC\b/gi, "TPC"],
]

/**
 * Normalize a course name into a more geocoder-friendly form WITHOUT changing
 * which real place it refers to:
 *  - drop a trailing parenthetical sub-course qualifier, e.g. "Torrey Pines
 *    (North)" → "Torrey Pines" (OSM maps the venue, rarely each nine), and
 *  - expand common abbreviations ("GC" → "Golf Course", "CC" → "Country Club").
 *
 * Pure and side-effect free. This only affects the SEARCH string; the verified
 * match gate ({@link isGolfCourseFeature}) is unchanged, so normalization can
 * never turn a non-golf location into a false "verified".
 */
export function normalizeCourseName(name: string): string {
  let out = name.replace(/\s*\([^)]*\)\s*$/, "").trim()
  for (const [pattern, replacement] of NAME_EXPANSIONS) {
    out = out.replace(pattern, replacement)
  }
  return out.replace(/\s{2,}/g, " ").trim()
}

/**
 * Ordered, de-duplicated list of query strings to try for a course, most
 * specific first: the raw name as given, then the normalized name. Trying the
 * raw form first preserves any already-correct exact match; the normalized form
 * recovers abbreviated/sub-course names that OSM stores under their full name.
 */
export function buildNominatimQueryVariants(query: GeocodeQuery): string[] {
  const variants: string[] = []
  const seen = new Set<string>()
  const push = (courseName: string) => {
    const q = buildNominatimQuery({ ...query, courseName })
    const key = q.toLowerCase()
    if (q !== "" && !seen.has(key)) {
      seen.add(key)
      variants.push(q)
    }
  }
  push(query.courseName)
  push(normalizeCourseName(query.courseName))
  return variants
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
    const variants = buildNominatimQueryVariants(query)
    if (variants.length === 0) {
      throw new ProviderError("Nominatim geocode requires at least a course name.", {
        provider: NOMINATIM_PROVIDER_NAME,
        code: "VALIDATION_ERROR",
      })
    }

    // Try the raw name first, then the normalized fallback. Return the first
    // VERIFIED golf-course match; only fall through to the next variant on a
    // clean "no golf feature" result (network/rate-limit errors still throw).
    for (const q of variants) {
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        addressdetails: "0",
        // Return OSM tags so we can positively identify golf-course features.
        extratags: "1",
        limit: "5",
      })
      const results = (await this.request(`/search?${params.toString()}`)) as
        | NominatimRawResult[]
        | null

      if (!Array.isArray(results)) continue
      const match = selectVerifiedGolfMatch(results, this.name)
      if (match) return match
    }

    return null
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
