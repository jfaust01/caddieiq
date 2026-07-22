import type { TournamentSummary } from '@/features/tournaments/types'
import type { TournamentField } from '@/features/tournaments/services/tournament-service'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

/**
 * Historical stats for a tournament (derived from past results).
 */
export interface HistoricalTournamentStats {
  winningScores: number[] // Last 5 years
  cutLines: number[] // Last 5 years
  averageBirdies: number
  averageDrivingDistance: number
  averageGirPercent: number
  averagePuttingRank: number
  playedYears: number
}

/**
 * Aggregated data for tournament intelligence generation.
 * Pulls together course, field, weather, historical, and odds data.
 */
export interface TournamentIntelligenceData {
  tournament: TournamentSummary
  field: TournamentField
  weather: WeatherIntelligence | null
  historicalStats: HistoricalTournamentStats | null
  courseMetrics: Record<string, number | string> | null
  currentOdds: Array<{
    playerName: string
    odds: number
    salary?: number
  }> | null
}

/**
 * Aggregator pulls together all data needed for tournament intelligence generation.
 * Acts as single interface to multiple services.
 */
export class TournamentIntelligenceAggregator {
  /**
   * Aggregate all tournament intelligence data.
   * Returns null if core data (tournament, field) unavailable.
   */
  static aggregate(
    tournament: TournamentSummary,
    field: TournamentField,
    weather: WeatherIntelligence | null = null,
    historicalStats: HistoricalTournamentStats | null = null,
    courseMetrics: Record<string, number | string> | null = null,
    currentOdds: Array<{ playerName: string; odds: number; salary?: number }> | null = null,
  ): TournamentIntelligenceData {
    return {
      tournament,
      field,
      weather,
      historicalStats,
      courseMetrics,
      currentOdds,
    }
  }

  /**
   * Calculate key numbers from aggregated data.
   * These are the metrics that matter for decision-making.
   */
  static calculateKeyNumbers(data: TournamentIntelligenceData) {
    const historical = data.historicalStats
    const course = data.tournament.courseRef
    const field = data.field

    return {
      // Scoring Context
      averageWinningScore: historical?.winningScores?.[0] ?? null,
      winningScoreTrend: calculateTrend(historical?.winningScores ?? []),
      averageCutLine: historical?.cutLines?.[0] ?? null,
      cutLineTrend: calculateTrend(historical?.cutLines ?? []),

      // Course Characteristics
      averageBirdies: historical?.averageBirdies ?? null,
      averageDrivingDistance: historical?.averageDrivingDistance ?? null,
      averageGirPercent: historical?.averageGirPercent ?? null,
      averagePuttingRank: historical?.averagePuttingRank ?? null,

      // Course Metrics
      courseDifficulty: course?.difficulty ?? null,
      coursePar: course?.par ?? null,
      courseYardage: course?.yardage ?? null,

      // Field Context
      fieldSize: field?.size ?? 0,
      rankedPlayers: field?.rankingLeaders?.ratedPlayers ?? 0,
      worldRankedPercent: field?.size
        ? Math.round((field.rankingLeaders?.ratedPlayers ?? 0) / field.size * 100)
        : 0,

      // Weather
      weatherConfidence: data.weather?.statusReport?.code === 'forecast-available' ? 'HIGH' : 'LOW',
      windMph: data.weather?.current?.windSpeedMph ?? null,
      temperatureF: data.weather?.current?.temperatureF ?? null,

      // Odds
      favoriteOdds: data.currentOdds?.[0]?.odds ?? null,
      favoriteName: data.currentOdds?.[0]?.playerName ?? null,
    }
  }

  /**
   * Identify player archetypes that win at this venue.
   * Returns array of archetype names with confidence scores.
   */
  static identifyWinningArchetypes(
    data: TournamentIntelligenceData,
  ): Array<{ archetype: string; confidence: number; reason: string }> {
    const archetypes: Array<{ archetype: string; confidence: number; reason: string }> = []

    const metrics = data.courseMetrics || {}

    // Accuracy matters if driving importance high
    if (metrics.drivingImportance && (metrics.drivingImportance as number) > 70) {
      archetypes.push({
        archetype: 'Accurate Drivers',
        confidence: Math.min(100, (metrics.drivingImportance as number) + 10),
        reason: 'Narrow fairways punish inaccuracy heavily',
      })
    }

    // Iron players matter if approach importance high
    if (metrics.approachImportance && (metrics.approachImportance as number) > 70) {
      archetypes.push({
        archetype: 'Elite Iron Players',
        confidence: Math.min(100, (metrics.approachImportance as number) + 10),
        reason: 'Approach play is critical to scoring here',
      })
    }

    // Short game specialists if short game importance high
    if (metrics.shortGameImportance && (metrics.shortGameImportance as number) > 70) {
      archetypes.push({
        archetype: 'Short Game Specialists',
        confidence: Math.min(100, (metrics.shortGameImportance as number) + 10),
        reason: 'Around-green performance separates winners',
      })
    }

    // Putters matter if putting importance high
    if (metrics.puttingImportance && (metrics.puttingImportance as number) > 70) {
      archetypes.push({
        archetype: 'Confident Putters',
        confidence: Math.min(100, (metrics.puttingImportance as number) + 10),
        reason: 'Putting prowess decides close competitions',
      })
    }

    // Wind specialists
    if (metrics.windSensitivity && (metrics.windSensitivity as number) > 60) {
      archetypes.push({
        archetype: 'Wind Specialists',
        confidence: 75,
        reason: 'Exposed layout requires wind management expertise',
      })
    }

    // Bombers if low penalty severity
    if (metrics.penaltySeverity && (metrics.penaltySeverity as number) < 40) {
      archetypes.push({
        archetype: 'Young Bombers',
        confidence: 65,
        reason: 'Forgiving rough allows aggressive play',
      })
    }

    // Sort by confidence descending
    return archetypes.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Identify biggest storylines for this tournament.
   * Should be combined with AI generation for full narrative.
   */
  static identifyPotentialStorylines(data: TournamentIntelligenceData): string[] {
    const storylines: string[] = []

    // Defending champion
    if (data.tournament.defendingChampion) {
      storylines.push(`${data.tournament.defendingChampion} returns as defending champion`)
    }

    // First-time venue players
    const topPlayers = data.field?.rankingLeaders?.topRanked?.slice(0, 5) ?? []
    if (topPlayers.length > 0) {
      storylines.push(`Top ${topPlayers.length} players battling for victory`)
    }

    // Weather
    if (data.weather?.forecast) {
      storylines.push('Significant weather expected to impact scoring')
    }

    // Course changes (would need course change data)
    storylines.push('Rough setup and course maintenance changes from last year')

    // Field strength
    const worldRankedPercent = data.field?.size
      ? Math.round((data.field.rankingLeaders?.ratedPlayers ?? 0) / data.field.size * 100)
      : 0
    if (worldRankedPercent > 80) {
      storylines.push('Elite field with strong world ranking representation')
    }

    return storylines
  }
}

/**
 * Calculate trend direction for a series of numbers.
 * Returns 'improving', 'declining', or 'stable'.
 */
function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable'

  const recent = values.slice(0, 2).reduce((a, b) => a + b, 0) / 2
  const older = values.slice(-2).reduce((a, b) => a + b, 0) / 2

  const diff = recent - older
  if (Math.abs(diff) < 0.5) return 'stable'
  return diff > 0 ? 'improving' : 'declining'
}
