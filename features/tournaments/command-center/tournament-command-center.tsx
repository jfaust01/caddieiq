import { PageShell } from '@/components/shared/page-shell'
import { CommandCenterHeader } from '@/features/tournaments/command-center/command-center-header'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentCompactOverview } from '@/features/tournaments/components/tournament-compact-overview'
import { TournamentDfsHub } from '@/features/tournaments/components/tournament-dfs-hub'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { courseService } from '@/features/courses/services/course-service'
import { isCurrentUserAdmin } from '@/lib/session'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import { fetchTournamentsForSelector } from '@/features/tournaments/actions/fetch-tournaments-for-selector'

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
 * Tournament Command Center — a mission-control dashboard that reorganizes the
 * research hub into collapsible, decision-first widgets. New derived summaries
 * (Morning Brief, AI Coach, Trending, Story) sit above the existing verified
 * intelligence engines, all fed from the same request-cached service data. No
 * value is fabricated: every widget renders only what the engines actually
 * returned, and empty engines degrade to honest placeholders.
 */
export async function TournamentCommandCenter({ tournament }: TournamentCommandCenterProps) {
  const [
    field,
    fieldReport,
    fitBoard,
    dfsField,
    weather,
    isAdmin,
    tournamentOptions,
  ] = await Promise.all([
    tournamentService.getTournamentField(tournament.id),
    tournamentService.getFieldReport(tournament.id),
    tournamentService.getFieldFitBoard(tournament.id),
    tournamentService.getDfsValueField(tournament.id),
    tournamentService.getWeatherIntelligence(tournament.id),
    isCurrentUserAdmin(),
    fetchTournamentsForSelector(),
  ])

  const weatherAdmin = isAdmin
    ? {
        tournamentId: tournament.id,
        importStatus: await tournamentService.getWeatherImportStatus(tournament.id),
      }
    : undefined

  const hasField = field.size > 0

  const dataConfidence = field.analyticsSummary.ratedPlayers > 0 ? 'verified' : null

  return (
    <>
      <CommandCenterHeader
        tournament={tournament}
        fieldSize={field.size}
        weatherSummary={weatherSummary(weather)}
        weatherPlaceholder={weather.statusReport.label}
        dataConfidence={dataConfidence}
        tournamentOptions={tournamentOptions}
      />

      <PageShell>

      {/* Full-width Tabbed Content */}
      <TournamentDetailTabs
        overview={
          <TournamentCompactOverview
            tournament={tournament}
            field={field}
            fieldReport={fieldReport}
            weather={weather}
            dfsField={dfsField}
          />
        }
        additionalTabs={[
          ...(hasField
            ? [
                {
                  value: 'dfs',
                  label: 'DFS',
                  content: (
                    <TournamentDfsHub
                      tournament={tournament}
                      field={field}
                      dfsField={dfsField}
                    />
                  ),
                  count: dfsField?.players?.length ?? 0,
                },
              ]
            : []),
        ]}
      />

      </PageShell>
    </>
  )
}
