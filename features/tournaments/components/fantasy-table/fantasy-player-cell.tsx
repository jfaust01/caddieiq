import { PlayerFlag } from '@/features/tournaments/components/player-flag'
import { PlayerPerformanceBadges } from './player-performance-badges'
import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Reusable player identity cell: circular headshot (with initials fallback),
 * truncated name, and country flag. Shared by every phase's rows so the player
 * column looks and behaves identically across Scheduled / Live / Completed.
 *
 * Renders the inner cell content only — the parent supplies the wrapping <td>.
 */
export function FantasyPlayerCell({ entrant }: { entrant: FieldEntrant }) {
  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex gap-2">
      {entrant.headshotUrl ? (
        <img
          src={entrant.headshotUrl || '/placeholder.svg'}
          alt={entrant.playerName}
          className="h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] shrink-0 rounded-full border border-white/[0.12] object-cover"
        />
      ) : (
        <div className="flex h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-[#1a1f26] text-[10px] sm:text-xs font-medium text-muted-foreground/70">
          {initials}
        </div>
      )}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
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
    </div>
  )
}
