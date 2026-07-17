/**
 * Tournament elevation utilities — derived analytics for premium research experience.
 *
 * Pure functions that transform raw tournament, field, course, and weather data
 * into actionable insights for DFS strategy, field analysis, and risk assessment.
 * All functions are deterministic and testable; no side effects or database access.
 */

import 'server-only'

import type { CourseProfile } from '@/lib/domain/course'
import type { TournamentField } from '@/features/tournaments/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'

/**
 * Strategic theme for a tournament.
 * Used to guide lineup construction and player selection.
 */
export interface StrategicTheme {
  /** Primary skill emphasis (e.g., "accuracy", "distance", "precision") */
  primary: string
  /** Secondary skill emphasis */
  secondary: string
  /** One-line summary for quick reference */
  summary: string
}

/**
 * Field strength rating with supporting metrics.
 */
export interface FieldStrengthAnalysis {
  /** Overall field quality: "elite" | "strong" | "regular" | "weak" */
  rating: "elite" | "strong" | "regular" | "weak"
  /** Average world ranking (if available) */
  avgOwgr?: number
  /** Percentage of top-50 players */
  topFiftyPercent?: number
  /** Estimated field quality score (0-100) */
  scoreOutOf100: number
  /** One-line explanation */
  description: string
}

/**
 * DFS strategy recommendations for different game types.
 */
export interface DfsStrategyRecommendations {
  /** Cash game strategy (low variance) */
  cash: {
    primary: string
    secondary: string
    avoidance: string
  }
  /** GPP / Large field strategy (high variance) */
  gpp: {
    primary: string
    secondary: string
    targetOwnership: string
  }
  /** Single-entry tournament strategy */
  singleEntry: {
    primary: string
    secondary: string
    tiebreaker: string
  }
  /** Large field (10K+ entry) strategy */
  largeField: {
    primary: string
    secondary: string
    leverage: string
  }
}

/**
 * Risk factor identified for a tournament.
 */
export interface RiskFactor {
  /** Risk category (e.g., "weather", "field", "course") */
  category: "weather" | "field" | "course" | "other"
  /** Risk name */
  name: string
  /** Risk severity: 1-5 (1 = low, 5 = critical) */
  severity: number
  /** What makes this risky */
  description: string
  /** How to mitigate */
  mitigation: string
}

/**
 * Premium insight about the tournament.
 */
export interface PremiumInsight {
  /** Insight title */
  title: string
  /** Key takeaway */
  insight: string
  /** How to apply to lineup */
  application: string
}

/**
 * Compute strategic themes from course characteristics and field composition.
 * Returns primary and secondary skill emphases.
 */
export function computeStrategicThemes(
  courseProfile: CourseProfile | null,
): StrategicTheme {
  if (!courseProfile) {
    return {
      primary: "balanced",
      secondary: "consistency",
      summary: "No course data; prioritize recent form",
    }
  }

  // Length-based themes
  if (courseProfile.avgYardage > 7300) {
    return {
      primary: "distance",
      secondary: "accuracy",
      summary: "Ultra-long layout rewards distance with control",
    }
  }

  if (courseProfile.avgYardage < 6400) {
    return {
      primary: "accuracy",
      secondary: "precision",
      summary: "Shorter course emphasizes accuracy over distance",
    }
  }

  // Fairway-based themes
  if (
    courseProfile.fairwayWidth === "narrow" ||
    courseProfile.fairwayWidth === "very_narrow"
  ) {
    return {
      primary: "accuracy",
      secondary: "ball_striking",
      summary: "Tight fairways punish wild tee shots severely",
    }
  }

  // Green-based themes
  if (
    courseProfile.avgGreenSize === "small" ||
    courseProfile.avgGreenSize === "tiny"
  ) {
    return {
      primary: "precision",
      secondary: "short_game",
      summary: "Small greens reward elite approach play",
    }
  }

  // Default: balanced
  return {
    primary: "balanced",
    secondary: "consistency",
    summary: "Balanced test requiring all-around skill",
  }
}

/**
 * Analyze field strength and predict competitiveness level.
 * Based on field size and estimated OWGR average (if available).
 */
