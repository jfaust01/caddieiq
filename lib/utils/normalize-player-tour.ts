/**
 * Normalize player Tour affiliation to standardized display labels.
 * 
 * This is the single source of truth for Tour value normalization.
 * All raw Tour values must pass through this function before rendering.
 * 
 * Supported return values:
 * - "PGA"
 * - "LIV"
 * - "DP"
 * - "KFT"
 * - "LPGA"
 * - "CHAMP"
 * - "(A)"
 * - "No Tour"
 */

export type PlayerTourLabel = 'PGA' | 'LIV' | 'DP' | 'KFT' | 'LPGA' | 'CHAMP' | '(A)' | 'No Tour'

/**
 * Normalize a raw Tour value to a standardized display label.
 * Handles null, undefined, empty strings, and unsupported values gracefully.
 * Does not infer Tour from context; only normalizes explicit values.
 */
export function normalizePlayerTour(value: string | null | undefined): PlayerTourLabel {
  // Handle null/undefined/empty
  if (!value || typeof value !== 'string') {
    return 'No Tour'
  }

  const normalized = value.trim().toUpperCase()

  // Empty after trim
  if (normalized.length === 0) {
    return 'No Tour'
  }

  // PGA Tour
  if (normalized === 'PGA' || normalized === 'PGA TOUR' || normalized === 'PGAT') {
    return 'PGA'
  }

  // LIV Golf
  if (normalized === 'LIV' || normalized === 'LIV GOLF') {
    return 'LIV'
  }

  // DP World Tour
  if (
    normalized === 'DP' ||
    normalized === 'DP WORLD TOUR' ||
    normalized === 'DPWT' ||
    normalized === 'EUROPEAN TOUR'
  ) {
    return 'DP'
  }

  // Korn Ferry Tour
  if (
    normalized === 'KFT' ||
    normalized === 'KORN FERRY' ||
    normalized === 'KORN FERRY TOUR'
  ) {
    return 'KFT'
  }

  // LPGA Tour
  if (normalized === 'LPGA' || normalized === 'LPGA TOUR') {
    return 'LPGA'
  }

  // PGA Tour Champions
  if (
    normalized === 'CHAMP' ||
    normalized === 'CHAMPIONS TOUR' ||
    normalized === 'PGA TOUR CHAMPIONS'
  ) {
    return 'CHAMP'
  }

  // Amateur
  if (
    normalized === '(A)' ||
    normalized === 'A' ||
    normalized === 'AM' ||
    normalized === 'AMATEUR'
  ) {
    return '(A)'
  }

  // Unknown value — default to "No Tour"
  return 'No Tour'
}
