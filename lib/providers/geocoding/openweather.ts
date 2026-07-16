/**
 * OpenWeather Geocoding provider — the city-level fallback.
 *
 * OpenWeather's `/geo/1.0/direct` endpoint is a *place* geocoder: it resolves
 * city / locality names to their centroid. It has NO golf-course POIs, so it
 * can never return a course-precise coordinate — querying a course name simply
 * 404s. This provider therefore deliberately geocodes by the course's
 * **locality** (city + US state + country) and reports the result as
 * `estimated`, which the Course Geolocation service persists as the
 * `APPROXIMATE` confidence tier.
 *
 * Why keep it: a city centroid is accurate enough for a *regional* weather
 * forecast (OpenWeather's own forecast resolution is city-scale), so this
 * fallback unblocks Weather Intelligence for the many courses OSM cannot match,
 * while the honesty gate keeps such coordinates out of maps and clearly labeled.
 *
 * Honest by construction:
 *   - Never returns a coordinate without a real city to anchor it (no country
 *     centroids, no zeros).
 *   - Never claims `verified`; a locality centroid is always `estimated`.
 *   - Country codes are normalized to ISO-2 first; an unknown country is simply
 *     omitted from the query rather than guessed.
 */

import { ProviderError, RateLimitError } from "../shared/errors"
import { isUsStateCode, toIso2CountryCode } from "./country-codes"
import type { GeocodingProvider } from "./provider"
import type { GeocodeMatch, GeocodeQuery } from "./types"

export const OPENWEATHER_GEOCODING_PROVIDER_NAME = "openweather-geocoding"

const DEFAULT_BASE_URL = "https://api.openweathermap.org/geo/1.0"
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_RETRIES = 2
const MAX_ERROR_BODY = 500

/** A single raw OpenWeather geocoding result. Only fields we read are typed. */
export interface OpenWeatherGeoResult {
  name?: string
  lat?: number
  lon?: number
  country?: string
  state?: string
}

/** Fully-resolved OpenWeather geocoding configuration. */
export interface OpenWeatherGeocodingConfig {
  apiKey: string
  baseUrl: string
  timeoutMs: number
  maxRetries: number
}

export interface OpenWeatherGeocodingConfigInput {
  apiKey?: string | null
  baseUrl?: string | null
  timeoutMs?: number | null
  maxRetries?: number | null
}

/**
 * Validate + normalize config. Pure (no env reads). Throws an actionable
 * ProviderError when the required API key is missing.
 */
export function validateOpenWeatherGeocodingConfig(
  input: OpenWeatherGeocodingConfigInput,
): OpenWeatherGeocodingConfig {
  const apiKey = input.apiKey?.trim()
  if (!apiKey) {
    throw new ProviderError(
      "OpenWeather geocoding requires OPENWEATHER_API_KEY to be set.",
      { provider: OPENWEATHER_GEOCODING_PROVIDER_NAME, code: "AUTHENTICATION_ERROR" },
    )
  }
  const baseUrl = (input.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "")
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = input.maxRetries ?? DEFAULT_MAX_RETRIES
  return { apiKey, baseUrl, timeoutMs, maxRetries }
}

/** Load config from the environment and validate it. */
export function loadOpenWeatherGeocodingConfig(
  overrides: OpenWeatherGeocodingConfigInput = {},
): OpenWeatherGeocodingConfig {
  return validateOpenWeatherGeocodingConfig({
    apiKey: overrides.apiKey ?? process.env.OPENWEATHER_API_KEY ?? null,
    baseUrl: overrides.baseUrl ?? process.env.OPENWEATHER_GEOCODING_BASE_URL ?? null,
    timeoutMs: overrides.timeoutMs ?? null,
    maxRetries: overrides.maxRetries ?? null,
  })
}

/**
 * Build the `q` parameter for a locality lookup: `city[,state][,ISO2]`.
 *
 * Returns `null` when there is no city to anchor on — we never geocode a course
 * to a country centroid. The `state` component is only appended for US
 * locations (the only place OpenWeather honors it) and only when it is a valid
 * US postal code. An unknown country is omitted rather than guessed.
 */
export function buildOpenWeatherQuery(query: GeocodeQuery): string | null {
  const city = query.city?.trim()
  if (!city) return null

  const iso2 = toIso2CountryCode(query.country)
  const parts: string[] = [city]

  if (iso2 === "US" && isUsStateCode(query.stateProvince)) {
    parts.push(query.stateProvince!.trim().toUpperCase())
  }
  if (iso2) parts.push(iso2)

  return parts.join(",")
}

