/**
 * Course Enrichment Service
 *
 * Provides a reusable, testable service for enriching the course_characteristics table.
 * Used by both the CLI script and admin endpoints.
 * All database I/O is isolated in this layer.
 */

import { PrismaClient } from '@/lib/generated/prisma/client'
import {
  enrichCourseCharacteristics,
  type DerivedCharacteristics,
} from '@/lib/analytics/course-characteristics-engine'
import { CourseRepository } from '@/lib/repositories/course-repository'

export interface EnrichmentStats {
  totalCourses: number
  enrichedCount: number
  skippedCount: number
  createdCount: number
  updatedCount: number
  errors: Array<{
    courseId: string
    error: string
  }>
}

export interface EnrichmentProgress {
  totalCourses: number
  processedCourses: number
  createdCount: number
  updatedCount: number
  errors: string[]
}

/**
 * Callback for progress updates during enrichment.
 */
export type ProgressCallback = (progress: EnrichmentProgress) => void

const BATCH_SIZE = 500

/**
 * Core enrichment logic, extracted into a reusable service.
 * This is called by both the CLI script and the admin endpoint.
 */
export async function enrichCourseCharacteristicsTable(
  prisma: PrismaClient,
  options?: {
    dryRun?: boolean
    verbose?: boolean
    onProgress?: ProgressCallback
  },
): Promise<EnrichmentStats> {
  const repository = new CourseRepository(prisma)
  const result: EnrichmentStats = {
    totalCourses: 0,
    enrichedCount: 0,
    skippedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    errors: [],
  }

  // Fetch all non-deleted courses
  const allCourses = await prisma.course.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      par: true,
      yardage: true,
      altitudeFt: true,
    },
    orderBy: { name: 'asc' },
  })

  result.totalCourses = allCourses.length

  if (result.totalCourses === 0) {
    return result
  }

  // Enrich each course
  const characteristicsToPersist: DerivedCharacteristics[] = []

  for (const course of allCourses) {
    try {
      const derived = enrichCourseCharacteristics(course as any)
      characteristicsToPersist.push(derived)
      result.enrichedCount++
    } catch (error) {
      result.skippedCount++
      result.errors.push({
        courseId: course.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Emit progress updates
    if (options?.onProgress) {
      options.onProgress({
        totalCourses: result.totalCourses,
        processedCourses: result.enrichedCount + result.skippedCount,
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        errors: result.errors.map((e) => `${e.courseId}: ${e.error}`),
      })
    }
  }

  // Persist in batches (or dry-run)
  if (!options?.dryRun) {
    for (let i = 0; i < characteristicsToPersist.length; i += BATCH_SIZE) {
      const batch = characteristicsToPersist.slice(i, i + BATCH_SIZE)
      // Cast to the repository's expected type (the enums are compatible at runtime)
      const batchResult = await repository.bulkUpsertCharacteristics(batch as any)

      result.createdCount += batchResult.inserted
      result.updatedCount += batchResult.updated

      if (batchResult.failed > 0 && batchResult.errors) {
        result.errors.push(
          ...batchResult.errors.map((error: any) => ({
            courseId: error.id ?? 'UNKNOWN',
            error: error.message ?? String(error),
          })),
        )
      }

      // Emit batch progress
      if (options?.onProgress) {
        options.onProgress({
          totalCourses: result.totalCourses,
          processedCourses: result.enrichedCount + result.skippedCount,
          createdCount: result.createdCount,
          updatedCount: result.updatedCount,
          errors: result.errors.map((e) => `${e.courseId}: ${e.error}`),
        })
      }
    }
  }

  return result
}