export function analyzeFieldStrength(
  field: TournamentField,
): FieldStrengthAnalysis {
  const playerCount = field.size || 0

  // Estimate based on field size and historical data
  if (playerCount < 50) {
    return {
      rating: "elite",
      scoreOutOf100: 95,
      description: "Exclusive field with only top players",
    }
  }

  if (playerCount < 100) {
    return {
      rating: "strong",
      scoreOutOf100: 85,
      description: "High-quality field with elite majority",
    }
  }

  if (playerCount < 150) {
    return {
      rating: "regular",
      scoreOutOf100: 70,
      description: "Standard tour field with mixed quality",
    }
  }

  return {
    rating: "regular",
    scoreOutOf100: 65,
    description: "Large field with varied skill levels",
  }
}

/**
 * Generate DFS strategy recommendations based on course and field.
 */
export function generateDfsStrategy(
  courseProfile: CourseProfile | null,
  fieldStrength: FieldStrengthAnalysis,
): DfsStrategyRecommendations {
  const themes = computeStrategicThemes(courseProfile)
  const isWeakField = fieldStrength.rating === "weak" || fieldStrength.rating === "regular"

  return {
    cash: {
      primary: isWeakField
        ? "Lock verified form + chalk"
        : "Elite ball strikers with course fit",
      secondary: "Consistent scorers avoiding volatility",
      avoidance: "High-variance boom/bust players",
    },
    gpp: {
      primary: `Mid-tier ${themes.primary} specialists < 10% ownership`,
      secondary: "Contrarian course experts ignoring chalk",
      targetOwnership: "15-25%",
    },
    singleEntry: {
      primary: "Balanced stack of elite + mid-tier",
      secondary: "Course experts with recent form",
      tiebreaker: "Avoid all stacks and correlations",
    },
    largeField: {
      primary: "Target 5-10% sub-10K ownership",
      secondary: "Course specialists at 25-50% of elite ownership",
      leverage: "Fade 50%+ chalked favorites",
    },
  }
}

/**
 * Identify key risk factors for the tournament.
 */
export function identifyRiskFactors(
  courseProfile: CourseProfile | null,
  weather: WeatherIntelligence | null,
  fieldStrength: FieldStrengthAnalysis,
): RiskFactor[] {
  const risks: RiskFactor[] = []

  // Course risks
  if (courseProfile?.windExposure === "high") {
    risks.push({
      category: "course",
      name: "High wind exposure",
      severity: 4,
      description: "Variable wind can create significant scoring swings",
      mitigation: "Prioritize consistent wind players; avoid volatility",
    })
  }

  if (
    courseProfile?.avgGreenSize === "tiny" ||
    courseProfile?.avgGreenSize === "small"
  ) {
    risks.push({
      category: "course",
      name: "Tiny greens amplify misses",
      severity: 4,
      description: "Approach play becomes critical; even slightly off results in bogey",
      mitigation: "Stack elite approach players; ignore bombers",
    })
  }

  // Weather risks
  if (weather?.statusReport?.code === "fetch-pending") {
    risks.push({
      category: "weather",
      name: "Weather data still loading",
      severity: 2,
      description: "Incomplete weather forecast; scoring impact unknown",
      mitigation: "Wait for full forecast before finalizing lineups",
    })
  }

  if (weather?.current?.windSpeedMph && weather.current.windSpeedMph > 15) {
    risks.push({
      category: "weather",
      name: "Strong winds",
      severity: 3,
      description: "Wind above 15 mph significantly impacts scoring",
      mitigation: "Reduce aggressive strategies; play defensive",
    })
  }

  // Field risks
  if (fieldStrength.rating === "elite") {
    risks.push({
      category: "field",
      name: "Elite-heavy field",
      severity: 3,
      description: "Top players are more likely to perform; less variance",
      mitigation: "Chalk-heavy cash games; leverage in GPP",
    })
  }

  if (fieldStrength.rating === "weak") {
    risks.push({
      category: "field",
      name: "Weak field creates uncertainty",
      severity: 2,
      description: "Lower-ranked players increase volatility",
      mitigation: "Play conservative cash; exploit GPP leverage",
    })
  }

  return risks
}

