/**
 * Player Tournament Context — Utilities for analyzing how a tournament and course
 * impact a specific player's value and strategy.
 *
 * These functions transform tournament intelligence, course intelligence, and player
 * analytics into tournament-specific insights: DFS strategy by game type, risk factors,
 * and a strategic summary.
 */

import type { PlayerDetail } from '@/features/players/types'
import type { CourseProfile } from '@/lib/domain/course'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

/**
 * How a tournament impacts a player's DFS value and strategic positioning.
 */
export interface PlayerTournamentImpact {
  /** Strategic summary paragraph (3-5 sentences) */
  strategySummary: string
  /** Why this player fits or doesn't fit this tournament */
  fitExplanation: string
  /** Overall recommendation: Strong / Moderate / Weak / Avoid */
  recommendation: 'strong' | 'moderate' | 'weak' | 'avoid'
  /** Confidence level: High / Medium / Low */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * DFS strategy recommendation by game type for this player at this tournament.
 */
export interface PlayerDfsStrategyForTournament {
  /** Cash games (50/50, Double-Ups) — prioritize consistency */
  cashGames: {
    recommendation: 'primary' | 'secondary' | 'avoid'
    reason: string
    targetPercentage?: string
  }
  /** Single Entry tournaments — balance upside with consistency */
  singleEntry: {
    recommendation: 'primary' | 'secondary' | 'avoid'
    reason: string
    ceiling?: string
    floor?: string
  }
  /** Large Field GPPs — prioritize upside and ceiling */
  largeFieldGpp: {
    recommendation: 'primary' | 'secondary' | 'avoid'
    reason: string
    targetPercentage?: string
  }
}

/**
 * Risk factors specific to this player at this tournament.
 */
export interface PlayerTournamentRisk {
  /** Risk factor identifier */
  id: string
  /** Human-readable label */
  label: string
  /** Severity: High / Medium / Low */
  severity: 'high' | 'medium' | 'low'
  /** Explanation of the risk */
  description: string
  /** Mitigation strategy if applicable */
  mitigation?: string
}

/**
 * Generate a tournament impact summary explaining how this tournament affects
 * this player's value proposition.
 *
 * Returns strategic insight paragraph (3-5 sentences) explaining:
 * - How the course suits (or doesn't suit) this player's game
 * - Current form relative to expected performance
 * - Key opportunity or concern
 */
export function getTournamentImpactSummary(
  player: PlayerDetail,
  courseProfile: CourseProfile | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _weather?: WeatherIntelligence,
): PlayerTournamentImpact {
  if (!courseProfile || !player.upcoming?.course) {
    return {
      strategySummary: 'Course intelligence unavailable for detailed analysis.',
      fitExplanation: 'Unable to compute course fit without course data.',
      recommendation: 'moderate',
      confidence: 'low',
    }
  }

  const playerName = player.fullName
  const courseName = player.upcoming.course.name || 'this course'

  // Determine fit based on player analytics and course characteristics
  const playerForm = player.analytics.form?.status || 'neutral'
  const isFormGood = playerForm === 'trending_up' || playerForm === 'hot'

  // Evaluate course fit based on player skills vs course demands
  const playerAvgScoring = player.analytics.scoringAverage || 71
  const courseExpectedScore = courseProfile.avgYardage > 7200 ? 72 : courseProfile.avgYardage < 6500 ? 70 : 71

  const isCourseGoodFit =
    (courseProfile.fairwayWidth === 'wide' && playerAvgScoring < 70.5) ||
    (courseProfile.avgGreenSize === 'large' && playerAvgScoring < 71) ||
    (courseProfile.greenSpeed === 'low' && playerAvgScoring < 70.5)

  // Build strategic summary
  let strategySummary = ''
  if (isFormGood && isCourseGoodFit) {
    strategySummary = `${playerName} is trending well and this course setup suits his game. Look for strong scoring from tee to green. Confidence is high—prioritize him in lineups where form metrics align with course characteristics.`
    return {
      strategySummary,
      fitExplanation: `${playerName}'s skills align well with ${courseName}'s setup.`,
      recommendation: 'strong',
      confidence: 'high',
    }
  } else if (isFormGood && !isCourseGoodFit) {
    strategySummary = `${playerName} brings excellent current form to ${courseName}, but the course setup presents challenges. He'll need to rely on hot putter and short game to compensate. Monitor pre-round interviews for course confidence.`
    return {
      strategySummary,
      fitExplanation: `Form is strong but course fit is marginal.`,
      recommendation: 'moderate',
      confidence: 'medium',
    }
  } else if (!isFormGood && isCourseGoodFit) {
    strategySummary = `Despite recent inconsistency, ${playerName}'s game is well-suited to ${courseName}. Look for a bounce-back performance as course conditions favor his approach. This is a course where his strengths matter most.`
    return {
      strategySummary,
      fitExplanation: `Course conditions suit his game but form is a concern.`,
      recommendation: 'moderate',
      confidence: 'medium',
    }
  } else {
    strategySummary = `${playerName} faces headwinds at ${courseName}—recent form has been inconsistent and the course doesn't naturally suit his game. Proceed with caution; consider paying up for better form or finding course-fit specialists.`
    return {
      strategySummary,
      fitExplanation: `Form concerns and marginal course fit suggest risk.`,
      recommendation: 'weak',
      confidence: 'high',
    }
  }
}

/**
 * Generate DFS strategy recommendations by game type for this player at this tournament.
 *
 * Returns game-type specific guidance:
 * - Cash Games: Emphasis on consistency and floor
 * - Single Entry: Emphasis on balance between upside and floor
 * - Large Field GPP: Emphasis on ceiling and differentiation
 */
export function computePlayerDfsStrategyForTournament(
  player: PlayerDetail,
  courseProfile: CourseProfile | null,
): PlayerDfsStrategyForTournament {
  const formStatus = player.analytics.form?.status || 'neutral'
  const isFormGood = formStatus === 'trending_up' || formStatus === 'hot'
  const volatility = player.analytics.volatility || 'medium'

  if (!courseProfile || !player.upcoming?.course) {
    return {
      cashGames: {
        recommendation: 'secondary',
        reason: 'Insufficient data for strong positioning.',
      },
      singleEntry: {
        recommendation: 'secondary',
        reason: 'Insufficient data for specific strategy.',
      },
      largeFieldGpp: {
        recommendation: 'secondary',
        reason: 'Insufficient data for positioning.',
      },
    }
  }

  // Cash Games: Prioritize consistency and floor
  const cashRecommendation =
    isFormGood && volatility === 'low' ? 'primary' : volatility === 'high' ? 'avoid' : 'secondary'
  const cashReason =
    cashRecommendation === 'primary'
      ? `${player.fullName} is in excellent form with low volatility—ideal for consistent 50/50 lineups.`
      : cashRecommendation === 'avoid'
        ? `High volatility makes this player risky for cash games despite recent form.`
        : `Consider as secondary cash play; form is neutral and volatility is moderate.`

  // Single Entry: Balance upside with consistency
  const singleRecommendation = isFormGood ? 'primary' : volatility === 'high' ? 'secondary' : 'secondary'
  const singleReason =
    singleRecommendation === 'primary'
      ? `${player.fullName}'s recent form and balance between ceiling and floor make him ideal for single-entry tournaments.`
      : `Consider as secondary play; works well in single-entry if you need balanced upside/floor.`

  const ceiling = isFormGood ? '75-76 (6 under par)' : '72-73 (even par)'
  const floor = volatility === 'high' ? '76-77 (3-4 over par)' : '72-73 (even to 1 over par)'

  // Large Field GPP: Prioritize ceiling and differentiation
  const gppRecommendation = isFormGood && volatility !== 'low' ? 'primary' : isFormGood ? 'secondary' : 'secondary'
  const gppReason =
    gppRecommendation === 'primary'
      ? `${player.fullName} brings both form and upside potential—use in GPP lineups for differentiation.`
      : `Consider in GPP for balanced exposure; not a chalk play but solid ceiling potential.`

  return {
    cashGames: {
      recommendation: cashRecommendation,
      reason: cashReason,
      targetPercentage: cashRecommendation === 'primary' ? '80-100%' : cashRecommendation === 'secondary' ? '40-60%' : '0-10%',
    },
    singleEntry: {
      recommendation: singleRecommendation,
      reason: singleReason,
      ceiling,
      floor,
    },
    largeFieldGpp: {
      recommendation: gppRecommendation,
      reason: gppReason,
      targetPercentage: gppRecommendation === 'primary' ? '50-80%' : gppRecommendation === 'secondary' ? '30-50%' : '10-30%',
    },
  }
}

/**
 * Identify risk factors specific to this player at this tournament.
 *
 * Returns array of risk factors (high/medium/low severity) including:
 * - Recent volatility or form concerns
 * - Course-fit concerns (historical under-performance)
 * - Weather sensitivity
 * - Ownership/chalk concerns
 */
export function identifyPlayerTournamentRisks(
  player: PlayerDetail,
  courseProfile: CourseProfile | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _weather?: WeatherIntelligence,
): PlayerTournamentRisk[] {
  const risks: PlayerTournamentRisk[] = []

  const formStatus = player.analytics.form?.status || 'neutral'
  const volatility = player.analytics.volatility || 'medium'
  const recentForm = player.recentForm || []

  // Risk: Poor recent form
  if (formStatus === 'trending_down' || formStatus === 'cold') {
    risks.push({
      id: 'poor-form',
      label: 'Recent Form Decline',
      severity: formStatus === 'cold' ? 'high' : 'medium',
      description: `${player.fullName} has been playing poorly recently. Recent finishes suggest inconsistency.`,
      mitigation: 'Wait for a return to form or stack with proven performers only.',
    })
  }

  // Risk: High volatility
  if (volatility === 'high') {
    risks.push({
      id: 'high-volatility',
      label: 'High Volatility',
      severity: 'high',
      description: `Results have been very inconsistent—excellent finishes mixed with missed cuts or large misses.`,
      mitigation: 'Limit exposure in cash games; use selectively in GPPs for ceiling upside.',
    })
  }

  // Risk: Missing cut recently
  const recentMissedCut = recentForm.some((finish) => finish.status === 'MISSED_CUT')
  if (recentMissedCut) {
    risks.push({
      id: 'recent-missed-cut',
      label: 'Recent Missed Cut',
      severity: 'high',
      description: `${player.fullName} has missed a cut recently, suggesting lack of consistency or preparation issues.`,
      mitigation: 'Verify pre-tournament interviews or practice round coverage before committing.',
    })
  }

  // Risk: Poor historical performance at this course (if available)
  if (courseProfile && player.courseHistory && player.courseHistory.length > 0) {
    const coursePerformance = player.courseHistory.find((c) => c.courseId === player.upcoming?.course?.id)
    if (coursePerformance && coursePerformance.averageScore > 72) {
      risks.push({
        id: 'poor-course-history',
        label: 'Poor Course History',
        severity: 'medium',
        description: `Historical performance at ${player.upcoming?.course?.name || 'this course'} has been below average.`,
        mitigation: 'Consider similar but different course fits as comparables.',
      })
    }
  }

  // Risk: Ownership/Chalk
  if (player.dfsValue?.salary && player.dfsValue.salary > 10000) {
    risks.push({
      id: 'chalk-ownership',
      label: 'Potential Chalk Play',
      severity: 'low',
      description: `High salary suggests ${player.fullName} may be heavily rostered if in form—consider fading or using contrarian pivots.`,
      mitigation: 'In GPPs, balance chalk plays with value contrarian picks.',
    })
  }

  return risks
}
