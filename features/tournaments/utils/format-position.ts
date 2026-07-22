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
 * Format position with priority status handling and tie indicators.
 *
 * Priority order:
 * 1. Withdrawn (WD)
 * 2. Disqualified (DQ)
 * 3. Missed cut (MC)
 * 4. MDF (Modified format)
 * 5. Numeric position with tie formatting
 * 6. Missing position (—)
 *
 * @param entrant - FieldEntrant with position, withdrawn, cutMade, and status
 * @param positionCountMap - Map of position → count of players at that position
 * @returns Formatted display string:
 *   - 'WD' if withdrawn
 *   - 'DQ' if disqualified
 *   - 'MC' if missed cut
 *   - 'MDF' if status is MDF
 *   - 'T{position}' if numeric and tied
 *   - '{position}' if numeric and not tied
 *   - '—' if position is null
 */
export function formatPositionWithStatusPriority(
  entrant: {
    position: number | string | null | undefined
    withdrawn: boolean
    cutMade: boolean | null
    status?: string | null
  },
  positionCountMap: Map<number, number>,
): string {
  // Priority 1: Check if withdrawn
  if (entrant.withdrawn) {
    return 'WD'
  }

  // Priority 2: Check if disqualified (status = 'DQ')
  if (entrant.status === 'DQ' || entrant.status === 'DISQUALIFIED') {
    return 'DQ'
  }

  // Priority 3: Check if missed cut (cutMade === false or various status values)
  if (
    entrant.cutMade === false ||
    entrant.status === 'MC' ||
    entrant.status === 'MISSED_CUT' ||
    entrant.status === 'CUT'
  ) {
    return 'MC'
  }

  // Priority 4: Check for MDF status
  if (entrant.status === 'MDF') {
    return 'MDF'
  }

  // Priority 5: Handle numeric positions with tie formatting
  const { position } = entrant
  if (position == null) return '—'

  // If position is a string status (shouldn't get here due to priority checks, but handle it)
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

  // Priority 6: Missing/invalid position
  return '—'
}

/**
 * Format position with tie indicator if multiple players share the same position.
 * (Deprecated: use formatPositionWithStatusPriority instead)
 *
 * @param position - Raw position value (number, string status like 'CUT', or null)
 * @param positionCountMap - Map of position → count of players at that position
 * @returns Formatted display string
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
