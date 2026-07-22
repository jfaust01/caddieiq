/**
 * Development-only mock player metadata.
 *
 * TODO: Remove this provider once authoritative Tour and country data is
 * fully connected from the backend. This is strictly a UI layout preview.
 */

/** Development mock data for player Tour affiliations. */
const MOCK_TOUR_DATA: Record<string, string> = {
  // PGA Tour players
  'adamscott': 'PGA TOUR',
  'collinmorikawa': 'PGA TOUR',
  'dennymccarthy': 'PGA TOUR',
  'garywoods': 'PGA TOUR',
  'davidlipsky': 'PGA TOUR',

  // LIV Golf players
  'jonrahm': 'LIV',
  'dustinjohnson': 'LIV',
  'broookskoepka': 'LIV',
  'phil mickelson': 'LIV',

  // DP World Tour players
  'tommyfleetwood': 'DP WORLD TOUR',
  'torynvandevelde': 'DP WORLD TOUR',
  'rorymc': 'EUROPEAN TOUR',
}

/**
 * Get development mock Tour affiliation for a player.
 * Returns null if no mock data exists (caller should handle gracefully).
 *
 * NOTE: This is only used when real Tour data is unavailable. Once
 * the backend mapping is complete, delete this entire provider.
 */
export function getDevelopmentPlayerMetadata(
  playerId: string,
  playerName: string,
): { tour: string | null } {
  // Try lookup by playerId first
  const mockTour = MOCK_TOUR_DATA[playerId.toLowerCase()]
  if (mockTour) {
    return { tour: mockTour }
  }

  // Fallback: Try lookup by player name
  const nameLower = playerName.toLowerCase().replace(/\s+/g, '')
  const mockTourByName = MOCK_TOUR_DATA[nameLower]
  if (mockTourByName) {
    return { tour: mockTourByName }
  }

  // No mock data
  return { tour: null }
}
