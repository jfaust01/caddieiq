import { BarChart3, ChevronLeft, Cloud, Compass, LineChart, ListChecks, Newspaper, Sparkles, Star, Target, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { CommandCenterHeader } from '@/features/tournaments/command-center/command-center-header'
import { CommandCenterWidget } from '@/features/tournaments/command-center/command-center-widget'
import { CommandCenterSearch } from '@/features/tournaments/command-center/command-center-search'
import { QuickActions } from '@/features/tournaments/command-center/quick-actions'
import { PersonalizationWidget } from '@/features/tournaments/command-center/personalization-widget'
import { MorningBrief } from '@/features/tournaments/command-center/morning-brief'
import { TournamentStory } from '@/features/tournaments/command-center/tournament-story'
import { TrendingPlayers } from '@/features/tournaments/command-center/trending-players'
import { AiCoachWidget } from '@/features/tournaments/command-center/ai-coach-widget'
import { CaddieChat } from '@/features/caddie/components/caddie-chat'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentField } from '@/features/tournaments/components/tournament-field'
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'
import { TournamentCourseIntelligence } from '@/features/tournaments/components/tournament-course-intelligence'
import { TournamentCourseAnalytics } from '@/features/tournaments/components/tournament-course-analytics'
import { TournamentCourseOverviewWrapper } from '@/features/tournaments/components/tournament-course-overview-wrapper'
import { TournamentWeatherIntelligence } from '@/features/tournaments/components/tournament-weather-intelligence'
import { TournamentOddsIntelligence } from '@/features/tournaments/components/tournament-odds-intelligence'
import { TournamentSkillLeaderboards } from '@/features/tournaments/components/tournament-skill-leaderboards'
import { TournamentDfsLeaderboards } from '@/features/tournaments/components/tournament-dfs-leaderboards'
import { FieldFitBoard } from '@/features/tournaments/components/field-fit-board'
import { TournamentOverview } from '@/features/tournaments/components/tournament-overview'
import { TournamentSidebar } from '@/features/tournaments/components/tournament-sidebar'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { courseService } from '@/features/courses/services/course-service'
import {
  buildMorningBrief,
  buildTournamentStory,
  buildTrending,
  buildCoachRecommendations,
} from '@/lib/command-center'
import { isCurrentUserAdmin } from '@/lib/session'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

interface TournamentCommandCenterProps {
  tournament: TournamentSummary
}

/** Status codes for which a live/loaded forecast reading exists to summarize. */
const FORECAST_STATUS_CODES = new Set([
  'forecast-available',
  'live-forecast',
  'historical-available',
])

/**
 * Build the header's one-line weather chip (e.g. "72°F · 12 mph") from the
 * current conditions, or `null` unless the Weather Status Engine classifies a
 * real forecast as loaded — so the header shows an honest placeholder instead
 * of a stale or fabricated reading.
 */
function weatherSummary(weather: WeatherIntelligence): string | null {
  if (!FORECAST_STATUS_CODES.has(weather.statusReport.code)) return null
  if (weather.status !== 'available' || !weather.current) return null
  const parts: string[] = []
  if (weather.current.temperatureF !== null) parts.push(`${Math.round(weather.current.temperatureF)}\u00b0F`)
  if (weather.current.windSpeedMph !== null) parts.push(`${Math.round(weather.current.windSpeedMph)} mph`)
  return parts.length > 0 ? parts.join(' \u00b7 ') : null
}

/**
 * Tournament Command Center — a mission-control dashboard that reorganizes the
 * research hub into collapsible, decision-first widgets. New derived summaries
 * (Morning Brief, AI Coach, Trending, Story) sit above the existing verified
 * intelligence engines, all fed from the same request-cached service data. No
 * value is fabricated: every widget renders only what the engines actually
 * returned, and empty engines degrade to honest placeholders.
 */
