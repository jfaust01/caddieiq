import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import type { RoundWithScores } from '@/features/tournaments/services/tournament-service'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import type { ModuleStatus } from '@/features/tournaments/components/tournament-data-quality-panel'

interface DataQualityInput {
  tournament: TournamentSummary
  field: TournamentField | null
  fieldFieldCount: number
  dfsRecordCount: number
  dfsMatchedCount?: number
  dfsUnmatchedPlayers?: Array<{ playerId: string; playerName: string }>
  dfsStatus?: 'VERIFIED' | 'PARTIAL' | 'UNAVAILABLE'
  hasWeather: boolean
  hasOdds: boolean
  hasHoles: boolean
  roundCount: number
  weather: WeatherIntelligence | null
}

export function buildModuleStatuses(input: DataQualityInput): ModuleStatus[] {
  const modules: ModuleStatus[] = []

  // 1. Tournament Overview
  modules.push({
    name: 'Tournament Overview',
    status: 'VERIFIED',
    source: 'tournaments table (database)',
    recordCount: 1,
    lastUpdated: input.tournament.updatedAt ?? null,
    missingInputs: [],
    productionSafe: true,
  })

  // 2. Field List
  modules.push({
    name: 'Field',
    status: 'VERIFIED',
    source: 'tournament_fields table',
    recordCount: input.fieldFieldCount,
    lastUpdated: null,
    missingInputs: [],
    productionSafe: true,
  })

  // 3. Course Data
  modules.push({
    name: 'Course',
    status: input.tournament.courseRef ? 'VERIFIED' : 'UNAVAILABLE',
    source: 'courses table',
    recordCount: input.tournament.courseRef ? 1 : 0,
    lastUpdated: null,
    missingInputs: input.tournament.courseRef ? [] : ['Course data not imported'],
    productionSafe: true,
  })

  // 4. Hole Breakdown
  modules.push({
    name: 'Hole Breakdown',
    status: input.hasHoles ? 'VERIFIED' : 'UNAVAILABLE',
    source: 'course_holes table',
    recordCount: 0,
    lastUpdated: null,
    missingInputs: ['Hole-by-hole course data'],
    productionSafe: true,
  })

  // 5. DFS Salaries
  const dfsUnmatchedCount = input.fieldFieldCount - (input.dfsMatchedCount ?? input.dfsRecordCount)
  const dfsUnmatchedList = (input.dfsUnmatchedPlayers ?? []).map(p => p.playerName).join(', ')
  const dfsMissingInputs: string[] = []
  if (dfsUnmatchedCount > 0) {
    dfsMissingInputs.push(
      `${dfsUnmatchedCount} entrant${dfsUnmatchedCount !== 1 ? 's' : ''} missing salary: ${dfsUnmatchedList || '(see details)'}`
    )
  }

  modules.push({
    name: 'DFS Salaries',
    status: input.dfsStatus ?? (input.dfsRecordCount > 0 ? 'PARTIAL' : 'UNAVAILABLE'),
    source: 'dfs_salaries table (database)',
    recordCount: input.dfsRecordCount,
    lastUpdated: null,
    missingInputs: dfsMissingInputs,
    productionSafe: input.dfsRecordCount > 0,
  })

  // 6. Rounds
  modules.push({
    name: 'Rounds',
    status: input.roundCount === 4 ? 'VERIFIED' : 'PARTIAL',
    source: 'rounds table (tournament-wide scoring)',
    recordCount: input.roundCount,
    lastUpdated: null,
    missingInputs: input.roundCount < 4 ? [`${4 - input.roundCount} rounds incomplete`] : [],
    productionSafe: true,
  })

  // 7. Weather
  modules.push({
    name: 'Weather',
    status: input.hasWeather ? 'VERIFIED' : 'UNAVAILABLE',
    source: 'weather_snapshots table',
    recordCount: 0,
    lastUpdated: null,
    missingInputs: ['Weather forecasts not imported'],
    productionSafe: true,
  })

  // 8. Odds
  modules.push({
    name: 'Odds',
    status: input.hasOdds ? 'VERIFIED' : 'UNAVAILABLE',
    source: 'odds_quotes table',
    recordCount: 0,
    lastUpdated: null,
    missingInputs: ['Betting markets not imported'],
    productionSafe: true,
  })

  // 9. Field Rankings (CaddieIQ)
  modules.push({
    name: 'Field Rankings',
    status: 'CALCULATED',
    source: 'CaddieIQ ranking engine (from player_season_statistics)',
    recordCount: input.fieldFieldCount,
    lastUpdated: null,
    missingInputs: [],
    productionSafe: true,
  })

  // 10. AI Intelligence
  modules.push({
    name: 'AI Intelligence',
    status: 'AI_GENERATED',
    source: 'Tournament Intelligence Engine (calculated from verified data)',
    recordCount: 1,
    lastUpdated: null,
    missingInputs: [],
    productionSafe: true,
  })

  return modules
}
