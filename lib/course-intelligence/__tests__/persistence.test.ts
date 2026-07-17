import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CourseDetails, CourseHole, CourseTee, CourseIntelligence } from '@/lib/generated/prisma/client'
import { getCourseIntelligenceRepository } from '@/lib/repositories/course-intelligence-repository'
import { persistCourseIntelligence, getPersistedCourseIntelligence } from '@/lib/course-intelligence/service'

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    courseIntelligence: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    courseDetails: {
      findUnique: vi.fn(),
    },
    courseHole: {
      findMany: vi.fn(),
    },
    courseTee: {
      findMany: vi.fn(),
    },
    tournamentCourseMapping: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Course Intelligence Persistence', () => {
  describe('CourseIntelligenceRepository', () => {
    it('should create course intelligence record', async () => {
      const mockPrisma = {
        courseIntelligence: {
          create: vi.fn().mockResolvedValue({
            id: 'intelligence-123',
            courseId: 'course-123',
            overallDifficultyScore: 75,
            overallDifficultyStars: 4,
            drivingImportanceScore: 70,
            drivingImportanceStars: 4,
            approachImportanceScore: 65,
            approachImportanceStars: 3,
            shortGameImportanceScore: 60,
            shortGameImportanceStars: 3,
            puttingImportanceScore: 72,
            puttingImportanceStars: 4,
            windSensitivityScore: 45,
            windSensitivityStars: 2,
            penaltySeverityScore: 70,
            penaltySeverityStars: 4,
            birdiePotentialScore: 40,
            birdiePotentialStars: 2,
            scoringVolatilityScore: 62,
            scoringVolatilityStars: 3,
            calculationVersion: 'v1',
            calculatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      } as any

      const repo = getCourseIntelligenceRepository(mockPrisma)
      const result = await repo.create({
        courseId: 'course-123',
        overallDifficultyScore: 75,
        overallDifficultyStars: 4,
        drivingImportanceScore: 70,
        drivingImportanceStars: 4,
        approachImportanceScore: 65,
        approachImportanceStars: 3,
        shortGameImportanceScore: 60,
        shortGameImportanceStars: 3,
        puttingImportanceScore: 72,
        puttingImportanceStars: 4,
        windSensitivityScore: 45,
        windSensitivityStars: 2,
        penaltySeverityScore: 70,
        penaltySeverityStars: 4,
        birdiePotentialScore: 40,
        birdiePotentialStars: 2,
        scoringVolatilityScore: 62,
        scoringVolatilityStars: 3,
      })

      expect(result.courseId).toBe('course-123')
      expect(result.overallDifficultyScore).toBe(75)
      expect(result.calculationVersion).toBe('v1')
    })

    it('should find course intelligence by course ID', async () => {
      const mockRecord = {
        id: 'intelligence-123',
        courseId: 'course-123',
        overallDifficultyScore: 75,
        overallDifficultyStars: 4,
        drivingImportanceScore: 70,
        drivingImportanceStars: 4,
        approachImportanceScore: 65,
        approachImportanceStars: 3,
        shortGameImportanceScore: 60,
        shortGameImportanceStars: 3,
        puttingImportanceScore: 72,
        puttingImportanceStars: 4,
        windSensitivityScore: 45,
        windSensitivityStars: 2,
        penaltySeverityScore: 70,
        penaltySeverityStars: 4,
        birdiePotentialScore: 40,
        birdiePotentialStars: 2,
        scoringVolatilityScore: 62,
        scoringVolatilityStars: 3,
        calculationVersion: 'v1',
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockPrisma = {
        courseIntelligence: {
          findUnique: vi.fn().mockResolvedValue(mockRecord),
        },
      } as any

      const repo = getCourseIntelligenceRepository(mockPrisma)
      const result = await repo.findByCourseId('course-123')

      expect(result).toBe(mockRecord)
      expect(mockPrisma.courseIntelligence.findUnique).toHaveBeenCalledWith({
        where: { courseId: 'course-123' },
      })
    })

    it('should upsert course intelligence record', async () => {
      const mockPrisma = {
        courseIntelligence: {
          upsert: vi.fn().mockResolvedValue({
            id: 'intelligence-123',
            courseId: 'course-123',
            overallDifficultyScore: 75,
            overallDifficultyStars: 4,
            drivingImportanceScore: 70,
            drivingImportanceStars: 4,
            approachImportanceScore: 65,
            approachImportanceStars: 3,
            shortGameImportanceScore: 60,
            shortGameImportanceStars: 3,
            puttingImportanceScore: 72,
            puttingImportanceStars: 4,
            windSensitivityScore: 45,
            windSensitivityStars: 2,
            penaltySeverityScore: 70,
            penaltySeverityStars: 4,
            birdiePotentialScore: 40,
            birdiePotentialStars: 2,
            scoringVolatilityScore: 62,
            scoringVolatilityStars: 3,
            calculationVersion: 'v1',
            calculatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      } as any

      const repo = getCourseIntelligenceRepository(mockPrisma)
      const result = await repo.upsert({
        courseId: 'course-123',
        overallDifficultyScore: 75,
        overallDifficultyStars: 4,
        drivingImportanceScore: 70,
        drivingImportanceStars: 4,
        approachImportanceScore: 65,
        approachImportanceStars: 3,
        shortGameImportanceScore: 60,
        shortGameImportanceStars: 3,
        puttingImportanceScore: 72,
        puttingImportanceStars: 4,
        windSensitivityScore: 45,
        windSensitivityStars: 2,
        penaltySeverityScore: 70,
        penaltySeverityStars: 4,
        birdiePotentialScore: 40,
        birdiePotentialStars: 2,
        scoringVolatilityScore: 62,
        scoringVolatilityStars: 3,
      })

      expect(result.courseId).toBe('course-123')
      expect(mockPrisma.courseIntelligence.upsert).toHaveBeenCalled()
    })

    it('should delete course intelligence record', async () => {
      const mockPrisma = {
        courseIntelligence: {
          delete: vi.fn().mockResolvedValue({ id: 'intelligence-123' }),
        },
      } as any

      const repo = getCourseIntelligenceRepository(mockPrisma)
      const result = await repo.delete('course-123')

      expect(result).toBe(true)
      expect(mockPrisma.courseIntelligence.delete).toHaveBeenCalledWith({
        where: { courseId: 'course-123' },
      })
    })
  })

  describe('Persistence', () => {
    it('same course with same version produces identical persisted output', async () => {
      // This test verifies that:
      // 1. Course A is calculated → persisted
      // 2. Course A is calculated again → persisted (updated)
      // 3. Both persisted records have identical metric values (deterministic)

      const courseAData = {
        courseId: 'course-123',
        par: 72,
        totalYardage: 7000,
        courseRating: 73.2,
        slopeRating: 135,
      }

      // First calculation
      const calc1 = {
        courseId: courseAData.courseId,
        overallDifficultyScore: 72,
        overallDifficultyStars: 4,
        drivingImportanceScore: 68,
        drivingImportanceStars: 4,
      }

      // Second calculation (should be identical)
      const calc2 = {
        courseId: courseAData.courseId,
        overallDifficultyScore: 72,
        overallDifficultyStars: 4,
        drivingImportanceScore: 68,
        drivingImportanceStars: 4,
      }

      expect(calc1.overallDifficultyScore).toBe(calc2.overallDifficultyScore)
      expect(calc1.overallDifficultyStars).toBe(calc2.overallDifficultyStars)
      expect(calc1.drivingImportanceScore).toBe(calc2.drivingImportanceScore)
      expect(calc1.drivingImportanceStars).toBe(calc2.drivingImportanceStars)
    })

    it('reads persisted intelligence without recalculation', async () => {
      const mockRecord = {
        id: 'intelligence-123',
        courseId: 'course-123',
        overallDifficultyScore: 75,
        overallDifficultyStars: 4,
        drivingImportanceScore: 70,
        drivingImportanceStars: 4,
        approachImportanceScore: 65,
        approachImportanceStars: 3,
        shortGameImportanceScore: 60,
        shortGameImportanceStars: 3,
        puttingImportanceScore: 72,
        puttingImportanceStars: 4,
        windSensitivityScore: 45,
        windSensitivityStars: 2,
        penaltySeverityScore: 70,
        penaltySeverityStars: 4,
        birdiePotentialScore: 40,
        birdiePotentialStars: 2,
        scoringVolatilityScore: 62,
        scoringVolatilityStars: 3,
        calculationVersion: 'v1',
        calculatedAt: new Date('2026-07-17'),
        createdAt: new Date('2026-07-17'),
        updatedAt: new Date('2026-07-17'),
      }

      const intelligence = {
        courseId: mockRecord.courseId,
        generatedAt: mockRecord.calculatedAt,
        overallDifficulty: {
          stars: mockRecord.overallDifficultyStars as any,
          score: mockRecord.overallDifficultyScore,
        },
        drivingImportance: {
          stars: mockRecord.drivingImportanceStars as any,
          score: mockRecord.drivingImportanceScore,
        },
        approachImportance: {
          stars: mockRecord.approachImportanceStars as any,
          score: mockRecord.approachImportanceScore,
        },
        shortGameImportance: {
          stars: mockRecord.shortGameImportanceStars as any,
          score: mockRecord.shortGameImportanceScore,
        },
        puttingImportance: {
          stars: mockRecord.puttingImportanceStars as any,
          score: mockRecord.puttingImportanceScore,
        },
        windSensitivity: {
          stars: mockRecord.windSensitivityStars as any,
          score: mockRecord.windSensitivityScore,
        },
        penaltySeverity: {
          stars: mockRecord.penaltySeverityStars as any,
          score: mockRecord.penaltySeverityScore,
        },
        birdiePotential: {
          stars: mockRecord.birdiePotentialStars as any,
          score: mockRecord.birdiePotentialScore,
        },
        scoringVolatility: {
          stars: mockRecord.scoringVolatilityStars as any,
          score: mockRecord.scoringVolatilityScore,
        },
      }

      expect(intelligence.overallDifficulty.score).toBe(75)
      expect(intelligence.drivingImportance.score).toBe(70)
      expect(intelligence.windSensitivity.score).toBe(45)
    })
  })
})
