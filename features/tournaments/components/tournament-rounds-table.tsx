'use client'

import { useState } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RoundWithScores, PlayerScoreEntry } from '@/features/tournaments/services/tournament-service'

interface TournamentRoundsTableProps {
  rounds: RoundWithScores[]
  isAdmin?: boolean
  onImportClick?: () => void
  isLoading?: boolean
}

/**
 * Display tournament rounds with player scores in a tabbed interface.
 * Supports sorting by position, score, and player name.
 * Shows status badges for leaders, top 10, made/missed cut, withdrawn.
 * Reuses CaddieIQ styling for consistency.
 */
export function TournamentRoundsTable({
  rounds,
  isAdmin = false,
  onImportClick,
  isLoading = false,
}: TournamentRoundsTableProps) {
  // DEBUG: Component render log
  console.log('[v0] TournamentRoundsTable rendering')
  console.log('[v0]   rounds.length:', rounds.length)

  const [activeRound, setActiveRound] = useState<number | 'overall'>(0)
  const [sortBy, setSortBy] = useState<'position' | 'score' | 'player'>('position')
  const [sortAsc, setSortAsc] = useState(true)

  // Handle empty state
  if (rounds.length === 0) {
    console.log('[v0] TournamentRoundsTable showing empty state')
    return (
      <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <AlertCircle className="size-8 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">No round scoring available</p>
              <p className="text-sm text-muted-foreground">
                Round scoring will appear once play begins or historical results are imported.
              </p>
            </div>
            {isAdmin && onImportClick && (
              <Button
                onClick={onImportClick}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                {isLoading ? 'Importing...' : 'Import Historical Results'}
              </Button>
            )}
          </div>
        </Card>
    )
  }

  // Build tabs: individual rounds + overall
  const tabs = rounds.map((r) => ({ label: `Round ${r.roundNumber}`, value: r.roundNumber }))
  if (rounds.length > 1) {
    tabs.push({ label: 'Overall', value: 'overall' as const })
  }

  // Get current round data
  const currentRound =
    activeRound === 'overall'
      ? {
          roundId: 'overall',
          roundNumber: 0,
          scheduledDate: null,
          status: 'COMPLETED',
          playerScores: aggregateScores(rounds),
        }
      : rounds.find((r) => r.roundNumber === activeRound)

  // DEBUG: Log activeRound data
  console.log('[v0] ════════════════════════════════════════════════════')
  console.log('[v0] INSIDE TournamentRoundsTable')
  console.log('[v0] activeRound:', activeRound)
  console.log('[v0] currentRound.playerScores.length:', currentRound?.playerScores?.length ?? 'currentRound is null')
  console.log('[v0] ════════════════════════════════════════════════════')

  if (!currentRound) {
    return null
  }

  // Sort player scores
  const sortedScores = sortScores(currentRound.playerScores, sortBy, sortAsc)

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveRound(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeRound === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort toolbar */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {(['position', 'score', 'player'] as const).map((col) => (
          <Button
            key={col}
            size="sm"
            variant={sortBy === col ? 'default' : 'outline'}
            onClick={() => {
              if (sortBy === col) {
                setSortAsc(!sortAsc)
              } else {
                setSortBy(col)
                setSortAsc(true)
              }
            }}
            className="gap-1"
          >
            {col === 'position' && 'Position'}
            {col === 'score' && 'Score'}
            {col === 'player' && 'Player'}
            {sortBy === col && (
              <ChevronDown className={cn('size-3', sortAsc ? 'rotate-180' : '')} aria-hidden />
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-foreground">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Player</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Score</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">To Par</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No scoring data available for this round.
                </td>
              </tr>
            ) : (
              sortedScores.map((entry, idx) => (
                <RoundScoreRow key={entry.playerRoundId} entry={entry} rank={idx + 1} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface RoundScoreRowProps {
  entry: PlayerScoreEntry
  rank: number
}

function RoundScoreRow({ entry, rank }: RoundScoreRowProps) {
  const isLeader = entry.position === 1
  const isTop10 = entry.position && entry.position <= 10
  const statusBadges = []

  if (entry.withdrawn) {
    statusBadges.push({ label: 'WD', variant: 'secondary' as const })
  } else if (entry.disqualified) {
    statusBadges.push({ label: 'DQ', variant: 'destructive' as const })
  } else if (entry.madeCut === false) {
    statusBadges.push({ label: 'Missed Cut', variant: 'outline' as const })
  } else if (entry.madeCut === true) {
    statusBadges.push({ label: 'Made Cut', variant: 'outline' as const })
  }

  const positionDisplay = entry.withdrawn || entry.disqualified ? '—' : entry.position || '—'
  const scoreDisplay = entry.score ?? '—'
  const toParDisplay = entry.toPar ? (entry.toPar > 0 ? `+${entry.toPar}` : `${entry.toPar}`) : '—'

  return (
    <tr
      className={cn(
        'border-b border-border hover:bg-muted/50 transition-colors',
        isLeader && 'bg-primary/5',
        isTop10 && !isLeader && 'bg-muted/20',
      )}
    >
      <td className={cn('px-4 py-3 font-mono text-sm', isLeader && 'font-semibold text-primary')}>
        {positionDisplay}
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{entry.playerName}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{scoreDisplay}</td>
      <td className={cn('px-4 py-3 text-right font-mono text-sm', entry.toPar && entry.toPar < 0 && 'text-primary')}>
        {toParDisplay}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {isLeader && <Badge variant="default">Leader</Badge>}
          {isTop10 && !isLeader && <Badge variant="secondary">Top 10</Badge>}
          {statusBadges.map((sb) => (
            <Badge key={sb.label} variant={sb.variant}>
              {sb.label}
            </Badge>
          ))}
        </div>
      </td>
    </tr>
  )
}

/**
 * Aggregate scores across all rounds to create an overall leaderboard.
 * Sums scores and to-par; uses best position and made cut status.
 */
function aggregateScores(rounds: RoundWithScores[]): PlayerScoreEntry[] {
  const aggregated = new Map<string, PlayerScoreEntry>()

  for (const round of rounds) {
    for (const entry of round.playerScores) {
      const existing = aggregated.get(entry.playerId)
      if (!existing) {
        aggregated.set(entry.playerId, {
          playerRoundId: `${entry.playerId}-overall`,
          playerId: entry.playerId,
          playerName: entry.playerName,
          position: entry.position,
          score: entry.score ?? 0,
          toPar: entry.toPar ?? 0,
          madeCut: entry.madeCut,
          withdrawn: entry.withdrawn,
          disqualified: entry.disqualified,
        })
      } else {
        existing.score = (existing.score ?? 0) + (entry.score ?? 0)
        existing.toPar = (existing.toPar ?? 0) + (entry.toPar ?? 0)
        if (entry.withdrawn) existing.withdrawn = true
        if (entry.disqualified) existing.disqualified = true
        // Update position only if this entry has a better one
        if (entry.position && (!existing.position || entry.position < existing.position)) {
          existing.position = entry.position
        }
      }
    }
  }

  return Array.from(aggregated.values())
}

/**
 * Sort player scores by the specified column.
 */
function sortScores(
  scores: PlayerScoreEntry[],
  sortBy: 'position' | 'score' | 'player',
  ascending: boolean,
): PlayerScoreEntry[] {
  const sorted = [...scores].sort((a, b) => {
    let cmp = 0

    if (sortBy === 'position') {
      const aPos = a.position ?? Infinity
      const bPos = b.position ?? Infinity
      cmp = aPos - bPos
    } else if (sortBy === 'score') {
      const aScore = a.score ?? Infinity
      const bScore = b.score ?? Infinity
      cmp = aScore - bScore
    } else if (sortBy === 'player') {
      cmp = a.playerName.localeCompare(b.playerName)
    }

    return ascending ? cmp : -cmp
  })

  return sorted
}
