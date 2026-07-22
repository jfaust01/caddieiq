'use client'

import { useEffect, useRef, type ReactNode } from "react"
import { CalendarDays, CloudSun, MapPin, Users } from "lucide-react"

import { TournamentStatusBadge } from "@/features/tournaments/components/tournament-status-badge"
import { TournamentTourChip } from "@/features/tournaments/components/tournament-tour-chip"
import { TournamentSelector } from "@/features/tournaments/components/tournament-selector"
import type { TournamentSummary } from "@/features/tournaments/types"
import { formatDateRange, formatFieldSize } from "@/features/tournaments/utils/format"
import type { TournamentSelectorOption } from "@/features/tournaments/actions/fetch-tournaments-for-selector"

interface CommandCenterHeaderProps {
  tournament: TournamentSummary
  fieldSize: number
  /** Short conditions summary (e.g. "72°F · 12 mph"), or `null`. */
  weatherSummary: string | null
  /** Honest placeholder when no forecast is loaded. */
  weatherPlaceholder: string
  /** One-word data-confidence label for the whole hub (e.g. "verified"). */
  dataConfidence: string | null
  /** Tournament options for the selector dropdown. */
  tournamentOptions?: TournamentSelectorOption[]
}

/** A compact fact chip in the header meta row. */
function MetaChip({ icon, children, pending = false }: { icon: ReactNode; children: ReactNode; pending?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
      {icon}
      <span className={pending ? "text-muted-foreground/60" : "text-foreground"}>{children}</span>
    </span>
  )
}

/**
 * Sticky Command Center header: the mission-control status bar. Answers
 * "what / when / where / how big / what conditions / how sure are we" at a
 * glance, and hosts the quick-actions row. All values come from verified
 * summary data; missing signals render honest placeholders.
 */
export function CommandCenterHeader({
  tournament,
  fieldSize,
  weatherSummary,
  weatherPlaceholder,
  dataConfidence,
  tournamentOptions = [],
}: CommandCenterHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  
  // Determine if tournament is completed
  const isCompleted =
    tournament.status?.trim().toUpperCase() === "COMPLETED"
  
  useEffect(() => {
    // Measure TopNav height and set CommandCenterHeader offset to appear below it
    const topNav = document.querySelector('header[class*="sticky"][class*="top-0"][class*="z-50"]')
    if (!topNav) return
    
    const topNavHeight = topNav.getBoundingClientRect().height
    if (headerRef.current) {
      headerRef.current.style.setProperty('--sticky-top', `${topNavHeight}px`)
    }
  }, [])

  return (
    <header 
      ref={headerRef}
      className="sticky z-40 w-full border-b border-border/50 backdrop-blur-xl"
      style={{ 
        top: 'var(--sticky-top, 0px)',
        background: 'color-mix(in srgb, var(--background) 80%, transparent)',
        WebkitBackdropFilter: 'blur(14px)',
      } as React.CSSProperties & { '--sticky-top': string; WebkitBackdropFilter: string }}
    >
      <div className="px-4 py-2 sm:px-6">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tour Chip */}
            {tournament.tour ? (
              <TournamentTourChip tour={tournament.tour} variant="default" />
            ) : (
              <TournamentTourChip tour={null} variant="default" />
            )}

            {/* Tournament Selector / Title */}
            {tournamentOptions.length > 0 ? (
              <TournamentSelector
                currentTournamentId={tournament.id}
                currentTournamentName={tournament.name}
                options={tournamentOptions}
              />
            ) : (
              <h1 className="text-lg font-semibold tracking-tight text-pretty">
                {tournament.name}
              </h1>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <TournamentStatusBadge status={tournament.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <MetaChip icon={<CalendarDays aria-hidden />}>
              {formatDateRange(tournament.startDate, tournament.endDate)}
            </MetaChip>
            {tournament.course ? (
              <MetaChip icon={<MapPin aria-hidden />}>{tournament.course}</MetaChip>
            ) : null}
            <MetaChip icon={<Users aria-hidden />} pending={fieldSize === 0}>
              {(fieldSize > 0 ? formatFieldSize(fieldSize) : null) ?? "Field pending"}
            </MetaChip>
            {!isCompleted ? (
              <MetaChip icon={<CloudSun aria-hidden />} pending={!weatherSummary}>
                {weatherSummary ?? weatherPlaceholder}
              </MetaChip>
            ) : null}
          </div>
        </div>
        </div>
      </div>
    </header>
  )
}
