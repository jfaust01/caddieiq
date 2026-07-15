/**
 * Presentation helpers for the Tournament domain. Pure functions only — safe to
 * use from both server and client components.
 */

import type { TournamentLocation, TournamentStatus, TourType } from '@/features/tournaments/types'

/** Shown wherever an optional value has not been ingested yet. */
export const EMPTY_VALUE = '—'

export type Tone = 'success' | 'warning' | 'muted' | 'default'

const STATUS_LABELS: Record<TournamentStatus, string> = {
  SCHEDULED: 'Scheduled',
  ACTIVE: 'In progress',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
}

const TOUR_SHORT: Record<TourType, string> = {
  PGA: 'PGA',
  DP_WORLD: 'DPWT',
  LIV: 'LIV',
  KORN_FERRY: 'KFT',
  LPGA: 'LPGA',
}

export function statusLabel(status: TournamentStatus): string {
  return STATUS_LABELS[status]
}

export function statusTone(status: TournamentStatus): Tone {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'SCHEDULED':
      return 'default'
    case 'COMPLETED':
      return 'muted'
    case 'CANCELED':
      return 'warning'
  }
}

/** Short tour label, e.g. "DPWT", or an em-dash when the tour is unclassified. */
export function tourShortLabel(tour: TourType | null): string {
  return tour ? TOUR_SHORT[tour] : EMPTY_VALUE
}

/** Season display: the year, or an em-dash when unlinked. */
export function seasonDisplay(season: number | null): string {
  return season === null ? EMPTY_VALUE : `${season}`
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})
const DATE_FMT_WITH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Human date range for an event, e.g. "Apr 10 – 13, 2025". Falls back to a
 * single date when only one bound is known, or an em-dash when neither is.
 */
export function formatDateRange(start: string | null, end: string | null): string {
  const startDate = parseDate(start)
  const endDate = parseDate(end)

  if (!startDate && !endDate) return EMPTY_VALUE
  if (startDate && !endDate) return DATE_FMT_WITH_YEAR.format(startDate)
  if (!startDate && endDate) return DATE_FMT_WITH_YEAR.format(endDate)

  const s = startDate as Date
  const e = endDate as Date
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()

  if (sameMonth) {
    // "Apr 10 – 13, 2025"
    return `${DATE_FMT.format(s)} – ${e.getDate()}, ${e.getFullYear()}`
  }
  if (sameYear) {
    // "Apr 28 – May 2, 2025"
    return `${DATE_FMT.format(s)} – ${DATE_FMT_WITH_YEAR.format(e)}`
  }
  // "Dec 30, 2024 – Jan 2, 2025"
  return `${DATE_FMT_WITH_YEAR.format(s)} – ${DATE_FMT_WITH_YEAR.format(e)}`
}

const PURSE_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Purse display, e.g. "$20,000,000", or an em-dash when unknown. */
export function formatPurse(purse: number | null): string {
  if (purse === null || !Number.isFinite(purse)) return EMPTY_VALUE
  return PURSE_FMT.format(purse)
}

/** Location display, e.g. "Augusta, GA, USA", or an em-dash when unknown. */
export function formatLocation(location: TournamentLocation | null): string {
  if (!location) return EMPTY_VALUE
  const parts = [location.city, location.stateProvince, location.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  )
  return parts.length > 0 ? parts.join(', ') : EMPTY_VALUE
}

/** Generic text display: the value, or an em-dash when null/empty. */
export function textDisplay(value: string | null): string {
  return value && value.trim() ? value : EMPTY_VALUE
}
