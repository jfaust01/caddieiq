import { PlayerFlag } from '@/features/tournaments/components/player-flag'
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
    <div className="flex min-w-0 items-center gap-2">
      {entrant.headshotUrl ? (
        <img
          src={entrant.headshotUrl || '/placeholder.svg'}
          alt={entrant.playerName}
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full border border-white/[0.08] object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-xs font-semibold text-white">
          {initials}
        </div>
      )}
      <div className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {entrant.playerName}
        </span>
        {entrant.countryCode && (
          <PlayerFlag
            countryCode={entrant.countryCode}
            className="h-4 sm:h-5 w-auto shrink-0 rounded-[2px]"
          />
        )}
      </div>
    </div>
  )
}
