import { AlertCircle } from 'lucide-react'

import { SectionHeader } from '@/components/shared/section-header'
import { courseService } from '@/features/courses/services/course-service'
import { CourseOverview } from './course-overview'
import { getTournamentCourseMappingRepository } from '@/lib/repositories/tournament-course-mapping-repository'
import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getCourseHoleRepository } from '@/lib/repositories/course-hole-repository'
import { getCourseTeeRepository } from '@/lib/repositories/course-tee-repository'

interface TournamentCourseOverviewWrapperProps {
  tournamentId: string
}

/**
 * Server-side wrapper that fetches course overview data for a tournament.
 * Handles empty states, loading, and error conditions.
 * Renders CourseOverview component when data is available.
 */
export async function TournamentCourseOverviewWrapper({
  tournamentId,
}: TournamentCourseOverviewWrapperProps) {
  try {
    // Get tournament course mapping
    const mappingRepo = getTournamentCourseMappingRepository()
    const mappingResult = await mappingRepo.findByTournamentId(tournamentId)

    if (mappingResult.outcome !== 'ok' || !mappingResult.record) {
      return (
        <section className="flex flex-col gap-4">
          <SectionHeader as="h3" title="Course Overview" />
          <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <AlertCircle className="mt-0.5 size-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                No course information available
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This tournament has not yet been linked to a golf course in CaddieIQ.
              </p>
            </div>
          </div>
        </section>
      )
    }

    const mapping = mappingResult.record
    const golfCourseApiId = mapping.golfCourseApiCourseId

    // Fetch course details
    const courseDetailsRepo = getCourseDetailsRepository()
    const courseResult = await courseDetailsRepo.findByExternalId(golfCourseApiId.toString())

    if (courseResult.outcome !== 'ok' || !courseResult.record) {
      return (
        <section className="flex flex-col gap-4">
          <SectionHeader as="h3" title="Course Overview" />
          <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <AlertCircle className="mt-0.5 size-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Course data not found
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                The course linked to this tournament could not be loaded.
              </p>
            </div>
          </div>
        </section>
      )
    }

    const course = courseResult.record

    // Fetch holes and tees
    const [holesResult, teesResult] = await Promise.all([
      getCourseHoleRepository().findByCourseId(course.id),
      getCourseTeeRepository().findByCourseId(course.id),
    ])

    const holes = holesResult && Array.isArray(holesResult) ? holesResult : []
    const tees = teesResult && Array.isArray(teesResult) ? teesResult : []

    return (
      <section className="flex flex-col gap-4">
        <SectionHeader as="h3" title="Course Overview" />
        <CourseOverview course={course} holes={holes} tees={tees} />
      </section>
    )
  } catch (error) {
    console.error('[v0] Failed to load course overview:', error)

    return (
      <section className="flex flex-col gap-4">
        <SectionHeader as="h3" title="Course Overview" />
        <div className="flex items-start gap-3 rounded-lg border border-red-200/50 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 size-4 text-red-600 dark:text-red-500 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              Unable to load course information
            </p>
            <p className="text-xs text-red-800 dark:text-red-300">
              Please try again later or contact support.
            </p>
          </div>
        </div>
      </section>
    )
  }
}
