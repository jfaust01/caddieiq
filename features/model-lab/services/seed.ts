/**
 * Seed data for the Model Lab.
 *
 * Provides a small set of realistic saved models so the workspace feels
 * populated on first load. Ids are stable so `/model-lab/[modelId]` deep links
 * resolve. Everything here is mock, in-memory client state.
 *
 * TODO(data): replace with the authenticated user's persisted models.
 */

import type { Model, ModelMetric } from '../types'
import { getTemplate } from '../templates'

const SEED_TIME = '2025-07-10T14:30:00.000Z'

function metricsFromTemplate(key: string): ModelMetric[] {
  const template = getTemplate(key)
  return template ? template.metrics.map((metric) => ({ ...metric })) : []
}

export function createSeedModels(): Model[] {
  return [
    {
      id: 'model-season-leaders',
      name: 'My Season Leaders',
      description:
        'Season-long body of work first, with fantasy scoring and reliability behind it.',
      origin: 'custom',
      templateKey: 'season-leaders',
      favorite: true,
      metrics: metricsFromTemplate('season-leaders'),
      versions: [
        {
          id: 'v-season-1',
          label: 'v1',
          note: 'Initial build from the Season Leaders template.',
          metrics: metricsFromTemplate('season-leaders'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'model-fantasy-value',
      name: 'DFS Value Board',
      description: 'Fantasy scoring rate first, for weekly DFS lineups.',
      origin: 'custom',
      templateKey: 'fantasy-value',
      favorite: false,
      metrics: metricsFromTemplate('fantasy-value'),
      versions: [
        {
          id: 'v-value-1',
          label: 'v1',
          metrics: metricsFromTemplate('fantasy-value'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'model-hot-hand',
      name: 'Hot Hand',
      description: 'Chases recent form for week-to-week fantasy picks.',
      origin: 'custom',
      templateKey: 'hot-hand',
      favorite: false,
      metrics: metricsFromTemplate('hot-hand'),
      versions: [
        {
          id: 'v-hot-1',
          label: 'v1',
          metrics: metricsFromTemplate('hot-hand'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
  ]
}
