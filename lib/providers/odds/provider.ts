/**
 * The Odds API provider.
 *
 * Extends {@link BaseProvider} for automatic logging, timing, and error
 * normalization. The heavy lifting (fetching, normalization, consensus,
 * persistence) lives in the {@link OddsApiClient}, the Odds Intelligence engine,
 * and the Odds import pipeline respectively — mirroring how the Weather engine
 * splits its concerns. What this class provides is a real, cheap `health()`
 * probe (used by the admin data-coverage dashboard) via the free `/sports`
 * endpoint, plus quota reporting.
 *
 * `normalize` / `validate` / `import` are intentionally not routed through this
 * class: the odds pipeline consumes the client directly (see
 * `lib/imports/odds-import.ts`), just as the weather pipeline does.
 */

import { BaseProvider } from "../shared/base-provider"
import { notImplemented, ProviderError } from "../shared/errors"
import type {
  ImportJob,
  ImportResult,
  ProviderConfig,
  ProviderStatus,
  ValidationResult,
} from "../shared/types"
import { OddsApiClient } from "./client"
import { isOddsApiConfigured } from "./config"

const PROVIDER = "odds"

export class OddsProvider extends BaseProvider<unknown, unknown> {
  private client: OddsApiClient | undefined

  constructor(
    config: Omit<ProviderConfig, "name"> = {},
    client?: OddsApiClient,
  ) {
    super({ ...config, name: PROVIDER })
    this.client = client
  }

  async connect(): Promise<void> {
    if (!isOddsApiConfigured()) {
      throw new ProviderError("The Odds API is not configured (THE_ODDS_API_KEY missing).", {
        provider: PROVIDER,
        code: "AUTHENTICATION_ERROR",
      })
    }
    this.client ??= OddsApiClient.fromEnv()
    this.markConnected()
  }

  /**
   * Real health probe. Uses the free `/sports` endpoint (no quota cost) to
   * confirm connectivity and credentials, and reports the observed request
   * quota. Never throws — a failure is reported as a health state instead.
   */
  async health(): Promise<ProviderStatus> {
    const checkedAt = new Date()

    if (!isOddsApiConfigured()) {
      return {
        provider: PROVIDER,
        state: "unavailable",
        connected: false,
        checkedAt,
        message: "THE_ODDS_API_KEY is not set.",
      }
    }

    const start = Date.now()
    try {
      const client = (this.client ??= OddsApiClient.fromEnv())
      const golf = await client.listGolfSports()
      const quota = client.getQuota()
      const remaining = quota.remaining
      const state =
        remaining !== null && remaining <= 0 ? "degraded" : "healthy"
      const golfNote =
        golf.length > 0
          ? `${golf.length} golf market(s) live`
          : "no golf markets live right now"
      return {
        provider: PROVIDER,
        state,
        connected: true,
        checkedAt,
        latencyMs: Date.now() - start,
        message:
          remaining !== null
            ? `${golfNote}; ${remaining} request credit(s) remaining.`
            : `${golfNote}.`,
      }
    } catch (error) {
      return {
        provider: PROVIDER,
        state: "unavailable",
        connected: false,
        checkedAt,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : "Health probe failed.",
      }
    }
  }

  async disconnect(): Promise<void> {
    this.markDisconnected()
  }

  normalize(): unknown {
    throw notImplemented(PROVIDER, "normalize() — use the Odds Intelligence engine")
  }

  validate(): ValidationResult {
    throw notImplemented(PROVIDER, "validate() — use the Odds Intelligence engine")
  }

  protected async execute(_job: ImportJob): Promise<ImportResult<unknown>> {
    throw notImplemented(PROVIDER, "import() — use lib/imports/odds-import.ts")
  }
}
