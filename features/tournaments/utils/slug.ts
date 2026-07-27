/**
 * Generates a URL-friendly slug from a tournament name.
 * Format: "tournament-name"
 * Human-readable but does not include the ID for a cleaner URL.
 */
export function generateTournamentSlug(name: string): string {
  const slugName = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  return slugName
}

/**
 * Converts a slug back to a tournament name.
 * Since the slug is just the tournament name, this reverses it.
 * Note: This is a best-effort approach for lookups.
 */
export function slugToTournamentName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
