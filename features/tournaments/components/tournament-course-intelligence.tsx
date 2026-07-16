import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/shared/section-header'
import { CourseIntelligencePanel } from '@/features/courses/components/course-intelligence-panel'
import type { CourseProfile } from '@/lib/domain/course'

interface TournamentCourseIntelligenceProps {
  /** The normalized profile of the event's host venue. */
  profile: CourseProfile
  /** Host course identity, for the section heading and the deep link. */
  course: { id: string; name: string }
}

/**
 * Host-venue Course Intelligence on the Tournament hub. Reuses the exact same
 * {@link CourseIntelligencePanel} the Course Page renders — so the tournament
 * view and the course view can never disagree — and adds a heading plus a deep
 * link to the full course profile. Rendered only when the event is linked to a
 * course; the panel itself honestly reports how much is verified.
 */
export function TournamentCourseIntelligence({
  profile,
  course,
}: TournamentCourseIntelligenceProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        title="Course intelligence"
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
    </section>
  )
}
