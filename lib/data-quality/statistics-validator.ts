/**
 * Player season-statistics validation.
 *
 * The Validation stage of the statistics import pipeline (Provider → Mapper →
 * **Validation** → Repository). Like the rest of this layer it performs no I/O
 * and never throws: it takes mapped {@link PlayerSeasonStat} objects for a
 * single season and returns the subset safe to persist, plus counts of what was
 * dropped and why.
 *
 * A dedicated validator (rather than the generic player/course machinery)
 * because season stats have their own identity semantics: the reconciliation
 * key is `playerSlug`, and within a single season each player should appear at
 * most once. The meaningful checks are: (1) the row can be reconciled to a
 * player (`playerSlug` present), (2) a player appears at most once for the
 * season, and (3) numeric fields are plausible — implausible values are
 * sanitized to `null` rather than discarding an otherwise-valid row, so a bad
 * ranking never costs us a player's events/points.
 */

import type { PlayerSeasonStat } from "@/lib/domain/statistics/types"

/** Outcome of validating one season's statistics. */
export interface StatisticsValidationResult {
  /** Rows safe to persist (reconcilable, de-duplicated, sanitized). */
  valid: PlayerSeasonStat[]
  /** Rows dropped because they could not be reconciled to a player. */
  dropped: number
  /** Rows dropped because the player already appeared for this season. */
  duplicates: number
  /** Bounded human-readable notes for logs/reporting. */
  issues: string[]
}

/** Coerce a value to a plausible rank/position (integer ≥ 1) or null. */
function sanitizeRank(value: number | null): number | null {
  if (value == null) return null
  if (!Number.isFinite(value) || value < 1) return null
  return Math.trunc(value)
}

/** Coerce a value to a non-negative count (integer ≥ 0) or null. */
function sanitizeCount(value: number | null): number | null {
  if (value == null) return null
  if (!Number.isFinite(value) || value < 0) return null
  return Math.trunc(value)
}

/** Coerce a fantasy-points value to a finite number or null (may be negative). */
function sanitizePoints(value: number | null): number | null {
  if (value == null) return null
  return Number.isFinite(value) ? value : null
}

/**
 * Validate and sanitize the mapped season-stat rows for one season.
 *
 * @param rows - Mapped rows for a single season.
 * @param maxIssues - Cap on retained notes (log hygiene). Defaults to 25.
 */
export function validateSeasonStats(
  rows: readonly PlayerSeasonStat[],
  maxIssues = 25,
): StatisticsValidationResult {
  const valid: PlayerSeasonStat[] = []
  const issues: string[] = []
  const seenSlugs = new Set<string>()
  let dropped = 0
  let duplicates = 0

  const note = (message: string) => {
    if (issues.length < maxIssues) issues.push(message)
  }

  for (const row of rows) {
    const slug = row.playerSlug?.trim()
    if (!slug) {
      dropped += 1
      note(`Unreconcilable row (empty player slug) for "${row.playerName}"`)
      continue
    }
    if (seenSlugs.has(slug)) {
      duplicates += 1
      note(`Duplicate player "${row.playerName}" within season ${row.season}`)
      continue
    }
    seenSlugs.add(slug)

    valid.push({
      ...row,
      worldRanking: sanitizeRank(row.worldRanking),
      worldRankingLastWeek: sanitizeRank(row.worldRankingLastWeek),
      events: sanitizeCount(row.events),
      averagePoints: sanitizePoints(row.averagePoints),
      totalPoints: sanitizePoints(row.totalPoints),
      pointsGained: sanitizePoints(row.pointsGained),
      pointsLost: sanitizePoints(row.pointsLost),
    })
  }

  return { valid, dropped, duplicates, issues }
}
