/**
 * Unit tests for the Course Analytics Service pure calculation functions.
 * No database I/O — tests the formulas directly.
 */
import { describe, it, expect } from 'vitest'

import {
  calculateConfidence,
  calculateDifficultyRating,
  calculateBirdieRating,
  calculateBogeyRating,
  calculateVolatilityRating,
  calculateDfsScoringRating,
  calculateAverageScoreToPar,
  calculateHistoricalRates,
  classifyCourseArchetype,
} from '../course-analytics-service'

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------
describe('calculateConfidence', () => {
  it('returns 0 for no data', () => {
    expect(calculateConfidence(0, 0)).toBe(0)
  })

  it('returns low confidence for 1 tournament', () => {
    const c = calculateConfidence(1, 50)
    expect(c).toBeGreaterThan(0)
    expect(c).toBeLessThan(0.5)
  })

  it('returns medium confidence for 5 tournaments', () => {
    const c = calculateConfidence(5, 300)
    expect(c).toBeGreaterThanOrEqual(0.4)
    expect(c).toBeLessThan(0.8)
  })

  it('returns high confidence for 10+ tournaments', () => {
    const c = calculateConfidence(10, 800)
    expect(c).toBeGreaterThanOrEqual(0.7)
    expect(c).toBeLessThanOrEqual(1)
  })

  it('caps at 1', () => {
    expect(calculateConfidence(100, 10000)).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------
describe('calculateDifficultyRating', () => {
  it('returns null for insufficient data', () => {
    expect(calculateDifficultyRating([1, 2, 3])).toBeNull()
  })

  it('returns 5.0 for average toPar of 0', () => {
    const scores = Array(20).fill(0)
    const rating = calculateDifficultyRating(scores)
    expect(rating).toBe(5)
  })

  it('returns higher rating for positive average toPar', () => {
    const scores = Array(20).fill(3) // avg +3 over par
    const rating = calculateDifficultyRating(scores)
    expect(rating).not.toBeNull()
    expect(rating!).toBeGreaterThan(5)
  })

  it('returns lower rating for negative average toPar', () => {
    const scores = Array(20).fill(-3) // avg -3 under par
    const rating = calculateDifficultyRating(scores)
    expect(rating).not.toBeNull()
    expect(rating!).toBeLessThan(5)
  })

  it('clamps to 1–10 range', () => {
    const hard = Array(20).fill(10)
    const easy = Array(20).fill(-10)
    expect(calculateDifficultyRating(hard)).toBe(10)
    expect(calculateDifficultyRating(easy)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Birdie Rating
// ---------------------------------------------------------------------------
describe('calculateBirdieRating', () => {
  it('returns null for insufficient rounds', () => {
    expect(calculateBirdieRating(30, 5)).toBeNull()
  })

  it('returns ~5 for Tour-average 3 birdies/round', () => {
    const rating = calculateBirdieRating(300, 100)
    expect(rating).not.toBeNull()
    expect(rating!).toBeCloseTo(5, 0)
  })

  it('returns higher for birdie-heavy courses', () => {
    const rating = calculateBirdieRating(600, 100) // 6 birdies/round
    expect(rating!).toBeGreaterThan(5)
  })
})

// ---------------------------------------------------------------------------
// Bogey Rating
// ---------------------------------------------------------------------------
describe('calculateBogeyRating', () => {
  it('returns null for insufficient rounds', () => {
    expect(calculateBogeyRating(25, 5)).toBeNull()
  })

  it('returns ~5 for Tour-average 2.5 bogeys/round', () => {
    const rating = calculateBogeyRating(250, 100)
    expect(rating).not.toBeNull()
    expect(rating!).toBeCloseTo(5, 0)
  })
})

// ---------------------------------------------------------------------------
// Volatility
// ---------------------------------------------------------------------------
describe('calculateVolatilityRating', () => {
  it('returns null for insufficient data', () => {
    expect(calculateVolatilityRating(Array(10).fill(0))).toBeNull()
  })

  it('returns low volatility for consistent scores', () => {
    const scores = Array(50).fill(0) // zero variance
    const rating = calculateVolatilityRating(scores)
    expect(rating!).toBe(1)
  })

  it('returns higher volatility for spread scores', () => {
    const scores: number[] = []
    for (let i = 0; i < 50; i++) scores.push(i % 2 === 0 ? -5 : 5)
    const rating = calculateVolatilityRating(scores)
    expect(rating!).toBeGreaterThan(5)
  })
})

// ---------------------------------------------------------------------------
// Historical Rates
// ---------------------------------------------------------------------------
describe('calculateHistoricalRates', () => {
  it('returns all nulls for insufficient data', () => {
    const r = calculateHistoricalRates(10, 1, 8, 5)
    expect(r.birdieRate).toBeNull()
    expect(r.bogeyRate).toBeNull()
    expect(r.eagleRate).toBeNull()
  })

  it('calculates correct rates', () => {
    // 100 rounds × 18 holes = 1800 holes, 270 birdies = 15% birdie rate.
    const r = calculateHistoricalRates(270, 5, 180, 100)
    expect(r.birdieRate).toBeCloseTo(0.15, 2)
    expect(r.bogeyRate).toBeCloseTo(0.1, 2)
    expect(r.eagleRate).toBeCloseTo(0.003, 3)
  })
})

// ---------------------------------------------------------------------------
// Course Archetype Classification
// ---------------------------------------------------------------------------
describe('classifyCourseArchetype', () => {
  it('returns null when confidence is too low', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 8,
      birdieRating: 3,
      bogeyRating: 7,
      volatilityRating: 4,
      confidenceScore: 0.05,
    })
    expect(result).toBeNull()
  })

  it('classifies Birdie Fest', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 4,
      birdieRating: 8,
      bogeyRating: 3,
      volatilityRating: 5,
      confidenceScore: 0.5,
    })
    expect(result).toBe('Birdie Fest')
  })

  it('classifies Major Championship Test', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 9,
      birdieRating: 3,
      bogeyRating: 6,
      volatilityRating: 4,
      confidenceScore: 0.5,
    })
    expect(result).toBe('Major Championship Test')
  })

  it('classifies Risk / Reward', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 6,
      birdieRating: 6,
      bogeyRating: 6,
      volatilityRating: 8,
      confidenceScore: 0.5,
    })
    expect(result).toBe('Risk / Reward')
  })

  it('classifies Short Game Challenge', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 7,
      birdieRating: 4,
      bogeyRating: 8,
      volatilityRating: 5,
      confidenceScore: 0.5,
    })
    expect(result).toBe('Short Game Challenge')
  })

  it('classifies Positional Course for low-variance moderate difficulty', () => {
    const result = classifyCourseArchetype({
      difficultyRating: 6,
      birdieRating: 5,
      bogeyRating: 5,
      volatilityRating: 3,
      confidenceScore: 0.5,
    })
    expect(result).toBe('Positional Course')
  })
})
