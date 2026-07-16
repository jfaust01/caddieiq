/**
 * The four Model Lab metric pillars and their metadata.
 *
 * Each pillar maps 1:1 to an Analytics Engine metric (the `key` IS the analytics
 * key), so weighting a pillar directly re-weights that player's real analytics
 * score. There are deliberately only four — the exact set the Analytics Engine
 * computes — so the builder never offers a factor the platform cannot ground in
 * data.
 */

import type { MetricCategory, MetricGroupDefinition, MetricGroupKey } from '../types'

export const METRIC_GROUPS: MetricGroupDefinition[] = [
  {
    key: 'seasonPerformance',
    label: 'Season Performance',
    description: "Overall season standing — total fantasy output blended with world ranking.",
    metricKey: 'seasonPerformance',
    category: 'Season',
  },
  {
    key: 'recentForm',
    label: 'Recent Form',
    description: 'Current trajectory — world-ranking standing and week-over-week movement.',
    metricKey: 'recentForm',
    category: 'Form',
  },
  {
    key: 'fantasyProduction',
    label: 'Fantasy Production',
    description: 'Scoring rate — average fantasy points per event, relative to the field.',
    metricKey: 'fantasyProduction',
    category: 'Fantasy',
  },
  {
    key: 'consistency',
    label: 'Consistency',
    description: 'Reliability — the share of a player’s fantasy activity that is positive.',
    metricKey: 'consistency',
    category: 'Reliability',
  },
]

/** Fast lookup of a pillar's definition by key. */
export const METRIC_GROUP_BY_KEY: Record<MetricGroupKey, MetricGroupDefinition> =
  Object.fromEntries(METRIC_GROUPS.map((group) => [group.key, group])) as Record<
    MetricGroupKey,
    MetricGroupDefinition
  >

/** Ordered list of every pillar key. */
export const METRIC_GROUP_KEYS: MetricGroupKey[] = METRIC_GROUPS.map(
  (group) => group.key,
)

/** Pillars bucketed by category, preserving order. */
export function metricGroupsByCategory(): Array<{
  category: MetricCategory
  groups: MetricGroupDefinition[]
}> {
  const order: MetricCategory[] = ['Season', 'Form', 'Fantasy', 'Reliability']
  return order.map((category) => ({
    category,
    groups: METRIC_GROUPS.filter((group) => group.category === category),
  }))
}
