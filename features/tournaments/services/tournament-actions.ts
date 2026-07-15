'use server'

/**
 * Server actions for the tournaments feature.
 *
 * The boundary the client hooks call across. Each wraps the server-only
 * `tournamentService` (which reads the live database) and converts any failure
 * into a typed, serializable result so the UI can distinguish an empty dataset
 * from a database/unexpected error and render the right state.
 */

import type {
  FilterOption,
  PaginatedResult,
  TournamentQuery,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'

import { tournamentService } from './tournament-service'

/** Discriminated result so the client never has to catch across the boundary. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'DATABASE_UNAVAILABLE' }

function logFailure(scope: string, error: unknown): void {
  // Structured, secret-free server log; the client only sees a coarse code.
  console.error(`[tournaments] ${scope} failed:`, error instanceof Error ? error.message : error)
}

/** Fetch a filtered, paginated page of the live tournament schedule. */
export async function fetchTournaments(
  query: TournamentQuery,
): Promise<ActionResult<PaginatedResult<TournamentSummary>>> {
  try {
    return { ok: true, data: await tournamentService.getTournaments(query) }
  } catch (error) {
    logFailure('fetchTournaments', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}

/** Fetch tour filter options that depend on live data. */
export async function fetchTournamentTourOptions(): Promise<
  ActionResult<FilterOption<TourType | 'ALL'>[]>
> {
  try {
    return { ok: true, data: await tournamentService.getTourOptions() }
  } catch (error) {
    logFailure('fetchTournamentTourOptions', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}

/** Fetch season filter options that depend on live data. */
export async function fetchTournamentSeasonOptions(): Promise<ActionResult<FilterOption[]>> {
  try {
    return { ok: true, data: await tournamentService.getSeasonOptions() }
  } catch (error) {
    logFailure('fetchTournamentSeasonOptions', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}
