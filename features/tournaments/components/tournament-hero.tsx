import type { LucideIcon } from 'lucide-react'
import { CalendarDays, CloudSun, DollarSign, Flag, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TournamentStatusBadge } from '@/features/tournaments/components/tournament-status-badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatCoursePar,
  formatDateRange,
  formatPurse,
  formatYardage,
  textDisplay,
} from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

interface HeroStatProps {
  icon: LucideIcon
  label: string
  value: string
  /** When true, the value renders in a muted "awaiting data" treatment. */
  pending?: boolean
  /** When set, the value becomes a link to this href. */
  href?: string
}

/** A single at-a-glance hero metric. Pending stats read as intentional placeholders. */
function HeroStat({ icon: Icon, label, value, pending = false, href }: HeroStatProps) {
  const valueClass = cn(
    'truncate text-sm font-semibold',
    pending && 'font-medium text-muted-foreground/60',
  )
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          pending ? 'bg-muted text-muted-foreground/70' : 'bg-accent text-accent-foreground',
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {href ? (
          <Link
            href={href}
            className={cn(valueClass, 'text-primary underline-offset-4 hover:underline')}
            title={value}
          >
            {value}
          </Link>
        ) : (
          <span className={valueClass} title={value}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

interface TournamentHeroProps {
  tournament: TournamentSummary
}

/**
 * Answers "what is this, how big is it, what are the conditions" at a glance:
 * the tournament identity, status, tour, dates and purse, plus a strip of hero
 * statistics. Course is sourced live; field size, weather, and difficulty show
 * intentional placeholders until those feeds are imported.
 */
export function TournamentHero({ tournament }: TournamentHeroProps) {
  const tourName = tournament.tour?.name ?? null

  // Compose "Par 72 · 7,475 yds" from whichever course specs are available.
  const parText = formatCoursePar(tournament.courseRef?.par ?? null)
  const yardageText = formatYardage(tournament.courseRef?.yardage ?? null)
  const specParts = [parText, yardageText].filter((part) => part !== EMPTY_VALUE)
  const hasCourseSpec = specParts.length > 0
  const courseSpec = hasCourseSpec ? specParts.join(' · ') : 'Awaiting import'

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" title={tourName ?? undefined}>
                {tourName ?? EMPTY_VALUE}
              </Badge>
              <TournamentStatusBadge status={tournament.status} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              {tournament.name}
            </h1>
            {tournament.officialName && tournament.officialName !== tournament.name ? (
              <p className="text-sm text-muted-foreground text-pretty">
                {tournament.officialName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 sm:items-end">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
              {formatDateRange(tournament.startDate, tournament.endDate)}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DollarSign className="size-4" aria-hidden />
              {formatPurse(tournament.purse)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <HeroStat
            icon={MapPin}
            label="Course"
            value={textDisplay(tournament.course)}
            pending={!tournament.courseRef}
            href={tournament.courseRef ? `/courses/${tournament.courseRef.id}` : undefined}
          />
          <HeroStat
            icon={Flag}
            label="Par / Yardage"
            value={courseSpec}
            pending={!hasCourseSpec}
          />
          <HeroStat icon={Users} label="Field size" value="Awaiting import" pending />
          <HeroStat icon={CloudSun} label="Weather" value="Awaiting import" pending />
        </div>
      </CardContent>
    </Card>
  )
}
