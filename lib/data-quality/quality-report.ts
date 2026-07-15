/**
 * Quality scoring and report construction.
 *
 * Pure functions that turn a list of {@link QualityIssue} into a numeric quality
 * score and a structured {@link QualityReport}. Scoring is deterministic so the
 * Admin data-quality surface and any thresholds behave predictably.
 */

import type {
  EntityKind,
  QualityIssue,
  QualityReport,
} from "./types"
import type { HasExternalReference } from "@/lib/domain"

/** Points deducted from a perfect score per finding, by severity. */
const PENALTY = {
  error: 25,
  warning: 5,
} as const

/** Reports at or above this score are considered high quality. */
export const HIGH_QUALITY_THRESHOLD = 90

/**
 * Compute a 0–100 quality score from a set of issues.
 *
 * A clean entity scores 100. Each error subtracts 25 and each warning subtracts
 * 5, floored at 0. The weighting makes any error drop an entity well below the
 * high-quality threshold while letting a couple of warnings shave only a few
 * points (e.g. 100 → 95 → 82 → 67).
 */
export function computeQualityScore(issues: QualityIssue[]): number {
  const penalty = issues.reduce((total, current) => total + PENALTY[current.severity], 0)
  return Math.max(0, Math.min(100, 100 - penalty))
}

/**
 * Build a {@link QualityReport} for one evaluated entity from its issues.
 * `isValid` is false if any error-severity issue is present.
 */
export function buildQualityReport(
  entity: EntityKind,
  reference: HasExternalReference["externalRef"],
  issues: QualityIssue[],
): QualityReport {
  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")

  return {
    entity,
    reference: { source: reference.source, externalId: reference.externalId },
    isValid: errors.length === 0,
    score: computeQualityScore(issues),
    errors,
    warnings,
  }
}

/** Mean score across a set of reports, rounded to an integer (0 when empty). */
export function averageScore(reports: QualityReport[]): number {
  if (reports.length === 0) return 0
  const total = reports.reduce((sum, report) => sum + report.score, 0)
  return Math.round(total / reports.length)
}
