/**
 * Generates a URL-friendly slug from a tournament name and ID.
 * Format: "tournament-name_tournamentId"
 * Uses underscore to separate name from ID for reliable extraction.
 */
export function generateTournamentSlug(name: string, tournamentId: string): string {
  const slugName = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  return `${slugName}_${tournamentId}`
}

/**
 * Extracts the tournament ID from a slug.
 * Format: "tournament-name_tournamentId"
 * The ID is after the underscore.
 */
export function extractTournamentIdFromSlug(slug: string): string {
  const parts = slug.split('_')
  return parts[parts.length - 1]
}
