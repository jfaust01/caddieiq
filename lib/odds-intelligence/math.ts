/**
 * Pure odds mathematics for the Odds Intelligence engine.
 *
 * Every function here is total and side-effect-free: no I/O, no clock, no
 * randomness. They convert between odds representations and derive market
 * probabilities from *verified* bookmaker prices. Nothing here fabricates a
 * price — callers only ever pass real decimal odds returned by the provider.
 *
 * Terminology:
 *   - Decimal odds (d): total return per unit staked incl. stake, d > 1.
 *   - American odds: +N underdog / -N favourite convention.
 *   - Implied probability (raw): 1/d. Across a book's field this sums to > 1;
 *     the excess is the bookmaker's margin ("vig"/"overround").
 *   - De-vigged (fair) probability: raw probability renormalized so the field
 *     sums to 1, i.e. the book's implied view with margin removed.
 */

/** Smallest decimal price we treat as valid (anything <= 1 is not a real price). */
const MIN_DECIMAL = 1.0000001

/** True when a value is a finite decimal price strictly greater than 1. */
export function isValidDecimalOdds(decimal: number): boolean {
  return Number.isFinite(decimal) && decimal > 1
}

/**
 * Convert decimal odds to American odds, rounded to the nearest integer.
 * Favourites (d < 2) yield negative American odds; underdogs (d > 2) positive.
 */
export function decimalToAmerican(decimal: number): number {
  if (!isValidDecimalOdds(decimal)) {
    throw new RangeError(`decimalToAmerican: invalid decimal odds ${decimal}`)
  }
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100)
  }
  return Math.round(-100 / (decimal - 1))
}

/**
 * Raw implied probability of a single decimal price: 1/d, clamped to (0,1].
 * This INCLUDES the bookmaker margin — use {@link devig} for a fair estimate.
 */
export function impliedProbabilityFromDecimal(decimal: number): number {
  if (!isValidDecimalOdds(decimal)) {
    throw new RangeError(`impliedProbabilityFromDecimal: invalid decimal odds ${decimal}`)
  }
  return 1 / decimal
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Remove the bookmaker margin from a set of raw implied probabilities using the
 * standard multiplicative (proportional) method: divide each by the field
 * total ("overround"). Returns fair probabilities that sum to 1.
 *
 * Returns an all-zero-safe result: if the total is not positive (empty input),
 * an empty array is returned rather than dividing by zero.
 */
export function devig(rawProbabilities: readonly number[]): number[] {
  const total = rawProbabilities.reduce((sum, p) => sum + p, 0)
  if (total <= 0) return rawProbabilities.map(() => 0)
  return rawProbabilities.map((p) => p / total)
}

/** The bookmaker margin (overround) of a field: sum(1/d) - 1, or null if empty. */
export function overround(decimalPrices: readonly number[]): number | null {
  if (decimalPrices.length === 0) return null
  const total = decimalPrices.reduce((sum, d) => sum + impliedProbabilityFromDecimal(d), 0)
  return total - 1
}

/** Arithmetic mean, or null for an empty set. */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Median, or null for an empty set. Does not mutate the input. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** Population standard deviation, or null for an empty set. */
export function stddev(values: readonly number[]): number | null {
  const m = mean(values)
  if (m == null) return null
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Best (max) and worst (min) decimal price in a set, or null when empty. */
export function priceRange(
  decimalPrices: readonly number[],
): { best: number; worst: number } | null {
  if (decimalPrices.length === 0) return null
  return { best: Math.max(...decimalPrices), worst: Math.min(...decimalPrices) }
}
