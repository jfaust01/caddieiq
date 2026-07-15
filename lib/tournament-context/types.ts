/**
 * Tournament Context Engine — shared types.
 *
 * The Tournament Context is the single authoritative answer to the question
 * *"which tournament is this player (or page) currently evaluating, and how
 * complete is that context?"* Every event-specific model — Course Fit, Weather,
 * DFS Value, Betting Value, AI Coach — consumes this object instead of
 * independently deciding which tournament to score. See
 * docs/TOURNAMENT_CONTEXT_ENGINE.md.
 *
 * The engine follows the same governing principle as the rest of the platform
 * (see docs/MODELS.md): **never fabricate context.** When a required input is
 * missing the engine returns an explicit `unavailable` state with a
 * machine-readable reason, never a guessed tournament or course.
 */

/**
 * Confidence in the resolved context. This is the **ceiling** for every
 * downstream model: a model can never present more certainty than the context
 * it was built on.
 *
 * - `verified`  — a real, existing tournament with a linked host course and a
 *                 known start date. All course-dependent models can run.
 * - `partial`   — a real tournament is identified, but something course-related
 *                 is missing (no linked host course, or no start date), so
 *                 course-dependent models must degrade rather than compute.
 * - `unavailable` — no tournament could be resolved; nothing downstream may run.
 */
export type ContextConfidence = 'verified' | 'partial' | 'unavailable'

/** Which surface asked for the context (drives the unavailable copy). */
export type ContextSource = 'player' | 'tournament'

/**
 * Where the resolved event sits in time relative to now. Derived from the
 * tournament's start/end dates; used by downstream models to decide whether a
 * forward-looking signal is meaningful.
 */
export type ContextTiming = 'UPCOMING' | 'LIVE' | 'COMPLETED'

/** Why a context is unavailable — machine-readable, never a free-form guess. */
export type ContextUnavailableReason =
  /** Player source: the player is not in the field of any upcoming event. */
  | 'no-upcoming-tournament'
  /** Tournament source: the tournament id does not resolve to a live row. */
  | 'tournament-missing'

/** A single missing-but-non-fatal input that lowers confidence to `partial`. */
export type ContextGapField = 'course' | 'startDate' | 'endDate' | 'field'

/** A recorded gap in the context, with human-readable detail for the UI. */
export interface ContextGap {
  field: ContextGapField
  detail: string
}

/** The resolved tournament (verified DB facts only; dates are ISO strings). */
export interface ContextTournament {
  id: string
  name: string
  slug: string
  /** Database `TournamentStatus` text (e.g. `"SCHEDULED"`). */
  status: string
  startDate: string | null
  endDate: string | null
}

/** The resolved host course, when one is linked. */
export interface ContextCourse {
  id: string
  name: string
}

/** A successfully resolved context: a real tournament, with gaps made explicit. */
export interface TournamentContextAvailable {
  status: 'available'
  confidence: 'verified' | 'partial'
  source: ContextSource
  timing: ContextTiming
  tournament: ContextTournament
  /** The host course, or `null` when the event has none linked yet. */
  course: ContextCourse | null
  /** Whether a field (roster) has been imported for the event. */
  fieldConfirmed: boolean
  /** Every missing input that kept this from being fully `verified`. */
  gaps: ContextGap[]
}

/** No context could be resolved — downstream models must not run. */
export interface TournamentContextUnavailable {
  status: 'unavailable'
  confidence: 'unavailable'
  source: ContextSource
  reason: ContextUnavailableReason
  /** Plain-English explanation, safe to render directly. */
  detail: string
}

/** The single context object every event-specific model consumes. */
export type TournamentContext = TournamentContextAvailable | TournamentContextUnavailable

/** Narrow a context to its available form. */
export function isContextAvailable(
  context: TournamentContext,
): context is TournamentContextAvailable {
  return context.status === 'available'
}

/**
 * True when the context is complete enough for a **course-dependent** model
 * (Course Fit, Course Intelligence, Weather) to run: a verified context always
 * has a linked course. Downstream code should gate on this rather than
 * re-deriving the rule.
 */
export function hasCourseContext(
  context: TournamentContext,
): context is TournamentContextAvailable & { course: ContextCourse } {
  return context.status === 'available' && context.confidence === 'verified' && context.course !== null
}
