/**
 * OpenStreetMap Nominatim configuration.
 *
 * Nominatim needs no API key, so this provider works zero-config in every
 * environment. Its public usage policy is strict, though: at most ~1 request
 * per second and a genuine, identifying `User-Agent`. Those obligations are
 * encoded here as defaults. Validation is a pure function so it is unit-testable
 * without the environment; a loader reads env overrides at runtime.
 */

import { ProviderError } from "../shared/errors"

const PROVIDER = "osm-nominatim"

/** Public Nominatim endpoint. Self-hosting swaps this via `NOMINATIM_BASE_URL`. */
export const NOMINATIM_DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org"

/** Per-request timeout budget. */
export const NOMINATIM_DEFAULT_TIMEOUT_MS = 10_000

/** Retry attempts for transient failures. */
export const NOMINATIM_DEFAULT_MAX_RETRIES = 2

/**
 * Minimum spacing between outbound calls (ms). Nominatim's usage policy caps
 * absolute throughput at 1 req/s; 1100ms keeps a safety margin so a batch
 * enrichment run stays a good citizen of the public service.
 */
export const NOMINATIM_DEFAULT_MIN_REQUEST_INTERVAL_MS = 1_100

/**
 * Identifying User-Agent. Nominatim rejects requests without a real one. The
 * default names the app; operators SHOULD set `NOMINATIM_USER_AGENT` to include
 * a contact address per the usage policy.
 */
export const NOMINATIM_DEFAULT_USER_AGENT = "CaddieIQ/1.0 (Course Geolocation Engine)"

/** Fully-resolved, validated Nominatim configuration. */
export interface NominatimConfig {
  baseUrl: string
  timeoutMs: number
  maxRetries: number
  minRequestIntervalMs: number
  userAgent: string
}

/** Partial config accepted by the validator/loader; missing fields default. */
export interface NominatimConfigInput {
  baseUrl?: string | null
  timeoutMs?: number | null
  maxRetries?: number | null
  minRequestIntervalMs?: number | null
  userAgent?: string | null
}

/**
 * Validate and normalize raw input into a complete {@link NominatimConfig}.
 * Pure: no I/O, no environment reads. Throws with an actionable message when
 * invalid.
 */
export function validateNominatimConfig(input: NominatimConfigInput): NominatimConfig {
  const baseUrl = (input.baseUrl?.trim() || NOMINATIM_DEFAULT_BASE_URL).replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new ProviderError(
      `Nominatim baseUrl must be an absolute http(s) URL; received "${baseUrl}".`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { baseUrl } },
    )
  }

  const timeoutMs = input.timeoutMs ?? NOMINATIM_DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ProviderError(
      `Nominatim timeoutMs must be a positive number; received ${String(timeoutMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { timeoutMs } },
    )
  }

  const maxRetries = input.maxRetries ?? NOMINATIM_DEFAULT_MAX_RETRIES
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new ProviderError(
      `Nominatim maxRetries must be a non-negative integer; received ${String(maxRetries)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { maxRetries } },
    )
  }

  const minRequestIntervalMs =
    input.minRequestIntervalMs ?? NOMINATIM_DEFAULT_MIN_REQUEST_INTERVAL_MS
  if (!Number.isFinite(minRequestIntervalMs) || minRequestIntervalMs < 0) {
    throw new ProviderError(
      `Nominatim minRequestIntervalMs must be a non-negative number; received ${String(minRequestIntervalMs)}.`,
      { provider: PROVIDER, code: "VALIDATION_ERROR", details: { minRequestIntervalMs } },
    )
  }

  const userAgent = input.userAgent?.trim() || NOMINATIM_DEFAULT_USER_AGENT

  return { baseUrl, timeoutMs, maxRetries, minRequestIntervalMs, userAgent }
}

/** Load configuration from the environment and validate it. */
export function loadNominatimConfig(overrides: NominatimConfigInput = {}): NominatimConfig {
  return validateNominatimConfig({
    baseUrl: overrides.baseUrl ?? process.env.NOMINATIM_BASE_URL ?? null,
    timeoutMs: overrides.timeoutMs ?? null,
    maxRetries: overrides.maxRetries ?? null,
    minRequestIntervalMs: overrides.minRequestIntervalMs ?? null,
    userAgent: overrides.userAgent ?? process.env.NOMINATIM_USER_AGENT ?? null,
  })
}
