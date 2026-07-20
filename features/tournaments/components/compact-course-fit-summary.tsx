'use client'

import Link from 'next/link'
import { ChevronRight, Zap, TrendingUp } from 'lucide-react'
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
  const traits = fitBoard?.traits?.slice(0, 4) ?? []
  
  if (!fitBoard || !hasCourse || traits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Course Fit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
          <TrendingUp className="size-5 text-muted-foreground/50" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">No course traits</p>
            <p className="text-xs text-muted-foreground/70">Analysis in progress</p>
          </div>
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
