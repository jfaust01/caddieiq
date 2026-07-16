/**
 * Scramble-sentinel detection — the honesty gate for scramble-prone feeds.
 *
 * The configured SportsDataIO tier is an evaluation tier that returns some
 * premium feeds (betting odds, DFS/fantasy projections) as **structurally valid
 * but obfuscated** payloads: the envelope, field names, and types are exactly as
 * documented, but the *values* are placeholders. SportsDataIO calls this
 * "scrambling". Text fields arrive as the literal string `"Scrambled"`.
 *
 * See `docs/DATA_CATALOG.md` §1 for the authoritative tier reality check. The
 * governing rule there — repeated across every pipeline that touches these
 * feeds — is:
 *
 *   > We must never surface scrambled values as if they were real.
 *
 * This module centralizes that rule so betting, fantasy, and any future
 * scramble-prone importer share one detector instead of re-implementing string
 * comparisons ad hoc. The pipelines stay built in full: a scramble is treated as
 * *absence* (record dropped, or its values nulled), so the instant a production
 * key is installed the real values flow through untouched — no code change.
 *
 * These helpers are pure and never throw; detection is a translation concern,
 * consistent with the rest of `lib/domain/shared`.
 */

/**
 * The literal placeholder SportsDataIO writes into text fields when a feed is
 * scrambled on the current tier. Matched case-insensitively and trimmed so
 * incidental whitespace/casing does not defeat the gate.
 */
export const SCRAMBLE_SENTINEL = "Scrambled"

/**
 * True when a text value is the scramble sentinel (case-insensitive, trimmed).
 * A real market descriptor, player name, or status will never equal this, so a
 * match is an unambiguous "this value is obfuscated, not real" signal.
 */
export function isScrambledText(value: unknown): boolean {
  if (typeof value !== "string") return false
  return value.trim().toLowerCase() === SCRAMBLE_SENTINEL.toLowerCase()
}

/**
 * Scramble-aware string clean: trims and returns `null` for empty values (like
 * the shared `cleanString`) AND for the scramble sentinel. Use this when mapping
 * a text field from a scramble-prone feed so an obfuscated placeholder is stored
 * as honest absence rather than the literal word "Scrambled".
 */
export function cleanUnscrambledString(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return isScrambledText(trimmed) ? null : trimmed
}

/**
 * Scan a raw record for the text sentinel across the given descriptor fields
 * (e.g. a betting market's bet-type / description). Returns true if ANY of them
 * is scrambled — the caller's cue to treat the whole record as unavailable
 * rather than persisting a fabricated market.
 *
 * Only the caller-named descriptor fields are inspected: those are the columns
 * the catalog identifies as scramble carriers. Numeric obfuscation is handled
 * separately (see {@link isImplausibleProjection}) because a bad decimal cannot
 * be distinguished from a real one by value alone.
 */
export function hasScrambledDescriptor(
  record: Record<string, unknown> | null | undefined,
  descriptorFields: readonly string[],
): boolean {
  if (!record) return false
  return descriptorFields.some((field) => isScrambledText(record[field]))
}

/**
 * Heuristic guard for the DFS/fantasy feed, whose numeric projections are
 * scrambled into implausible values on the trial tier (per the catalog, e.g.
 * `Birdies: 37.3`, per-event fantasy points near zero). Unlike text, a scrambled
 * number is not self-identifying, so this is a *bounded plausibility* check, not
 * a sentinel match: a value outside a sane range for its metric is treated as
 * unavailable.
 *
 * `min`/`max` express the plausible inclusive range for the specific metric
 * (the caller knows its units). A `null`/non-finite input is "not present", which
 * is honest absence rather than an implausible value, so it returns `false`.
 */
export function isImplausibleProjection(
  value: unknown,
  range: { min: number; max: number },
): boolean {
  if (value == null) return false
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return false
  return n < range.min || n > range.max
}
