/**
 * Presentation helpers for the Player domain. Pure functions only — safe to use
 * from both server and client components.
 */

import type { FormResult, Handedness, PlayerStatus, Tour } from '@/features/players/types'

const TOUR_LABELS: Record<Tour, string> = {
  PGA: 'PGA Tour',
  DP_WORLD: 'DP World Tour',
  LIV: 'LIV Golf',
  KORN_FERRY: 'Korn Ferry Tour',
  CHAMPIONS: 'PGA Tour Champions',
}

const TOUR_SHORT: Record<Tour, string> = {
  PGA: 'PGA',
  DP_WORLD: 'DPWT',
  LIV: 'LIV',
  KORN_FERRY: 'KFT',
  CHAMPIONS: 'CHMP',
}

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  RIGHT: 'Right-handed',
  LEFT: 'Left-handed',
}

/** Shown wherever an optional value has not been ingested yet. */
export const EMPTY_VALUE = '—'

const STATUS_LABELS: Record<PlayerStatus, string> = {
  ACTIVE: 'Active',
  INJURED: 'Injured',
  INACTIVE: 'Inactive',
}

export type Tone = 'success' | 'warning' | 'muted' | 'default'

export function tourLabel(tour: Tour | null): string {
  return tour ? TOUR_LABELS[tour] : EMPTY_VALUE
}

export function tourShortLabel(tour: Tour | null): string {
  return tour ? TOUR_SHORT[tour] : EMPTY_VALUE
}

export function handednessLabel(handedness: Handedness | null): string {
  return handedness ? HANDEDNESS_LABELS[handedness] : EMPTY_VALUE
}

export function statusLabel(status: PlayerStatus): string {
  return STATUS_LABELS[status]
}

/** World-ranking display: `#12` when ranked, "Unranked" when not. */
export function worldRankDisplay(rank: number | null): string {
  return rank === null ? 'Unranked' : `#${rank}`
}

/** Numeric field display: the number as a string, or an em-dash when unknown. */
export function numberDisplay(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${value}`
}

const DECIMAL_FMT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Decimal display for fantasy-points figures, e.g. `1,284.5`. Returns an
 * em-dash when the value was not reported by the provider.
 */
export function decimalDisplay(value: number | null): string {
  return value === null ? EMPTY_VALUE : DECIMAL_FMT.format(value)
}

/**
 * Signed decimal display for movement deltas, e.g. `+3` / `-2`. Returns an
 * em-dash when either side is unknown, and `even` when there is no change.
 */
export function rankMovementDisplay(current: number | null, previous: number | null): string {
  if (current === null || previous === null) return EMPTY_VALUE
  // A LOWER world-ranking number is BETTER, so improvement = previous - current.
  const delta = previous - current
  if (delta === 0) return 'even'
  return delta > 0 ? `+${delta}` : `${delta}`
}

export function statusTone(status: PlayerStatus): Tone {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INJURED':
      return 'warning'
    case 'INACTIVE':
      return 'muted'
  }
}

/** Initials for a headshot placeholder, e.g. "Scottie Scheffler" -> "SS". */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Ordinal ranking display, e.g. 1 -> "1st", 23 -> "23rd". */
export function ordinal(value: number): string {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

/** Short label for a recent-form finish. */
export function formLabel(position: FormResult['position']): string {
  if (typeof position === 'number') {
    return position === 1 ? 'WIN' : `${position}`
  }
  return position
}

/** Tone used to color a recent-form pill by how strong the finish was. */
export function formTone(position: FormResult['position']): Tone {
  if (typeof position !== 'number') return 'muted'
  if (position === 1) return 'success'
  if (position <= 10) return 'default'
  if (position <= 30) return 'warning'
  return 'muted'
}
