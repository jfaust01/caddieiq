/**
 * Built-in Model Lab templates.
 *
 * Each template is a realistic, opinionated starting point users can preview or
 * duplicate into their own saved model. Weight vectors sum to 100% across the
 * ten metric groups and are deliberate but illustrative.
 *
 * TODO(analytics): calibrate these weights against backtested output once real
 * analytics feed the Ranking Engine.
 */

import type { ModelTemplate } from '../types'
import { buildMetrics } from '../utils/weights'

export const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    key: 'overall',
    name: 'Overall',
    description: 'A balanced power ranking blending every core signal.',
    metrics: buildMetrics({
      'recent-form': 20,
      'strokes-gained': 25,
      'course-fit': 15,
      consistency: 15,
      momentum: 10,
      value: 10,
      wind: 5,
    }),
  },
  {
    key: 'major-championship',
    name: 'Major Championship',
    description: 'Rewards elite ball-striking and grit under the toughest setups.',
    metrics: buildMetrics({
      'strokes-gained': 25,
      driving: 15,
      'course-fit': 15,
      consistency: 20,
      'recent-form': 15,
      putting: 10,
    }),
  },
  {
    key: 'links-golf',
    name: 'Links Golf',
    description: 'Built for seaside links: wind control and creative scrambling.',
    metrics: buildMetrics({
      wind: 30,
      scrambling: 20,
      'course-fit': 20,
      driving: 15,
      consistency: 15,
    }),
  },
  {
    key: 'birdie-fest',
    name: 'Birdie Fest',
    description: 'Tuned for low-scoring weeks where making birdies is everything.',
    metrics: buildMetrics({
      'strokes-gained': 25,
      putting: 25,
      'recent-form': 20,
      momentum: 15,
      driving: 15,
    }),
  },
  {
    key: 'ball-strikers',
    name: 'Ball Strikers',
    description: 'Prioritizes tee-to-green excellence over the flat stick.',
    metrics: buildMetrics({
      'strokes-gained': 30,
      driving: 25,
      'course-fit': 20,
      consistency: 15,
      scrambling: 10,
    }),
  },
  {
    key: 'wind-specialists',
    name: 'Wind Specialists',
    description: 'Surfaces players who thrive when conditions turn nasty.',
    metrics: buildMetrics({
      wind: 40,
      consistency: 20,
      'strokes-gained': 20,
      scrambling: 20,
    }),
  },
  {
    key: 'short-course',
    name: 'Short Course',
    description: 'Emphasizes wedge play and putting on a shorter, scorable track.',
    metrics: buildMetrics({
      putting: 30,
      scrambling: 25,
      'recent-form': 20,
      'strokes-gained': 15,
      momentum: 10,
    }),
  },
  {
    key: 'long-course',
    name: 'Long Course',
    description: 'Favors length and power on a demanding, long layout.',
    metrics: buildMetrics({
      driving: 35,
      'strokes-gained': 25,
      'course-fit': 20,
      consistency: 20,
    }),
  },
  {
    key: 'recent-form',
    name: 'Recent Form',
    description: 'Leans hard on results and trajectory over the last few starts.',
    metrics: buildMetrics({
      'recent-form': 45,
      momentum: 30,
      'strokes-gained': 15,
      'course-fit': 10,
    }),
  },
  {
    key: 'balanced',
    name: 'Balanced',
    description: 'Even-handed across every metric group — no strong lean.',
    metrics: buildMetrics({
      'recent-form': 12,
      momentum: 10,
      'course-fit': 12,
      'strokes-gained': 12,
      driving: 10,
      putting: 10,
      scrambling: 8,
      wind: 8,
      consistency: 10,
      value: 8,
    }),
  },
]

/** Look up a template by its stable key. */
export function getTemplate(key: string): ModelTemplate | undefined {
  return MODEL_TEMPLATES.find((template) => template.key === key)
}
