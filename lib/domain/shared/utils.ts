/**
 * Pure translation helpers shared by the domain mappers.
 *
 * These perform **field translation only** — trimming, slugifying, coercing a
 * loose upstream value into a domain-friendly shape. They deliberately do not
 * validate (no "is this a real country?" checks) and never throw on bad input;
 * validation is a separate layer that runs on the mapper output.
 */

/**
 * Convert an arbitrary label into a URL-safe slug candidate.
 *
 * Note: this produces a *candidate* only. Guaranteeing global uniqueness (e.g.
 * appending a discriminator on collision) is a persistence concern handled by
 * the repository layer, not the mapper.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
}

/** Trim a string and return `null` when it is empty or absent. */
export function cleanString(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Coerce a loose numeric value (number or numeric string) into a finite number,
 * or `null` when it is absent/unparseable. Does not range-check — that is
 * validation's job.
 */
export function cleanNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Parse an upstream date string into a `Date`, or `null` when absent/invalid.
 * SportsDataIO emits ISO-8601-ish strings (e.g. "1990-05-14T00:00:00").
 */
export function parseDate(value: string | null | undefined): Date | null {
  const cleaned = cleanString(value ?? null)
  if (cleaned == null) return null
  const date = new Date(cleaned)
  return Number.isNaN(date.getTime()) ? null : date
}
