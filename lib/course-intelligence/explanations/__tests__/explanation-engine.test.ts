/**
 * Tests for explanation engine.
 * Verify deterministic generation and factor identification.
 */

import { describe, it, expect } from 'vitest'
import {
  generateAllExplanations,
  generateExplanationForMetric,
  getExplainableMetrics,
  validateExplanations,
} from '../explanation-engine'
import type { ExplanationGenerationInput } from '../types'

/**
 * Create a test input with realistic values.
 */
function createTestInput(overrides?: Partial<ExplanationGenerationInput>): ExplanationGenerationInput {
  return {
    courseId: 'test-course-123',
    overallDifficultyScore: 75,
    overallDifficultyStars: 4,
    drivingImportanceScore: 72,
    drivingImportanceStars: 4,
    approachImportanceScore: 65,
    approachImportanceStars: 3,
    shortGameImportanceScore: 60,
    shortGameImportanceStars: 3,
    puttingImportanceScore: 70,
    puttingImportanceStars: 4,
    windSensitivityScore: 45,
    windSensitivityStars: 2,
    penaltySeverityScore: 72,
    penaltySeverityStars: 4,
    birdiePotentialScore: 55,
    birdiePotentialStars: 3,
    scoringVolatilityScore: 62,
    scoringVolatilityStars: 3,
    par: 72,
    slope: 132,
    courseRating: 73.5,
    yardage: 6900,
    greenSize: 'Small',
    fairwayWidth: 'Narrow',
    linksStyle: false,
    elevation: 'Low',
    bunkerCount: 65,
    waterHazards: 3,
    handicapSpread: 18,
    parDistribution: {
      par3Count: 4,
      par4Count: 10,
      par5Count: 4,
    },
    reachablePar5s: 2,
    averageHoleLength: 385,
    ...overrides,
  }
}

