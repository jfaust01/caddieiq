'use server'

import { isCurrentUserAdmin } from '@/lib/auth/admin-check'
import { persistCourseIntelligence } from '@/lib/course-intelligence/service'
import { getCourseIntelligenceRepository } from '@/lib/repositories/course-intelligence-repository'
import prismaClient from '@/lib/prisma'

export interface RefreshCourseIntelligenceResult {
  success: boolean
  courseId?: string
  message?: string
  error?: string
}

/**
 * Server action: Refresh course intelligence for a single course.
 *
 * Admin-only action that:
 * 1. Deletes existing intelligence (if necessary)
 * 2. Recalculates intelligence
 * 3. Persists to database
 * 4. Returns summary
 */
export async function refreshCourseIntelligenceAction(
  courseId: string,
): Promise<RefreshCourseIntelligenceResult> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin role required',
    }
  }

  try {
    console.log(`[v0] Refreshing course intelligence for courseId: ${courseId}`)

    // Delete existing intelligence
    const intelligenceRepo = getCourseIntelligenceRepository(prismaClient)
    await intelligenceRepo.delete(courseId)

    // Recalculate and persist
    const intelligence = await persistCourseIntelligence(courseId)

    if (!intelligence) {
      return {
        success: false,
        error: 'Course not found or insufficient data to calculate intelligence',
      }
    }

    return {
      success: true,
      courseId,
      message: 'Course intelligence refreshed successfully',
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Refresh course intelligence failed for courseId: ${courseId}`, error)

    return {
      success: false,
      error: errorMsg,
    }
  }
}
