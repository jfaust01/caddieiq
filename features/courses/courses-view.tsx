import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { CourseDirectory } from '@/features/courses/components/course-directory'
import { MapPinned } from 'lucide-react'

export function CoursesView() {
  return (
    <PageShell>
      <PageHeader
        title="Courses"
        description="Browse the course database. Search by name, city, or location to find playing conditions and characteristics."
        icon={<MapPinned className="h-6 w-6" />}
      />
      <CourseDirectory />
    </PageShell>
  )
}
