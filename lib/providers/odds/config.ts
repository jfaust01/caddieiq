/**
 * The Odds API configuration.
 *
 * Resolves and validates the settings the client needs to make authenticated
 * requests to https://the-odds-api.com. The only required secret is
 * `THE_ODDS_API_KEY`; everything else has a sensible default. Validation is a
 * pure function (`validateOddsApiConfig`) so it can be unit-tested without
 * touching the environment, plus an env-backed loader (`loadOddsApiConfig`) for
 * runtime.
 *
 * Mirrors the OpenWeather config so both real feeds share one shape.
 */

import { AuthenticationError, ProviderError } from "../shared/errors"

const PROVIDER = "odds"

/** Default The Odds API REST base URL (v4). */
export const ODDS_API_DEFAULT_BASE_URL = "https://api.the-odds-api.com/v4"

/** Default per-request timeout budget. */
export const ODDS_API_DEFAULT_TIMEOUT_MS = 10_000

/** Default retry attempts for transient failures. */
export const ODDS_API_DEFAULT_MAX_RETRIES = 2

/**
 * Minimum spacing between outbound calls (ms). The Odds API bills per market
 * per region, so a batch import must not burst; the importer also refreshes
 * intelligently on top of this guard.
 */
export const ODDS_API_DEFAULT_MIN_REQUEST_INTERVAL_MS = 300

/** Fully-resolved, validated The Odds API configuration. */
export interface OddsApiConfig {
  /** API key sent as the `apiKey` query param. Never logged. */
  apiKey: string
  /** REST base URL (no trailing slash). */
  baseUrl: string
  /** Per-request timeout in milliseconds. */
  timeoutMs: number
  /** Number of retry attempts for retryable failures. */
  maxRetries: number
  /** Minimum spacing between outbound requests, in milliseconds. */
  minRequestIntervalMs: number
}

/** Partial config accepted by the validator/loader; missing fields default. */
export interface OddsApiConfigInput {
  apiKey?: string | null
  baseUrl?: string | null
  timeoutMs?: number | null
  maxRetries?: number | null
  minRequestIntervalMs?: number | null
}

/**
 * Validate and normalize raw configuration input into a complete
 * {@link OddsApiConfig}. Pure: performs no I/O and reads no environment, so it
 * is fully unit-testable. Throws with an actionable message when invalid.
 */
export function validateOddsApiConfig(input: OddsApiConfigInput): OddsApiConfig {
  const apiKey = input.apiKey?.trim()

  if (!apiKey) {
    throw new AuthenticationError(
      "The Odds API is not configured: set the THE_ODDS_API_KEY environment variable.",
      { provider: PROVIDER, details: { missing: "THE_ODDS_API_KEY" } },
    )
  }

  const baseUrl = (input.baseUrl?.trim() || ODDS_API_DEFAULT_BASE_URL).replace(/\/+$/, "")

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new ProviderError(
      `The Odds API baseUrl must be an absolute http(s) URL; received "${baseUrl}".`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { baseUrl } },
    )
  }

  const timeoutMs = input.timeoutMs ?? ODDS_API_DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ProviderError(
      `The Odds API timeoutMs must be a positive number; received ${String(timeoutMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { timeoutMs } },
    )
  }

  const maxRetries = input.maxRetries ?? ODDS_API_DEFAULT_MAX_RETRIES
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new ProviderError(
      `The Odds API maxRetries must be a non-negative integer; received ${String(maxRetries)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { maxRetries } },
    )
  }

  const minRequestIntervalMs =
    input.minRequestIntervalMs ?? ODDS_API_DEFAULT_MIN_REQUEST_INTERVAL_MS
  if (!Number.isFinite(minRequestIntervalMs) || minRequestIntervalMs < 0) {
    throw new ProviderError(
      `The Odds API minRequestIntervalMs must be a non-negative number; received ${String(minRequestIntervalMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { minRequestIntervalMs } },
    )
  }

  return { apiKey, baseUrl, timeoutMs, maxRetries, minRequestIntervalMs }
}

/**
 * Load configuration from the environment and validate it. Throws
 * {@link AuthenticationError} if the API key is absent so misconfiguration
 * fails loudly and early.
 */
export function loadOddsApiConfig(overrides: OddsApiConfigInput = {}): OddsApiConfig {
  return validateOddsApiConfig({
    apiKey: overrides.apiKey ?? process.env.THE_ODDS_API_KEY ?? null,
    baseUrl: overrides.baseUrl ?? process.env.THE_ODDS_API_BASE_URL ?? null,
    timeoutMs: overrides.timeoutMs ?? null,
    maxRetries: overrides.maxRetries ?? null,
    minRequestIntervalMs: overrides.minRequestIntervalMs ?? null,
  })
}

/** Whether a The Odds API key is present in the environment. */
export function isOddsApiConfigured(): boolean {
  return Boolean(process.env.THE_ODDS_API_KEY?.trim())
}
