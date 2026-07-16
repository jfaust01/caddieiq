/**
 * Built-in Model Lab templates.
 *
 * Each template is an opinionated starting point users can preview or duplicate
 * into their own saved model. Every weight vector is expressed over the four
 * analytics pillars and sums to 100%. Because the pillars map directly to real
 * analytics, these presets produce genuine rankings the moment they run.
 */

import type { ModelTemplate } from '../types'
import { buildMetrics } from '../utils/weights'

export const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    key: 'overall',
    name: 'Overall',
    description: 'A balanced power ranking blending all four analytics pillars.',
    metrics: buildMetrics({
      seasonPerformance: 30,
      recentForm: 30,
      fantasyProduction: 25,
      consistency: 15,
    }),
  },
  {
    key: 'season-leaders',
    name: 'Season Leaders',
    description: 'Rewards the strongest bodies of work across the whole season.',
    metrics: buildMetrics({
      seasonPerformance: 55,
      fantasyProduction: 25,
      consistency: 20,
    }),
  },
  {
    key: 'hot-hand',
    name: 'Hot Hand',
    description: 'Chases current trajectory for week-to-week picks.',
    metrics: buildMetrics({
      recentForm: 60,
      seasonPerformance: 25,
      fantasyProduction: 15,
    }),
  },
  {
    key: 'fantasy-value',
    name: 'Fantasy Value',
    description: 'Prioritizes raw fantasy scoring rate for DFS and season-long play.',
    metrics: buildMetrics({
      fantasyProduction: 55,
      recentForm: 25,
      consistency: 20,
    }),
  },
  {
    key: 'steady-eddie',
    name: 'Steady Eddie',
    description: 'Favors dependable producers who rarely post a dud.',
    metrics: buildMetrics({
      consistency: 50,
      seasonPerformance: 30,
      fantasyProduction: 20,
    }),
  },
  {
    key: 'balanced',
    name: 'Balanced',
    description: 'Even-handed across every pillar — no strong lean.',
    metrics: buildMetrics({
      seasonPerformance: 25,
      recentForm: 25,
      fantasyProduction: 25,
      consistency: 25,
    }),
  },
]

/** Look up a template by its stable key. */
export function getTemplate(key: string): ModelTemplate | undefined {
  return MODEL_TEMPLATES.find((template) => template.key === key)
}
