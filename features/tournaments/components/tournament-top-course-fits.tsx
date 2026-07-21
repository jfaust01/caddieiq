'use client'

import { TrendingUp, Zap, Target, Wind, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'

interface CourseFitPlayer {
  rank: number
  playerName: string
  playerId: string
  fitScore: number
  drivingFit: number
  approachFit: number
  shortGameFit: number
  puttingFit: number
  courseHistory: number
}

interface TournamentTopCourseFitsProps {
  players: CourseFitPlayer[]
}

/**
 * Top 10 Course Fits — shows players with the best fit for this specific course.
 * Displays 10 players with course fit breakdown: driving, approach, short game, putting, history.
 * Replaces empty placeholder sections with valuable actionable data.
 */
export function TournamentTopCourseFits({ players }: TournamentTopCourseFitsProps) {
  if (!players || players.length === 0) {
    return null
  }

  const topPlayers = players.slice(0, 10)

  return (
    <section aria-label="Top course fits">
      <SectionHeader
        title="Top Course Fits"
        description="Players best suited for this specific course based on their game and history"
        icon={Target}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-3">Player</div>
            <div className="col-span-2 text-center">Fit Score</div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Zap className="size-3" />
              Drive
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Trophy className="size-3" />
              Short
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Wind className="size-3" />
              Hist
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            {topPlayers.map((player) => (
              <div
                key={player.playerId}
                className="grid grid-cols-12 gap-2 px-3 py-2 rounded hover:bg-muted/30 transition-colors text-sm"
              >
                <div className="col-span-1 text-center font-semibold text-muted-foreground">
                  {player.rank}
                </div>
                <div className="col-span-3 truncate font-medium">
                  {player.playerName}
                </div>
                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-chart-1/20 text-chart-1 font-bold text-xs">
                    {player.fitScore}%
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs">
                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-chart-2"
                      style={{ width: `${Math.min(player.drivingFit, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{player.drivingFit}%</span>
                </div>
                <div className="col-span-2 text-center text-xs">
                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-chart-3"
                      style={{ width: `${Math.min(player.shortGameFit, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{player.shortGameFit}%</span>
                </div>
                <div className="col-span-2 text-center text-xs">
                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-chart-4"
                      style={{ width: `${Math.min(player.courseHistory, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{player.courseHistory}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-chart-2" />
          <span className="text-muted-foreground">Driving</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-chart-3" />
          <span className="text-muted-foreground">Short Game</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-chart-4" />
          <span className="text-muted-foreground">History</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-chart-1" />
          <span className="text-muted-foreground">Overall Fit</span>
        </div>
      </div>
    </section>
  )
}
