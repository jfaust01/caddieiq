/**
 * Standardized error classes shared by every analytics module and the engine.
 *
 * All analytics failures should surface as an `AnalyticsError` (or subclass) so
 * callers, the engine, and logging can treat them uniformly. Never leak a raw
 * error out of a module — wrap it with `toAnalyticsError`.
 */

export type AnalyticsErrorCode =
  | "ANALYTICS_ERROR"
  | "VALIDATION_ERROR"
  | "MISSING_DATA_ERROR"
  | "NOT_IMPLEMENTED"

export interface AnalyticsErrorOptions {
  /** The module that produced the error (e.g. "recent-form"). */
  module?: string
  /** Machine-readable error code. Defaults to `"ANALYTICS_ERROR"`. */
  code?: AnalyticsErrorCode
  /** The underlying error, if any. */
  cause?: unknown
  /** Arbitrary structured context for debugging/logging. */
  details?: Record<string, unknown>
}

/** A single problem discovered during validation. */
export interface ValidationIssue {
  /** Dot-path to the offending field, when known (e.g. "subject.id"). */
  path?: string
  message: string
}

/** Base error for anything that goes wrong inside the analytics layer. */
export class AnalyticsError extends Error {
  readonly code: AnalyticsErrorCode
  readonly module?: string
  readonly details?: Record<string, unknown>
  /** Redeclared so the field is available on older TS lib targets. */
  override readonly cause?: unknown

  constructor(message: string, options: AnalyticsErrorOptions = {}) {
    super(message)
    this.name = "AnalyticsError"
    this.code = options.code ?? "ANALYTICS_ERROR"
    this.module = options.module
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
      module: this.module,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * A module was asked to run without the inputs it needs. Expected while the
 * data platform is not yet feeding real data into the framework.
 */
export class MissingDataError extends AnalyticsError {
  constructor(message = "Required analytics data is missing", options: AnalyticsErrorOptions = {}) {
    super(message, { ...options, code: "MISSING_DATA_ERROR" })
    this.name = "MissingDataError"
  }
}

/** A context failed validation before a run. */
export class AnalyticsValidationError extends AnalyticsError {
  readonly issues: ValidationIssue[]

  constructor(
    message = "Analytics validation failed",
    options: AnalyticsErrorOptions & { issues?: ValidationIssue[] } = {},
  ) {
    const { issues, ...rest } = options
    super(message, { ...rest, code: "VALIDATION_ERROR" })
    this.name = "AnalyticsValidationError"
    this.issues = issues ?? []
  }
}

/**
 * Helper for framework scaffolding: signals a capability that exists in the
 * architecture but has no implementation yet.
 */
export function notImplemented(module: string, feature: string): AnalyticsError {
  return new AnalyticsError(`${feature} is not implemented for module "${module}" yet`, {
    module,
    code: "NOT_IMPLEMENTED",
  })
}

/**
 * Coerce an unknown thrown value into an `AnalyticsError`. Existing
 * `AnalyticsError`s pass through unchanged so their code/metadata is preserved.
 */
export function toAnalyticsError(error: unknown, module?: string): AnalyticsError {
  if (error instanceof AnalyticsError) return error

  if (error instanceof Error) {
    return new AnalyticsError(error.message, { module, cause: error })
  }

  return new AnalyticsError("Unknown analytics error", {
    module,
    details: { value: error },
  })
}
