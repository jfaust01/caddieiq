'use client'

import { DollarSign, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'

interface ValuePlay {
  playerId: string
  playerName: string
  salary: number
  valueRating: number
  projectedPoints: number
  ownership: number
  leverage: number
  boom: number
}

interface TournamentDfsValuePlaysProps {
  plays: ValuePlay[]
}

/**
 * DFS Value Plays — shows undervalued players with high upside.
 * Displays salary, value rating, projected points, ownership, leverage, boom %.
 * Helps DFS players find value before building lineups.
 */
export function TournamentDfsValuePlays({ plays }: TournamentDfsValuePlaysProps) {
  if (!plays || plays.length === 0) {
    return null
  }

  const topPlays = plays.slice(0, 12)

  return (
    <section aria-label="DFS value plays">
      <SectionHeader
        title="DFS Value Plays"
        description="Best value picks with upside relative to salary and ownership"
        icon={DollarSign}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-11 gap-2 text-xs font-semibold text-muted-foreground px-3">
            <div className="col-span-2">Player</div>
            <div className="col-span-1 text-right">Salary</div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <Zap className="size-3" />
              Value
            </div>
            <div className="col-span-1 text-right">Proj Pts</div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <Users className="size-3" />
              Own%
            </div>
            <div className="col-span-1 text-right">Lever</div>
            <div className="col-span-1 text-right">Boom%</div>
            <div className="col-span-2 text-center">PPK</div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-1">
            {topPlays.map((play) => {
              const ppk = (play.projectedPoints / play.salary) * 1000
              return (
                <Link
                  key={play.playerId}
                  href={`/players/${play.playerId}`}
                  className="grid grid-cols-11 gap-2 px-3 py-2 rounded hover:bg-muted/40 transition-colors text-sm group"
                >
                  <div className="col-span-2 truncate font-medium group-hover:underline">
                    {play.playerName}
                  </div>
                  <div className="col-span-1 text-right tabular-nums font-mono text-muted-foreground">
                    ${(play.salary / 1000).toFixed(1)}K
                  </div>
                  <div className="col-span-1 text-right">
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-chart-1/20 text-chart-1 font-bold text-xs">
                      {play.valueRating}
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-xs">
                    <span className="font-bold">{play.projectedPoints.toFixed(1)}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-chart-2"
                        style={{ width: `${Math.min(play.ownership, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{play.ownership}%</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-xs font-semibold">{play.leverage.toFixed(1)}x</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={`text-xs font-bold ${play.boom > 30 ? 'text-chart-1' : 'text-muted-foreground'}`}>
                      {play.boom}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-bold">{ppk.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground"> pts/K</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground font-semibold mb-1">Value Rating</p>
          <p className="text-muted-foreground">Risk/reward score</p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold mb-1">Leverage</p>
          <p className="text-muted-foreground">Ownership advantage</p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold mb-1">PPK</p>
          <p className="text-muted-foreground">Points per $1K salary</p>
        </div>
      </div>
    </section>
  )
}
