/**
 * SportsDataIO client — the first concrete implementation of the
 * {@link GolfDataProvider} capability contract.
 *
 * Responsibilities:
 *   - Perform authenticated HTTP requests using the configured API key
 *     (sent as the `Ocp-Apim-Subscription-Key` header, so it never appears in a
 *     URL or a log line).
 *   - Apply a per-request timeout and retry transient failures with backoff.
 *   - Emit structured request/retry/success/failure logs.
 *   - Map every failure onto the shared provider error taxonomy.
 *
 * Non-responsibilities (by design): this client does **not** normalize, import,
 * or persist anything. It returns raw, typed provider responses. The
 * normalization layer consumes these — see the TODO markers on each method.
 */

import type {
  GolfDataProvider,
  HealthCheck,
  ProviderListResponse,
  ProviderQuery,
  ProviderResponse,
  ProviderResponseMeta,
  ProviderStatus,
} from "../provider"
import { ProviderError } from "../shared/errors"
import {
  loadSportsDataIoConfig,
  type SportsDataIoConfig,
  type SportsDataIoConfigInput,
} from "./config"
import {
  mapSportsDataIoHttpError,
  mapSportsDataIoNetworkError,
} from "./errors"
import { createSportsDataIoLogger, type SportsDataIoLogger } from "./logger"
import type { SdioCourse, SdioPlayer, SdioResource, SdioTournament } from "./types"

/** Client implementation version, surfaced in health checks. */
export const SPORTSDATAIO_CLIENT_VERSION = "1.0.0"

const PROVIDER = "sportsdataio"

/** Upstream paths per logical resource (relative to the configured baseUrl). */
const RESOURCE_PATHS: Record<SdioResource, string> = {
  players: "/json/Players",
  tournaments: "/json/Tournaments",
  courses: "/json/Courses",
}

