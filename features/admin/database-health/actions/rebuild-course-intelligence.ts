'use server'

import { isCurrentUserAdmin } from '@/lib/session'
import { enrichCourseCharacteristicsTable, type EnrichmentStats } from '@/lib/services/course-enrichment-service'
import prismaClient from '@/lib/prisma'

/**
 * Admin action to rebuild course intelligence.
 * This runs the course enrichment pipeline server-side and returns progress/results.
 */
export async function rebuildCourseIntelligence(): Promise<{
  success: boolean
  stats?: EnrichmentStats
  error?: string
}> {
  // Verify the user is an admin
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: admin access required',
    }
  }

  try {
    const stats = await enrichCourseCharacteristicsTable(prismaClient, {
      dryRun: false,
    })

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('[rebuildCourseIntelligence] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
