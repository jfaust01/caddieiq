/**
 * Course Environmental & Scoring Metrics
 * Includes: wind sensitivity, penalty severity, birdie potential, and scoring volatility
 */

import type { CourseData, MetricResult } from "./types"

/**
 * Calculate Wind Sensitivity
 * How much wind affects play at this course
 */
export function calculateWindSensitivity(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Elevation and exposure (higher elevation = more wind)
  if (course.address?.elevation && course.address.elevation > 3000) {
    score += 40
    dataPoints.push(`High elevation: ${course.address.elevation} ft`)
  } else if (course.address?.elevation && course.address.elevation > 1500) {
    score += 20
    dataPoints.push(`Moderate elevation: ${course.address.elevation} ft`)
  }

  // Links-style or open courses = more wind
  if (course.characteristicFlags?.linksStyle) {
    score += 40
    dataPoints.push("Links-style layout exposes to wind")
  }

  // Course architecture (doglegs suggest wind protection)
  const avgHandicap = course.holes.length > 0 ? course.holes.reduce((sum, h) => sum + (h.handicap || 0), 0) / course.holes.length : 9
  const handicapVariance = course.holes.length > 0 
    ? Math.sqrt(course.holes.reduce((sum, h) => sum + Math.pow((h.handicap || 0) - avgHandicap, 2), 0) / course.holes.length)
    : 0

  const windScore = Math.min(20, (handicapVariance / 4) * 20) // High variance suggests wind is a factor
  score += windScore
  dataPoints.push(`Handicap variance: ${handicapVariance.toFixed(1)} (indicates strategic variety)`)

  // Par 3s are sensitive to wind (exposed shots)
  const par3Count = course.holes.filter((h) => h.par === 3).length
  score += (par3Count / 6) * 10 // 6 Par 3s = 10 points max
  dataPoints.push(`${par3Count} Par 3 holes (sensitive to wind)`)

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 70,
    explanation: `Wind has ${["minimal", "light", "moderate", "significant", "major"][stars - 1]} impact on play.`,
    dataPoints,
  }
}

/**
 * Calculate Penalty Severity
 * How severely the course penalizes missed shots
 */
export function calculatePenaltySeverity(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Water hazards (major penalty)
  if (course.hazardCounts?.water) {
    const waterScore = Math.min(40, (course.hazardCounts.water / 5) * 40) // 5+ water hazards = 40 points
    score += waterScore
    dataPoints.push(`${course.hazardCounts.water} water hazards`)
  }

  // Bunkers (moderate penalty)
  if (course.hazardCounts?.sand) {
    const bunkerScore = Math.min(25, (course.hazardCounts.sand / 8) * 25)
    score += bunkerScore
    dataPoints.push(`${course.hazardCounts.sand} bunkers`)
  }

  // Out of bounds (severe penalty)
  if (course.hazardCounts?.outOfBounds) {
    const oobScore = Math.min(25, (course.hazardCounts.outOfBounds / 3) * 25) // Few OOB = high penalty value
    score += oobScore
    dataPoints.push(`${course.hazardCounts.outOfBounds} out of bounds areas`)
  }

  // Trees/vegetation (penalty for wayward shots)
  if (course.hazardCounts?.trees) {
    const treeScore = Math.min(20, (course.hazardCounts.trees / 10) * 20)
    score += treeScore
    dataPoints.push(`${course.hazardCounts.trees} tree hazard areas`)
  }

  // Narrow fairways compound penalties
  if (course.characteristicFlags?.narrowFairways) {
    score += 15
    dataPoints.push("Narrow fairways increase penalty risk")
  }

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 85,
    explanation: `Missed shots are ${["lightly", "mildly", "moderately", "severely", "very severely"][stars - 1]} penalized.`,
    dataPoints,
  }
}

/**
 * Calculate Birdie Potential
 * How many birdie opportunities a good player should expect
 */
export function calculateBirdiePotential(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 100 // Start at maximum, decrease for birdie difficulty

  // Par 5s are primary birdie holes
  const par5s = course.holes.filter((h) => h.par === 5)
  const reachablePar5s = par5s.filter((h) => h.yardage < 540)
  const par5BirdieChance = (reachablePar5s.length / Math.max(1, par5s.length)) * 40
  score -= (40 - par5BirdieChance)
  dataPoints.push(`${reachablePar5s.length}/${par5s.length} reachable Par 5s`)

  // Par 4s rarely birdieable; short Par 4s are opportunities
  const par4s = course.holes.filter((h) => h.par === 4)
  const shortPar4s = par4s.filter((h) => h.yardage < 360)
  const par4BirdieChance = (shortPar4s.length / Math.max(1, par4s.length)) * 20
  score -= (20 - par4BirdieChance)
  dataPoints.push(`${shortPar4s.length} short Par 4s (birdie opportunities)`)

  // Hazards reduce birdie potential
  const totalHazards = (course.hazardCounts?.water || 0) + (course.hazardCounts?.sand || 0) + (course.hazardCounts?.trees || 0)
  const hazardPenalty = Math.min(25, (totalHazards / 10) * 25)
  score -= hazardPenalty
  dataPoints.push(`${totalHazards} hazards reduce birdie opportunities`)

  // Small greens reduce birdie potential
  if (course.characteristicFlags?.smallGreens) {
    score -= 15
    dataPoints.push("Small greens make birdies harder")
  }

  const finalScore = Math.round(Math.max(0, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 80,
    explanation: `Birdie opportunities are ${["very rare", "limited", "moderate", "abundant", "very abundant"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Scoring Volatility
 * How much scores can vary from day to day (consistency)
 */
export function calculateScoringVolatility(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Handicap spread indicates hole difficulty variance
  const handicaps = course.holes.filter((h) => h.handicap > 0).map((h) => h.handicap)
  if (handicaps.length === course.holes.length) {
    const avgHandicap = handicaps.reduce((a, b) => a + b, 0) / handicaps.length
    const variance = handicaps.reduce((sum, h) => sum + Math.pow(h - avgHandicap, 2), 0) / handicaps.length
    const volatility = Math.sqrt(variance)
    const volatilityScore = Math.min(100, (volatility / 5) * 100) // 5+ std dev = very volatile
    score += volatilityScore
    dataPoints.push(`Handicap std dev: ${volatility.toFixed(1)} (hole difficulty variance)`)
  }

  // Yardage variance (long holes vs short holes)
  const avgYardage = course.holes.reduce((sum, h) => sum + h.yardage, 0) / course.holes.length
  const yardageVariance = course.holes.reduce((sum, h) => sum + Math.pow(h.yardage - avgYardage, 2), 0) / course.holes.length
  const yardageVolatility = Math.sqrt(yardageVariance)
  const yardageScore = Math.min(50, (yardageVolatility / 100) * 50) // 100+ yards std dev = volatile
  score = (score + yardageScore) / 2 // Blend the two measures
  dataPoints.push(`Yardage std dev: ${yardageVolatility.toFixed(0)} yards`)

  // Environmental factors add volatility
  if (course.characteristicFlags?.fastGreens || (course.address?.elevation && course.address.elevation > 3000)) {
    score = Math.min(100, score + 15)
    dataPoints.push("Fast greens or high elevation increase volatility")
  }

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 80,
    explanation: `Scoring volatility is ${["very consistent", "consistent", "moderate", "volatile", "very volatile"][stars - 1]}.`,
    dataPoints,
  }
}
