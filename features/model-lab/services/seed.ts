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
      id: 'model-open-championship',
      name: 'My Open Championship',
      description:
        'Links-leaning build for The Open — wind control and scrambling weighted heavily.',
      origin: 'custom',
      templateKey: 'links-golf',
      favorite: true,
      metrics: metricsFromTemplate('links-golf'),
      versions: [
        {
          id: 'v-open-1',
          label: 'v1',
          note: 'Initial build from the Links Golf template.',
          metrics: metricsFromTemplate('links-golf'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'model-bomber-board',
      name: 'Bomber Board',
      description: 'Distance-first model for long, demanding setups.',
      origin: 'custom',
      templateKey: 'long-course',
      favorite: false,
      metrics: metricsFromTemplate('long-course'),
      versions: [
        {
          id: 'v-bomber-1',
          label: 'v1',
          metrics: metricsFromTemplate('long-course'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'model-hot-hand',
      name: 'Hot Hand',
      description: 'Chases form and momentum for week-to-week fantasy picks.',
      origin: 'custom',
      templateKey: 'recent-form',
      favorite: false,
      metrics: metricsFromTemplate('recent-form'),
      versions: [
        {
          id: 'v-hot-1',
          label: 'v1',
          metrics: metricsFromTemplate('recent-form'),
          createdAt: SEED_TIME,
        },
      ],
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
  ]
}
