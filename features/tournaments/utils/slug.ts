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
