/**
 * SportsDataIO error mapping.
 *
 * Translates upstream HTTP responses and low-level fetch failures into the
 * canonical provider error taxonomy defined in `../shared/errors`. Keeping a
 * single taxonomy (rather than re-declaring error classes per provider) is what
 * lets callers, retry logic, and logging treat every provider uniformly.
 *
 * This module intentionally does not re-export the shared error classes; import
 * them from `../shared/errors` (or the package root) when you need to catch
 * them. It only adds SportsDataIO-specific *mapping*.
 */

import {
  AuthenticationError,
  NetworkError,
  ProviderError,
  RateLimitError,
  TimeoutError,
} from "../shared/errors"

const PROVIDER = "sportsdataio"

/** Context describing the failed request (never includes the API key). */
export interface SdioErrorContext {
  /** HTTP method, e.g. "GET". */
  method?: string
  /** Sanitized request path (no query secrets). */
  path?: string
  /** Response body text, truncated by the caller. */
  body?: string
  /** Retry-After header value, when present. */
  retryAfter?: string | null
}

/** Whether an HTTP status is worth retrying (transient server/throttle). */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599)
}

/** Parse a `Retry-After` header (delta-seconds or HTTP date) into ms. */
function parseRetryAfterMs(retryAfter?: string | null): number | undefined {
  if (!retryAfter) return undefined
  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(retryAfter)
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now())
  return undefined
}

/**
 * Map an HTTP error response to a {@link ProviderError} subclass:
 *   - 401 / 403 → {@link AuthenticationError}
 *   - 429       → {@link RateLimitError} (with `retryAfterMs` when supplied)
 *   - 5xx / 408 → retryable {@link ProviderError}
 *   - other 4xx → non-retryable {@link ProviderError}
 */
export function mapSportsDataIoHttpError(
  status: number,
  context: SdioErrorContext = {},
): ProviderError {
  const details = {
    status,
    method: context.method,
    path: context.path,
    body: context.body,
  }

  if (status === 401 || status === 403) {
    return new AuthenticationError(
      `SportsDataIO rejected the request (HTTP ${status}). Check SPORTSDATAIO_API_KEY.`,
      { provider: PROVIDER, details },
    )
  }

  if (status === 429) {
    return new RateLimitError("SportsDataIO rate limit exceeded (HTTP 429).", {
      provider: PROVIDER,
      details,
      retryAfterMs: parseRetryAfterMs(context.retryAfter),
    })
  }

  return new ProviderError(`SportsDataIO request failed (HTTP ${status}).`, {
    provider: PROVIDER,
    retryable: isRetryableStatus(status),
    details,
  })
}

/**
 * Map a thrown fetch/abort error to a {@link ProviderError} subclass. An
 * `AbortError` (our timeout signal) becomes a {@link TimeoutError}; anything
 * else that reaches here is treated as a {@link NetworkError}.
 */
export function mapSportsDataIoNetworkError(
  error: unknown,
  context: SdioErrorContext & { timeoutMs?: number } = {},
): ProviderError {
  if (error instanceof ProviderError) return error

  const details = { method: context.method, path: context.path }

  const name = error instanceof Error ? error.name : ""
  if (name === "AbortError" || name === "TimeoutError") {
    return new TimeoutError("SportsDataIO request timed out.", {
      provider: PROVIDER,
      timeoutMs: context.timeoutMs,
      cause: error,
      details,
    })
  }

  return new NetworkError("SportsDataIO request could not reach the upstream API.", {
    provider: PROVIDER,
    cause: error,
    details,
  })
}
