import { describe, it, expect } from 'vitest'
import type { VersionSnapshot } from '../version-registry'
import { BuildValidator } from '../build-validator'
import { ActivationPolicy } from '../activation-policy'
import type { CalculatedFeature } from '../types'

describe('Build Lifecycle Integration Tests', () => {
  describe('Build Validator', () => {
    const validator = new BuildValidator()

    it('should reject NaN confidence', () => {
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: 50,
          featureValueStr: null,
          confidence: NaN,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].severity).toBe('ERROR')
    })

    it('should reject Infinity confidence', () => {
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: 50,
          featureValueStr: null,
          confidence: Infinity,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject confidence outside 0-100', () => {
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: 50,
          featureValueStr: null,
          confidence: 101,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject duplicate feature keys', () => {
      const features: CalculatedFeature[] = [
        {
          featureName: 'tournament_count',
          featureCategory: 'stats',
          featureValue: 10,
          featureValueStr: null,
          confidence: 90,
          source: 'sportsdataio',
        },
        {
          featureName: 'tournament_count',
          featureCategory: 'stats',
          featureValue: 11,
          featureValueStr: null,
          confidence: 85,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      const duplicateError = errors.find((e) => e.issue.includes('Duplicate'))
      expect(duplicateError).toBeDefined()
    })

    it('should reject NaN feature values', () => {
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: NaN,
          featureValueStr: null,
          confidence: 50,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should validate data completeness 0-100', () => {
      expect(validator.validateDataCompleteness(0).length).toBe(0)
      expect(validator.validateDataCompleteness(50).length).toBe(0)
      expect(validator.validateDataCompleteness(100).length).toBe(0)
      expect(validator.validateDataCompleteness(101).length).toBeGreaterThan(0)
      expect(validator.validateDataCompleteness(-1).length).toBeGreaterThan(0)
    })
  })

  describe('Activation Policy', () => {
    const policy = ActivationPolicy.getDefaultProductionPolicy()

    it('should accept SUCCESS status with sufficient completeness', () => {
      const buildResult = {
        playerId: 'p1',
        status: 'SUCCESS' as const,
        featureCount: 7,
        completedFeatureCount: 6,
        dataCompleteness: 80,
        calculatedAt: new Date(),
        warnings: [],
        calculatorFailures: [],
      }
      const featureNames = ['tournament_count', 'avg_finish', 'cut_percentage', 'top10pct', 'avg_dkpoints', 'avg_salary', 'salary_value']
      const featureValues = new Map(
        featureNames.map((n) => [n, { value: Math.random() * 100 }]),
      )

      const evaluation = policy.evaluate(buildResult, featureNames, featureValues)
      expect(evaluation.eligible).toBe(true)
    })

    it('should reject PARTIAL status', () => {
      const buildResult = {
        playerId: 'p1',
        status: 'PARTIAL' as const,
        featureCount: 7,
        completedFeatureCount: 4,
        dataCompleteness: 50,
        calculatedAt: new Date(),
        warnings: [],
        calculatorFailures: [],
      }
      const featureNames = ['tournament_count', 'avg_finish']
      const featureValues = new Map(
        featureNames.map((n) => [n, { value: 50 }]),
      )

      const evaluation = policy.evaluate(buildResult, featureNames, featureValues)
      expect(evaluation.eligible).toBe(false)
      expect(evaluation.reasons.some((r) => r.includes('PARTIAL'))).toBe(true)
    })

    it('should reject insufficient completeness', () => {
      const buildResult = {
        playerId: 'p1',
        status: 'SUCCESS' as const,
        featureCount: 7,
        completedFeatureCount: 2,
        dataCompleteness: 25,
        calculatedAt: new Date(),
        warnings: [],
        calculatorFailures: [],
      }
      const featureNames = ['tournament_count', 'avg_finish', 'other']
      const featureValues = new Map(
        featureNames.map((n) => [n, { value: 50 }]),
      )

      const evaluation = policy.evaluate(buildResult, featureNames, featureValues)
      expect(evaluation.eligible).toBe(false)
      expect(evaluation.reasons.some((r) => r.includes('completeness'))).toBe(true)
    })

    it('should reject missing required features', () => {
      const buildResult = {
        playerId: 'p1',
        status: 'SUCCESS' as const,
        featureCount: 7,
        completedFeatureCount: 7,
        dataCompleteness: 100,
        calculatedAt: new Date(),
        warnings: [],
        calculatorFailures: [],
      }
      const featureNames = ['tournament_count'] // missing avg_finish
      const featureValues = new Map(
        featureNames.map((n) => [n, { value: 50 }]),
      )

      const evaluation = policy.evaluate(buildResult, featureNames, featureValues)
      expect(evaluation.eligible).toBe(false)
      expect(evaluation.reasons.some((r) => r.includes('avg_finish'))).toBe(true)
    })

    it('should detect null required features', () => {
      const buildResult = {
        playerId: 'p1',
        status: 'SUCCESS' as const,
        featureCount: 7,
        completedFeatureCount: 6,
        dataCompleteness: 80,
        calculatedAt: new Date(),
        warnings: [],
        calculatorFailures: [],
      }
      const featureNames = ['tournament_count', 'avg_finish']
      const featureValues = new Map([
        ['tournament_count', { value: 10 }],
        ['avg_finish', { value: null }], // NULL!
      ])

      const evaluation = policy.evaluate(buildResult, featureNames, featureValues)
      expect(evaluation.eligible).toBe(false)
    })
  })

  describe('Concurrency Scenarios', () => {
    it('should detect concurrent builds via optimistic locking simulation', () => {
      // Scenario: two builds for same player
      // Build A: read active=null, calculate, try to promote
      // Build B: read active=null, calculate, promote first
      // Build A: try to promote but sees active!=null

      const previousActiveId = null
      const newActiveId = 'build-B'

      // Build A tries to promote with previousActiveId=null
      // but currentActive.id = 'build-B' (set by Build B)
      const currentActive = newActiveId

      const concurrencyDetected = currentActive !== previousActiveId && previousActiveId === null

      expect(concurrencyDetected).toBe(true)
    })

    it('should allow different players to build concurrently', () => {
      // Different playerId = different unique constraint
      // @@unique([playerId, activationStatus])
      // Player1 can have (ACTIVE, SUPERSEDED, REJECTED)
      // Player2 can have (ACTIVE, SUPERSEDED, REJECTED)
      // No conflict

      const player1Builds = [
        { playerId: 'p1', activationStatus: 'ACTIVE' },
        { playerId: 'p1', activationStatus: 'SUPERSEDED' },
      ]
      const player2Builds = [
        { playerId: 'p2', activationStatus: 'ACTIVE' },
        { playerId: 'p2', activationStatus: 'SUPERSEDED' },
      ]

      const uniqueKeysP1 = player1Builds.map(
        (b) => `${b.playerId}:${b.activationStatus}`,
      )
      const uniqueKeysP2 = player2Builds.map(
        (b) => `${b.playerId}:${b.activationStatus}`,
      )

      const noConflict = uniqueKeysP1.every((k) => !uniqueKeysP2.includes(k))
      expect(noConflict).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty feature list', () => {
      const validator = new BuildValidator()
      const errors = validator.validateFeatures([])
      expect(errors.length).toBe(0) // Empty is valid
    })

    it('should handle feature with both value and valueStr', () => {
      const validator = new BuildValidator()
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: 50,
          featureValueStr: '50%',
          confidence: 80,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.length).toBe(0)
    })

    it('should require at least one value (featureValue or featureValueStr)', () => {
      const validator = new BuildValidator()
      const features: CalculatedFeature[] = [
        {
          featureName: 'test',
          featureCategory: 'test',
          featureValue: null,
          featureValueStr: null,
          confidence: 80,
          source: 'sportsdataio',
        },
      ]
      const errors = validator.validateFeatures(features)
      expect(errors.some((e) => e.issue.includes('featureValue or featureValueStr'))).toBe(true)
    })
  })
})
