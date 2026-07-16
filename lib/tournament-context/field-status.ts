/**
 * Tournament Context Engine — official field lifecycle (pure).
 *
 * This module owns the **single** set of rules that answer *"has the official
 * PGA Tour field been released for this event, and how confident are we in it?"*
 * It has no I/O: the service layer passes verified database facts and the
 * current time, and this returns a normalized {@link FieldIntelligence}. Keeping
 * it pure means the lifecycle rules and the commitment-deadline math are
 * unit-testable in isolation and identical for every consumer (the Tournament
 * Page banner, the admin diagnostics panel, and downstream field-dependent
 * models). See docs/TOURNAMENT_FIELD_INTELLIGENCE.md.
 *
 * Background: for PGA Tour events, players have until **5:00 PM Eastern Time on
 * the Friday before tournament week** to officially commit. The Tour publishes
 * the official field shortly after that deadline. Until then the field is
 * unofficial and participation can change — so an event with no imported field
 * is `awaiting`, not an error.
 */

import type { FieldConfidence, FieldIntelligence, FieldStatus } from './types'

const ET_ZONE = 'America/New_York'

/** Verified facts the lifecycle rules operate on. Times are real `Date`s. */
export interface FieldIntelligenceInput {
  /** Database `TournamentStatus` text (e.g. `"SCHEDULED"`, `"ACTIVE"`). */
  status: string
  startDate: Date | null
  endDate: Date | null
  /** Whether an official field (roster) has been imported for the event. */
  fieldConfirmed: boolean
  /** Known imported (non-withdrawn) entrant count, or `null` when not counted. */
  fieldPlayerCount: number | null
}

/** The ET calendar Y/M/D of an instant (month is 0-based). */
function etDateParts(date: Date): { year: number; month0: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) map[part.type] = part.value
  return { year: Number(map.year), month0: Number(map.month) - 1, day: Number(map.day) }
}

/** Milliseconds a timezone is ahead of UTC at the given instant (negative for ET). */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) map[part.type] = part.value
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  )
  return asUtc - date.getTime()
}

/**
 * Convert an ET wall-clock time (year/month0/day hh:mm) into the exact UTC
 * instant. Measures the ET offset at the candidate instant and corrects once —
 * accurate outside the ~1-hour DST transition window, which never overlaps the
 * 5:00 PM deadline.
 */
function etWallClockToUtc(
  year: number,
  month0: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guess = Date.UTC(year, month0, day, hour, minute)
  const offset = tzOffsetMs(new Date(guess), ET_ZONE)
  return new Date(guess - offset)
}

/**
 * The PGA Tour commitment deadline for an event: **5:00 PM ET on the Friday
 * before tournament week**. Tournament week is the calendar week (Mon–Sun)
 * containing the start date; the deadline Friday is the Friday of the prior
 * week (three days before that week's Monday). Pure and deterministic.
 */
export function computeFieldReleaseTime(startDate: Date): Date {
  const { year, month0, day } = etDateParts(startDate)
  // Day-of-week of the start date on the ET calendar (0=Sun … 6=Sat).
  const dow = new Date(Date.UTC(year, month0, day)).getUTCDay()
  const daysFromMonday = (dow + 6) % 7 // Mon→0 … Sun→6
  const daysBackToFriday = daysFromMonday + 3 // back to the prior Friday
  const friday = new Date(Date.UTC(year, month0, day - daysBackToFriday))
  return etWallClockToUtc(
    friday.getUTCFullYear(),
    friday.getUTCMonth(),
    friday.getUTCDate(),
    17,
    0,
  )
}

/**
 * Normalize verified facts into the official-field {@link FieldIntelligence}.
 * Pure and total: never throws, always returns a fully-shaped result. `now` is
 * injectable so the lifecycle can be tested deterministically.
 */
export function deriveFieldIntelligence(
  input: FieldIntelligenceInput,
  now: number = Date.now(),
): FieldIntelligence {
  const { status, startDate, endDate, fieldConfirmed } = input
  const playerCount = input.fieldPlayerCount

  const releaseTime = startDate ? computeFieldReleaseTime(startDate).toISOString() : null

  const result = (fieldStatus: FieldStatus, fieldConfidence: FieldConfidence): FieldIntelligence => ({
    fieldStatus,
    fieldConfirmed,
    fieldReleaseTime: releaseTime,
    fieldConfidence,
    // Only surface a count once the field is genuinely known; otherwise honest null.
    fieldPlayerCount: fieldConfirmed && typeof playerCount === 'number' ? playerCount : null,
  })

  // Cancelled is terminal and independent of dates.
  if (status === 'CANCELED') return result('cancelled', 'unknown')

  const start = startDate ? startDate.getTime() : null
  const end = endDate ? endDate.getTime() : null

  const isComplete = status === 'COMPLETED' || (end !== null && end < now)
  if (isComplete) return result('complete', fieldConfirmed ? 'official' : 'unknown')

  const isLive =
    status === 'ACTIVE' || (start !== null && start <= now && (end === null || end >= now))
  if (isLive) return result('live', fieldConfirmed ? 'official' : 'unknown')

  // Upcoming (or indeterminate) from here on.
  if (fieldConfirmed) return result('confirmed', 'official')
  // A known upcoming event with no field yet is honestly "awaiting", not an error.
  if (start !== null) return result('awaiting', 'awaiting')
  // No date and no field: the lifecycle cannot be placed. Never guessed.
  return result('unknown', 'unknown')
}
