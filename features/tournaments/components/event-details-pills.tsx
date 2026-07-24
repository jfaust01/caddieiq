'use client'

import {
  Award,
  CalendarDays,
  CircleDollarSign,
  Flag,
  Gauge,
  Globe,
  Scissors,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import type { TournamentSummary } from '@/features/tournaments/types'
import { formatPurse, formatDkTotal } from '@/features/tournaments/utils/format'
import { DraftKingsMark } from './draftkings-mark'

interface EventDetailsPill {
  label: string
  value: string
}

/** Premium icon per fact label; falls back to a neutral target mark. */
const PILL_ICONS: Record<string, LucideIcon> = {
  Tour: Trophy,
  Season: CalendarDays,
  Par: Flag,
  Yardage: Gauge,
  Purse: CircleDollarSign,
  'Cut Rule': Scissors,
  'Cut Line': Target,
  'FedEx Points': Award,
  'World Ranking Points': Globe,
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {filteredPills.map((pill) => {
        const isDkTotal = pill.label === 'DKTotal'
        const Icon = PILL_ICONS[pill.label] ?? Target

        return (
          <div
            key={pill.label}
            className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0D1318] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-emerald-400/25 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_40px_rgba(16,185,129,0.08)]"
          >
            {/* Top accent line */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
            />
            {/* Top-right emerald glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/[0.06] blur-3xl transition-all duration-[250ms] group-hover:bg-emerald-500/[0.10]"
            />
            {/* Faint radial lighting */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_-10%,rgba(16,185,129,0.05),transparent_60%)]"
            />

            {/* Content */}
            <div className="relative flex flex-col items-center gap-4 text-center">
              {/* Icon tile */}
              <div className="flex size-14 items-center justify-center rounded-[18px] border border-emerald-400/30 bg-emerald-400/[0.06] shadow-[0_0_20px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]">
                {isDkTotal ? (
                  <DraftKingsMark className="h-6 w-auto" />
                ) : (
                  <Icon className="size-6 text-emerald-400" aria-hidden />
                )}
              </div>

              {/* Label */}
              <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                {isDkTotal ? 'DK Total' : pill.label}
              </span>

              {/* Divider */}
              <div aria-hidden="true" className="h-px w-full bg-white/[0.06]" />

              {/* Value */}
              <span className="text-2xl font-bold text-white">{pill.value}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
