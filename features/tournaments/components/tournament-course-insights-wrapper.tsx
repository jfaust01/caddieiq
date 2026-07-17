import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getTournamentCourseMappingRepository } from '@/lib/repositories/tournament-course-mapping-repository'
import { getCourseInsights } from '@/lib/course-intelligence/insights'
import { CourseInsightsCard } from './course-insights-card'
import { StatusBadge } from './status-badge'
import prismaClient from '@/lib/prisma'
import { Lightbulb } from 'lucide-react'

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
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Lightbulb className="size-5 shrink-0 text-muted-foreground/50" />
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Insights Not Available</p>
              <p className="text-xs text-muted-foreground">
                No course information has been mapped for this tournament yet.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <StatusBadge variant="not-imported" label="Not Imported" showIcon />
          </div>
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
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Lightbulb className="size-5 shrink-0 text-muted-foreground/50" />
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Course Data Not Found</p>
              <p className="text-xs text-muted-foreground">
                Course details could not be retrieved. Please verify the course information is correctly imported.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <StatusBadge variant="error" label="Failed" showIcon />
          </div>
        </div>
      )
    }

    // Get insights for course
    const insights = await getCourseInsights(courseResult.record.id)

    if (!insights || insights.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Lightbulb className="size-5 shrink-0 text-muted-foreground/50" />
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Course Insights Not Yet Generated</p>
              <p className="text-xs text-muted-foreground">
                Insights are generated from course intelligence metrics. They will appear here once intelligence has been calculated.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <StatusBadge variant="not-generated" label="Not Generated" showIcon />
          </div>
        </div>
      )
    }

    return <CourseInsightsCard insights={insights} />
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Failed to load course insights: ${errorMsg}`)

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Lightbulb className="size-5 shrink-0 text-muted-foreground/50" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-sm">Unable to Load Insights</p>
            <p className="text-xs text-muted-foreground">
              An error occurred while retrieving course insights. Please try refreshing the page.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <StatusBadge variant="error" label="Error" showIcon />
        </div>
      </div>
    )
  }
}
