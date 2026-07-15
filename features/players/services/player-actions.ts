'use server'

/**
 * Server actions for the players feature.
 *
 * These are the boundary the client hooks call across. Each wraps the
 * server-only `playerService` (which reads the live database) and converts any
 * failure into a typed, serializable result so the UI can distinguish an empty
 * dataset from a database/unexpected error and render the right state.
 */

import type {
  FilterOption,
  PaginatedResult,
  Player,
  PlayerDetail,
  PlayerQuery,
} from '@/features/players/types'

import { playerService } from './player-service'

/** Discriminated result so the client never has to catch across the boundary. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'DATABASE_UNAVAILABLE' }

function logFailure(scope: string, error: unknown): void {
  // Structured, secret-free server log; the client only sees a coarse code.
  console.error(`[players] ${scope} failed:`, error instanceof Error ? error.message : error)
}

/** Fetch a filtered, paginated page of the live player directory. */
export async function fetchPlayers(
  query: PlayerQuery,
): Promise<ActionResult<PaginatedResult<Player>>> {
  try {
    return { ok: true, data: await playerService.getPlayers(query) }
  } catch (error) {
    logFailure('fetchPlayers', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}

/** Fetch a single live player's full detail, or null when not found. */
export async function fetchPlayerDetail(
  playerId: string,
): Promise<ActionResult<PlayerDetail | null>> {
  try {
    return { ok: true, data: await playerService.getPlayerById(playerId) }
  } catch (error) {
    logFailure('fetchPlayerDetail', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}

/** Fetch directory filter options that depend on live data (nationalities). */
export async function fetchNationalityOptions(): Promise<ActionResult<FilterOption[]>> {
  try {
    return { ok: true, data: await playerService.getNationalityOptions() }
  } catch (error) {
    logFailure('fetchNationalityOptions', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}

/**
 * Whether the tour filter should be offered. Tour classification is not present
 * for imported players, so the UI uses this to disable the control rather than
 * return misleading results. On error, defaults to unavailable (safe: no
 * incorrect filtering).
 */
export async function fetchTourFilterAvailable(): Promise<ActionResult<boolean>> {
  try {
    return { ok: true, data: await playerService.isTourFilterAvailable() }
  } catch (error) {
    logFailure('fetchTourFilterAvailable', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}
