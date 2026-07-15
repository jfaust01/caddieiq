import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CourseDetailView } from '@/features/courses/course-detail-view'
import { courseService } from '@/features/courses/services/course-service'

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { courseId } = await params

  try {
    const course = await courseService.getCourseById(courseId)

    if (!course) {
      return {
        title: 'Course not found',
        description: 'This course could not be located in the CaddieIQ database.',
      }
    }

    return {
      title: course.name,
      description: `Course profile and hosted tournaments for ${course.name}.`,
    }
  } catch {
    // Never let a transient database error break metadata generation.
    return {
      title: 'Course',
      description: 'Course profile and hosted tournaments.',
    }
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const course = await courseService.getCourseById(courseId)

  // Invalid or unknown id → proper HTTP 404 via the nearest not-found boundary.
  if (!course) {
    notFound()
  }

  return <CourseDetailView course={course} />
}
