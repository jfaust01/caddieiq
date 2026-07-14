'use client'

import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { RecentForm } from '@/features/players/components/recent-form'
import { tourShortLabel } from '@/features/players/utils/format'
import { cn } from '@/lib/utils'

import type { RankingRow } from '../types'
import { RankingMovement } from './ranking-movement'
import { ScoreChip } from './score-chip'

interface RankingsTableProps {
  rows: RankingRow[]
  selectedPlayerId: string | null
  onSelect: (playerId: string) => void
  isFavorite: (playerId: string) => boolean
  onToggleFavorite: (playerId: string) => void
}

/**
 * The core rankings leaderboard. Rows are selectable (opening the player
 * preview) and expose favorite + player-page actions.
 *
 * TODO(data): rows are mock output from the Ranking Engine — the player-page
 * link assumes engine ids map to `Player.id` in the live data model.
 */
export function RankingsTable({
  rows,
  selectedPlayerId,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: RankingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-14 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="hidden md:table-cell">Country</TableHead>
            <TableHead className="text-right">Overall</TableHead>
            <TableHead className="text-center">Trend</TableHead>
            <TableHead className="hidden lg:table-cell">Recent Form</TableHead>
            <TableHead className="hidden text-center xl:table-cell">
              Course Fit
            </TableHead>
            <TableHead className="hidden text-center sm:table-cell">
              Value
            </TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const favorite = isFavorite(row.playerId)
            const selected = row.playerId === selectedPlayerId
            return (
              <TableRow
                key={row.playerId}
                data-state={selected ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => onSelect(row.playerId)}
              >
                <TableCell className="text-center">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {row.rank}
                  </span>
                </TableCell>

                <TableCell>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(row.playerId)
                    }}
                    className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <PlayerHeadshot
                      player={{ fullName: row.name, headshotUrl: row.headshotUrl }}
                      size="sm"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tourShortLabel(row.tour)}
                      </span>
                    </span>
                  </button>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <CountryFlag nationality={row.nationality} showName />
                </TableCell>

                <TableCell className="text-right">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {Math.round(row.overallScore)}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <RankingMovement movement={row.movement} delta={row.delta} />
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <RecentForm form={row.recentForm} limit={5} />
                </TableCell>

                <TableCell className="hidden text-center xl:table-cell">
                  <ScoreChip value={row.moduleScores.courseFit} />
                </TableCell>

                <TableCell className="hidden text-center sm:table-cell">
                  <ScoreChip value={row.moduleScores.value} />
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        favorite
                          ? `Remove ${row.name} from favorites`
                          : `Add ${row.name} to favorites`
                      }
                      aria-pressed={favorite}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleFavorite(row.playerId)
                      }}
                    >
                      <Star
                        className={cn(
                          favorite && 'fill-warning text-warning',
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        <Link
                          href={`/players/${row.playerId}`}
                          aria-label={`Open ${row.name} player page`}
                          onClick={(event) => event.stopPropagation()}
                        />
                      }
                    >
                      <ExternalLink />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
