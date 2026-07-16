/**
 * The Odds API client — the concrete integration behind the Odds Intelligence
 * engine.
 *
 * Responsibilities:
 *   - List golf sports (free `/sports` endpoint — no quota cost).
 *   - Fetch multi-bookmaker odds for a golf sport key, returning the raw events
 *     plus the request-quota snapshot from the response headers.
 *   - Enforce a client-side minimum request interval (a light rate-limit guard),
 *     a per-request timeout, and retry with backoff on transient/429 failures.
 *   - Map every failure onto the shared provider error taxonomy.
 *
 * Non-responsibilities (by design): this client does NOT normalize, grade, or
 * persist anything. It returns the raw, typed The Odds API payload. The Odds
 * Intelligence engine consumes it. The API key travels as the `apiKey` query
 * param and is redacted from every log line.
 *
 * Mirrors {@link OpenWeatherClient} so both real feeds share one HTTP shape.
 */

import { ProviderError, RateLimitError, toProviderError } from "../shared/errors"
import {
  loadOddsApiConfig,
  type OddsApiConfig,
  type OddsApiConfigInput,
} from "./config"
import type {
  OddsApiEvent,
  OddsApiFetchResult,
  OddsApiQuota,
  OddsApiSport,
} from "./types"

export const ODDS_API_CLIENT_VERSION = "1.0.0"

const PROVIDER = "odds"
const MAX_ERROR_BODY = 500

export interface OddsApiClientDeps {
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /** Clock, injectable for deterministic rate-limit tests. */
  now?: () => number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Options for an odds fetch. Defaults target US books + decimal outrights. */
export interface FetchOddsOptions {
  /** Comma-separated regions, e.g. "us" or "us,uk". */
  regions?: string
  /** Comma-separated markets, e.g. "outrights". */
  markets?: string
}

export class OddsApiClient {
  readonly providerName = PROVIDER
  readonly version = ODDS_API_CLIENT_VERSION

  private readonly config: OddsApiConfig
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  /** Timestamp (ms) of the last outbound request, for interval spacing. */
  private lastRequestAt = 0
  /** Latest quota snapshot observed from any billed request. */
  private lastQuota: OddsApiQuota = { remaining: null, used: null, last: null }

  constructor(config: OddsApiConfig, deps: OddsApiClientDeps = {}) {
    this.config = config
    this.fetchImpl = deps.fetch ?? globalThis.fetch
    this.sleep = deps.sleep ?? defaultSleep
    this.now = deps.now ?? Date.now

    if (typeof this.fetchImpl !== "function") {
      throw new ProviderError("No fetch implementation available for The Odds API client.", {
        provider: PROVIDER,
        code: "CONNECTION_ERROR",
      })
    }
  }

  /** Construct a client from environment configuration. */
  static fromEnv(
    overrides: OddsApiConfigInput = {},
    deps: OddsApiClientDeps = {},
  ): OddsApiClient {
    return new OddsApiClient(loadOddsApiConfig(overrides), deps)
  }

  /** The most recent quota snapshot observed (for health reporting). */
  getQuota(): OddsApiQuota {
    return { ...this.lastQuota }
  }

  /**
   * List all sports. Free — the `/sports` endpoint does not consume quota.
   * Callers filter for `group === "Golf"` / `has_outrights`.
   */
  async listSports(): Promise<OddsApiSport[]> {
    const params = new URLSearchParams({ apiKey: this.config.apiKey })
    const { data } = await this.request(`/sports?${params.toString()}`)
    return Array.isArray(data) ? (data as OddsApiSport[]) : []
  }

  /** List only active golf sports that offer outright markets. */
  async listGolfSports(): Promise<OddsApiSport[]> {
    const sports = await this.listSports()
    return sports.filter((s) => s.group === "Golf" && s.active && s.has_outrights)
  }