/** Injectable dependencies, primarily to keep the client unit-testable. */
export interface SportsDataProviderDeps {
  /** Fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch
  /** Sink for structured logs (defaults to the console sink). */
  logger?: SportsDataIoLogger
  /** Sleep function used between retries (defaults to real `setTimeout`). */
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Max characters of an error body we retain for diagnostics. */
const MAX_ERROR_BODY = 500

export class SportsDataProvider
  implements GolfDataProvider<SdioPlayer, SdioTournament, SdioCourse>
{
  readonly providerName = PROVIDER
  readonly version = SPORTSDATAIO_CLIENT_VERSION

  private readonly config: SportsDataIoConfig
  private readonly fetchImpl: typeof fetch
  private readonly logger: SportsDataIoLogger
  private readonly sleep: (ms: number) => Promise<void>

  constructor(config: SportsDataIoConfig, deps: SportsDataProviderDeps = {}) {
    this.config = config
    this.fetchImpl = deps.fetch ?? globalThis.fetch
    this.logger = deps.logger ?? createSportsDataIoLogger()
    this.sleep = deps.sleep ?? defaultSleep

    if (typeof this.fetchImpl !== "function") {
      throw new ProviderError("No fetch implementation available for SportsDataIO client.", {
        provider: PROVIDER,
        code: "CONNECTION_ERROR",
      })
    }
  }

  /**
   * Construct a client from environment configuration. Validates
   * `SPORTSDATAIO_API_KEY` at call time and throws a clear error if it is
   * missing or invalid.
   */
  static fromEnv(
    overrides: SportsDataIoConfigInput = {},
    deps: SportsDataProviderDeps = {},
  ): SportsDataProvider {
    return new SportsDataProvider(loadSportsDataIoConfig(overrides), deps)
  }

  // --- Capability: health --------------------------------------------------

  async health(): Promise<HealthCheck> {
    const startedAt = Date.now()
    const checkedAt = new Date()

    try {
      // A minimal authenticated read acts as the probe.
      await this.rawRequest(RESOURCE_PATHS.players, "players", { probe: true })
      const latency = Date.now() - startedAt
      return this.buildHealth({
        connected: true,
        authenticated: true,
        latency,
        status: "operational",
        checkedAt,
        message: "SportsDataIO reachable and authenticated.",
      })
    } catch (error) {
      const latency = Date.now() - startedAt
      return this.mapHealthFailure(error, latency, checkedAt)
    }
  }

  // --- Capability: players -------------------------------------------------

  async listPlayers(query?: ProviderQuery): Promise<ProviderListResponse<SdioPlayer>> {
    const { data, meta } = await this.getList<SdioPlayer>(
      RESOURCE_PATHS.players,
      "players",
      query,
    )
    // TODO(normalization): SdioPlayer[] → CaddieIQ Player records.
    return { data, meta }
  }

  async getPlayer(playerId: string): Promise<ProviderResponse<SdioPlayer>> {
    const { data, meta } = await this.getOne<SdioPlayer>(
      `/json/Player/${encodeURIComponent(playerId)}`,
      "players",
    )
    // TODO(normalization): SdioPlayer → CaddieIQ Player record.
    return { data, meta }
  }

  // --- Capability: tournaments ---------------------------------------------

  async listTournaments(
    query?: ProviderQuery,
  ): Promise<ProviderListResponse<SdioTournament>> {
    const { data, meta } = await this.getList<SdioTournament>(
      RESOURCE_PATHS.tournaments,
      "tournaments",
      query,
    )
    // TODO(normalization): SdioTournament[] → CaddieIQ Tournament records.
    return { data, meta }
  }

  async getTournament(tournamentId: string): Promise<ProviderResponse<SdioTournament>> {
    const { data, meta } = await this.getOne<SdioTournament>(
      `/json/Tournament/${encodeURIComponent(tournamentId)}`,
      "tournaments",
    )
    // TODO(normalization): SdioTournament → CaddieIQ Tournament record.
    return { data, meta }
  }

  // --- Capability: courses -------------------------------------------------

  async listCourses(query?: ProviderQuery): Promise<ProviderListResponse<SdioCourse>> {
    const { data, meta } = await this.getList<SdioCourse>(
      RESOURCE_PATHS.courses,
      "courses",
      query,
    )
    // TODO(normalization): SdioCourse[] → CaddieIQ Course records.
    return { data, meta }
  }

  // --- Internal helpers ----------------------------------------------------

  private async getList<T>(
    path: string,
    resource: string,
    query?: ProviderQuery,
  ): Promise<{ data: T[]; meta: ProviderResponseMeta }> {
    const { data, requestId } = await this.rawRequest(this.withQuery(path, query), resource)
    const rows = Array.isArray(data) ? (data as T[]) : []
    return { data: rows, meta: this.meta(resource, requestId) }
  }

  private async getOne<T>(
    path: string,
    resource: string,
  ): Promise<{ data: T; meta: ProviderResponseMeta }> {
    const { data, requestId } = await this.rawRequest(path, resource)
    return { data: data as T, meta: this.meta(resource, requestId) }
  }

  /** Append provider-native query params (season/limit/cursor) to a path. */
  private withQuery(path: string, query?: ProviderQuery): string {
    if (!query) return path
    const params = new URLSearchParams()
    if (query.season !== undefined) params.set("season", String(query.season))
    if (query.limit !== undefined) params.set("limit", String(query.limit))
    if (query.cursor) params.set("cursor", query.cursor)
    const qs = params.toString()
    return qs ? `${path}?${qs}` : path
  }

  private meta(resource: string, requestId?: string): ProviderResponseMeta {
    return { provider: PROVIDER, resource, fetchedAt: new Date(), requestId }
  }

  /**
   * Perform a single logical request with timeout, retry, structured logging,
   * and error mapping. Returns the parsed JSON payload and any upstream request
   * id. The API key travels in a header and never appears in a URL or a log.
   */
  private async rawRequest(
    path: string,
    resource: string,
    opts: { probe?: boolean } = {},
  ): Promise<{ data: unknown; status: number; requestId?: string }> {
    const url = `${this.config.baseUrl}${path}`
    const maxAttempts = this.config.maxRetries + 1
    const startedAt = Date.now()
    let lastError: ProviderError | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

      this.logger.request({ method: "GET", url, resource, attempt, maxAttempts })

      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: {
            "Ocp-Apim-Subscription-Key": this.config.apiKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!response.ok) {
          const body = await this.safeBody(response)
          throw mapSportsDataIoHttpError(response.status, {
            method: "GET",
            path,
            body,
            retryAfter: response.headers.get("retry-after"),
          })
        }

        const data = await response.json().catch(() => null)
        this.logger.success({
          method: "GET",
          url,
          resource,
          status: response.status,
          durationMs: Date.now() - startedAt,
        })
        return {
          data,
          status: response.status,
          requestId: response.headers.get("x-request-id") ?? undefined,
        }
      } catch (rawError) {
        clearTimeout(timer)
        const error =
          rawError instanceof ProviderError
            ? rawError
            : mapSportsDataIoNetworkError(rawError, {
                method: "GET",
                path,
                timeoutMs: this.config.timeoutMs,
              })
        lastError = error

        const canRetry = error.retryable && attempt < maxAttempts
        if (!canRetry) {
          this.logger.failure({
            method: "GET",
            url,
            resource,
            attempt,
            durationMs: Date.now() - startedAt,
            error,
          })
          throw error
        }

        const delayMs = this.backoffMs(attempt, error)
        this.logger.retry({
          method: "GET",
          url,
          resource,
          attempt,
          maxAttempts,
          delayMs,
          reason: error.code,
        })
        await this.sleep(delayMs)
      }
    }

    // Unreachable in practice; the loop either returns or throws.
    throw lastError ?? new ProviderError("SportsDataIO request failed.", { provider: PROVIDER })
  }

  /** Exponential backoff, honoring a rate-limit `retryAfterMs` when present. */
  private backoffMs(attempt: number, error: ProviderError): number {
    const retryAfter = (error as { retryAfterMs?: number }).retryAfterMs
    if (typeof retryAfter === "number") return retryAfter
    return 300 * 2 ** (attempt - 1)
  }

  private async safeBody(response: Response): Promise<string | undefined> {
    try {
      const text = await response.text()
      return text.slice(0, MAX_ERROR_BODY)
    } catch {
      return undefined
    }
  }

  private buildHealth(input: Omit<HealthCheck, "providerName" | "version">): HealthCheck {
    return {
      providerName: this.providerName,
      version: this.version,
      ...input,
    }
  }

  private mapHealthFailure(error: unknown, latency: number, checkedAt: Date): HealthCheck {
    const code = error instanceof ProviderError ? error.code : "PROVIDER_ERROR"

    let connected = true
    let authenticated = true
    let status: ProviderStatus = "degraded"

    if (code === "AUTHENTICATION_ERROR") {
      authenticated = false
      status = "unauthenticated"
    } else if (code === "NETWORK_ERROR" || code === "TIMEOUT_ERROR" || code === "CONNECTION_ERROR") {
      connected = false
      authenticated = false
      status = "unavailable"
    }

    return this.buildHealth({
      connected,
      authenticated,
      latency,
      status,
      checkedAt,
      message: error instanceof Error ? error.message : "SportsDataIO health check failed.",
    })
  }
}