describe('Explanation Engine', () => {
  describe('generateAllExplanations', () => {
    it('generates exactly 9 explanations', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input)

      expect(explanations).toHaveLength(9)
    })

    it('generates deterministic output', () => {
      const input = createTestInput()

      const first = generateAllExplanations(input)
      const second = generateAllExplanations(input)

      // Check all explanations match
      expect(first).toEqual(second)
    })

    it('includes all required metrics', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input)
      const metrics = explanations.map(e => e.metric)

      expect(metrics).toContain('overallDifficulty')
      expect(metrics).toContain('drivingImportance')
      expect(metrics).toContain('approachImportance')
      expect(metrics).toContain('shortGameImportance')
      expect(metrics).toContain('puttingImportance')
      expect(metrics).toContain('windSensitivity')
      expect(metrics).toContain('penaltySeverity')
      expect(metrics).toContain('birdiePotential')
      expect(metrics).toContain('scoringVolatility')
    })

    it('provides non-empty titles and summaries', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input)

      explanations.forEach(exp => {
        expect(exp.title).toBeTruthy()
        expect(exp.title.length).toBeGreaterThan(0)
        expect(exp.summary).toBeTruthy()
        expect(exp.summary.length).toBeGreaterThan(0)
      })
    })

    it('provides contributing factors', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input)

      explanations.forEach(exp => {
        expect(exp.contributingFactors).toBeDefined()
        expect(Array.isArray(exp.contributingFactors)).toBe(true)
        expect(exp.contributingFactors.length).toBeGreaterThan(0)
      })
    })

    it('generates challenging course explanations for high difficulty', () => {
      const input = createTestInput({
        overallDifficultyScore: 85,
        overallDifficultyStars: 5,
        yardage: 7300,
        slope: 145,
      })

      const explanations = generateAllExplanations(input)
      const difficultyExp = explanations.find(e => e.metric === 'overallDifficulty')

      expect(difficultyExp?.title).toMatch(/Extreme|Demanding/i)
    })

    it('generates accessible course explanations for low difficulty', () => {
      const input = createTestInput({
        overallDifficultyScore: 25,
        overallDifficultyStars: 2,
        yardage: 5200,
        slope: 105,
      })

      const explanations = generateAllExplanations(input)
      const difficultyExp = explanations.find(e => e.metric === 'overallDifficulty')

      expect(difficultyExp?.title).toMatch(/Accessible|Accommodating/i)
    })

    it('generates linked-style course explanations', () => {
      const input = createTestInput({
        windSensitivityScore: 75,
        windSensitivityStars: 5,
        linksStyle: true,
      })

      const explanations = generateAllExplanations(input)
      const windExp = explanations.find(e => e.metric === 'windSensitivity')

      expect(windExp?.summary).toMatch(/exposure|links/i)
    })
  })

  describe('generateExplanationForMetric', () => {
    it('generates explanation for valid metric', () => {
      const input = createTestInput()
      const explanation = generateExplanationForMetric(input, 'drivingImportance')

      expect(explanation).toBeDefined()
      expect(explanation?.metric).toBe('drivingImportance')
      expect(explanation?.title).toBeTruthy()
      expect(explanation?.summary).toBeTruthy()
    })

    it('returns null for unknown metric', () => {
      const input = createTestInput()
      const explanation = generateExplanationForMetric(input, 'unknownMetric' as any)

      expect(explanation).toBeNull()
    })

    it('generates consistent explanation for same metric', () => {
      const input = createTestInput()

      const first = generateExplanationForMetric(input, 'puttingImportance')
      const second = generateExplanationForMetric(input, 'puttingImportance')

      expect(first).toEqual(second)
    })
  })

  describe('getExplainableMetrics', () => {
    it('returns all 9 explainable metrics', () => {
      const metrics = getExplainableMetrics()

      expect(metrics).toHaveLength(9)
    })

    it('returns expected metric list', () => {
      const metrics = getExplainableMetrics()

      expect(metrics).toContain('overallDifficulty')
      expect(metrics).toContain('drivingImportance')
      expect(metrics).toContain('puttingImportance')
    })
  })

  describe('validateExplanations', () => {
    it('validates complete explanation set', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input)

      const validation = validateExplanations(explanations)

      expect(validation.valid).toBe(true)
      expect(validation.missing).toHaveLength(0)
    })

    it('detects missing explanations', () => {
      const input = createTestInput()
      const explanations = generateAllExplanations(input).slice(0, 5)

      const validation = validateExplanations(explanations)

      expect(validation.valid).toBe(false)
      expect(validation.missing.length).toBeGreaterThan(0)
    })
  })

  describe('Factor Identification', () => {
    it('identifies high slope as a factor', () => {
      const input = createTestInput({
        slope: 145,
        overallDifficultyScore: 85,
      })

      const explanations = generateAllExplanations(input)
      const difficultyExp = explanations.find(e => e.metric === 'overallDifficulty')

      expect(difficultyExp?.contributingFactors.some(f => f.includes('slope'))).toBe(true)
    })

    it('identifies long yardage as a factor', () => {
      const input = createTestInput({
        yardage: 7400,
        drivingImportanceScore: 78,
      })

      const explanations = generateAllExplanations(input)
      const drivingExp = explanations.find(e => e.metric === 'drivingImportance')

      expect(drivingExp?.contributingFactors.some(f => f.includes('yardage'))).toBe(true)
    })

    it('identifies narrow fairways as a factor', () => {
      const input = createTestInput({
        fairwayWidth: 'Narrow',
        drivingImportanceScore: 78,
      })

      const explanations = generateAllExplanations(input)
      const drivingExp = explanations.find(e => e.metric === 'drivingImportance')

      expect(drivingExp?.contributingFactors.some(f => f.includes('narrow|fairway'))).toBe(true)
    })

    it('identifies small greens as a factor', () => {
      const input = createTestInput({
        greenSize: 'Small',
        approachImportanceScore: 75,
      })

      const explanations = generateAllExplanations(input)
      const approachExp = explanations.find(e => e.metric === 'approachImportance')

      expect(approachExp?.contributingFactors.some(f => f.includes('small'))).toBe(true)
    })

    it('identifies multiple par 5s as a factor', () => {
      const input = createTestInput({
        parDistribution: {
          par3Count: 4,
          par4Count: 8,
          par5Count: 6,
        },
      })

      const explanations = generateAllExplanations(input)
      const birdiePotentialExp = explanations.find(e => e.metric === 'birdiePotential')

      expect(birdiePotentialExp?.contributingFactors.some(f => f.includes('par 5'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles minimal input gracefully', () => {
      const input = createTestInput({
        parDistribution: undefined,
      })

      const explanations = generateAllExplanations(input)

      expect(explanations).toHaveLength(9)
      explanations.forEach(exp => {
        expect(exp.title).toBeTruthy()
      })
    })

    it('handles extreme difficulty scores', () => {
      const input = createTestInput({
        overallDifficultyScore: 100,
        overallDifficultyStars: 5,
        slope: 150,
        yardage: 7500,
      })

      const explanations = generateAllExplanations(input)
      const difficultyExp = explanations.find(e => e.metric === 'overallDifficulty')

      expect(difficultyExp?.summary).toBeTruthy()
      expect(difficultyExp?.summary.length).toBeGreaterThan(0)
    })

    it('handles low difficulty scores', () => {
      const input = createTestInput({
        overallDifficultyScore: 0,
        overallDifficultyStars: 1,
        slope: 90,
        yardage: 5000,
      })

      const explanations = generateAllExplanations(input)
      const difficultyExp = explanations.find(e => e.metric === 'overallDifficulty')

      expect(difficultyExp?.summary).toBeTruthy()
    })
  })
})
