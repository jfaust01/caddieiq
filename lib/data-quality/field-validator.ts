/**
 * Tournament-field validation.
 *
 * The Validation stage of the field import pipeline (Provider → Mapper →
 * **Validation** → Repository). Like the rest of this layer it performs no I/O
 * and never throws: it takes mapped {@link TournamentFieldEntry} objects for a
 * single tournament and returns the subset safe to persist, plus a count of
 * what was dropped and why.
 *
 * Why a dedicated validator rather than the generic
 * {@link import("./validator").validatePlayers}-style machinery: field entries
 * have different identity semantics. Their reconciliation key is `playerSlug`
 * (not `slug`), and the same player legitimately appears across many different
 * tournaments' batches — so the batch-wide duplicate detection used for
 * players/courses/tournaments would raise false positives. The meaningful
 * checks here are: (1) the entry can be reconciled to a player (`playerSlug`
 * present), (2) a player appears at most once *within one tournament*, and
 * (3) numeric fields are plausible (implausible values are sanitized to `null`
 * rather than discarding an otherwise-valid entry).
 */

import type { TournamentFieldEntry } from "@/lib/domain/field/types"

/** Outcome of validating one tournament's field. */
export interface FieldValidationResult {
  /** Entries safe to persist (reconcilable, de-duplicated, sanitized). */
  valid: TournamentFieldEntry[]
  /** Entries dropped because they could not be reconciled to a player. */
  dropped: number
  /** Entries dropped because the player already appeared in this field. */
  duplicates: number
  /** Bounded human-readable notes for logs/reporting. */
  issues: string[]
}

/** Coerce a value to a plausible finishing position (integer ≥ 1) or null. */
function sanitizePosition(value: number | null): number | null {
  if (value == null) return null
  if (!Number.isFinite(value) || value < 1) return null
  return Math.trunc(value)
}

/** Coerce earnings to a non-negative number or null. */
function sanitizeEarnings(value: number | null): number | null {
  if (value == null) return null
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

/**
 * Validate and sanitize the mapped entries for one tournament's field.
 *
 * @param entries - Mapped entries for a single tournament.
 * @param maxIssues - Cap on retained notes (log hygiene). Defaults to 25.
 */
export function validateFieldEntries(
  entries: readonly TournamentFieldEntry[],
  maxIssues = 25,
): FieldValidationResult {
  const valid: TournamentFieldEntry[] = []
  const issues: string[] = []
  const seenSlugs = new Set<string>()
  let dropped = 0
  let duplicates = 0

  const note = (message: string) => {
    if (issues.length < maxIssues) issues.push(message)
  }

  for (const entry of entries) {
    const slug = entry.playerSlug?.trim()
    if (!slug) {
      dropped += 1
      note(`Unreconcilable entry (empty player slug) for "${entry.playerName}"`)
      continue
    }
    if (seenSlugs.has(slug)) {
      duplicates += 1
      note(`Duplicate player "${entry.playerName}" within one tournament field`)
      continue
    }
    seenSlugs.add(slug)

    valid.push({
      ...entry,
      finalPosition: sanitizePosition(entry.finalPosition),
      earnings: sanitizeEarnings(entry.earnings),
    })
  }

  return { valid, dropped, duplicates, issues }
}
