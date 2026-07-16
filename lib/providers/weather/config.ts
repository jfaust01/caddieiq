/**
 * OpenWeather configuration.
 *
 * Resolves and validates the settings the client needs to make authenticated
 * requests. The only required secret is `OPENWEATHER_API_KEY`; everything else
 * has a sensible default. Validation is a pure function
 * (`validateOpenWeatherConfig`) so it can be unit-tested without touching the
 * environment, plus an env-backed loader (`loadOpenWeatherConfig`) for runtime.
 */

import { AuthenticationError, ProviderError } from "../shared/errors"

const PROVIDER = "weather"

/** Default OpenWeather REST base URL (2.5 data API). */
export const OPENWEATHER_DEFAULT_BASE_URL = "https://api.openweathermap.org/data/2.5"

/** Default per-request timeout budget. */
export const OPENWEATHER_DEFAULT_TIMEOUT_MS = 10_000

/** Default retry attempts for transient failures. */
export const OPENWEATHER_DEFAULT_MAX_RETRIES = 2

/**
 * Minimum spacing between outbound calls (ms). A light client-side guard so a
 * batch import cannot burst past OpenWeather's free-tier limits; the importer
 * also dedupes and refreshes intelligently on top of this.
 */
export const OPENWEATHER_DEFAULT_MIN_REQUEST_INTERVAL_MS = 250

/** Fully-resolved, validated OpenWeather configuration. */
export interface OpenWeatherConfig {
  /** API key sent as the `appid` query param. Never logged. */
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
export interface OpenWeatherConfigInput {
  apiKey?: string | null
  baseUrl?: string | null
  timeoutMs?: number | null
  maxRetries?: number | null
  minRequestIntervalMs?: number | null
}

/**
 * Validate and normalize raw configuration input into a complete
 * {@link OpenWeatherConfig}. Pure: performs no I/O and reads no environment, so
 * it is fully unit-testable. Throws with an actionable message when invalid.
 */
export function validateOpenWeatherConfig(input: OpenWeatherConfigInput): OpenWeatherConfig {
  const apiKey = input.apiKey?.trim()

  if (!apiKey) {
    throw new AuthenticationError(
      "OpenWeather is not configured: set the OPENWEATHER_API_KEY environment variable.",
      { provider: PROVIDER, details: { missing: "OPENWEATHER_API_KEY" } },
    )
  }

  const baseUrl = (input.baseUrl?.trim() || OPENWEATHER_DEFAULT_BASE_URL).replace(/\/+$/, "")

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new ProviderError(
      `OpenWeather baseUrl must be an absolute http(s) URL; received "${baseUrl}".`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { baseUrl } },
    )
  }

  const timeoutMs = input.timeoutMs ?? OPENWEATHER_DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ProviderError(
      `OpenWeather timeoutMs must be a positive number; received ${String(timeoutMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { timeoutMs } },
    )
  }

  const maxRetries = input.maxRetries ?? OPENWEATHER_DEFAULT_MAX_RETRIES
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new ProviderError(
      `OpenWeather maxRetries must be a non-negative integer; received ${String(maxRetries)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { maxRetries } },
    )
  }

  const minRequestIntervalMs =
    input.minRequestIntervalMs ?? OPENWEATHER_DEFAULT_MIN_REQUEST_INTERVAL_MS
  if (!Number.isFinite(minRequestIntervalMs) || minRequestIntervalMs < 0) {
    throw new ProviderError(
      `OpenWeather minRequestIntervalMs must be a non-negative number; received ${String(minRequestIntervalMs)}.`,
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
export function loadOpenWeatherConfig(overrides: OpenWeatherConfigInput = {}): OpenWeatherConfig {
  return validateOpenWeatherConfig({
    apiKey: overrides.apiKey ?? process.env.OPENWEATHER_API_KEY ?? null,
    baseUrl: overrides.baseUrl ?? process.env.OPENWEATHER_BASE_URL ?? null,
    timeoutMs: overrides.timeoutMs ?? null,
    maxRetries: overrides.maxRetries ?? null,
    minRequestIntervalMs: overrides.minRequestIntervalMs ?? null,
  })
}

/** Whether an OpenWeather API key is present in the environment. */
export function isOpenWeatherConfigured(): boolean {
  return Boolean(process.env.OPENWEATHER_API_KEY?.trim())
}
