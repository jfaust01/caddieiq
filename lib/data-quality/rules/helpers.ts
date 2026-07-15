/**
 * Shared, pure predicates and issue factories used by the per-entity rule
 * modules. Keeping these here avoids duplicating field-level checks across the
 * player / course / tournament rules and guarantees consistent issue codes and
 * messages.
 */

import type { IssueCode, IssueSeverity, QualityIssue } from "../types"

/** Build a {@link QualityIssue}. Thin factory for consistent shape. */
export function issue(
  code: IssueCode,
  severity: IssueSeverity,
  message: string,
  options: { path?: string; value?: unknown } = {},
): QualityIssue {
  return { code, severity, message, path: options.path, value: options.value }
}

/** A string that is present and non-empty after trimming. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/** A finite JavaScript number (rejects NaN/Infinity and non-numbers). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/** A valid Date instance (rejects `Invalid Date`). */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Loose ISO-3166 style country check: a 2- or 3-letter alphabetic code, or a
 * recognizable country name (letters, spaces, and a few punctuation marks). The
 * domain layer keeps `countryCode` as a raw label; strict ISO normalization is a
 * later concern, so this only rejects clearly invalid values (digits, symbols,
 * empty).
 */
export function isPlausibleCountry(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2) return false
  return /^[A-Za-z][A-Za-z .'-]*$/.test(trimmed)
}

/** Latitude must be within [-90, 90]. */
export function isValidLatitude(value: number): boolean {
  return isFiniteNumber(value) && value >= -90 && value <= 90
}

/** Longitude must be within [-180, 180]. */
export function isValidLongitude(value: number): boolean {
  return isFiniteNumber(value) && value >= -180 && value <= 180
}

/**
 * Require a string field. Emits a `REQUIRED_FIELD_MISSING` error when absent.
 */
export function requireString(
  value: unknown,
  path: string,
  label = path,
): QualityIssue | null {
  return isNonEmptyString(value)
    ? null
    : issue("REQUIRED_FIELD_MISSING", "error", `${label} is required.`, { path, value })
}

/**
 * Validate an optional number: if present it must be finite and (when bounds are
 * given) within [min, max]. Absent (`null`/`undefined`) is allowed — emit a
 * warning separately if a field is expected but optional.
 */
export function checkOptionalNumber(
  value: number | null | undefined,
  path: string,
  bounds?: { min?: number; max?: number },
): QualityIssue | null {
  if (value === null || value === undefined) return null
  if (!isFiniteNumber(value)) {
    return issue("INVALID_NUMBER", "error", `${path} must be a finite number.`, {
      path,
      value,
    })
  }
  if (bounds) {
    const { min, max } = bounds
    if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
      return issue(
        "NUMBER_OUT_OF_RANGE",
        "error",
        `${path} is out of the expected range${
          min !== undefined && max !== undefined ? ` [${min}, ${max}]` : ""
        }.`,
        { path, value },
      )
    }
  }
  return null
}

/**
 * Validate an optional date: if present it must be a valid Date. Absent is
 * allowed. Returns an `INVALID_DATE` error otherwise.
 */
export function checkOptionalDate(
  value: Date | null | undefined,
  path: string,
): QualityIssue | null {
  if (value === null || value === undefined) return null
  return isValidDate(value)
    ? null
    : issue("INVALID_DATE", "error", `${path} is not a valid date.`, { path, value })
}
