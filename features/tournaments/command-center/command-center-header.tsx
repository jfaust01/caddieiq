'use client'

import { type ReactNode } from "react"
import { CalendarDays, CloudSun, MapPin, Users, Heart, Share2, Bell } from "lucide-react"

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

/** A compact metadata item with optional icon. */
function MetaItem({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm text-foreground/80">
      {children}
    </span>
  )
}

/** Metadata separator bullet. */
function MetaSeparator() {
  return <span className="text-foreground/40">•</span>
}

/** Action button in the right-aligned actions area. */
function ActionButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-colors text-foreground/60 hover:text-foreground"
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </button>
  )
}

/**
 * Premium Tournament Header: a mission-control status bar that answers
 * "what / when / where / stats" at a glance with premium typography and spacing.
 * Values come from verified summary data; missing signals render honest placeholders.
 */
export function CommandCenterHeader({
  tournament,
  fieldSize,
  weatherSummary,
  weatherPlaceholder,
  dataConfidence,
  tournamentOptions = [],
}: CommandCenterHeaderProps) {
  // Determine if tournament is completed
  const isCompleted =
    tournament.status?.trim().toUpperCase() === "COMPLETED"

  // Format purse if available
  const formatPurse = (purse: number | null) => {
    if (!purse) return null
    if (purse >= 1_000_000) return `$${(purse / 1_000_000).toFixed(1)}M`
    if (purse >= 1_000) return `$${(purse / 1_000).toFixed(0)}K`
    return `$${purse}`
  }

  return (
    <header 
      ref={headerRef}
      className="border-b border-white/5 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 w-full"
    >
      <div className="px-4 py-4 sm:px-6 md:py-5">
        {/* Main header row: title on left, actions on right */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          {/* Left: Title and chips */}
          <div className="flex min-w-0 flex-col gap-2.5 flex-1">
            {/* Hero title and tour chip row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Tour Chip */}
              <div className="shrink-0">
                {tournament.tour ? (
                  <TournamentTourChip tour={tournament.tour} variant="default" />
                ) : (
                  <TournamentTourChip tour={null} variant="default" />
                )}
              </div>

              {/* Tournament Name (Hero) */}
              <div className="min-w-0 flex-1">
                {tournamentOptions.length > 0 ? (
                  <TournamentSelector
                    currentTournamentId={tournament.id}
                    currentTournamentName={tournament.name}
                    options={tournamentOptions}
                  />
                ) : (
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white text-balance">
                    {tournament.name}
                  </h1>
                )}
              </div>

              {/* Phase pill */}
              <div className="shrink-0 sm:ml-auto">
                <TournamentStatusBadge status={tournament.status} />
              </div>
            </div>

            {/* Metadata row with separators */}
            <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
              {/* Date */}
              <MetaItem>
                <CalendarDays className="inline size-3.5 mr-1 align-text-bottom opacity-60" />
                {formatDateRange(tournament.startDate, tournament.endDate)}
              </MetaItem>
              <MetaSeparator />

              {/* Course */}
              {tournament.course ? (
                <>
                  <MetaItem>
                    <MapPin className="inline size-3.5 mr-1 align-text-bottom opacity-60" />
                    {tournament.course}
                  </MetaItem>
                  <MetaSeparator />
                </>
              ) : null}

              {/* Par */}
              {tournament.courseRef?.par ? (
                <>
                  <MetaItem>Par {tournament.courseRef.par}</MetaItem>
                  <MetaSeparator />
                </>
              ) : null}

              {/* Yardage */}
              {tournament.courseRef?.yardage ? (
                <>
                  <MetaItem>{tournament.courseRef.yardage.toLocaleString()} yd</MetaItem>
                  <MetaSeparator />
                </>
              ) : null}

              {/* Purse */}
              {tournament.purse ? (
                <>
                  <MetaItem>{formatPurse(tournament.purse)}</MetaItem>
                  <MetaSeparator />
                </>
              ) : null}

              {/* Players */}
              <MetaItem>
                <Users className="inline size-3.5 mr-1 align-text-bottom opacity-60" />
                {(fieldSize > 0 ? formatFieldSize(fieldSize) : null) ?? "Field pending"}
              </MetaItem>

              {/* Weather (only for non-completed tournaments) */}
              {!isCompleted ? (
                <>
                  <MetaSeparator />
                  <MetaItem>
                    <CloudSun className={`inline size-3.5 mr-1 align-text-bottom ${!weatherSummary ? 'opacity-40' : 'opacity-60'}`} />
                    {weatherSummary ?? weatherPlaceholder}
                  </MetaItem>
                </>
              ) : null}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ActionButton icon={Heart} label="Add to favorites" />
            <ActionButton icon={Share2} label="Share tournament" />
            <ActionButton icon={Bell} label="Notifications" />
          </div>
        </div>
      </div>
    </header>
  )
}
