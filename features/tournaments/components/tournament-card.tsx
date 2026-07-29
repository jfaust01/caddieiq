import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { TournamentStatus, TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatLocation,
  formatPurse,
  statusLabel,
  tourShortLabel,
} from '@/features/tournaments/utils/format'
import { generateTournamentSlug } from '@/features/tournaments/utils/slug'
import { cn } from '@/lib/utils'

interface MetadataRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  title?: string
}

function MetadataRow({ icon: Icon, label, value, title }: MetadataRowProps) {
  if (value === EMPTY_VALUE) return null

  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-px size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-medium text-foreground truncate" title={title ?? value}>
          {value}
        </span>
      </div>
    </div>
  )
}

interface TournamentCardProps {
  tournament: TournamentSummary
}

/** Status-aware premium tournament card for the directory. */
export function TournamentCard({ tournament }: TournamentCardProps) {
  const location = formatLocation(tournament.location)
  const venue =
    tournament.course && location !== EMPTY_VALUE
      ? `${tournament.course} · ${location}`
      : tournament.course ?? location

  // Phase detection
  const isLive = tournament.status === 'ACTIVE'
  const isCompleted = tournament.status === 'COMPLETED'
  const isScheduled = tournament.status === 'SCHEDULED'

  // Status accent colors for top border
  const accentColor = isLive
    ? 'from-emerald-400'
    : isCompleted
      ? 'from-sky-400/40'
      : 'from-cyan-400/40'

  // Footer action text
  const footerAction = isLive ? 'FOLLOW LIVE' : isCompleted ? 'VIEW RECAP' : 'VIEW PREVIEW'

  // Left footer metadata: Show real data only, omit empty placeholders
  const footerLeftValue = isCompleted
    ? tournament.tournamentWinner?.playerName ?? null
    : tournament.purse !== null
      ? formatPurse(tournament.purse)
      : null

  const footerLeftLabel = isCompleted ? 'WINNER' : 'PURSE'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'bg-slate-950/60 border border-slate-700/40 hover:border-slate-600/60',
        'hover:shadow-xl transition-all duration-200',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-background'
      )}
    >
      {/* Status accent line at top */}
      <div
        className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', accentColor)}
        aria-hidden
      />

      {/* Inset top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-slate-400/10 via-slate-200/5 to-transparent pointer-events-none"
        aria-hidden
      />

      {/* Main content */}
      <div className="flex flex-col gap-0 p-5">
        {/* Header: badges and title */}
        <div className="flex items-start justify-between gap-2 min-w-0 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            {/* Tour chip */}
            <Badge
              variant="outline"
              className={cn(
                'h-6 px-2 text-xs font-semibold uppercase tracking-wide',
                'border border-slate-600/50 bg-slate-900/40 text-slate-300'
              )}
            >
              {tourShortLabel(tournament.tour?.type ?? null)}
            </Badge>

            {/* Status badge */}
            <Badge
              variant="outline"
              className={cn(
                'h-6 px-2 text-xs font-semibold uppercase tracking-wide',
                isLive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : isCompleted
                    ? 'border-sky-400/30 bg-sky-400/5 text-sky-300'
                    : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
              )}
            >
              {statusLabel(tournament.status)}
            </Badge>
          </div>

          {/* Right arrow indicator */}
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-slate-600 group-hover:text-slate-400',
              'transition-colors duration-200 mt-0.5'
            )}
            aria-hidden
          />
        </div>

        {/* Tournament title */}
        <h3
          className="text-lg font-semibold leading-6 text-white mb-4 line-clamp-2 group-hover:text-slate-100 transition-colors"
          title={tournament.name}
        >
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="outline-none after:absolute after:inset-0 focus:outline-none"
          >
            {tournament.name}
          </Link>
        </h3>

        {/* Phase-specific content */}
        <div className="space-y-2.5 mb-4">
          {isLive && tournament.status === 'ACTIVE' ? (
            // Live tournament content
            <>
              <MetadataRow
                icon={Clock}
                label="Status"
                value="In progress"
                title="Tournament is currently in progress"
              />
              {tournament.tournamentWinner ? (
                <MetadataRow
                  icon={TrendingUp}
                  label="Leader"
                  value={tournament.tournamentWinner.playerName}
                />
              ) : null}
              {tournament.topDkScorer ? (
                <MetadataRow
                  icon={Users}
                  label="Top DK"
                  value={`${tournament.topDkScorer.playerName} — ${tournament.topDkScorer.dkFantasyPoints}`}
                />
              ) : null}
            </>
          ) : isCompleted ? (
            // Completed tournament content
            <>
              {tournament.tournamentWinner ? (
                <>
                  <MetadataRow
                    icon={CheckCircle2}
                    label="Winner"
                    value={tournament.tournamentWinner.playerName}
                  />
                  {tournament.tournamentWinner.scoreToPar !== null && (
                    <MetadataRow
                      icon={TrendingUp}
                      label="Score"
                      value={
                        tournament.tournamentWinner.scoreToPar >= 0
                          ? `+${tournament.tournamentWinner.scoreToPar}`
                          : `${tournament.tournamentWinner.scoreToPar}`
                      }
                    />
                  )}
                </>
              ) : null}
              {tournament.topDkScorer ? (
                <MetadataRow
                  icon={Users}
                  label="Top DK"
                  value={`${tournament.topDkScorer.playerName} — ${tournament.topDkScorer.dkFantasyPoints}`}
                />
              ) : null}
              {!tournament.tournamentWinner ? (
                <>
                  <MetadataRow icon={Calendar} label="Dates" value={formatDateRange(tournament.startDate, tournament.endDate)} />
                  <MetadataRow icon={MapPin} label="Venue" value={venue} title={venue} />
                </>
              ) : null}
            </>
          ) : (
            // Scheduled tournament content
            <>
              <MetadataRow
                icon={Calendar}
                label="Dates"
                value={formatDateRange(tournament.startDate, tournament.endDate)}
              />
              <MetadataRow icon={MapPin} label="Venue" value={venue} title={venue} />
              <MetadataRow
                icon={DollarSign}
                label="Purse"
                value={formatPurse(tournament.purse)}
              />
            </>
          )}
        </div>

        {/* Footer: divider, metadata, and action */}
        <div className="border-t border-slate-700/30 pt-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {footerLeftValue ? (
              <>{footerLeftLabel}</>
            ) : (
              <span className="text-slate-500">{EMPTY_VALUE}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-300 group-hover:text-slate-100 transition-colors">
            {footerAction}
            <ArrowUpRight className="size-3" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
