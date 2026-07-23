'use client'

import type { TournamentSummary } from '@/features/tournaments/types'
import { formatPurse, formatDkTotal, textDisplay } from '@/features/tournaments/utils/format'
import { DraftKingsMark } from './draftkings-mark'

interface EventDetailsPill {
  label: string
  value: string
}

/**
 * Event Details Pills component.
 * Displays supplemental tournament information in a compact, scannable pill format.
 * Filters out information already shown in the header to avoid duplication.
 * Header includes: Name, Status, Dates, Course, Field size, Weather
 */
export function EventDetailsPills({ tournament }: { tournament: TournamentSummary }) {
  const pills: EventDetailsPill[] = []

  // Tour (not in header)
  if (tournament.tour?.name) {
    pills.push({ label: 'Tour', value: tournament.tour.name })
  }

  // Season (not in header)
  if (tournament.season) {
    pills.push({ label: 'Season', value: `${tournament.season}` })
  }

  // Location (not in header, only city/state shown via formatLocation)
  // Skip if already showing in header - check if location is in header
  // For now, skip as it may be in the compact header

  // Par (not in header)
  if (tournament.courseRef?.par) {
    pills.push({ label: 'Par', value: `${tournament.courseRef.par}` })
  }

  // Yardage (not in header)
  if (tournament.courseRef?.yardage) {
    pills.push({ label: 'Yardage', value: `${tournament.courseRef.yardage.toLocaleString()} yds` })
  }

  // Purse (not in header, but shown in TournamentOverview - exclude to avoid duplication)
  // Actually, check header - purse is NOT in header, so include it
  if (tournament.purse) {
    pills.push({ label: 'Purse', value: formatPurse(tournament.purse) })
  }

  // DK Total (aggregate fantasy points for field)
  if (tournament.totalDkFantasyPoints !== null) {
    pills.push({ label: 'DKTotal', value: formatDkTotal(tournament.totalDkFantasyPoints) })
  }

  // Cut rule (not in header)
  if (tournament.cutAfterRounds) {
    pills.push({
      label: 'Cut Rule',
      value: `After ${tournament.cutAfterRounds} round${tournament.cutAfterRounds !== 1 ? 's' : ''}`,
    })
  }

  // Cut line (not in header)
  if (tournament.cutLine !== null) {
    const cutLineValue = tournament.cutLine >= 0 ? `+${tournament.cutLine}` : `${tournament.cutLine}`
    pills.push({ label: 'Cut Line', value: cutLineValue })
  }

  // FedEx points (not in header)
  if (tournament.fedExPoints) {
    pills.push({ label: 'FedEx Points', value: `${tournament.fedExPoints}` })
  }

  // World ranking points (not in header)
  if (tournament.worldRankingPoints) {
    pills.push({ label: 'World Ranking Points', value: `${tournament.worldRankingPoints}` })
  }

  // Filter out empty pills
  const filteredPills = pills.filter((pill) => pill.value && pill.value !== '—')

  if (filteredPills.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3">
      {filteredPills.map((pill) => (
        <div
          key={pill.label}
          className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2.5"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            {pill.label === 'DKTotal' ? (
              <>
                <DraftKingsMark className="h-3 w-auto" />
                <span>TOTAL</span>
              </>
            ) : (
              pill.label
            )}
          </span>
          <span className="text-sm font-semibold text-foreground">{pill.value}</span>
        </div>
      ))}
    </div>
  )
}