export async function TournamentCommandCenter({ tournament }: TournamentCommandCenterProps) {
  const courseRef = tournament.courseRef
  const [
    field,
    fieldReport,
    fieldNews,
    courseProfile,
    courseAnalytics,
    fitBoard,
    weather,
    odds,
    skillLeaderboards,
    dfsField,
    isAdmin,
  ] = await Promise.all([
    tournamentService.getTournamentField(tournament.id),
    tournamentService.getFieldReport(tournament.id),
    tournamentService.getFieldNews(tournament.id),
    courseRef ? courseService.getCourseIntelligence(courseRef.id) : Promise.resolve(null),
    courseRef ? courseService.getCourseAnalyticsById(courseRef.id) : Promise.resolve(null),
    tournamentService.getFieldFitBoard(tournament.id),
    tournamentService.getWeatherIntelligence(tournament.id),
    tournamentService.getOddsIntelligence(tournament.id),
    tournamentService.getSkillLeaderboards(tournament.id),
    tournamentService.getDfsValueField(tournament.id),
    isCurrentUserAdmin(),
  ])

  const weatherAdmin = isAdmin
    ? {
        tournamentId: tournament.id,
        importStatus: await tournamentService.getWeatherImportStatus(tournament.id),
      }
    : undefined

  const hasField = field.size > 0

  // Derive Command Center summaries from verified engine output.
  const brief = buildMorningBrief({ dfsField, odds, fitBoard, weather, fieldReport })
  const story = buildTournamentStory({ field, fitBoard, weather, odds, dfsField })
  const trending = buildTrending({ dfsField, odds, fitBoard })
  const coach = buildCoachRecommendations({ dfsField, fitBoard })

  const dataConfidence = field.analyticsSummary.ratedPlayers > 0 ? 'verified' : null

  const searchPlayers = field.entrants.map((entrant) => ({
    id: entrant.playerId,
    name: entrant.playerName,
  }))
  const searchNews = fieldNews.map((item) => ({
    id: item.id,
    title: item.title,
    playerId: item.playerId,
  }))
  const fieldMembers = field.entrants.map((entrant) => ({
    playerId: entrant.playerId,
    playerName: entrant.playerName,
  }))

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

      <CommandCenterHeader
        tournament={tournament}
        fieldSize={field.size}
        weatherSummary={weatherSummary(weather)}
        weatherPlaceholder={weather.statusReport.label}
        dataConfidence={dataConfidence}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CommandCenterSearch
              tournamentId={tournament.id}
              players={searchPlayers}
              news={searchNews}
            />
            <QuickActions tournamentId={tournament.id} />
          </div>
        }
      />

      {/* Decision-first summary row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandCenterWidget
          id="morning-brief"
          title="Morning Brief"
          subtitle="The five things that matter most today"
          icon={<Sparkles className="size-4 text-primary" aria-hidden />}
        >
          <MorningBrief brief={brief} />
        </CommandCenterWidget>

        <CommandCenterWidget
          id="ai-coach"
          title="AI Coach"
          subtitle="Explainable plays from the value & fit engines"
          icon={<Target className="size-4 text-primary" aria-hidden />}
        >
          <AiCoachWidget coach={coach} />
        </CommandCenterWidget>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandCenterWidget
          id="trending"
          title="Trending"
          subtitle="Category leaders across the field"
          icon={<TrendingUp className="size-4 text-primary" aria-hidden />}
        >
          <TrendingPlayers trending={trending} />
        </CommandCenterWidget>

        <CommandCenterWidget
          id="personalization"
          title="Your Players"
          subtitle="Favorited & tracked players in this field"
          icon={<Star className="size-4 text-primary" aria-hidden />}
        >
          <PersonalizationWidget field={fieldMembers} />
        </CommandCenterWidget>
      </div>

      <CommandCenterWidget
        id="story"
        title="Tournament Story"
        subtitle="The auto-generated narrative for this event"
        icon={<Newspaper className="size-4 text-primary" aria-hidden />}
      >
        <TournamentStory story={story} />
      </CommandCenterWidget>

      <CommandCenterWidget
        id="ask-caddie"
        title="Ask the Caddie"
        subtitle="Chat with every engine — grounded, cited answers"
        icon={<Sparkles className="size-4 text-primary" aria-hidden />}
      >
        <CaddieChat tournamentId={tournament.id} compact />
      </CommandCenterWidget>

      {/* Verified intelligence engines, each collapsible */}
      {hasField ? (
        <CommandCenterWidget
          id="dfs"
          title="DFS Value"
          icon={<LineChart className="size-4 text-primary" aria-hidden />}
        >
          <TournamentDfsLeaderboards field={dfsField} />
        </CommandCenterWidget>
      ) : null}

      {courseRef ? (
        <CommandCenterWidget
          id="course-overview"
          title="Course Overview"
          icon={<Compass className="size-4 text-primary" aria-hidden />}
        >
          <TournamentCourseOverviewWrapper tournamentId={tournament.id} />
        </CommandCenterWidget>
      ) : null}

      {courseRef && courseProfile ? (
        <CommandCenterWidget
          id="course"
          title="Course Intelligence"
          icon={<Compass className="size-4 text-primary" aria-hidden />}
        >
          <TournamentCourseIntelligence
            profile={courseProfile}
            course={{ id: courseRef.id, name: courseRef.name }}
          />
        </CommandCenterWidget>
      ) : null}

      {courseRef && courseAnalytics ? (
        <CommandCenterWidget
          id="course-analytics"
          title="Course Analytics"
          icon={<BarChart3 className="size-4 text-primary" aria-hidden />}
        >
          <TournamentCourseAnalytics
            analytics={courseAnalytics}
            course={{ id: courseRef.id, name: courseRef.name }}
          />
        </CommandCenterWidget>
      ) : null}

      <CommandCenterWidget
        id="weather"
        title="Weather Intelligence"
        icon={<Cloud className="size-4 text-primary" aria-hidden />}
      >
        <TournamentWeatherIntelligence weather={weather} admin={weatherAdmin} />
      </CommandCenterWidget>

      <CommandCenterWidget
        id="odds"
        title="Odds Intelligence"
        icon={<TrendingUp className="size-4 text-primary" aria-hidden />}
      >
        <TournamentOddsIntelligence odds={odds} />
      </CommandCenterWidget>

      {hasField ? (
        <CommandCenterWidget
          id="skill"
          title="Skill Leaderboards"
          icon={<Trophy className="size-4 text-primary" aria-hidden />}
        >
          <TournamentSkillLeaderboards leaderboards={skillLeaderboards} />
        </CommandCenterWidget>
      ) : null}

      {hasField ? (
        <CommandCenterWidget
          id="fit"
          title="Field Fit Board"
          icon={<ListChecks className="size-4 text-primary" aria-hidden />}
        >
          <FieldFitBoard board={fitBoard} hasCourse={Boolean(courseRef)} />
        </CommandCenterWidget>
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
            hasField={hasField}
          />
        </aside>
      </div>
    </PageShell>
  )
}
