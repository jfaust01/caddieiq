/**
 * Tournament Context Engine — public surface.
 *
 * The authoritative source of "which tournament is this player/page evaluating,
 * and how complete is that context?" Every event-specific model consumes
 * {@link tournamentContextService} rather than selecting a tournament itself.
 * See docs/TOURNAMENT_CONTEXT_ENGINE.md.
 */
export { tournamentContextService } from './service'
export { normalizeTournamentContext, type RawTournamentContext } from './context'
export {
  computeFieldReleaseTime,
  deriveFieldIntelligence,
  type FieldIntelligenceInput,
} from './field-status'
export {
  hasCourseContext,
  isContextAvailable,
  type ContextConfidence,
  type ContextCourse,
  type ContextGap,
  type ContextGapField,
  type ContextSource,
  type ContextTiming,
  type ContextTournament,
  type ContextUnavailableReason,
  type FieldConfidence,
  type FieldIntelligence,
  type FieldStatus,
  type TournamentContext,
  type TournamentContextAvailable,
  type TournamentContextUnavailable,
} from './types'
