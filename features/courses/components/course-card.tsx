'use client'

import Link from 'next/link'

import { Card } from '@/components/ui/card'
import type { CourseSummary } from '@/features/courses/types'

export interface CourseCardProps {
  course: CourseSummary
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full p-4 transition-colors hover:bg-accent">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-base line-clamp-2">{course.name}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {course.city && <p>{course.city}</p>}
            {course.stateProvince && (
              <p>
                {course.stateProvince}
                {course.country && `, ${course.country}`}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
