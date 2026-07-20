'use client'

import { Trophy, MapPin } from 'lucide-react'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { CourseIntelligence } from '@/features/courses/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompactCourseHistoryRowProps {
  tournament: TournamentSummary
  courseProfile: CourseIntelligence | null
}

/**
 * Compact course facts and historical results row.
 */
export function CompactCourseHistoryRow({
  tournament,
  courseProfile,
}: CompactCourseHistoryRowProps) {
  const par = tournament.courseRef?.par ?? null
  const yardage = tournament.courseRef?.yardage ?? null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Course Facts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Course Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {par && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Par</span>
              <span className="font-semibold">{par}</span>
            </div>
          )}
          {yardage && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Yardage</span>
              <span className="font-semibold">{yardage.toLocaleString()}</span>
            </div>
          )}
          {courseProfile?.averageScore !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg Score</span>
              <span className="font-semibold">{courseProfile.averageScore.toFixed(1)}</span>
            </div>
          )}
          {courseProfile?.handicapRating !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slope</span>
              <span className="font-semibold">{courseProfile.handicapRating.toFixed(0)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Winners/History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Winners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {tournament.defendingChampion && (
              <div className="flex items-start gap-2">
                <Trophy className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Defending</div>
                  <div className="font-semibold">{tournament.defendingChampion}</div>
                </div>
              </div>
            )}
            {tournament.location && (
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-semibold">{tournament.location}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
