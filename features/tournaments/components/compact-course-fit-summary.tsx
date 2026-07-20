'use client'

import Link from 'next/link'
import { ChevronRight, Zap } from 'lucide-react'
import type { FieldFitBoard } from '@/features/tournaments/services/tournament-service'
import type { CourseRef } from '@/features/tournaments/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CompactCourseFitSummaryProps {
  fitBoard: FieldFitBoard | null
  hasCourse: boolean
  courseRef: CourseRef | null
}

/**
 * Compact course fit summary showing top 3-5 traits.
 * Links to full course details tab.
 */
export function CompactCourseFitSummary({
  fitBoard,
  hasCourse,
  courseRef,
}: CompactCourseFitSummaryProps) {
  if (!fitBoard || !hasCourse) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Course fit data not available
        </CardContent>
      </Card>
    )
  }

  // Extract top traits from fit board
  const traits = fitBoard.traits?.slice(0, 4) ?? []

  if (traits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No course traits available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Course Fit</CardTitle>
          {courseRef && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              nativeButton={false}
              render={
                <Link href={`/courses/${courseRef.id}`}>
                  View course
                  <ChevronRight className="size-4" />
                </Link>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {traits.map((trait) => (
            <div key={trait} className="flex items-center gap-2 text-sm">
              <Zap className="size-3 text-amber-500 shrink-0" aria-hidden />
              <span>{trait}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
