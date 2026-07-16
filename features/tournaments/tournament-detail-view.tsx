import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentField } from '@/features/tournaments/components/tournament-field'
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'
import { TournamentCourseIntelligence } from '@/features/tournaments/components/tournament-course-intelligence'
import { TournamentWeatherIntelligence } from '@/features/tournaments/components/tournament-weather-intelligence'
import { TournamentOddsIntelligence } from '@/features/tournaments/components/tournament-odds-intelligence'
import { TournamentSkillLeaderboards } from '@/features/tournaments/components/tournament-skill-leaderboards'
import { FieldFitBoard } from '@/features/tournaments/components/field-fit-board'
import { TournamentHero } from '@/features/tournaments/components/tournament-hero'
import { TournamentIntelligence } from '@/features/tournaments/components/tournament-intelligence'
import { TournamentOverview } from '@/features/tournaments/components/tournament-overview'
import { TournamentSidebar } from '@/features/tournaments/components/tournament-sidebar'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { courseService } from '@/features/courses/services/course-service'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

interface TournamentDetailViewProps {
  tournament: TournamentSummary
}

/**
 * Build the hero's one-line weather chip (e.g. "72°F · 12 mph") from the current
 * conditions. Returns `null` when unavailable so the hero shows its honest
 * "Awaiting import" placeholder instead of a fabricated reading.
 */
function weatherSummary(weather: WeatherIntelligence): string | null {
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
  const [field, fieldNews, courseProfile, fitBoard, weather, odds, skillLeaderboards] = await Promise.all([
    tournamentService.getTournamentField(tournament.id),
    tournamentService.getFieldNews(tournament.id),
    courseRef ? courseService.getCourseIntelligence(courseRef.id) : Promise.resolve(null),
    tournamentService.getFieldFitBoard(tournament.id),
    tournamentService.getWeatherIntelligence(tournament.id),
    tournamentService.getOddsIntelligence(tournament.id),
    tournamentService.getSkillLeaderboards(tournament.id),
  ])

  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        nativeButton={false}
        render={
          <Link href="/tournaments">
            <ChevronLeft data-icon="inline-start" />
            All tournaments
          </Link>
        }
      />

      <TournamentHero
        tournament={tournament}
        fieldSize={field.size}
        weatherSummary={weatherSummary(weather)}
      />

      <TournamentIntelligence />

      {courseRef && courseProfile ? (
        <TournamentCourseIntelligence
          profile={courseProfile}
          course={{ id: courseRef.id, name: courseRef.name }}
        />
      ) : null}

      <TournamentWeatherIntelligence weather={weather} />

      <TournamentOddsIntelligence odds={odds} />

      {field.size > 0 ? (
        <TournamentSkillLeaderboards leaderboards={skillLeaderboards} />
      ) : null}

      {field.size > 0 ? (
        <FieldFitBoard board={fitBoard} hasCourse={Boolean(courseRef)} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TournamentDetailTabs
            overview={
              <div className="flex flex-col gap-6">
                <TournamentOverview tournament={tournament} />
                <FieldRankingLeaders leaders={field.rankingLeaders} />
              </div>
            }
            field={<TournamentField field={field} />}
            fieldCount={field.size}
          />
        </div>
        <aside className="lg:col-span-1" aria-label="Tournament research">
          <TournamentSidebar
            tournament={tournament}
            fieldNews={fieldNews}
            hasField={field.size > 0}
          />
        </aside>
      </div>
    </PageShell>
  )
}
