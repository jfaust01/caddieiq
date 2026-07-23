'use client'

import { Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDfsSalary } from '@/features/tournaments/utils/format'
import { DraftKingsMark } from '../draftkings-mark'

interface TournamentWinnerCardProps {
  tournamentWinner: {
    playerId: string
    playerName: string
    headshotUrl: string | null
    scoreToPar: number | null
    dkFantasyPoints: number | null
    dfsSalary: number | null
  } | null
  /** Whether the tournament is completed; if false, shows "TBD" */
  isCompleted?: boolean
  className?: string
}

/**
 * Format score to par display.
 * Examples: -18 → -18, +2 → +2, 0 → E, null → —
 */
function formatScoreToPar(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '—'
  }
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

/**
 * Format DK fantasy points for display.
 * Examples: 112.5 → 112.5, 112 → 112, null → —
 * (Logo will be rendered separately)
 */
function formatDkPoints(points: number | null | undefined): string {
  if (points === null || points === undefined || !Number.isFinite(points)) {
    return '—'
  }
  // Format with 1 decimal place, remove trailing .0
  const rounded = Math.round(points * 10) / 10
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
  return formatted
}

/**
 * Tournament Winner Card - displays the official tournament champion,
 * including their final score relative to par and DK fantasy points.
 */
export function TournamentWinnerCard({
  tournamentWinner,
  isCompleted = true,
  className,
}: TournamentWinnerCardProps) {
  const scoreToPar = formatScoreToPar(tournamentWinner?.scoreToPar)
  const dkPoints = formatDkPoints(tournamentWinner?.dkFantasyPoints)
  const dfsSalary = formatDfsSalary(tournamentWinner?.dfsSalary)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <Award className="size-5 text-primary" aria-hidden />
        <CardTitle>Tournament Winner</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {tournamentWinner ? (
          <>
            {/* Player with Headshot or Initials */}
            <div className="flex items-center gap-3">
              {tournamentWinner.headshotUrl ? (
                <img
                  src={tournamentWinner.headshotUrl}
                  alt={tournamentWinner.playerName}
                  className="size-10 rounded-full object-cover bg-muted"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {tournamentWinner.playerName
                    .split(' ')
                    .slice(0, 2)
                    .map(name => name[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
                <div className="flex flex-col gap-1.5">
                <div className="text-sm font-semibold text-foreground">
                  {tournamentWinner.playerName}
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 tabular-nums">
                    <span>{scoreToPar}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <DraftKingsMark className="h-2.5 w-auto" />
                      <span>{dkPoints}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {dfsSalary}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : !isCompleted ? (
          <div className="text-3xl font-bold text-muted-foreground">TBD</div>
        ) : (
          <div className="text-3xl font-bold text-muted-foreground">—</div>
        )}
      </CardContent>
    </Card>
  )
}
