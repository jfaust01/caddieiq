'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import type { Player } from '@/features/players/types'

interface PlayersFantasyTableProps {
  players: Player[]
  isLoading?: boolean
  className?: string
  onPlayerClick?: (playerId: string) => void
}

/**
 * Fantasy table displaying players with position, name, flag, and headshot.
 * Redesigned UI to match reference design with proper layout, spacing, and density.
 * Only shows columns with real data available (never fabricates metrics).
 */
export function PlayersFantasyTable({
  players,
  isLoading,
  className,
  onPlayerClick,
}: PlayersFantasyTableProps) {
  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading players...</div>
  }

  if (!players || players.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No players found</div>
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        'bg-[#0D1117] shadow-sm',
        className,
      )}
      style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-12" />
            <col className="flex-1" />
          </colgroup>

          {/* Header */}
          <thead>
            <tr
              className="sticky top-0 z-40 h-11 border-b bg-[#101619]"
              style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
            >
              <th className="px-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
                POS
              </th>
              <th className="px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                PLAYER
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id}
                className="h-14 border-b bg-[#0D1117] transition-colors hover:bg-[#0F1419] cursor-pointer group"
                style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
                onClick={() => onPlayerClick?.(player.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPlayerClick?.(player.id)
                  }
                }}
              >
                {/* Position */}
                <td className="px-3 text-center text-sm font-medium text-foreground border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
                  {idx + 1}
                </td>

                {/* Player cell: headshot, name, flag */}
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerHeadshot player={player} className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Link
                        href={`/players/${player.id}`}
                        className="truncate text-sm font-medium text-foreground hover:underline focus-visible:underline outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {player.fullName}
                      </Link>
                      {player.nationality && (
                        <CountryFlag nationality={player.nationality} className="shrink-0" />
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
