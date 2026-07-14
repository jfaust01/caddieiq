/**
 * Standardized error classes shared by every data provider.
 *
 * All provider failures should surface as a `ProviderError` (or a subclass) so
 * that callers, retry logic, and logging can treat them uniformly. Never leak a
 * raw fetch/SDK error out of a provider — wrap it with `toProviderError`.
 */

export type ProviderErrorCode =
  | "PROVIDER_ERROR"
  | "AUTHENTICATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "VALIDATION_ERROR"
  | "CONNECTION_ERROR"
  | "NOT_IMPLEMENTED"

export interface ProviderErrorOptions {
  /** The provider that produced the error (e.g. "datagolf"). */
  provider?: string
  /** Machine-readable error code. Defaults to `"PROVIDER_ERROR"`. */
  code?: ProviderErrorCode
  /** Whether the operation is safe to retry (e.g. rate limits, timeouts). */
  retryable?: boolean
  /** The underlying error, if any. */
  cause?: unknown
  /** Arbitrary structured context for debugging/logging. */
  details?: Record<string, unknown>
}

/**
 * Base error for anything that goes wrong inside a provider.
 */
export class ProviderError extends Error {
  readonly code: ProviderErrorCode
  readonly provider?: string
  readonly retryable: boolean
  readonly details?: Record<string, unknown>
  /** Redeclared so the field is available on older TS lib targets. */
  override readonly cause?: unknown

  constructor(message: string, options: ProviderErrorOptions = {}) {
    super(message)
    this.name = "ProviderError"
    this.code = options.code ?? "PROVIDER_ERROR"
    this.provider = options.provider
    this.retryable = options.retryable ?? false
    this.details = options.details
    this.cause = options.cause
    // Restore the prototype chain when transpiling to ES5-era targets.
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Serializable view of the error, safe for structured logging. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      provider: this.provider,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    }
  }
}

/**
 * The provider rejected our credentials (missing/invalid API key, expired
 * token, etc.). Not retryable without operator intervention.
 */
export class AuthenticationError extends ProviderError {
  constructor(message = "Authentication failed", options: ProviderErrorOptions = {}) {
    super(message, { retryable: false, ...options, code: "AUTHENTICATION_ERROR" })
    this.name = "AuthenticationError"
  }
}

/**
 * The provider throttled the request. Retryable; `retryAfterMs` hints how long
 * to wait before trying again when the provider supplies that information.
 */
export class RateLimitError extends ProviderError {
  readonly retryAfterMs?: number

  constructor(
    message = "Rate limit exceeded",
    options: ProviderErrorOptions & { retryAfterMs?: number } = {},
  ) {
    const { retryAfterMs, ...rest } = options
    super(message, { retryable: true, ...rest, code: "RATE_LIMIT_ERROR" })
    this.name = "RateLimitError"
    this.retryAfterMs = retryAfterMs
  }
}

/**
 * Incoming or normalized data did not satisfy the expected shape/constraints.
 */
export class ValidationError extends ProviderError {
  readonly issues: ValidationIssue[]

  constructor(
    message = "Validation failed",
    options: ProviderErrorOptions & { issues?: ValidationIssue[] } = {},
  ) {
    const { issues, ...rest } = options
    super(message, { retryable: false, ...rest, code: "VALIDATION_ERROR" })
    this.name = "ValidationError"
    this.issues = issues ?? []
  }
}

/** A single problem discovered during validation. */
export interface ValidationIssue {
  /** Dot-path to the offending field, when known (e.g. "player.countryCode"). */
  path?: string
  message: string
}

/**
 * Helper for framework scaffolding: signals a capability that exists in the
 * architecture but has no implementation yet. Concrete providers replace the
 * throwing bodies in a future sprint.
 */
export function notImplemented(provider: string, feature: string): ProviderError {
  return new ProviderError(`${feature} is not implemented for provider "${provider}" yet`, {
    provider,
    code: "NOT_IMPLEMENTED",
  })
}

/**
 * Coerce an unknown thrown value into a `ProviderError`. Existing
 * `ProviderError`s pass through unchanged so their code/metadata is preserved.
 */
export function toProviderError(error: unknown, provider?: string): ProviderError {
  if (error instanceof ProviderError) return error

  if (error instanceof Error) {
    return new ProviderError(error.message, { provider, cause: error })
  }

  return new ProviderError("Unknown provider error", {
    provider,
    details: { value: error },
  })
}
