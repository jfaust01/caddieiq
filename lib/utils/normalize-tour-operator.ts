/**
 * Normalizes DFS salary operator values to standardized tournament tour labels.
 *
 * Single source of truth for tour normalization. Maps raw operator field values
 * from dfs_salaries table to display-ready labels used in the Tournament Field table.
 */

export type PlayerTourLabel = 'PGA' | 'LIV' | 'DP' | 'KFT' | 'LPGA' | 'CHAMP' | '(A)' | 'No Tour'

/**
 * Normalize a DFS salary operator value to a standardized tour label.
 *
 * @param operator - Raw operator value from dfs_salaries.operator or null/undefined
 * @returns Standardized tour label or 'No Tour' for unrecognized values
 *
 * @example
 * normalizeTourOperator('PGA TOUR') // → 'PGA'
 * normalizeTourOperator('LIV Golf') // → 'LIV'
 * normalizeTourOperator('DP WORLD TOUR') // → 'DP'
 * normalizeTourOperator(null) // → 'No Tour'
 * normalizeTourOperator('UNKNOWN') // → 'No Tour'
 */
export function normalizeTourOperator(operator: string | null | undefined): PlayerTourLabel {
  if (!operator) {
    return 'No Tour'
  }

  // Normalize: uppercase, trim, handle common separators
  const normalized = operator.toUpperCase().trim().replace(/_/g, ' ')

  // PGA TOUR variants
  if (normalized === 'PGA TOUR' || normalized === 'PGA' || normalized === 'PGAT') {
    return 'PGA'
  }

  // LIV variants
  if (normalized === 'LIV' || normalized === 'LIV GOLF' || normalized === 'LIV_GOLF') {
    return 'LIV'
  }

  // DP World Tour / European Tour variants
  if (
    normalized === 'DP' ||
    normalized === 'DP WORLD TOUR' ||
    normalized === 'DPWT' ||
    normalized === 'DP WORLD' ||
    normalized === 'EUROPEAN TOUR' ||
    normalized === 'EUROPEAN'
  ) {
    return 'DP'
  }

  // Korn Ferry Tour variants
  if (normalized === 'KFT' || normalized === 'KORN FERRY' || normalized === 'KORN FERRY TOUR') {
    return 'KFT'
  }

  // LPGA variants
  if (normalized === 'LPGA' || normalized === 'LPGA TOUR') {
    return 'LPGA'
  }

  // PGA Tour Champions / Champions Tour variants
  if (
    normalized === 'CHAMP' ||
    normalized === 'CHAMPIONS' ||
    normalized === 'CHAMPIONS TOUR' ||
    normalized === 'PGA TOUR CHAMPIONS'
  ) {
    return 'CHAMP'
  }

  // Amateur variants
  if (normalized === '(A)' || normalized === 'A' || normalized === 'AM' || normalized === 'AMATEUR') {
    return '(A)'
  }

  // Unknown / unsupported values → 'No Tour'
  return 'No Tour'
}
