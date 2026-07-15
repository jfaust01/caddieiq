import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { CourseHero } from '@/features/courses/components/course-hero'
import { CourseTournaments } from '@/features/courses/components/course-tournaments'
import type { CourseDetail } from '@/features/courses/types'

interface CourseDetailViewProps {
  course: CourseDetail
}

/**
 * Course profile page: identity and key specs up top, followed by the list of
 * tournaments the course has hosted. Missing specs render as intentional
 * placeholders and never expose raw ids or internal timestamps.
 */
export function CourseDetailView({ course }: CourseDetailViewProps) {
  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        nativeButton={false}
        render={
          <Link href="/courses">
            <ChevronLeft data-icon="inline-start" />
            All courses
          </Link>
        }
      />

      <CourseHero course={course} />

      <CourseTournaments tournaments={course.tournaments} />
    </PageShell>
  )
}
