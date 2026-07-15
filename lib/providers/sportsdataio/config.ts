/**
 * SportsDataIO configuration.
 *
 * Resolves and validates the settings the client needs to make authenticated
 * requests. The only required secret is `SPORTSDATAIO_API_KEY`; everything else
 * has a sensible default. Validation is split into a pure function
 * (`validateSportsDataIoConfig`) so it can be unit-tested without reading the
 * environment, and an env-backed loader (`loadSportsDataIoConfig`) used at
 * runtime.
 */

import { AuthenticationError, ProviderError } from "../shared/errors"

const PROVIDER = "sportsdataio"

/** Default SportsDataIO REST base URL (golf v2). */
export const SPORTSDATAIO_DEFAULT_BASE_URL = "https://api.sportsdata.io/golf/v2"

/** Default per-request timeout budget. */
export const SPORTSDATAIO_DEFAULT_TIMEOUT_MS = 10_000

/** Default retry attempts for transient failures. */
export const SPORTSDATAIO_DEFAULT_MAX_RETRIES = 2

/** Fully-resolved, validated SportsDataIO configuration. */
export interface SportsDataIoConfig {
  /** API key sent with every request. Never logged. */
  apiKey: string
  /** REST base URL (no trailing slash). */
  baseUrl: string
  /** Per-request timeout in milliseconds. */
  timeoutMs: number
  /** Number of retry attempts for retryable failures. */
  maxRetries: number
}

/** Partial config accepted by the validator/loader; missing fields default. */
export interface SportsDataIoConfigInput {
  apiKey?: string | null
  baseUrl?: string | null
  timeoutMs?: number | null
  maxRetries?: number | null
}

/**
 * Validate and normalize raw configuration input into a complete
 * {@link SportsDataIoConfig}. Pure: performs no I/O and reads no environment,
 * so it is fully unit-testable. Throws with an actionable message when the
 * input is invalid.
 */
export function validateSportsDataIoConfig(
  input: SportsDataIoConfigInput,
): SportsDataIoConfig {
  const apiKey = input.apiKey?.trim()

  if (!apiKey) {
    throw new AuthenticationError(
      "SportsDataIO is not configured: set the SPORTSDATAIO_API_KEY environment variable.",
      { provider: PROVIDER, details: { missing: "SPORTSDATAIO_API_KEY" } },
    )
  }

  const baseUrl = (input.baseUrl?.trim() || SPORTSDATAIO_DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  )

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new ProviderError(
      `SportsDataIO baseUrl must be an absolute http(s) URL; received "${baseUrl}".`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { baseUrl } },
    )
  }

  const timeoutMs = input.timeoutMs ?? SPORTSDATAIO_DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ProviderError(
      `SportsDataIO timeoutMs must be a positive number; received ${String(timeoutMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { timeoutMs } },
    )
  }

  const maxRetries = input.maxRetries ?? SPORTSDATAIO_DEFAULT_MAX_RETRIES
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new ProviderError(
      `SportsDataIO maxRetries must be a non-negative integer; received ${String(maxRetries)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { maxRetries } },
    )
  }

  return { apiKey, baseUrl, timeoutMs, maxRetries }
}

/**
 * Load configuration from the environment and validate it. Called at startup /
 * when constructing the default client. Throws {@link AuthenticationError} if
 * the API key is absent so misconfiguration fails loudly and early.
 */
export function loadSportsDataIoConfig(
  overrides: SportsDataIoConfigInput = {},
): SportsDataIoConfig {
  return validateSportsDataIoConfig({
    apiKey: overrides.apiKey ?? process.env.SPORTSDATAIO_API_KEY ?? null,
    baseUrl: overrides.baseUrl ?? process.env.SPORTSDATAIO_BASE_URL ?? null,
    timeoutMs: overrides.timeoutMs ?? null,
    maxRetries: overrides.maxRetries ?? null,
  })
}
