'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { Gauge } from 'lucide-react'

interface HoleDifficulty {
  rank: number
  holeNumber: number
  par: number
  yardage: number
  avgScore: number
  difficulty: number
  birdiePercent: number
  bogeyPercent: number
}

interface CourseSummary {
  hasHoleData: boolean
  totalPar: number
  totalYardage: number
  frontNinePar: number
  backNinePar: number
  frontNineYardage: number
  backNineYardage: number
  parDistribution: Record<number, number>
  holesByLength: { short: number; medium: number; long: number }
  topHardestHoles: HoleDifficulty[]
  topEasiestHoles: HoleDifficulty[]
  avgScore: number
  avgBirdiePercent: number
  avgBogeyPercent: number
}

interface TournamentCourseSummaryHolesProps {
  summary: CourseSummary
}

/**
 * Course Summary Holes — replaces empty hole breakdown with actionable course data.
 * Shows: hole-by-hole difficulty if available, or course summary stats.
 * Displays: par distribution, hole length distribution, front vs back nine comparison.
 */
export function TournamentCourseSummaryHoles({
  summary,
}: TournamentCourseSummaryHolesProps) {
  if (!summary) {
    return null
  }

  return (
    <section aria-label="Course holes and difficulty">
      <SectionHeader
        title="Course Summary"
        description="Hole-by-hole analysis and course characteristics"
        icon={Gauge}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Front vs Back Nine */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Front vs Back Nine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Front Nine</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Par</span>
                    <span className="font-bold">{summary.frontNinePar}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Yards</span>
                    <span className="font-bold">{(summary.frontNineYardage / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Back Nine</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Par</span>
                    <span className="font-bold">{summary.backNinePar}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Yards</span>
                    <span className="font-bold">{(summary.backNineYardage / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Par Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Par Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.parDistribution).map(([par, count]) => (
                <div key={par} className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Par {par}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-chart-1"
                        style={{ width: `${(count / 18) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground w-4 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hole Length Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Hole Lengths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1">Short Holes (&lt;350y)</p>
                <p className="text-lg font-bold text-chart-1">{summary.holesByLength.short}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">Medium Holes (350-420y)</p>
                <p className="text-lg font-bold text-chart-2">{summary.holesByLength.medium}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">Long Holes (&gt;420y)</p>
                <p className="text-lg font-bold text-chart-3">{summary.holesByLength.long}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Hardest & Easiest Holes */}
      {summary.hasHoleData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
          {/* Hardest */}
          {summary.topHardestHoles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top 5 Hardest Holes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.topHardestHoles.slice(0, 5).map((hole) => (
                    <div
                      key={hole.holeNumber}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Hole {hole.holeNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Par {hole.par} · {hole.yardage}y · {hole.avgScore.toFixed(1)} avg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">{hole.difficulty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Easiest */}
          {summary.topEasiestHoles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top 5 Easiest Holes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.topEasiestHoles.slice(0, 5).map((hole) => (
                    <div
                      key={hole.holeNumber}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Hole {hole.holeNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Par {hole.par} · {hole.yardage}y · {hole.avgScore.toFixed(1)} avg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-500">{hole.difficulty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Scoring Statistics */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scoring Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Avg Score</p>
              <p className="text-2xl font-bold">{summary.avgScore.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Birdie %</p>
              <p className="text-2xl font-bold">{summary.avgBirdiePercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Bogey %</p>
              <p className="text-2xl font-bold">{summary.avgBogeyPercent.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
