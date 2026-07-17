import { CalendarClock, CheckCircle2, CircleHelp, Flag, Users, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { FieldLifecycleBadge } from '@/features/tournaments/components/field-lifecycle-badge'
import {
  fieldConfidenceLabel,
  formatCommitmentDeadline,
  formatTimestamp,
} from '@/features/tournaments/utils/format'
import type { TournamentFieldReport } from '@/features/tournaments/types'
import type { FieldStatus } from '@/lib/tournament-context/types'
import { cn } from '@/lib/utils'

/** Per-status visual treatment for the banner's leading icon + accent. */
const STATUS_ICON: Record<FieldStatus, LucideIcon> = {
  awaiting: CalendarClock,
  confirmed: CheckCircle2,
  live: Flag,
  complete: Flag,
  cancelled: XCircle,
  unknown: CircleHelp,
}

const STATUS_ACCENT: Record<FieldStatus, string> = {
  awaiting: 'text-warning',
  confirmed: 'text-success',
  live: 'text-success',
  complete: 'text-muted-foreground',
  cancelled: 'text-muted-foreground',
  unknown: 'text-muted-foreground',
}

/** Headline copy per lifecycle state — plain-language, decision-first. */
function headline(report: TournamentFieldReport): string {
  switch (report.status) {
    case 'awaiting':
      return 'Official field pending'
    case 'confirmed':
      return 'Official field confirmed'
    case 'live':
      return 'Field set — tournament underway'
    case 'complete':
      return 'Final field'
    case 'cancelled':
      return 'Event canceled'
    case 'unknown':
      return 'Field status unavailable'
  }
}

/**
 * Supporting sentence per state. Honest by construction: the pending copy points
 * at the real commitment deadline (when known) and never claims a field exists;
 * the confirmed copy cites the actual player count only when it is known.
 */
function detail(report: TournamentFieldReport): string {
  const count =
    report.playerCount !== null && report.playerCount > 0
      ? `${report.playerCount} ${report.playerCount === 1 ? 'player' : 'players'}`
      : null

  switch (report.status) {
    case 'awaiting':
      return report.releaseTime
        ? 'Players commit until the PGA Tour deadline below. The official field is published shortly after — projections here are provisional until then.'
        : 'The official field has not been published yet. Projections shown are provisional until it is confirmed.'
    case 'confirmed':
      return count
        ? `The official field of ${count} has been published and imported. Field-dependent models are running on the confirmed roster.`
        : 'The official field has been published and imported. Field-dependent models are running on the confirmed roster.'
    case 'live':
      return count
        ? `The tournament is underway with a field of ${count}.`
        : 'The tournament is underway.'
    case 'complete':
      return count
        ? `This event has finished. The final field of ${count} is archived.`
        : 'This event has finished. The final field is archived.'
    case 'cancelled':
      return 'This event was canceled, so no field will be released.'
    case 'unknown':
      return 'CaddieIQ cannot confirm the field lifecycle for this event yet — no start date or field has been imported.'
  }
}

interface TournamentFieldBannerProps {
  report: TournamentFieldReport | null
  className?: string
}

/**
 * The Tournament Page's official-field status banner. It answers, at a glance,
 * *"is the field out yet?"* and adapts its message to the lifecycle:
 *
 * - **pending** → shows the PGA Tour commitment deadline and frames everything
 *   downstream as provisional (so users are never misled into treating an
 *   unreleased field as final);
 * - **confirmed / live / complete** → shows when the field was confirmed and
 *   last synced, plus the confidence chip;
 * - **cancelled / unknown** → states the honest absence.
 *
 * Live tournaments still render (state `live`) but the messaging shifts from
 * "pending/confirmed" to "underway", so the banner never nags about a field
 * that is already playing.
 */
export function TournamentFieldBanner({ report, className }: TournamentFieldBannerProps) {
  if (!report) return null
  
  const Icon = STATUS_ICON[report.status]
  const accent = STATUS_ACCENT[report.status]

  // Metadata rows shown only when the underlying value is genuinely known.
  const meta: Array<{ label: string; value: string }> = []
  if (report.status === 'awaiting' && report.releaseTime) {
    meta.push({ label: 'Commitment deadline', value: formatCommitmentDeadline(report.releaseTime) })
  }
  if (report.confirmedAt && (report.status === 'confirmed' || report.status === 'live')) {
    meta.push({ label: 'Field confirmed', value: formatTimestamp(report.confirmedAt) })
  }
  if (report.lastUpdated && report.status !== 'cancelled' && report.status !== 'unknown') {
    meta.push({ label: 'Last synced', value: formatTimestamp(report.lastUpdated) })
  }

  return (
    <section
      aria-label="Official field status"
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:gap-5',
        className,
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted', accent)}>
        <Icon className="size-5" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-card-foreground text-balance">
            {headline(report)}
          </h2>
          <FieldLifecycleBadge status={report.status} />
          {report.status !== 'unknown' && report.status !== 'cancelled' ? (
            <span className="text-xs font-medium text-muted-foreground">
              {fieldConfidenceLabel(report.confidence)}
            </span>
          ) : null}
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          {detail(report)}
        </p>

        {meta.length > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            {meta.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{row.label}</dt>
                <dd className="font-mono text-sm text-card-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {report.playerCount !== null && report.playerCount > 0 ? (
        <div className="flex shrink-0 items-center gap-2 self-start rounded-lg bg-muted px-3 py-2">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-mono text-sm font-semibold text-card-foreground">
            {report.playerCount}
          </span>
          <span className="text-xs text-muted-foreground">in field</span>
        </div>
      ) : null}
    </section>
  )
}
