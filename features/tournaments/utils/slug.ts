/**
 * Simply return the tournament ID as the slug.
 * This ensures URLs are always resolvable via direct ID lookup.
 */
export function generateTournamentSlug(tournamentId: string): string {
  return tournamentId
}

/**
 * Extracts the tournament ID from a slug.
 * Since the slug IS the ID, just return it.
 */
export function extractTournamentIdFromSlug(slug: string): string {
  return slug
}

/**
 * Convert tournament name to URL-friendly slug.
 * Example: "Cadillac Championship" -> "cadillac-championship"
 */
export function generateTournamentNameSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
