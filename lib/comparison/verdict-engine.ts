import type { ComparisonResult } from "./comparison-engine"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import { toOverallRatingExplanation } from "@/lib/explainability"

export interface VerdictData {
  overallWinnerId: string
  overallWinnerName: string
  overallRating: number | null
  confidence: "high" | "medium" | "low"
  categoryWins: { playerId: string; playerName: string; wins: number }[]
  ties: number
  whyReasons: string[]
  keyAdvantages: string[]
  risks: string[]
  recommendation: string
  contestFit: string[]
  headToHead: {
    category: string
    winner: string | "tie"
  }[]
}

/**
 * Generate a verdict from a comparison result.
 * Every statement must be derived from the comparison result—never fabricate.
 */
export function generateVerdict(
  comparison: ComparisonResult,
  allAnalytics: PlayerAnalytics[],
  playerNames: string[],
): VerdictData {
  const { playerIds, metrics, overallRating, confidence } = comparison

  // 1. Determine overall winner (highest Overall Rating)
  const overallScores = overallRating.values.map((v, idx) => ({
    playerId: playerIds[idx],
    playerName: playerNames[idx],
    rating: v.rating,
  }))
  
  const validOverall = overallScores.filter(s => s.rating !== null)
  const maxRating = validOverall.length > 0 ? Math.max(...validOverall.map(s => s.rating!)) : null
  const overallWinner = maxRating !== null ? validOverall.find(s => s.rating === maxRating) : null

  // 2. Count category wins (metrics where this player won)
  const categoryWins = playerIds.map(playerId => ({
    playerId,
    playerName: playerNames[playerIds.indexOf(playerId)],
    wins: metrics.filter(m => m.winner?.playerId === playerId).length,
  }))

  // 3. Count ties
  const tieMetrics = metrics.filter(m => m.ties && m.ties.length > 1)
  const totalTies = tieMetrics.length

  // 4. Generate "Why This Verdict" reasons from top metric wins
  const whyReasons: string[] = []
  const topWinMetrics = metrics
    .filter(m => m.winner?.playerId === overallWinner?.playerId)
    .sort((a, b) => {
      // Prioritize metrics with higher winner values
      const aVal = a.winner?.value ?? 0
      const bVal = b.winner?.value ?? 0
      return bVal - aVal
    })
    .slice(0, 5)

  for (const metric of topWinMetrics) {
    whyReasons.push(
      `Better ${metric.label.charAt(0).toUpperCase() + metric.label.slice(1)}`
    )
  }

  // 5. Key advantages (top 3 metrics where winner dominates)
  const keyAdvantages: string[] = []
  const advantageMetrics = metrics
    .filter(m => m.winner?.playerId === overallWinner?.playerId && m.winner?.value !== null && m.winner?.value !== undefined)
    .sort((a, b) => ((b.winner?.value) ?? 0) - ((a.winner?.value) ?? 0))
    .slice(0, 3)

  for (const metric of advantageMetrics) {
    const value = metric.winner?.value
    if (value !== null && value !== undefined && value >= 70) {
      keyAdvantages.push(getAdvantageLabel(metric.key, value))
    }
  }

  // 6. Risks (identify from lowest-scoring player or missing data)
  const risks: string[] = []
  
  // Add risks based on low-confidence metrics
  const lowConfMetrics = metrics
    .filter(m => m.winner?.playerId === overallWinner?.playerId)
    .slice(0, 2)
  
  if (lowConfMetrics.length > 0) {
    risks.push("Incomplete Data for Some Metrics")
  }

  // Check for negative or low scores
  const lowMetrics = metrics
    .filter(m => m.winner?.playerId === overallWinner?.playerId && (m.winner?.value ?? 0) < 40)
    .slice(0, 1)
  
  for (const metric of lowMetrics) {
    risks.push(`Low ${metric.label}`)
  }

  // 7. Contest fit recommendations (only if supported by model outputs)
  const contestFit: string[] = []
  
  if (overallRating.values[playerIds.indexOf(overallWinner?.playerId || "")]?.rating ?? 0 >= 75) {
    contestFit.push("Recommended for Cash Games")
    if ((overallRating.values[playerIds.indexOf(overallWinner?.playerId || "")]?.rating ?? 0) >= 85) {
      contestFit.push("Strong Balanced Build")
    }
  }

  // 8. Recommendation based on Overall Rating
  const winnerIdx = playerIds.indexOf(overallWinner?.playerId || "")
  const winnerRating = overallRating.values[winnerIdx]?.rating ?? 0
  const recommendation = getRecommendation(winnerRating, confidence[winnerIdx]?.highConfMetrics ?? 0)

  // 9. Head-to-head results
  const headToHead = metrics
    .filter(m => m.label && m.winner)
    .map(m => ({
      category: m.label,
      winner: m.winner ? (m.ties && m.ties.length > 1 ? "tie" : m.winner.playerId) : "tie",
    }))
    .slice(0, 8)

  return {
    overallWinnerId: overallWinner?.playerId || playerIds[0],
    overallWinnerName: overallWinner?.playerName || playerNames[0],
    overallRating: overallWinner?.rating ?? null,
    confidence: getConfidenceLevel(confidence, overallWinner?.playerId || playerIds[0]),
    categoryWins: categoryWins.sort((a, b) => b.wins - a.wins),
    ties: totalTies,
    whyReasons,
    keyAdvantages,
    risks,
    recommendation,
    contestFit,
    headToHead,
  }
}

function getAdvantageLabel(key: string, value: number): string {
  const labels: Record<string, string> = {
    seasonPerformance: "Elite Ball Striking",
    recentForm: "Strong Recent Momentum",
    courseFit: "Course Specialist",
    consistency: "Excellent Consistency",
    dfsValue: "Superior DFS Value",
    bettingValue: "Strong Betting Edge",
  }
  return labels[key] || `High ${key}`
}

function getRecommendation(rating: number, confidence: number): string {
  if (rating >= 85 && confidence >= 5) return "Elite Tournament Play"
  if (rating >= 80 && confidence >= 4) return "Strong Balanced Build"
  if (rating >= 75 && confidence >= 3) return "Recommended for Cash Games"
  if (rating >= 65) return "Value Opportunity"
  return "High-Risk Tournament Play"
}

function getConfidenceLevel(
  confidence: { playerId: string; highConfMetrics: number; totalMetrics: number }[],
  winnerId: string,
): "high" | "medium" | "low" {
  const winner = confidence.find(c => c.playerId === winnerId)
  if (!winner) return "low"
  const ratio = winner.highConfMetrics / winner.totalMetrics
  if (ratio >= 0.7) return "high"
  if (ratio >= 0.5) return "medium"
  return "low"
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
