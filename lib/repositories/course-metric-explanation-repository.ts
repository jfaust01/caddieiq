/**
 * CourseMetricExplanation repository.
 * Handles persistence and retrieval of metric explanations.
 */

import type { PrismaClient } from '@/lib/generated/prisma/client'
import type { CourseMetricExplanationRecord } from '@/lib/course-intelligence/explanations/types'

export interface CourseMetricExplanationInput {
  courseIntelligenceId: string
  metric: string
  title: string
  summary: string
  contributingFactors: string
  calculationVersion?: string
}

/**
 * Get repository instance.
 */
export function getCourseMetricExplanationRepository(prisma: PrismaClient) {
  return {
    /**
     * Find all explanations for a course intelligence record.
     */
    async findByCourseIntelligence(courseIntelligenceId: string): Promise<CourseMetricExplanationRecord[]> {
      try {
        const records = await prisma.courseMetricExplanation.findMany({
          where: { courseIntelligenceId },
          orderBy: { metric: 'asc' },
        })

        return records.map(r => ({
          id: r.id,
          courseIntelligenceId: r.courseIntelligenceId,
          metric: r.metric,
          title: r.title,
          summary: r.summary,
          contributingFactors: r.contributingFactors,
          calculationVersion: r.calculationVersion,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      } catch (error) {
        console.error('[v0] Error finding explanations:', error)
        return []
      }
    },

    /**
     * Find specific explanation by metric.
     */
    async findByMetric(courseIntelligenceId: string, metric: string): Promise<CourseMetricExplanationRecord | null> {
      try {
        const record = await prisma.courseMetricExplanation.findUnique({
          where: {
            courseIntelligenceId_metric_calculationVersion: {
              courseIntelligenceId,
              metric,
              calculationVersion: 'v1',
            },
          },
        })

        if (!record) return null

        return {
          id: record.id,
          courseIntelligenceId: record.courseIntelligenceId,
          metric: record.metric,
          title: record.title,
          summary: record.summary,
          contributingFactors: record.contributingFactors,
          calculationVersion: record.calculationVersion,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      } catch (error) {
        console.error('[v0] Error finding explanation by metric:', error)
        return null
      }
    },

    /**
     * Create new explanation.
     */
    async create(input: CourseMetricExplanationInput): Promise<CourseMetricExplanationRecord> {
      try {
        const record = await prisma.courseMetricExplanation.create({
          data: {
            courseIntelligenceId: input.courseIntelligenceId,
            metric: input.metric,
            title: input.title,
            summary: input.summary,
            contributingFactors: input.contributingFactors,
            calculationVersion: input.calculationVersion || 'v1',
          },
        })

        return {
          id: record.id,
          courseIntelligenceId: record.courseIntelligenceId,
          metric: record.metric,
          title: record.title,
          summary: record.summary,
          contributingFactors: record.contributingFactors,
          calculationVersion: record.calculationVersion,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      } catch (error) {
        console.error('[v0] Error creating explanation:', error)
        throw error
      }
    },

    /**
     * Upsert explanation (create if not exists, update if exists).
     */
    async upsert(input: CourseMetricExplanationInput): Promise<CourseMetricExplanationRecord> {
      try {
        const record = await prisma.courseMetricExplanation.upsert({
          where: {
            courseIntelligenceId_metric_calculationVersion: {
              courseIntelligenceId: input.courseIntelligenceId,
              metric: input.metric,
              calculationVersion: input.calculationVersion || 'v1',
            },
          },
          create: {
            courseIntelligenceId: input.courseIntelligenceId,
            metric: input.metric,
            title: input.title,
            summary: input.summary,
            contributingFactors: input.contributingFactors,
            calculationVersion: input.calculationVersion || 'v1',
          },
          update: {
            title: input.title,
            summary: input.summary,
            contributingFactors: input.contributingFactors,
            updatedAt: new Date(),
          },
        })

        return {
          id: record.id,
          courseIntelligenceId: record.courseIntelligenceId,
          metric: record.metric,
          title: record.title,
          summary: record.summary,
          contributingFactors: record.contributingFactors,
          calculationVersion: record.calculationVersion,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      } catch (error) {
        console.error('[v0] Error upserting explanation:', error)
        throw error
      }
    },

    /**
     * Upsert many explanations in batch.
     */
    async upsertMany(inputs: CourseMetricExplanationInput[]): Promise<CourseMetricExplanationRecord[]> {
      try {
        const results: CourseMetricExplanationRecord[] = []

        for (const input of inputs) {
          const record = await this.upsert(input)
          results.push(record)
        }

        return results
      } catch (error) {
        console.error('[v0] Error batch upserting explanations:', error)
        throw error
      }
    },

    /**
     * Delete explanation by ID.
     */
    async delete(id: string): Promise<boolean> {
      try {
        await prisma.courseMetricExplanation.delete({
          where: { id },
        })
        return true
      } catch (error) {
        console.error('[v0] Error deleting explanation:', error)
        return false
      }
    },

    /**
     * Delete all explanations for a course intelligence record.
     */
    async deleteForCourseIntelligence(courseIntelligenceId: string): Promise<number> {
      try {
        const result = await prisma.courseMetricExplanation.deleteMany({
          where: { courseIntelligenceId },
        })
        return result.count
      } catch (error) {
        console.error('[v0] Error deleting explanations for intelligence:', error)
        return 0
      }
    },

    /**
     * Delete explanation by metric.
     */
    async deleteByMetric(courseIntelligenceId: string, metric: string): Promise<boolean> {
      try {
        await prisma.courseMetricExplanation.deleteMany({
          where: { courseIntelligenceId, metric },
        })
        return true
      } catch (error) {
        console.error('[v0] Error deleting explanation by metric:', error)
        return false
      }
    },
  }
}

export type CourseMetricExplanationRepository = ReturnType<typeof getCourseMetricExplanationRepository>
