import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/shared/section-header'
import { CourseIntelligencePanel } from '@/features/courses/components/course-intelligence-panel'
import { TournamentFantasyAnalysis } from '@/features/tournaments/components/tournament-fantasy-analysis'
import type { CourseProfile } from '@/lib/domain/course'

interface TournamentCourseIntelligenceProps {
  /** The normalized profile of the event's host venue. */
  profile: CourseProfile | null
  /** Host course identity, for the section heading and the deep link. */
  course: { id: string; name: string } | null
}

/**
 * Host-venue Course Intelligence on the Tournament hub. Combines verified course
 * characteristics with Fantasy Analysis insights that transform GolfCourseAPI data
 * into actionable player archetype recommendations and skill importance rankings.
 */
export function TournamentCourseIntelligence({
  profile,
  course,
}: TournamentCourseIntelligenceProps) {
  if (!profile || !course) {
    return null
  }

  return (
    <section className="flex flex-col gap-8">
      {/* Course Characteristics */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          as="h3"
          title="Course characteristics"
          description={`The verified characteristics of ${course.name}, the host venue — the same profile that powers course fit.`}
          actions={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/courses/${course.id}`}>
                  View course
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              }
            />
          }
        />

        <CourseIntelligencePanel profile={profile} />
      </div>

      {/* Fantasy Analysis */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          as="h3"
          title="Fantasy analysis"
          description={`How ${course.name}'s characteristics impact player archetypes and lineup strategy — transform course data into DFS insights.`}
        />

        <TournamentFantasyAnalysis profile={profile} courseName={course.name} />
      </div>
    </section>
  )
}
