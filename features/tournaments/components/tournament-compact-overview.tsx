'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { EventDetailsPills } from './event-details-pills'
import { TournamentField } from './tournament-field'
import { TournamentWinnerCard } from './tournament-elevation/tournament-winner-card'

interface TournamentCompactOverviewProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}

/**
 * Normalize tournament completion status to handle various terminal states.
 */
function isTournamentCompleted(
  status: string | null | undefined
): boolean {
  const normalized = status?.trim().toLowerCase()
  return [
    'completed',
    'complete',
    'final',
    'finished',
    'closed',
  ].includes(normalized ?? '')
}

/**
 * Extract numeric position from various position formats.
 * Examples: 1 → 1, "1" → 1, "T1" → 1, "T5" → 5
 */
function getNumericPosition(
  position: number | string | null | undefined
): number | null {
  if (typeof position === 'number' && Number.isFinite(position)) {
    return position
  }

  if (typeof position === 'string') {
    const match = position.trim().toUpperCase().match(/^T?(\d+)$/)
    return match ? Number(match[1]) : null
  }

  return null
}

/**
 * Get the tournament winner from authoritative completed leaderboard data.
 * When tournament is completed and has a valid first-place entrant,
 * return their details for the winner card.
 */
function getResolvedWinner(tournament: TournamentSummary, field: TournamentField) {
  const isCompleted = isTournamentCompleted(tournament.status)

  if (!isCompleted || field.size === 0 || field.entrants.length === 0) {
    return tournament.tournamentWinner
  }

  // Prefer authoritative provider-supplied winner
  if (tournament.tournamentWinner) {
    return tournament.tournamentWinner
  }

  // Find first-place entrant from canonical leaderboard, excluding withdrawn/DQ players
  const firstPlaceEntrant = field.entrants.find(
    entrant =>
      getNumericPosition(entrant.position) === 1 &&
      !['WD', 'DQ', 'MC', 'MDF'].includes(
        String(entrant.status ?? '').toUpperCase()
      ) &&
      !entrant.withdrawn
  )

  if (!firstPlaceEntrant) {
    return null
  }

  // Construct winner data from first-place entrant
  return {
    playerId: firstPlaceEntrant.playerId,
    playerName: firstPlaceEntrant.playerName,
    headshotUrl: firstPlaceEntrant.headshotUrl,
    scoreToPar: firstPlaceEntrant.total,
    dkFantasyPoints: firstPlaceEntrant.totalDkFantasyPoints,
    dfsSalary: firstPlaceEntrant.dfsSalary,
    countryCode: firstPlaceEntrant.countryCode,
  }
}

/**
 * Tournament overview displaying event metadata and field information.
 */
export function TournamentCompactOverview({
  tournament,
  field,
  fieldReport,
}: TournamentCompactOverviewProps) {
  const tournamentId = tournament.id
  const hasField = field.size > 0
  const resolvedWinner = getResolvedWinner(tournament, field)

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {/* Event Details Pills */}
      <div className="min-w-0">
        <EventDetailsPills tournament={tournament} />
      </div>

      {/* Winner Card - displayed above Field section */}
      {hasField && (
        <div className="border-t border-border pt-6">
          <TournamentWinnerCard
            tournamentWinner={resolvedWinner}
            isCompleted={isTournamentCompleted(tournament.status)}
          />

          {/* Footnote */}
          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <div className="mt-0.5 shrink-0 text-muted-foreground/60">ℹ</div>
            <p>Stats update automatically when official results and scoring are available.</p>
          </div>
        </div>
      )}

      {/* Field Section */}
      {hasField && (
        <div className="pt-2 border-t border-border min-w-0">
          <div className="min-w-0">
            <TournamentField field={field} tournamentId={tournamentId} />
          </div>
        </div>
      )}
    </div>
  )
}