  /**
   * Fetch multi-bookmaker odds for a golf sport key. Always requests decimal
   * odds (the engine derives American + implied probability). Returns the raw
   * events plus the quota snapshot from the response headers.
   */
  async fetchOdds(
    sportKey: string,
    options: FetchOddsOptions = {},
  ): Promise<OddsApiFetchResult> {
    const key = sportKey.trim()
    if (!key) {
      throw new ProviderError("The Odds API fetch requires a non-empty sport key.", {
        provider: PROVIDER,
        code: "VALIDATION_ERROR",
      })
    }

    const params = new URLSearchParams({
      apiKey: this.config.apiKey,
      regions: options.regions ?? "us",
      markets: options.markets ?? "outrights",
      oddsFormat: "decimal",
      dateFormat: "iso",
    })
    const { data, quota } = await this.request(
      `/sports/${encodeURIComponent(key)}/odds?${params.toString()}`,
    )
    return {
      events: Array.isArray(data) ? (data as OddsApiEvent[]) : [],
      quota,
    }
  }

  // --- Internal ------------------------------------------------------------

  /**
   * Perform a single GET with interval spacing, timeout, retry, and error
   * mapping. The `apiKey` query param is stripped from any logged URL. Returns
   * the parsed body plus a quota snapshot parsed from the response headers.
   */
  private async request(path: string): Promise<{ data: unknown; quota: OddsApiQuota }> {
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

        const quota = this.parseQuota(response.headers)
        if (quota.remaining !== null || quota.used !== null) this.lastQuota = quota

        if (!response.ok) {
          const body = await this.safeBody(response)
          throw this.mapHttpError(response.status, body, response.headers.get("retry-after"))
        }

        const data = await response.json().catch(() => null)
        return { data, quota }
      } catch (rawError) {
        clearTimeout(timer)
        const error =
          rawError instanceof ProviderError ? rawError : this.mapNetworkError(rawError)
        lastError = error

        const canRetry = error.retryable && attempt < maxAttempts
        if (!canRetry) throw error

        const delayMs = this.backoffMs(attempt, error)
        await this.sleep(delayMs)
      }
    }

    throw lastError ?? new ProviderError("The Odds API request failed.", { provider: PROVIDER })
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

  private parseQuota(headers: Headers): OddsApiQuota {
    const num = (name: string): number | null => {
      const raw = headers.get(name)
      if (raw === null) return null
      const value = Number(raw)
      return Number.isFinite(value) ? value : null
    }
    return {
      remaining: num("x-requests-remaining"),
      used: num("x-requests-used"),
      last: num("x-requests-last"),
    }
  }

  private backoffMs(attempt: number, error: ProviderError): number {
    const retryAfter = (error as { retryAfterMs?: number }).retryAfterMs
    if (typeof retryAfter === "number") return retryAfter
    return 300 * 2 ** (attempt - 1)
  }

  private mapHttpError(status: number, body?: string, retryAfter?: string | null): ProviderError {
    if (status === 401 || status === 403) {
      return new ProviderError("The Odds API rejected the API key.", {
        provider: PROVIDER,
        code: "AUTHENTICATION_ERROR",
        details: { status, body },
      })
    }
    if (status === 422) {
      // The Odds API returns 422 for an unknown/expired sport key.
      return new ProviderError("The Odds API rejected the request parameters.", {
        provider: PROVIDER,
        code: "VALIDATION_ERROR",
        details: { status, body },
      })
    }
    if (status === 429) {
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined
      return new RateLimitError("The Odds API rate limit / quota exceeded.", {
        provider: PROVIDER,
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
        details: { status, body },
      })
    }
    const retryable = status >= 500
    return new ProviderError(`The Odds API request failed with status ${status}.`, {
      provider: PROVIDER,
      code: retryable ? "NETWORK_ERROR" : "PROVIDER_ERROR",
      retryable,
      details: { status, body },
    })
  }

  private mapNetworkError(error: unknown): ProviderError {
    if (error instanceof Error && error.name === "AbortError") {
      return new ProviderError("The Odds API request timed out.", {
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
