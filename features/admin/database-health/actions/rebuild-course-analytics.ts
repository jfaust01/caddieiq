'use server'

import { isCurrentUserAdmin } from '@/lib/session'
import { buildAllCourseAnalytics, type CourseAnalyticsBuildStats } from '@/lib/services/course-analytics-service'
import prismaClient from '@/lib/prisma'

/**
 * Admin server action to rebuild all course analytics from historical data.
 * Recalculates every course; never throws for individual failures.
 */
export async function rebuildCourseAnalytics(): Promise<{
  success: boolean
  stats?: CourseAnalyticsBuildStats
  error?: string
}> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: admin access required' }
  }

  try {
    const stats = await buildAllCourseAnalytics(prismaClient)
    return { success: true, stats }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
