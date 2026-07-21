import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { CourseDirectory } from '@/features/courses/components/course-directory'

export function CoursesView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Data"
        title="Courses"
        description="Browse the course database that powers your models. Search by name, city, or location to find playing conditions and characteristics."
      />
      <CourseDirectory />
    </PageShell>
  )
}
