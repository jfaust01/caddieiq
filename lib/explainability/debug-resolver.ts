import 'server-only'

import { analyticsService } from '@/lib/analytics/service'
import { getDfsValueService } from '@/lib/dfs-value/service'
import { getOddsIntelligenceService } from '@/lib/odds-intelligence/service'
import { getPlayerSkillIntelligenceService } from '@/lib/player-skill-intelligence/service'
import { tournamentContextService } from '@/lib/tournament-context/service'
import { getWeatherIntelligenceService } from '@/lib/weather-intelligence/service'

import { toBettingValueExplanation } from './adapters/betting-value'
import { toDfsValueExplanation } from './adapters/dfs-value'
import { toOverallRatingExplanation } from './adapters/overall-rating'
import { toPlayerSkillExplanation } from './adapters/player-skill'
import { toTournamentContextExplanation } from './adapters/tournament-context'
import { toWeatherExplanation } from './adapters/weather-intelligence'
import { getModelMeta, MODELS } from './registry'
import type { Explanation, ExplanationSubject, ModelId } from './types'

/** The kind of entity a debug lookup targets. */
export type DebugEntityKind = 'player' | 'tournament'

/** Which entity kind each model can be resolved against in the debug view. */
export const MODEL_ENTITY_KIND: Record<ModelId, DebugEntityKind> = {
  'overall-rating': 'player',
  'course-fit': 'player',
  'dfs-value': 'player',
  'betting-value': 'player',
  'fantasy-projection': 'player',
  'player-skill': 'player',
  'weather-intelligence': 'tournament',
  'tournament-context': 'tournament',
}

/**
 * Outcome of a debug resolution. `resolved` carries the canonical Explanation;
 * `unavailable` explains — honestly — why one could not be produced (no data,
 * or the model has no standalone server-side resolver and is only explainable
 * in-context on its own surface).
 */
export type DebugResolution =
  | { status: 'resolved'; explanation: Explanation }
  | { status: 'unavailable'; reason: string }

function subjectFor(
  kind: DebugEntityKind,
  id: string,
  label: string,
): ExplanationSubject {
  return { kind: kind === 'player' ? 'player' : 'tournament', id, label }
}

/**
 * Resolve a single model's Explanation for a given entity, reusing the exact
 * same service methods the production surfaces call. Pure adapters guarantee
 * the debug view shows precisely what users see — never a re-derived variant.
 */
export async function resolveDebugExplanation(
  modelId: ModelId,
  entityId: string,
  entityLabel: string,
): Promise<DebugResolution> {
  const subject = subjectFor(MODEL_ENTITY_KIND[modelId], entityId, entityLabel)

  try {
    switch (modelId) {
      case 'overall-rating': {
        const analytics = await analyticsService.getPlayerAnalytics(entityId)
        return { status: 'resolved', explanation: toOverallRatingExplanation(analytics, subject) }
      }
      case 'dfs-value': {
        const value = await getDfsValueService().getPlayerValue(entityId)
        if (!value) return { status: 'unavailable', reason: 'No DFS value row for this player. They may not be in an upcoming field with salary data.' }
        return { status: 'resolved', explanation: toDfsValueExplanation(value.result, subject) }
      }
      case 'player-skill': {
        const profile = await getPlayerSkillIntelligenceService().getPlayerProfile(entityId)
        return { status: 'resolved', explanation: toPlayerSkillExplanation(profile, subject) }
      }
      case 'betting-value': {
        const view = await getOddsIntelligenceService().getPlayerOddsView(entityId)
        if (!view) return { status: 'unavailable', reason: 'No odds view for this player. Betting markets may not be posted for their next start.' }
        return { status: 'resolved', explanation: toBettingValueExplanation(view, subject) }
      }
      case 'weather-intelligence': {
        const intel = await getWeatherIntelligenceService().getForTournament(entityId)
        return { status: 'resolved', explanation: toWeatherExplanation(intel, subject) }
      }
      case 'tournament-context': {
        const context = await tournamentContextService.getTournamentContext(entityId)
        return { status: 'resolved', explanation: toTournamentContextExplanation(context, subject) }
      }
      case 'course-fit':
        return {
          status: 'unavailable',
          reason:
            'Course Fit is computed per field, not per player in isolation. View it in-context on a tournament\u2019s Field Fit board, where every row exposes its own "Why?" breakdown.',
        }
      case 'fantasy-projection':
        return {
          status: 'unavailable',
          reason:
            'Fantasy Projection is an ingested provider value with no standalone per-player resolver. It is explained in-context wherever a projection is displayed.',
        }
      default: {
        // Exhaustiveness guard.
        const _never: never = modelId
        return { status: 'unavailable', reason: `Unknown model: ${String(_never)}` }
      }
    }
  } catch {
    // Never leak internals to the debug UI; report an honest, generic failure.
    return {
      status: 'unavailable',
      reason: `The ${getModelMeta(modelId).label} service failed to resolve this entity. The underlying data may be missing or the pipeline may not have run.`,
    }
  }
}

/** Model options grouped by the entity kind they resolve against, for the picker. */
export function debugModelOptions() {
  return MODELS.map((meta) => ({
    id: meta.id,
    label: meta.label,
    methodology: meta.methodology,
    entityKind: MODEL_ENTITY_KIND[meta.id],
  }))
}