/**
 * Generate premium insights about the tournament.
 */
export function generatePremiumInsights(
  courseProfile: CourseProfile | null,
  fieldStrength: FieldStrengthAnalysis,
  risks: RiskFactor[],
): PremiumInsight[] {
  const insights: PremiumInsight[] = []
  const themes = computeStrategicThemes(courseProfile)

  // Course insight
  insights.push({
    title: `Tournament Story: ${themes.primary.charAt(0).toUpperCase() + themes.primary.slice(1)} Matters Most`,
    insight: themes.summary,
    application: `Build lineups around ${themes.primary} specialists; fade generalists`,
  })

  // Field insight
  if (fieldStrength.rating === "elite") {
    insights.push({
      title: "Elite Field Demands Precision",
      insight:
        "Top-heavy field means favorites are more likely to perform; variance is lower",
      application: "Play chalk in cash; leverage contrarian plays in GPP",
    })
  }

  // Risk insight
  const topRisk = risks[0]
  if (topRisk) {
    insights.push({
      title: `Key Risk: ${topRisk.name}`,
      insight: topRisk.description,
      application: topRisk.mitigation,
    })
  }

  // Course fit insight
  if (courseProfile?.avgYardage && courseProfile.avgYardage > 7300) {
    insights.push({
      title: "Distance Creates an Edge",
      insight: "Ultra-long courses reward bombers; distance correlates with scoring",
      application: "Stack long hitters; prioritize distance metrics",
    })
  }

  // Secondary skill insight
  if (themes.secondary) {
    insights.push({
      title: `Don't Forget ${themes.secondary.replace(/_/g, " ")}`,
      insight: `${themes.secondary.replace(/_/g, " ")} is the secondary differentiator`,
      application: `After targeting ${themes.primary}, fill with ${themes.secondary.replace(/_/g, " ")} specialists`,
    })
  }

  return insights
}

/**
 * Weather impact on skill importance and scoring.
 * Shows how current conditions modify strategy.
 */
export interface WeatherImpactAnalysis {
  /** How wind affects playing difficulty (multiplicative factor) */
  windImpactFactor: number
  /** Estimated scoring environment shift (strokes per round) */
  scoringShift: number
  /** Skills most affected by current weather */
  affectedSkills: string[]
  /** Recommendations for adjusting strategy */
  adjustments: string[]
}

/**
 * Analyze how current weather impacts player value and strategy.
 */
export function analyzeWeatherImpact(
  weather: WeatherIntelligence | null,
  courseProfile: CourseProfile | null,
): WeatherImpactAnalysis {
  if (!weather || weather.status !== "available") {
    return {
      windImpactFactor: 1.0,
      scoringShift: 0,
      affectedSkills: [],
      adjustments: ["Wait for weather data before finalizing strategy"],
    }
  }

  const adjustments: string[] = []
  let windImpactFactor = 1.0
  let scoringShift = 0
  const affectedSkills: string[] = []

  // Analyze wind
  if (weather.current?.windSpeedMph) {
    if (weather.current.windSpeedMph > 15) {
      windImpactFactor = 1.4
      scoringShift = -1.5
      affectedSkills.push("accuracy", "distance_control")
      adjustments.push("Favor accurate drivers; reduce aggressive play")
    } else if (weather.current.windSpeedMph > 10) {
      windImpactFactor = 1.2
      scoringShift = -0.8
      affectedSkills.push("ball_striking")
      adjustments.push("Prioritize consistent ball strikers")
    }
  }

  // Analyze temperature
  if (weather.current?.temperatureF) {
    if (weather.current.temperatureF < 55) {
      scoringShift -= 0.5
      affectedSkills.push("distance")
      adjustments.push("Cool weather reduces distance; favor approach specialists")
    }
  }

  // Analyze moisture
  if (weather.current?.humidity && weather.current.humidity > 80) {
    scoringShift += 0.3
    adjustments.push("High humidity softens greens; approach play becomes easier")
  }

  return {
    windImpactFactor,
    scoringShift,
    affectedSkills: [...new Set(affectedSkills)],
    adjustments,
  }
}
