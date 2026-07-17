/**
 * CourseInsightRepository
 *
 * Persistence layer for course insights.
 */

import type { PrismaClient, CourseInsight } from "@/lib/generated/prisma/client"
import type { RawInsight } from "@/lib/course-intelligence/insights/types"

export interface CourseInsightInput {
  courseIntelligenceId: string
  category: string
  title: string
  summary: string
  importance: number
  icon: string
  displayOrder: number
}

export function getCourseInsightRepository(prismaClient: PrismaClient) {
  return {
    /**
     * Find insights by course intelligence ID.
     * Sorted by importance (desc) then displayOrder (asc).
     */
    async findByCourseIntelligence(courseIntelligenceId: string): Promise<CourseInsight[]> {
      return prismaClient.courseInsight.findMany({
        where: { courseIntelligenceId },
        orderBy: [
          { importance: 'desc' },
          { displayOrder: 'asc' },
        ],
      })
    },

    /**
     * Find insight by ID.
     */
    async findById(id: string): Promise<CourseInsight | null> {
      return prismaClient.courseInsight.findUnique({
        where: { id },
      })
    },

    /**
     * Find insight by courseIntelligenceId and category.
     */
    async findByCategory(courseIntelligenceId: string, category: string): Promise<CourseInsight | null> {
      return prismaClient.courseInsight.findUnique({
        where: {
          courseIntelligenceId_category: {
            courseIntelligenceId,
            category,
          },
        },
      })
    },

    /**
     * Create a new insight.
     */
    async create(input: CourseInsightInput): Promise<CourseInsight> {
      return prismaClient.courseInsight.create({
        data: input,
      })
    },

    /**
     * Upsert (create or update) an insight by category.
     */
    async upsert(input: CourseInsightInput): Promise<CourseInsight> {
      return prismaClient.courseInsight.upsert({
        where: {
          courseIntelligenceId_category: {
            courseIntelligenceId: input.courseIntelligenceId,
            category: input.category,
          },
        },
        create: input,
        update: {
          title: input.title,
          summary: input.summary,
          importance: input.importance,
          icon: input.icon,
          displayOrder: input.displayOrder,
        },
      })
    },

    /**
     * Upsert multiple insights.
     */
    async upsertMany(inputs: CourseInsightInput[]): Promise<CourseInsight[]> {
      const results: CourseInsight[] = []
      for (const input of inputs) {
        const result = await this.upsert(input)
        results.push(result)
      }
      return results
    },

    /**
     * Delete insight by ID.
     */
    async delete(id: string): Promise<CourseInsight> {
      return prismaClient.courseInsight.delete({
        where: { id },
      })
    },

    /**
     * Delete all insights for a course intelligence.
     */
    async deleteForCourseIntelligence(courseIntelligenceId: string): Promise<number> {
      const result = await prismaClient.courseInsight.deleteMany({
        where: { courseIntelligenceId },
      })
      return result.count
    },

    /**
     * Delete insight by category.
     */
    async deleteByCategory(courseIntelligenceId: string, category: string): Promise<CourseInsight | null> {
      try {
        return await prismaClient.courseInsight.delete({
          where: {
            courseIntelligenceId_category: {
              courseIntelligenceId,
              category,
            },
          },
        })
      } catch {
        return null
      }
    },
  }
}

export type CourseInsightRepository = ReturnType<typeof getCourseInsightRepository>
