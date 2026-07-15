/**
 * Pure, dependency-free coverage math for the Data Coverage Dashboard.
 *
 * This module is the single source of truth for how a raw (verified / total)
 * pair becomes a percentage and a human-facing quality rating. It performs no
 * I/O so it can be unit-tested in isolation and imported from client or server.
 *
 * Coverage philosophy (see docs/DATA_COVERAGE.md):
 *   - Coverage is always `verified / total`. Only genuinely verified records
 *     count toward the numerator — pending and missing never do.
 *   - A domain with nothing to measure (`total === 0`) has an *unknown* percent
 *     (`null`), never a flattering `100%` or a punishing `0%`.
 *   - Provider-restricted domains are never scored on the excellent→needs-
 *     attention scale; they carry a neutral `restricted` rating so a trial-tier
 *     limitation is never mistaken for a data-quality failure.
 */

/** Quality bands surfaced in the UI. `restricted` is intentionally unscored. */
export type CoverageRating =
  | "excellent"
  | "good"
  | "partial"
  | "needs-attention"
  | "restricted"

/** Inclusive lower bounds (percent) for each scored band, highest first. */
export const RATING_THRESHOLDS = {
  excellent: 90,
  good: 70,
  partial: 40,
} as const

/**
 * Coverage percentage as an integer 0–100, or `null` when there is nothing to
 * measure. Guards against negative / overflowing inputs so a miscount can never
 * render as a nonsensical percent.
 */
export function coveragePercent(verified: number, total: number): number | null {
  if (!Number.isFinite(verified) || !Number.isFinite(total)) return null
  if (total <= 0) return null
  const clamped = Math.min(Math.max(verified, 0), total)
  return Math.round((clamped / total) * 100)
}

/**
 * Maps a coverage percent to a scored quality band. A `null` percent (nothing
 * to measure) is treated as `needs-attention` — an empty domain needs data,
 * it is not "excellent" by vacuous default.
 */
export function rateCoverage(percent: number | null): CoverageRating {
  if (percent === null) return "needs-attention"
  if (percent >= RATING_THRESHOLDS.excellent) return "excellent"
  if (percent >= RATING_THRESHOLDS.good) return "good"
  if (percent >= RATING_THRESHOLDS.partial) return "partial"
  return "needs-attention"
}

/** Human label for a rating, matching the directive's VISUALS vocabulary. */
export function ratingLabel(rating: CoverageRating): string {
  switch (rating) {
    case "excellent":
      return "Excellent"
    case "good":
      return "Good"
    case "partial":
      return "Partial"
    case "needs-attention":
      return "Needs Attention"
    case "restricted":
      return "Provider Restricted"
  }
}

/**
 * Counts how many of the provided values are "present" (non-null, non-empty).
 * Used to grade record completeness (e.g. course-profile attributes) without
 * ever counting a `0`, `false`, or empty string as a real signal unless it is a
 * genuine value — callers pass already-normalized presence booleans for those.
 */
export function countPresent(values: Array<unknown>): number {
  return values.reduce<number>((acc, value) => {
    if (value === null || value === undefined) return acc
    if (typeof value === "string" && value.trim() === "") return acc
    return acc + 1
  }, 0)
}
