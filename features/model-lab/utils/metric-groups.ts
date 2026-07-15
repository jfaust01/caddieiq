/**
 * The ten Model Lab metric groups and their metadata.
 *
 * Each group maps to an analytics module in the Ranking Engine. The three
 * strokes-gained sub-groups (`driving`, `putting`, `scrambling`) roll up into
 * the `strokes-gained` module when a model is evaluated (see `weights.ts`), so
 * users can express fine-grained preferences without the engine needing new
 * modules.
 */

import type { MetricGroupDefinition, MetricGroupKey } from '../types'

export const METRIC_GROUPS: MetricGroupDefinition[] = [
  {
    key: 'recent-form',
    label: 'Recent Form',
    description: 'Results and trajectory over the last several starts.',
    module: 'recent-form',
    category: 'Form',
  },
  {
    key: 'momentum',
    label: 'Momentum',
    description: 'How sharply a player is trending right now.',
    module: 'momentum',
    category: 'Form',
  },
  {
    key: 'course-fit',
    label: 'Course Fit',
    description: 'How well a player’s game suits the venue profile.',
    module: 'course-fit',
    category: 'Fit',
  },
  {
    key: 'strokes-gained',
    label: 'Strokes Gained',
    description: 'Total strokes gained across all facets of the game.',
    module: 'strokes-gained',
    category: 'Skill',
  },
  {
    key: 'driving',
    label: 'Driving',
    description: 'Distance and accuracy off the tee (rolls into Strokes Gained).',
    module: 'strokes-gained',
    category: 'Skill',
  },
  {
    key: 'putting',
    label: 'Putting',
    description: 'Strokes gained on the greens (rolls into Strokes Gained).',
    module: 'strokes-gained',
    category: 'Skill',
  },
  {
    key: 'scrambling',
    label: 'Scrambling',
    description: 'Getting up and down to save par (rolls into Strokes Gained).',
    module: 'strokes-gained',
    category: 'Skill',
  },
  {
    key: 'wind',
    label: 'Wind',
    description: 'Expected performance in windy conditions.',
    module: 'wind',
    category: 'Conditions',
  },
  {
    key: 'consistency',
    label: 'Consistency',
    description: 'Round-to-round reliability and low variance.',
    module: 'consistency',
    category: 'Conditions',
  },
  {
    key: 'value',
    label: 'Value',
    description: 'Model strength relative to market price.',
    module: 'value',
    category: 'Market',
  },
]

/** Fast lookup of a metric group's definition by key. */
export const METRIC_GROUP_BY_KEY: Record<MetricGroupKey, MetricGroupDefinition> =
  Object.fromEntries(METRIC_GROUPS.map((group) => [group.key, group])) as Record<
    MetricGroupKey,
    MetricGroupDefinition
  >

/** Ordered list of every metric group key. */
export const METRIC_GROUP_KEYS: MetricGroupKey[] = METRIC_GROUPS.map(
  (group) => group.key,
)

/** Metric groups bucketed by category, preserving order. */
export function metricGroupsByCategory(): Array<{
  category: MetricGroupDefinition['category']
  groups: MetricGroupDefinition[]
}> {
  const order: MetricGroupDefinition['category'][] = [
    'Form',
    'Fit',
    'Skill',
    'Conditions',
    'Market',
  ]
  return order.map((category) => ({
    category,
    groups: METRIC_GROUPS.filter((group) => group.category === category),
  }))
}
