/**
 * TournamentContextService — the single authoritative source of tournament
 * context.
 *
 * Every event-specific model (Course Fit today; Weather, DFS Value, Betting
 * Value, and AI Coach next) resolves *which* tournament to evaluate through this
 * service and nowhere else. There is exactly one place that selects a player's
 * active event and one place that normalizes a tournament into a context, so no
 * two surfaces can disagree about the context or duplicate the selection logic.
 *
 * It reads only through repositories (the sole layer allowed to touch the
 * database), maps their rows into the pure normalizer's input, and returns the
 * normalized {@link TournamentContext}. The `server-only` import guarantees it
 * can never be pulled into a client bundle. Reads are wrapped in React `cache`
 * so a route that resolves the same context more than once per request (e.g. in
 * `generateMetadata` and the page) hits the database only once.
 *
 * See docs/TOURNAMENT_CONTEXT_ENGINE.md.
 */

import 'server-only'

import { cache } from 'react'

import { getPlayerRepository } from '@/lib/repositories/player-repository'
import { getTournamentRepository } from '@/lib/repositories/tournament-repository'

import { normalizeTournamentContext, type RawTournamentContext } from './context'
import type { TournamentContext } from './types'

/**
 * Resolve a player's single active tournament context: the host course of their
 * **next upcoming** event they are confirmed in. Forward-looking by design — a
 * past event is never selected. Returns an `unavailable` context (never a
 * fabricated one) when the player is in no upcoming field.
 */
const getPlayerActiveContextCached = cache(
  async (playerId: string): Promise<TournamentContext> => {
    const row = await getPlayerRepository().findUpcomingContextById(playerId)
    const raw: RawTournamentContext = {
      source: 'player',
      tournament: row
        ? {
            id: row.tournamentId,
            name: row.tournamentName,
            slug: row.tournamentSlug,
            status: row.tournamentStatus,
            startDate: row.startDate,
            endDate: row.endDate,
          }
        : null,
      course: row && row.courseId && row.courseName ? { id: row.courseId, name: row.courseName } : null,
      // Resolved via the player's field entry, so the field is always confirmed.
      fieldConfirmed: Boolean(row),
    }
    return normalizeTournamentContext(raw)
  },
)

/**
 * Resolve the context for a specific tournament (the tournament page and its
 * models). Produces the *same* normalized shape as the player resolver, so a
 * downstream model consumes an identical object regardless of entry point.
 */
const getTournamentContextCached = cache(
  async (tournamentId: string): Promise<TournamentContext> => {
    const row = await getTournamentRepository().findContextById(tournamentId)
    const raw: RawTournamentContext = {
      source: 'tournament',
      tournament: row
        ? {
            id: row.tournamentId,
            name: row.tournamentName,
            slug: row.tournamentSlug,
            status: row.tournamentStatus,
            startDate: row.startDate,
            endDate: row.endDate,
          }
        : null,
      course: row && row.courseId && row.courseName ? { id: row.courseId, name: row.courseName } : null,
      fieldConfirmed: Boolean(row && row.fieldCount > 0),
      // The tournament source knows the exact imported (non-withdrawn) count.
      fieldPlayerCount: row && row.fieldCount > 0 ? row.fieldCount : null,
    }
    return normalizeTournamentContext(raw)
  },
)

export const tournamentContextService = {
  /**
   * The player's next upcoming, in-field tournament context. This is the only
   * place a player's active event is selected. Reads through the repository —
   * never fabricates a tournament or course.
   */
  getPlayerActiveContext(playerId: string): Promise<TournamentContext> {
    return getPlayerActiveContextCached(playerId)
  },

  /**
   * The context for a specific tournament id, for the tournament hub and its
   * event-specific models. Reads through the repository — never fabricates data.
   */
  getTournamentContext(tournamentId: string): Promise<TournamentContext> {
    return getTournamentContextCached(tournamentId)
  },
}
