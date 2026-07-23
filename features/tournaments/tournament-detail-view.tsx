import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { PageShell } from '@/components/shared/page-shell'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentField } from '@/features/tournaments/components/tournament-field'
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'
import { TournamentCourseIntelligence } from '@/features/tournaments/components/tournament-course-intelligence'
import { TournamentWeatherIntelligence } from '@/features/tournaments/components/tournament-weather-intelligence'
import { TournamentOddsIntelligence } from '@/features/tournaments/components/tournament-odds-intelligence'
import { TournamentSkillLeaderboards } from '@/features/tournaments/components/tournament-skill-leaderboards'
import { TournamentDfsLeaderboards } from '@/features/tournaments/components/tournament-dfs-leaderboards'
import { FieldFitBoard } from '@/features/tournaments/components/field-fit-board'
import { TournamentHero } from '@/features/tournaments/components/tournament-hero'
import { TournamentFieldBanner } from '@/features/tournaments/components/tournament-field-banner'
import { TournamentIntelligence } from '@/features/tournaments/components/tournament-intelligence'
import { TournamentOverview } from '@/features/tournaments/components/tournament-overview'

import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { courseService } from '@/features/courses/services/course-service'
import { isCurrentUserAdmin } from '@/lib/session'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

interface TournamentDetailViewProps {
  tournament: TournamentSummary
}

/** Status codes for which a live/loaded forecast reading exists to summarize. */
const FORECAST_STATUS_CODES = new Set(['forecast-available', 'live-forecast', 'historical-available'])

/**
 * Build the hero's one-line weather chip (e.g. "72°F · 12 mph") from the current
 * conditions. Returns `null` unless the Weather Status Engine classifies a real
 * forecast as loaded — so a completed or too-far-out event shows the hero's
 * honest status placeholder instead of a stale or fabricated reading.
 */
function weatherSummary(weather: WeatherIntelligence | null): string | null {
  if (!weather || !weather.statusReport) return null
  if (!FORECAST_STATUS_CODES.has(weather.statusReport.code)) return null
  if (weather.status !== 'available' || !weather.current) return null
  const parts: string[] = []
  if (weather.current.temperatureF !== null) parts.push(`${Math.round(weather.current.temperatureF)}\u00b0F`)
  if (weather.current.windSpeedMph !== null) parts.push(`${Math.round(weather.current.windSpeedMph)} mph`)
  return parts.length > 0 ? parts.join(' \u00b7 ') : null
}

/**
 * Tournament research hub. Organized for decisions, not database fields: a hero
 * that answers "what/how big/what conditions" at a glance, an intelligence
 * layer that frames why the event matters, quick-navigation tabs, and a live
 * Overview + Field of the verified facts alongside a research sidebar. Sections
 * without imported data render intentional "Coming soon" placeholders rather
 * than broken layouts, and never expose raw ids or internal timestamps.
 */
export async function TournamentDetailView({ tournament }: TournamentDetailViewProps) {
  // The field powers both the hero "Field size" stat and the Field tab. Field
  // news reads through the request-cached field, so it adds no extra roster
  // query — only the news lookup itself. The host-course intelligence is loaded
  // in parallel, and only when the event is actually linked to a venue.
  const courseRef = tournament.courseRef
  const [
    field,
    fieldReport,
    courseProfile,
    fitBoard,
    weather,
    odds,
    skillLeaderboards,
    dfsField,
    isAdmin,
  ] = await Promise.all([
    tournamentService.getTournamentField(tournament.id),
    tournamentService.getFieldReport(tournament.id),
    courseRef ? courseService.getCourseIntelligence(courseRef.id) : Promise.resolve(null),
    tournamentService.getFieldFitBoard(tournament.id),
    tournamentService.getWeatherIntelligence(tournament.id),
    tournamentService.getOddsIntelligence(tournament.id),
    tournamentService.getSkillLeaderboards(tournament.id),
    tournamentService.getDfsValueField(tournament.id),
    isCurrentUserAdmin(),
  ])

  // Admins get a manual refresh control + import metadata on the weather card.
  // The extra query runs only for admins, so the common visitor path is
  // untouched.
  const weatherAdmin = isAdmin
    ? {
        tournamentId: tournament.id,
        importStatus: await tournamentService.getWeatherImportStatus(tournament.id),
      }
    : undefined

  return (
    <PageShell>
      <Link 
        href="/tournaments"
        className="inline-flex items-center gap-2 h-9 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        <ChevronLeft className="size-4" />
        All tournaments
      </Link>

      <TournamentHero
        tournament={tournament}
        fieldSize={field.size}
        weatherSummary={weatherSummary(weather)}
        weatherPlaceholder={weather?.statusReport?.label}
      />

      {fieldReport ? <TournamentFieldBanner report={fieldReport} /> : null}

      <TournamentIntelligence />

      {field.size > 0 ? <TournamentDfsLeaderboards field={dfsField} /> : null}

      {courseRef && courseProfile ? (
        <TournamentCourseIntelligence
          profile={courseProfile}
          course={{ id: courseRef.id, name: courseRef.name }}
        />
      ) : null}

      <TournamentWeatherIntelligence weather={weather} admin={weatherAdmin} />

      <TournamentOddsIntelligence odds={odds} />

      {field.size > 0 ? (
        <TournamentSkillLeaderboards leaderboards={skillLeaderboards} />
      ) : null}

      {field.size > 0 ? (
        <FieldFitBoard board={fitBoard} hasCourse={Boolean(courseRef)} />
      ) : null}

      <TournamentDetailTabs
        overview={
          <div className="flex flex-col gap-6">
            <TournamentOverview tournament={tournament} />
            <FieldRankingLeaders leaders={field.rankingLeaders} />
          </div>
        }
        field={<TournamentField field={field} tournamentId={tournament.id} />}
        fieldCount={field.size}
      />
    </PageShell>
  )
}
