/**
 * Tournament Context Engine — pure normalizer.
 *
 * This module owns the **single** set of rules that turn raw, verified database
 * facts into a normalized {@link TournamentContext} with a confidence grade. It
 * has no I/O and no dependency on the persistence layer, so the confidence rules
 * are unit-testable in isolation and identical for every caller (player page,
 * tournament page, and future models). See docs/TOURNAMENT_CONTEXT_ENGINE.md.
 *
 * Confidence is derived, never assumed:
 * - `verified`  — tournament + linked host course + a known start date.
 * - `partial`   — tournament resolved, but the course and/or start date is
 *                 missing (course-dependent models degrade).
 * - `unavailable` — no tournament resolved at all.
 *
 * A missing field (roster) is recorded as a gap but does not by itself lower a
 * course-complete context below `verified`; field-dependent consumers (DFS,
 * field boards) additionally check `fieldConfirmed`.
 */

import type {
  ContextGap,
  ContextSource,
  ContextTiming,
  TournamentContext,
} from './types'

/**
 * Source-agnostic input to the normalizer: verified facts only. The service
 * layer maps repository rows into this shape; `tournament` is `null` when no
 * row could be resolved (the sole trigger for an `unavailable` result).
 */
export interface RawTournamentContext {
  source: ContextSource
  tournament: {
    id: string
    name: string
    slug: string
    status: string
    startDate: Date | null
    endDate: Date | null
  } | null
  course: { id: string; name: string } | null
  /** Whether a field (roster) exists for the event. */
  fieldConfirmed: boolean
}

/** Derive where the event sits in time from its dates (and status as a hint). */
function deriveTiming(startDate: Date | null, endDate: Date | null): ContextTiming {
  const now = Date.now()
  const start = startDate ? startDate.getTime() : null
  const end = endDate ? endDate.getTime() : null

  if (start !== null && start > now) return 'UPCOMING'
  if (end !== null && end < now) return 'COMPLETED'
  // Started (or start unknown) and not yet ended → treat as live/in-window.
  if (start !== null && start <= now) return 'LIVE'
  return 'UPCOMING'
}

/**
 * Normalize verified facts into the authoritative {@link TournamentContext}.
 * Pure and total: it never throws and always returns a fully-shaped result.
 */
export function normalizeTournamentContext(raw: RawTournamentContext): TournamentContext {
  // No resolvable tournament → the only unavailable case. Never fabricated.
  if (!raw.tournament) {
    return {
      status: 'unavailable',
      confidence: 'unavailable',
      source: raw.source,
      reason: raw.source === 'player' ? 'no-upcoming-tournament' : 'tournament-missing',
      detail:
        raw.source === 'player'
          ? 'No verified upcoming tournament. This player is not confirmed in the field of any scheduled event.'
          : 'This tournament could not be resolved.',
    }
  }

  const { tournament, course, fieldConfirmed } = raw
  const gaps: ContextGap[] = []

  if (!course) {
    gaps.push({ field: 'course', detail: 'No host course is linked to this tournament yet.' })
  }
  if (!tournament.startDate) {
    gaps.push({ field: 'startDate', detail: 'The tournament start date is not recorded.' })
  }
  if (!tournament.endDate) {
    gaps.push({ field: 'endDate', detail: 'The tournament end date is not recorded.' })
  }
  if (!fieldConfirmed) {
    gaps.push({ field: 'field', detail: 'No field has been imported for this tournament yet.' })
  }

  // `verified` requires everything a course-dependent model needs: a real
  // course and a known start date. Anything short of that is `partial`.
  const isVerified = course !== null && tournament.startDate !== null
  const confidence: 'verified' | 'partial' = isVerified ? 'verified' : 'partial'

  return {
    status: 'available',
    confidence,
    source: raw.source,
    timing: deriveTiming(tournament.startDate, tournament.endDate),
    tournament: {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      status: tournament.status,
      startDate: tournament.startDate ? tournament.startDate.toISOString() : null,
      endDate: tournament.endDate ? tournament.endDate.toISOString() : null,
    },
    course: course ? { id: course.id, name: course.name } : null,
    fieldConfirmed,
    gaps,
  }
}
