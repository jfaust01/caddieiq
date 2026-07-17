import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getTournamentCourseMappingRepository } from '@/lib/repositories/tournament-course-mapping-repository'
import { getCourseInsights } from '@/lib/course-intelligence/insights'
import { CourseInsightsCard } from './course-insights-card'
import prismaClient from '@/lib/prisma'

export interface TournamentCourseInsightsWrapperProps {
  tournamentId: string
}

/**
 * Tournament Course Insights Wrapper
 *
 * Server component that fetches tournament course and its insights,
 * then renders the insights card.
 */
export async function TournamentCourseInsightsWrapper({ tournamentId }: TournamentCourseInsightsWrapperProps) {
  try {
    // Find tournament-course mapping
    const mappingRepo = getTournamentCourseMappingRepository(prismaClient)
    const mappingResult = await mappingRepo.findByTournamentId(tournamentId)

    if (mappingResult.outcome !== 'ok' || !mappingResult.record) {
      return (
        <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No course information available for this tournament.
          </p>
        </div>
      )
    }

    // Find course details by external ID
    const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
    const courseResult = await courseDetailsRepo.findByExternalId(
      mappingResult.record.golfCourseApiCourseId.toString()
    )

    if (courseResult.outcome !== 'ok' || !courseResult.record) {
      return (
        <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Course data not found.
          </p>
        </div>
      )
    }

    // Get insights for course
    const insights = await getCourseInsights(courseResult.record.id)

    return <CourseInsightsCard insights={insights} />
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Failed to load course insights: ${errorMsg}`)

    return (
      <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Unable to load course insights. Please try again later.
        </p>
      </div>
    )
  }
}
