/**
 * Presentation helpers for the Tournament domain. Pure functions only — safe to
 * use from both server and client components.
 */

import type {
  FieldEntryStatus,
  TournamentLocation,
  TournamentStatus,
  TourType,
} from '@/features/tournaments/types'
import type { FieldConfidence, FieldStatus } from '@/lib/tournament-context/types'

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

/** Parse ISO 8601 date string to UTC Date, avoiding timezone offset issues. */
function parseDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Format date using UTC to ensure server/client consistency. */
function formatDateUTC(date: Date, includeYear: boolean): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  
  if (includeYear) {
    return `${month} ${day}, ${year}`
  }
  return `${month} ${day}`
}

/**
 * Human date range for an event, e.g. "Apr 10 – 13, 2025". Falls back to a
 * single date when only one bound is known, or an em-dash when neither is.
 * Uses UTC to ensure server/client hydration consistency.
 */
export function formatDateRange(start: string | null, end: string | null): string {
  const startDate = parseDate(start)
  const endDate = parseDate(end)

  if (!startDate && !endDate) return EMPTY_VALUE
  if (startDate && !endDate) return formatDateUTC(startDate, true)
  if (!startDate && endDate) return formatDateUTC(endDate, true)

  const s = startDate as Date
  const e = endDate as Date
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear()
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth()

  if (sameMonth) {
    // "Apr 10 – 13, 2025"
    const sMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][s.getUTCMonth()]
    return `${sMonth} ${s.getUTCDate()} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`
  }
  if (sameYear) {
    // "Apr 28 – May 2, 2025"
    return `${formatDateUTC(s, false)} – ${formatDateUTC(e, true)}`
  }
  // "Dec 30, 2024 – Jan 2, 2025"
  return `${formatDateUTC(s, true)} – ${formatDateUTC(e, true)}`
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

const DK_TOTAL_FMT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

/**
 * DraftKings total fantasy points display, e.g. "6,842.5" or "6,842".
 * Formats with thousands separators and up to one decimal place.
 * Returns an em-dash when unknown or no data exists.
 */
export function formatDkTotal(dkTotal: number | null): string {
  if (dkTotal === null || !Number.isFinite(dkTotal)) return EMPTY_VALUE
  
  // Round to one decimal place
  const rounded = Math.round(dkTotal * 10) / 10
  
  // Format with thousands separators
  const formatted = DK_TOTAL_FMT.format(rounded)
  
  // Remove trailing .0
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

const DFS_SALARY_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/**
 * DFS salary display in USD with thousands separators and no decimals.
 * Examples: $10,400, $8,500, $0
 * Returns an em-dash when unknown or no data exists.
 */
export function formatDfsSalary(salary: number | null): string {
  if (salary === null || !Number.isFinite(salary)) return EMPTY_VALUE
  return DFS_SALARY_FMT.format(salary)
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

/** Course par display, e.g. "Par 72", or an em-dash when unknown. */
export function formatCoursePar(par: number | null): string {
  return typeof par === 'number' && Number.isFinite(par) ? `Par ${par}` : EMPTY_VALUE
}

const YARDAGE_FMT = new Intl.NumberFormat('en-US')

/** Course yardage display, e.g. "7,475 yds", or an em-dash when unknown. */
export function formatYardage(yardage: number | null): string {
  return typeof yardage === 'number' && Number.isFinite(yardage)
    ? `${YARDAGE_FMT.format(yardage)} yds`
    : EMPTY_VALUE
}

const FIELD_STATUS_LABELS: Record<FieldEntryStatus, string> = {
  CONFIRMED: 'Confirmed',
  ALTERNATE: 'Alternate',
  WITHDRAWN: 'Withdrawn',
  DISQUALIFIED: 'Disqualified',
  CUT: 'Missed cut',
  FINISHED: 'Finished',
}

/** Human label for a field entry status, e.g. "Missed cut". */
export function fieldStatusLabel(status: FieldEntryStatus): string {
  return FIELD_STATUS_LABELS[status]
}

/** Badge tone for a field entry status. */
export function fieldStatusTone(status: FieldEntryStatus): Tone {
  switch (status) {
    case 'FINISHED':
      return 'success'
    case 'CONFIRMED':
      return 'default'
    case 'ALTERNATE':
      return 'muted'
    case 'CUT':
      return 'muted'
    case 'WITHDRAWN':
    case 'DISQUALIFIED':
      return 'warning'
  }
}

const FIELD_SIZE_FMT = new Intl.NumberFormat('en-US')

/**
 * Field-size display, e.g. "156 players". Returns null when the field is empty
 * so callers can render an "awaiting import" placeholder instead.
 */
export function formatFieldSize(size: number): string | null {
  if (!Number.isFinite(size) || size <= 0) return null
  return `${FIELD_SIZE_FMT.format(size)} ${size === 1 ? 'player' : 'players'}`
}

/* --- Official field lifecycle ------------------------------------------- */

const FIELD_LIFECYCLE_LABELS: Record<FieldStatus, string> = {
  awaiting: 'Field pending',
  confirmed: 'Field confirmed',
  live: 'Field set',
  complete: 'Field final',
  cancelled: 'Event canceled',
  unknown: 'Field status unknown',
}

/** Human label for an official-field lifecycle status, e.g. "Field confirmed". */
export function fieldLifecycleLabel(status: FieldStatus): string {
  return FIELD_LIFECYCLE_LABELS[status]
}

/** Badge tone for an official-field lifecycle status. */
export function fieldLifecycleTone(status: FieldStatus): Tone {
  switch (status) {
    case 'confirmed':
    case 'live':
      return 'success'
    case 'awaiting':
      return 'warning'
    case 'complete':
      return 'muted'
    case 'cancelled':
    case 'unknown':
      return 'muted'
  }
}

const FIELD_CONFIDENCE_LABELS: Record<FieldConfidence, string> = {
  official: 'Official field',
  awaiting: 'Provisional',
  unknown: 'Unconfirmed',
}

/** Short label for how certain the presented field is, e.g. "Official field". */
export function fieldConfidenceLabel(confidence: FieldConfidence): string {
  return FIELD_CONFIDENCE_LABELS[confidence]
}

/**
 * Format the PGA Tour commitment deadline in UTC time, e.g. "Fri, Apr 4, 5:00 PM".
 * Uses UTC for server/client consistency (Eastern time zone handling varies by platform).
 * Returns an em-dash when the deadline is unknown — never a fabricated time.
 */
export function formatCommitmentDeadline(value: string | null): string {
  if (!value) return EMPTY_VALUE
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const weekday = weekdays[date.getUTCDay()]
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${weekday}, ${month} ${day}, ${displayHours}:${minutes} ${ampm} UTC`
}

/**
 * Record timestamp display, e.g. "Apr 10, 2025, 3:45 PM", or an em-dash when
 * the value is missing/undefined (list rows omit timestamps).
 * Uses UTC to ensure server/client consistency.
 */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return EMPTY_VALUE
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${month} ${day}, ${year}, ${displayHours}:${minutes} ${ampm}`
}
