'use client'

import { Star } from 'lucide-react'
import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { buildPositionCountMap } from '@/features/tournaments/utils/format-position'
import { FantasyPlayerTable } from './fantasy-player-table'

interface FavoritesTableProps {
  favoriteIds: Set<string>
  allEntrants: FieldEntrant[]
  fieldSize: number
  dfsByPlayer: Map<string, DfsValueResult>
  phase: TablePhase
  tournamentId?: string
  onToggleFavorite: (playerId: string) => void
  onRowClick: (playerId: string) => void
  onRoundSelect?: (playerId: string, round: number) => void
}

export function FavoritesTable({
  favoriteIds,
  allEntrants,
  fieldSize,
  dfsByPlayer,
  phase,
  tournamentId,
  onToggleFavorite,
  onRowClick,
  onRoundSelect,
}: FavoritesTableProps) {
  // Filter entrants to only favorites and maintain original order
  const favoriteEntrants = allEntrants.filter((e) => favoriteIds.has(e.playerId))

  if (favoriteEntrants.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Star size={16} className="fill-yellow-500 stroke-yellow-500" />
        <h3 className="text-sm font-semibold text-white">Favorites ({favoriteEntrants.length})</h3>
      </div>
      <FantasyPlayerTable
        phase={phase}
        entrants={favoriteEntrants}
        allEntrants={allEntrants}
        fieldSize={fieldSize}
        dfsByPlayer={dfsByPlayer}
        tournamentId={tournamentId}
        favoriteIds={favoriteIds}
        onRowClick={onRowClick}
        onToggleFavorite={onToggleFavorite}
        onRoundSelect={onRoundSelect}
      />
    </div>
  )
}
