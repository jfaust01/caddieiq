/**
 * Generates a URL-friendly slug from a tournament name and ID.
 * Format: "tournament-name-2024-tournamentId"
 * This ensures uniqueness while being human-readable.
 */
export function generateTournamentSlug(name: string, tournamentId: string): string {
  const slugName = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  return `${slugName}-${tournamentId}`
}

/**
 * Extracts the tournament ID from a slug.
 * Assumes the format: "tournament-name-tournamentId"
 * The ID is always the last segment after splitting by hyphen.
 */
export function extractTournamentIdFromSlug(slug: string): string {
  const parts = slug.split('-')
  return parts[parts.length - 1]
}