/**
 * Pure selection rule: take the first result with a finite, in-range
 * coordinate and report it as an `estimated` city-level match. Exported for
 * unit testing.
 */
export function selectCityMatch(
  results: readonly OpenWeatherGeoResult[],
  source: string,
): GeocodeMatch | null {
  for (const r of results) {
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
    const place = [r.name, r.state, r.country].filter(Boolean).join(", ")
    return {
      latitude,
      longitude,
      confidence: "estimated",
      source,
      displayName: place,
      matchType: "city",
    }
  }
  return null
}

export interface OpenWeatherGeocodingDeps {
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class OpenWeatherGeocodingProvider implements GeocodingProvider {
  readonly name = OPENWEATHER_GEOCODING_PROVIDER_NAME

  private readonly config: OpenWeatherGeocodingConfig
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>

  constructor(config: OpenWeatherGeocodingConfig, deps: OpenWeatherGeocodingDeps = {}) {
    this.config = config
    this.fetchImpl = deps.fetch ?? globalThis.fetch
    this.sleep = deps.sleep ?? defaultSleep

    if (typeof this.fetchImpl !== "function") {
      throw new ProviderError("No fetch implementation available for OpenWeather geocoding.", {
        provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
        code: "CONNECTION_ERROR",
      })
    }
  }

  static fromEnv(
    overrides: OpenWeatherGeocodingConfigInput = {},
    deps: OpenWeatherGeocodingDeps = {},
  ): OpenWeatherGeocodingProvider {
    return new OpenWeatherGeocodingProvider(loadOpenWeatherGeocodingConfig(overrides), deps)
  }

  async geocodeCourse(query: GeocodeQuery): Promise<GeocodeMatch | null> {
    const q = buildOpenWeatherQuery(query)
    // No city to anchor on: this provider cannot honestly place the course.
    if (!q) return null

    const params = new URLSearchParams({ q, limit: "5", appid: this.config.apiKey })
    const results = (await this.request(`/direct?${params.toString()}`)) as
      | OpenWeatherGeoResult[]
      | null

    if (!Array.isArray(results)) return null
    return selectCityMatch(results, this.name)
  }

  // --- Internal ------------------------------------------------------------

  private async request(path: string): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`
    const maxAttempts = this.config.maxRetries + 1
    let lastError: ProviderError | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)
      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: { Accept: "application/json" },
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
        const error = rawError instanceof ProviderError ? rawError : this.mapNetworkError(rawError)
        lastError = error
        const canRetry = error.retryable && attempt < maxAttempts
        if (!canRetry) throw error
        await this.sleep(500 * 2 ** (attempt - 1))
      }
    }

    throw lastError ?? new ProviderError("OpenWeather geocoding request failed.", {
      provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
    })
  }

  private mapHttpError(status: number, body?: string, retryAfter?: string | null): ProviderError {
    if (status === 429) {
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined
      return new RateLimitError("OpenWeather geocoding rate limit exceeded.", {
        provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
        details: { status, body },
      })
    }
    if (status === 401) {
      return new ProviderError("OpenWeather geocoding rejected the API key (401).", {
        provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
        code: "AUTHENTICATION_ERROR",
        retryable: false,
        details: { status, body },
      })
    }
    const retryable = status >= 500
    return new ProviderError(`OpenWeather geocoding failed with status ${status}.`, {
      provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
      code: retryable ? "NETWORK_ERROR" : "PROVIDER_ERROR",
      retryable,
      details: { status, body },
    })
  }

  private mapNetworkError(error: unknown): ProviderError {
    if (error instanceof Error && error.name === "AbortError") {
      return new ProviderError("OpenWeather geocoding request timed out.", {
        provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
        code: "TIMEOUT_ERROR",
        retryable: true,
        cause: error,
      })
    }
    return new ProviderError("OpenWeather geocoding network error.", {
      provider: OPENWEATHER_GEOCODING_PROVIDER_NAME,
      code: "NETWORK_ERROR",
      retryable: true,
      cause: error instanceof Error ? error : undefined,
    })
  }

  private async safeBody(response: Response): Promise<string | undefined> {
    try {
      const text = await response.text()
      return text.slice(0, MAX_ERROR_BODY)
    } catch {
      return undefined
    }
  }
}
