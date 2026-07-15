import { describe, expect, it } from 'vitest'

import type {
  AnalyticsMetricKey,
  AnalyticsScore,
  PlayerAnalytics,
} from '@/lib/analytics/types'

import { rankPopulationByModel } from '../model-preview-calculator'

/** Build one analytics score for a metric. */
function score(key: AnalyticsMetricKey, value: number | null): AnalyticsScore {
  return {
    key,
    label: key,
    description: '',
    value,
    band: value === null ? null : 'SOLID',
    confidence: value === null ? 'none' : 'high',
  }
}

/**
 * Build a PlayerAnalytics from a partial map of the four pillar values. Any
 * pillar omitted is emitted as a null score, mirroring the real engine.
 */
function player(
  playerId: string,
  values: Partial<Record<AnalyticsMetricKey, number>>,
): PlayerAnalytics {
  const keys: AnalyticsMetricKey[] = [
    'seasonPerformance',
    'recentForm',
    'fantasyProduction',
    'consistency',
  ]
  return {
    playerId,
    season: 2025,
    sampleSize: 10,
    overallRating: null,
    overallBand: null,
    scores: keys.map((key) => score(key, values[key] ?? null)),
    isEmpty: false,
  }
}

describe('rankPopulationByModel', () => {
  it('orders players by the weighted blend of their real analytics', () => {
    const players = [
      player('a', { seasonPerformance: 90, recentForm: 50 }),
      player('b', { seasonPerformance: 40, recentForm: 100 }),
    ]
    // 70/30 toward season performance → a (0.7*90+0.3*50=78) beats b (0.7*40+0.3*100=58).
    const ranked = rankPopulationByModel(players, {
      seasonPerformance: 0.7,
      recentForm: 0.3,
    })

    expect(ranked.map((r) => r.playerId)).toEqual(['a', 'b'])
    expect(ranked[0]).toMatchObject({ rank: 1, playerId: 'a', score: 78 })
    expect(ranked[1]).toMatchObject({ rank: 2, playerId: 'b', score: 58 })
  })

  it('renormalizes over the pillars a player actually has data for', () => {
    // Player is missing recentForm entirely; the composite should be the season
    // score alone (renormalized), not dragged down by treating it as zero.
    const players = [player('a', { seasonPerformance: 80 })]
    const ranked = rankPopulationByModel(players, {
      seasonPerformance: 0.5,
      recentForm: 0.5,
    })

    expect(ranked).toHaveLength(1)
    expect(ranked[0].score).toBe(80)
  })

  it('excludes players with none of the weighted pillars', () => {
    const players = [
      player('has-data', { fantasyProduction: 60 }),
      player('no-data', { seasonPerformance: 95 }),
    ]
    // Model weights only fantasyProduction; the second player has no value there.
    const ranked = rankPopulationByModel(players, { fantasyProduction: 1 })

    expect(ranked.map((r) => r.playerId)).toEqual(['has-data'])
  })

  it('returns nothing when no pillars are weighted', () => {
    const players = [player('a', { seasonPerformance: 90 })]
    expect(rankPopulationByModel(players, {})).toEqual([])
  })

  it('gives tied composites the same rank and maps grades from the score', () => {
    const players = [
      player('a', { seasonPerformance: 90 }),
      player('b', { seasonPerformance: 90 }),
      player('c', { seasonPerformance: 40 }),
    ]
    const ranked = rankPopulationByModel(players, { seasonPerformance: 1 })

    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3])
    // 90 → "A" tier, 40 → "D+"/lower; assert the top two share the A-range grade.
    expect(ranked[0].grade).toBe(ranked[1].grade)
    expect(ranked[0].score).toBe(90)
    expect(ranked[2].score).toBe(40)
  })
})
