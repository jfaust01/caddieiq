'use client'

import { CourseQualityReport } from '@/features/admin/courses/course-quality-report'

export default function CoursesQualityPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Course Data Quality</h1>
        <p className="text-muted-foreground">
          Validate imported GolfCourseAPI data quality and identify issues
        </p>
      </div>

      <CourseQualityReport />
    </div>
  )
}
