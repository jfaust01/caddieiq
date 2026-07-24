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
 * Only shows columns with real data available (never fabricates metrics).
 * Rows are clickable, with proper keyboard navigation support.
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
        'relative overflow-hidden rounded-2xl border',
        'bg-[#0D1117] shadow-lg',
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/20 before:to-transparent before:pointer-events-none',
        className,
      )}
      style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr
              className="h-12 border-b bg-[#101619]"
              style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
            >
              <th className="w-12 px-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                POS
              </th>
              <th className="flex-1 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/80 border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
                PLAYER
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id}
                className="h-16 border-b bg-[#0D1117] transition-colors hover:bg-[#0F1419] cursor-pointer group"
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
                <td className="w-12 px-3 text-center text-sm font-medium text-foreground border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
                  {idx + 1}
                </td>

                {/* Player cell: headshot, name, flag */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerHeadshot player={player} className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/players/${player.id}`}
                        className="truncate text-sm font-medium text-foreground hover:underline focus-visible:underline outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {player.fullName}
                      </Link>
                      {player.nationality && (
                        <CountryFlag nationality={player.nationality} />
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
