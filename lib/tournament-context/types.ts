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

/**
 * Where an event sits in the **official field lifecycle** — the answer to
 * *"has the official PGA Tour field been released for this event yet?"* This is
 * distinct from {@link ContextTiming} (which places the event in time): a
 * scheduled event that is still `UPCOMING` can be either `awaiting` (no official
 * field yet) or `confirmed` (the field has been published and imported).
 *
 * - `awaiting`  — a scheduled event whose official field has not been published.
 *                 Players commit until 5:00 PM ET the Friday before tournament
 *                 week; the Tour publishes the field shortly after. Not an error.
 * - `confirmed` — the official field has been released and imported.
 * - `live`      — the tournament is in progress; field messaging is retired.
 * - `complete`  — the tournament has finished; the field is archived.
 * - `cancelled` — the event was cancelled.
 * - `unknown`   — the lifecycle cannot be placed (e.g. no start date and no
 *                 field yet). Honest absence, never a guess.
 */
export type FieldStatus =
  | 'awaiting'
  | 'confirmed'
  | 'live'
  | 'complete'
  | 'cancelled'
  | 'unknown'

/**
 * Confidence that the field CaddieIQ is presenting is the **final, official**
 * field. Downstream field-dependent models (DFS Value, field boards) use this to
 * decide whether they may present finalized rankings.
 *
 * - `official` — the released, official field (confirmed / live / complete).
 * - `awaiting` — the official field has not been published yet; anything shown
 *                is provisional and must not be presented as final.
 * - `unknown`  — insufficient information to judge (e.g. cancelled, or no dates).
 */
export type FieldConfidence = 'official' | 'awaiting' | 'unknown'

/**
 * The official-field lifecycle facts attached to an available context. Every
 * field-dependent surface reads these instead of re-deriving "is the field
 * out?" on its own. See docs/TOURNAMENT_FIELD_INTELLIGENCE.md.
 */
export interface FieldIntelligence {
  /** Where the event sits in the official field lifecycle. */
  fieldStatus: FieldStatus
  /** Whether an official field (roster) has been imported for the event. */
  fieldConfirmed: boolean
  /**
   * The PGA Tour commitment deadline (5:00 PM ET the Friday before tournament
   * week), derived from the start date, as an ISO instant. The official field
   * is typically published shortly after. `null` when the start date is unknown.
   */
  fieldReleaseTime: string | null
  /** Certainty that the presented field is the final, official one. */
  fieldConfidence: FieldConfidence
  /**
   * Count of imported (non-withdrawn) entrants when known, else `null`. `null`
   * is honest "not published / not counted yet", never `0`-as-a-guess.
   */
  fieldPlayerCount: number | null
}

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
  /** Where the event sits in the official field lifecycle. */
  fieldStatus: FieldStatus
  /**
   * The PGA Tour commitment deadline (5:00 PM ET the Friday before tournament
   * week) as an ISO instant, or `null` when the start date is unknown.
   */
  fieldReleaseTime: string | null
  /** Certainty that the presented field is the final, official one. */
  fieldConfidence: FieldConfidence
  /** Imported (non-withdrawn) entrant count when known, else `null`. */
  fieldPlayerCount: number | null
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
