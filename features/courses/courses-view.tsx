import { MapPinned, Plus } from 'lucide-react'

import { ResourceView } from '@/components/shared/resource-view'
import { Button } from '@/components/ui/button'

export function CoursesView() {
  return (
    <ResourceView
      eyebrow="Data"
      title="Courses"
      description="Course profiles, layouts, and playing conditions that shape model outputs."
      searchPlaceholder="Search courses..."
      emptyIcon={MapPinned}
      emptyTitle="No courses yet"
      emptyDescription="Add a course profile to capture the conditions and characteristics your models weigh."
      actions={
        <Button>
          <Plus data-icon="inline-start" />
          Add course
        </Button>
      }
    />
  )
}
