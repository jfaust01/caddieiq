import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { PageShell } from '@/components/shared/page-shell'
import { CourseHero } from '@/features/courses/components/course-hero'
import { CourseIntelligencePanel } from '@/features/courses/components/course-intelligence-panel'
import { CourseTournaments } from '@/features/courses/components/course-tournaments'
import { CourseSelector } from '@/features/courses/components/course-selector'
import { courseService } from '@/features/courses/services/course-service'
import type { CourseDetail } from '@/features/courses/types'

interface CourseDetailViewProps {
  course: CourseDetail
}

/**
 * Course profile page: identity and key specs up top, followed by the list of
 * tournaments the course has hosted. Missing specs render as intentional
 * placeholders and never expose raw ids or internal timestamps.
 */
export async function CourseDetailView({ course }: CourseDetailViewProps) {
  // Fetch courses for the selector dropdown (first 50 courses)
  const { courses } = await courseService.queryCourses({ take: 50 })

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <CourseSelector
          currentCourseId={course.id}
          currentCourseName={course.name}
          courses={courses}
        />
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 h-9 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ChevronLeft className="size-4" />
          All courses
        </Link>
      </div>

      <CourseHero course={course} />

      <CourseIntelligencePanel profile={course.profile} />

      <CourseTournaments tournaments={course.tournaments} />
    </PageShell>
  )
}
