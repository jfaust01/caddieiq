/**
 * OpenWeather client — the concrete integration behind the Weather Intelligence
 * engine.
 *
 * Responsibilities:
 *   - Perform the authenticated 5-day/3-hour forecast request for a coordinate.
 *   - Enforce a client-side minimum request interval (a light rate-limit guard),
 *     a per-request timeout, and retry with backoff on transient/429 failures.
 *   - Map every failure onto the shared provider error taxonomy.
 *
 * Non-responsibilities (by design): this client does NOT normalize, grade, or
 * persist anything. It returns the raw, typed OpenWeather envelope. The Weather
 * Intelligence engine consumes it. The API key travels as the `appid` query
 * param and is redacted from every log line.
 */

import { ProviderError, RateLimitError, toProviderError } from "../shared/errors"
import {
  loadOpenWeatherConfig,
  type OpenWeatherConfig,
  type OpenWeatherConfigInput,
} from "./config"
import type { OwmForecastResponse } from "./types"

export const OPENWEATHER_CLIENT_VERSION = "1.0.0"

const PROVIDER = "weather"
const MAX_ERROR_BODY = 500

export interface OpenWeatherClientDeps {
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /** Clock, injectable for deterministic rate-limit tests. */
  now?: () => number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** A coordinate to fetch a forecast for. */
export interface ForecastQuery {
  latitude: number
  longitude: number
}

export class OpenWeatherClient {
  readonly providerName = PROVIDER
  readonly version = OPENWEATHER_CLIENT_VERSION

  private readonly config: OpenWeatherConfig
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  /** Timestamp (ms) of the last outbound request, for interval spacing. */
  private lastRequestAt = 0

  constructor(config: OpenWeatherConfig, deps: OpenWeatherClientDeps = {}) {
    this.config = config
    this.fetchImpl = deps.fetch ?? globalThis.fetch
    this.sleep = deps.sleep ?? defaultSleep
    this.now = deps.now ?? Date.now

    if (typeof this.fetchImpl !== "function") {
      throw new ProviderError("No fetch implementation available for OpenWeather client.", {
        provider: PROVIDER,
        code: "CONNECTION_ERROR",
      })
    }
  }

  /** Construct a client from environment configuration. */
  static fromEnv(
    overrides: OpenWeatherConfigInput = {},
    deps: OpenWeatherClientDeps = {},
  ): OpenWeatherClient {
    return new OpenWeatherClient(loadOpenWeatherConfig(overrides), deps)
  }

  /**
   * Fetch the 5-day / 3-hour forecast for a coordinate. Returns the raw
   * OpenWeather envelope (metric units). Validates the coordinate before
   * spending a request.
   */
  async fetchForecast(query: ForecastQuery): Promise<OwmForecastResponse> {
    const { latitude, longitude } = query
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new ProviderError(
        `OpenWeather forecast requires a valid coordinate; received (${String(latitude)}, ${String(longitude)}).`,
        { provider: PROVIDER, code: "VALIDATION_ERROR", details: { latitude, longitude } },
      )
    }

    const params = new URLSearchParams({
      lat: latitude.toFixed(4),
      lon: longitude.toFixed(4),
      units: "metric",
      appid: this.config.apiKey,
    })
    const data = await this.request(`/forecast?${params.toString()}`)
    return data as OwmForecastResponse
  }

  // --- Internal ------------------------------------------------------------

  /**
   * Perform a single GET with interval spacing, timeout, retry, and error
   * mapping. The `appid` query param is stripped from any logged URL.
   */
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
        const error =
          rawError instanceof ProviderError
            ? rawError
            : this.mapNetworkError(rawError)
        lastError = error

        const canRetry = error.retryable && attempt < maxAttempts
        if (!canRetry) throw error

        const delayMs = this.backoffMs(attempt, error)
        await this.sleep(delayMs)
      }
    }

    throw lastError ?? new ProviderError("OpenWeather request failed.", { provider: PROVIDER })
  }

  /** Enforce the configured minimum spacing between outbound requests. */
  private async throttle(): Promise<void> {
    const interval = this.config.minRequestIntervalMs
    if (interval <= 0) return
    const elapsed = this.now() - this.lastRequestAt
    if (elapsed < interval) {
      await this.sleep(interval - elapsed)
    }
  }

  private backoffMs(attempt: number, error: ProviderError): number {
    const retryAfter = (error as { retryAfterMs?: number }).retryAfterMs
    if (typeof retryAfter === "number") return retryAfter
    return 300 * 2 ** (attempt - 1)
  }

  private mapHttpError(status: number, body?: string, retryAfter?: string | null): ProviderError {
    if (status === 401 || status === 403) {
      return new ProviderError("OpenWeather rejected the API key.", {
        provider: PROVIDER,
        code: "AUTHENTICATION_ERROR",
        details: { status, body },
      })
    }
    if (status === 429) {
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined
      return new RateLimitError("OpenWeather rate limit exceeded.", {
        provider: PROVIDER,
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
        details: { status, body },
      })
    }
    const retryable = status >= 500
    return new ProviderError(`OpenWeather request failed with status ${status}.`, {
      provider: PROVIDER,
      code: retryable ? "NETWORK_ERROR" : "PROVIDER_ERROR",
      retryable,
      details: { status, body },
    })
  }

  private mapNetworkError(error: unknown): ProviderError {
    if (error instanceof Error && error.name === "AbortError") {
      return new ProviderError("OpenWeather request timed out.", {
        provider: PROVIDER,
        code: "TIMEOUT_ERROR",
        retryable: true,
        cause: error,
      })
    }
    const mapped = toProviderError(error, PROVIDER)
    return new ProviderError(mapped.message, {
      provider: PROVIDER,
      code: "NETWORK_ERROR",
      retryable: true,
      cause: error,
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
