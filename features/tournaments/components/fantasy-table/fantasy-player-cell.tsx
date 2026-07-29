'use client'

import { PlayerFlag } from '@/features/tournaments/components/player-flag'
import { PlayerPerformanceBadges } from './player-performance-badges'
import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Reusable player identity cell: circular headshot (with initials fallback),
 * truncated name, and country flag. Shared by every phase's rows so the player
 * column looks and behaves identically across Scheduled / Live / Completed.
 *
 * Clicking anywhere in the cell opens the scorecard drawer. Gracefully handles
 * missing headshots, flags, and long names. Displays up to 2 real badges
 * (Elite, Hot, Value, etc.) based on ranking and form scores.
 */
export function FantasyPlayerCell({
  entrant,
  onClick,
}: {
  entrant: FieldEntrant
  onClick?: (playerId: string) => void
}) {
  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={() => onClick?.(entrant.playerId)}
      className="flex gap-2 items-start py-0 pr-2 w-full text-left hover:opacity-80 transition-opacity duration-150"
      type="button"
    >
      {entrant.headshotUrl ? (
        <img
          src={entrant.headshotUrl}
          alt={entrant.playerName}
          className="h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] shrink-0 rounded-full border border-white/[0.12] object-cover"
        />
      ) : (
        <div className="flex h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-[#1a1f26] text-[10px] sm:text-xs font-medium text-muted-foreground/70">
          {initials}
        </div>
      )}
      <div className="flex flex-col gap-0">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-sm font-medium text-foreground">
            {entrant.playerName}
          </span>
          {entrant.countryCode && (
            <PlayerFlag
              countryCode={entrant.countryCode}
              className="h-[16px] sm:h-[18px] w-auto shrink-0 rounded-[2px]"
            />
          )}
        </div>
        <PlayerPerformanceBadges entrant={entrant} />
      </div>
    </button>
  )
}
