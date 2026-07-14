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

const STATUS_LABELS: Record<PlayerStatus, string> = {
  ACTIVE: 'Active',
  INJURED: 'Injured',
  INACTIVE: 'Inactive',
}

export type Tone = 'success' | 'warning' | 'muted' | 'default'

export function tourLabel(tour: Tour): string {
  return TOUR_LABELS[tour]
}

export function tourShortLabel(tour: Tour): string {
  return TOUR_SHORT[tour]
}

export function handednessLabel(handedness: Handedness): string {
  return HANDEDNESS_LABELS[handedness]
}

export function statusLabel(status: PlayerStatus): string {
  return STATUS_LABELS[status]
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
