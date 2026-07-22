/**
 * Convert tournament TourType to compact display labels.
 * 
 * Required compact labels:
 * - PGA TOUR → PGA
 * - LIV Golf → LIV
 * - DP World Tour → DP
 * - Korn Ferry Tour → KFT
 * - LPGA Tour → LPGA
 * - PGA Tour Champions → CHAMP
 * - Amateur → (A)
 */

export type TournamentTourLabel = 'PGA' | 'LIV' | 'DP' | 'KFT' | 'LPGA' | 'CHAMP' | '(A)' | 'No Tour'

/**
 * Normalize tournament tour name to a compact display label.
 * Uses the tournament Tour.code when available for deterministic mapping.
 * Falls back to Tour.name if code is not available.
 */
export function normalizeTournamentTour(
  tourName: string | null | undefined,
  tourCode: string | null | undefined,
): TournamentTourLabel {
  // Handle null/undefined
  if (!tourName && !tourCode) {
    return 'No Tour'
  }

  // Prefer code if available
  if (tourCode) {
    const code = tourCode.trim().toUpperCase()
    if (code === 'PGA') return 'PGA'
    if (code === 'LIV') return 'LIV'
    if (code === 'DP') return 'DP'
    if (code === 'KFT') return 'KFT'
    if (code === 'LPGA') return 'LPGA'
    if (code === 'CHAMP') return 'CHAMP'
    if (code === '(A)' || code === 'A') return '(A)'
  }

  // Fall back to tour name
  if (tourName) {
    const normalized = tourName.trim().toUpperCase()

    if (normalized === 'PGA TOUR' || normalized === 'PGA') return 'PGA'
    if (normalized === 'LIV GOLF' || normalized === 'LIV') return 'LIV'
    if (normalized === 'DP WORLD TOUR' || normalized === 'DP') return 'DP'
    if (normalized === 'KORN FERRY TOUR' || normalized === 'KFT') return 'KFT'
    if (normalized === 'LPGA TOUR' || normalized === 'LPGA') return 'LPGA'
    if (normalized === 'PGA TOUR CHAMPIONS' || normalized === 'CHAMP') return 'CHAMP'
    if (normalized === 'AMATEUR' || normalized === '(A)') return '(A)'
  }

  return 'No Tour'
}
