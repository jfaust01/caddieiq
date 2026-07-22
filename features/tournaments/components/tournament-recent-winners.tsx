'use client'

import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'

interface Winner {
  year: number
  playerName: string
  playerId: string
  score: string
  margin: string
  playoff: boolean
  worldRanking: number
}

interface TournamentRecentWinnersProps {
  winners: Winner[]
}

/**
 * Recent Winners — shows last 10 years of tournament winners.
 * Displays: winner name, winning score, playoff, margin, world ranking at time.
 * Helps identify patterns and find players who win this tournament.
 */
export function TournamentRecentWinners({ winners }: TournamentRecentWinnersProps) {
  if (!winners || winners.length === 0) {
    return null
  }

  return (
    <section aria-label="Recent tournament winners">
      <SectionHeader
        title="Last 10 Years"
        description="Tournament winners and their performance data"
        icon={Trophy}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-3">
            <div className="col-span-2">Year</div>
            <div className="col-span-3">Winner</div>
            <div className="col-span-2 text-right">Score</div>
            <div className="col-span-2 text-right">Margin</div>
            <div className="col-span-2 text-right">OWGR</div>
            <div className="col-span-1 text-center">PO</div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-1">
            {winners.map((winner) => (
              <Link
                key={`${winner.year}-${winner.playerId}`}
                href={`/players/${winner.playerId}`}
                className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded hover:bg-muted/40 transition-colors text-sm group"
              >
                <div className="col-span-2 font-mono text-muted-foreground font-bold">
                  {winner.year}
                </div>
                <div className="col-span-3 truncate font-medium group-hover:underline">
                  {winner.playerName}
                </div>
                <div className="col-span-2 text-right font-mono font-bold">
                  {winner.score}
                </div>
                <div className="col-span-2 text-right text-muted-foreground">
                  {winner.margin}
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-xs font-semibold bg-chart-1/20 text-chart-1 px-2 py-1 rounded">
                    {winner.worldRanking}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  {winner.playoff ? (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-900/20 text-orange-400 text-xs font-semibold">
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-3 text-xs text-muted-foreground">
        OWGR = World ranking at time of win | PO = Playoff required
      </p>
    </section>
  )
}
