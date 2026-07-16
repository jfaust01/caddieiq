import type { PlayerAnalytics, AnalyticsScore } from "@/lib/analytics/types"
import type { Explanation } from "@/lib/explainability"
import { toDecisionTrace } from "@/lib/explainability"

/**
 * Represents a single metric comparison between players.
 */
export interface MetricComparison {
  key: string
  label: string
  values: { playerId: string; value: number | null; band: string | null }[]
  winner: { playerId: string; value: number | null } | null
  ties: { playerId: string; value: number | null }[]
  isDifference: boolean
}

/**
 * The full comparison result for a set of players.
 */
export interface ComparisonResult {
  playerIds: string[]
  playerNames: string[]
  metrics: MetricComparison[]
  overallRating: {
    values: { playerId: string; rating: number | null; band: string | null }[]
    winner: { playerId: string; rating: number | null } | null
  }
  confidence: {
    playerId: string
    highConfMetrics: number
    totalMetrics: number
  }[]
}

/**
 * Extract comparable metrics from player analytics.
 * Filters out independent/context-only signals and null values for fair comparison.
 */
export function extractComparableMetrics(analytics: PlayerAnalytics[]): AnalyticsScore[] {
  if (analytics.length === 0) return []

  // Use scores from the first player as the template (all have same keys)
  const templateScores = analytics[0].scores
  
  // Filter to weighted metrics only (exclude independent signals)
  return templateScores.filter(score => !score.independent)
}

/**
 * Compare a single metric across players.
 * Determines the winner (highest value) and ties.
 */
export function compareMetric(
  key: string,
  label: string,
  analytics: PlayerAnalytics[],
  playerIds: string[],
): MetricComparison {
  const values = playerIds.map(id => {
    const analytic = analytics.find(a => a.playerId === id)
    const score = analytic?.scores.find(s => s.key === key)
    return {
      playerId: id,
      value: score?.value ?? null,
      band: score?.band ?? null,
    }
  })

  // Find winner (highest non-null value)
  const validValues = values.filter(v => v.value !== null)
  const maxValue = validValues.length > 0 ? Math.max(...validValues.map(v => v.value!)) : null
  
  const ties = maxValue !== null ? values.filter(v => v.value === maxValue) : []
  const winner = ties.length === 1 ? ties[0] : null

  return {
    key,
    label,
    values,
    winner,
    ties,
    isDifference: false,
  }
}

/**
 * Build a full comparison across all metrics for the selected players.
 */
export function buildComparison(
  analytics: PlayerAnalytics[],
  playerIds: string[],
  playerNames: string[],
): ComparisonResult {
  const comparableMetrics = extractComparableMetrics(analytics)
  
  const metrics = comparableMetrics.map(score =>
    compareMetric(score.key, score.label, analytics, playerIds),
  )

  // Overall rating comparison
  const overallValues = playerIds.map(id => {
    const analytic = analytics.find(a => a.playerId === id)
    return {
      playerId: id,
      rating: analytic?.overallRating ?? null,
      band: analytic?.overallBand ?? null,
    }
  })

  const validRatings = overallValues.filter(v => v.rating !== null)
  const maxRating = validRatings.length > 0 ? Math.max(...validRatings.map(v => v.rating!)) : null
  const ratingTies = maxRating !== null ? overallValues.filter(v => v.rating === maxRating) : []
  const ratingWinner = ratingTies.length === 1 ? ratingTies[0] : null

  // Confidence stats per player
  const confidence = playerIds.map(id => {
    const analytic = analytics.find(a => a.playerId === id)
    const highConfMetrics = analytic?.scores.filter(s => s.confidence === "high").length ?? 0
    const totalMetrics = analytic?.scores.length ?? 0
    return { playerId: id, highConfMetrics, totalMetrics }
  })

  return {
    playerIds,
    playerNames,
    metrics,
    overallRating: {
      values: overallValues,
      winner: ratingWinner,
    },
    confidence,
  }
}

/**
 * Calculate the difference view for a metric (base vs. comparison).
 */
export function calculateDifference(
  baseValue: number | null,
  compareValue: number | null,
): number | null {
  if (baseValue === null || compareValue === null) return null
  return compareValue - baseValue
}

/**
 * Generate a caddie insight comparing the players' profiles.
 */
export function generateCaddieInsight(
  result: ComparisonResult,
  explanations: Explanation[],
): string {
  if (result.playerIds.length < 2) return ""

  const names = result.playerNames.join(" vs. ")
  
  // Check overall rating
  const ratingWinner = result.overallRating.winner
  if (ratingWinner) {
    const winnerName = result.playerNames[result.playerIds.indexOf(ratingWinner.playerId)]
    const rating = ratingWinner.rating ?? 0
    if (rating >= 75) {
      return `${winnerName} has the stronger overall profile with a ${rating.toFixed(0)}/100 rating.`
    }
  }

  // Check consistency
  const consistencyMetric = result.metrics.find(m => m.key === "consistency")
  if (consistencyMetric?.winner) {
    const winnerName = result.playerNames[result.playerIds.indexOf(consistencyMetric.winner.playerId)]
    return `${winnerName} shows better consistency, making them a more reliable play.`
  }

  // Check recent form
  const formMetric = result.metrics.find(m => m.key === "recentForm")
  if (formMetric?.winner) {
    const winnerName = result.playerNames[result.playerIds.indexOf(formMetric.winner.playerId)]
    return `${winnerName} has stronger recent form, indicating momentum heading into this event.`
  }

  return `Both players have comparable metrics. Review the detailed breakdown to find your edge.`
}

/**
 * Export comparison as a shareable link.
 */
export function generateComparisonLink(playerIds: string[]): string {
  return `/compare?players=${playerIds.join(",")}`
}

/**
 * Parse player IDs from a comparison link.
 */
export function parseComparisonLink(queryString: string): string[] {
  const params = new URLSearchParams(queryString)
  const players = params.get("players")
  if (!players) return []
  
  // Validate max 4 players
  const ids = players.split(",").slice(0, 4)
  return ids.filter(id => id.length > 0)
}
