/**
 * Build a map of position values to their frequency in the entrant list.
 * Counts only numeric positions; ignores null, string statuses (CUT, WD, etc.)
 */
export function buildPositionCountMap(entrants: { position: number | string | null }[]): Map<number, number> {
  const countMap = new Map<number, number>()

  for (const entrant of entrants) {
    const pos = entrant.position

    // Skip null/undefined positions
    if (pos == null) continue

    // Skip non-numeric statuses (CUT, WD, DQ, MDF, etc.)
    if (typeof pos === 'string') continue

    // Skip non-integer values
    if (!Number.isInteger(pos)) continue

    // Increment count for this position
    countMap.set(pos, (countMap.get(pos) ?? 0) + 1)
  }

  return countMap
}

/**
 * Format position with tie indicator if multiple players share the same position.
 *
 * @param position - Raw position value (number, string status like 'CUT', or null)
 * @param positionCountMap - Map of position → count of players at that position
 * @returns Formatted display string:
 *   - '—' if position is null/undefined
 *   - 'T{position}' if position is numeric and count > 1
 *   - '{position}' if position is numeric and count === 1
 *   - '{status}' if position is a string status (CUT, WD, DQ, MDF, etc.)
 */
export function formatPositionWithTies(
  position: number | string | null | undefined,
  positionCountMap: Map<number, number>,
): string {
  // Handle null/undefined
  if (position == null) return '—'

  // Handle string statuses (CUT, WD, DQ, MDF, etc.)
  if (typeof position === 'string') return position

  // Handle numeric positions
  if (typeof position === 'number' && Number.isInteger(position)) {
    const count = positionCountMap.get(position) ?? 0
    
    // Add 'T' prefix only if 2 or more players share this position
    if (count > 1) {
      return `T${position}`
    }
    
    return `${position}`
  }

  // Fallback for non-integer numbers or unexpected types
  return '—'
}
