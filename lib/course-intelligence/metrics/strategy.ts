/**
 * Course Strategy Metrics
 * Calculates how different aspects of the game are emphasized at a course
 * Includes: driving, approach, short game, and putting importance
 */

import type { CourseData, MetricResult } from "./types"

/**
 * Calculate Driving Importance
 * How critical accurate driving is at this course
 */
export function calculateDrivingImportance(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Par 4 and 5 emphasis (driving holes)
  const par4And5 = course.holes.filter((h) => h.par >= 4).length
  const drivingPercentage = (par4And5 / course.holes.length) * 100
  const drivingScore = Math.min(100, (drivingPercentage / 75) * 100) // 75% = very high
  score += drivingScore * 0.4
  dataPoints.push(`${par4And5} Par 4/5 holes (${drivingPercentage.toFixed(0)}%)`)

  // Average hole length (longer = more driving focus)
  const avgLength = course.holes.reduce((sum, h) => sum + h.yardage, 0) / course.holes.length
  const lengthScore = Math.min(100, (avgLength / 420) * 100) // 420 yards = high
  score += lengthScore * 0.3
  dataPoints.push(`Average hole length: ${avgLength.toFixed(0)} yards`)

  // Fairway width (narrow = driving more critical)
  const fairwayDifficulty = course.characteristicFlags?.narrowFairways ? 20 : 0
  score += fairwayDifficulty * 0.2
  dataPoints.push(`Fairway width: ${course.characteristicFlags?.narrowFairways ? "Narrow" : "Normal"}`)

  // Par 5 reachability (unreachable = driving very important)
  const par5s = course.holes.filter((h) => h.par === 5)
  const unreachablePar5s = par5s.filter((h) => h.yardage > 540).length
  const reachabilityPenalty = (unreachablePar5s / Math.max(1, par5s.length)) * 20
  score += reachabilityPenalty * 0.1
  dataPoints.push(`Unreachable Par 5s: ${unreachablePar5s}/${par5s.length}`)

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 85,
    explanation: `Driving is ${["not emphasized", "minimally important", "moderately important", "very important", "critical"][stars - 1]} at this course.`,
    dataPoints,
  }
}

/**
 * Calculate Approach Shot Importance
 * How critical approach shot accuracy is (iron play)
 */
export function calculateApproachImportance(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Green sizes (small = approach more critical)
  const smallGreens = course.characteristicFlags?.smallGreens ? 30 : 0
  score += smallGreens
  dataPoints.push(`Green size: ${course.characteristicFlags?.smallGreens ? "Small" : "Normal/Large"}`)

  // Par 4 characteristics (difficulty of approach to Par 4)
  const par4s = course.holes.filter((h) => h.par === 4)
  const avgPar4Length = par4s.length > 0 ? par4s.reduce((sum, h) => sum + h.yardage, 0) / par4s.length : 0
  const par4Difficulty = Math.min(40, (avgPar4Length / 400) * 40) // 400 yards = moderate
  score += par4Difficulty
  dataPoints.push(`Average Par 4: ${avgPar4Length.toFixed(0)} yards`)

  // Hazards around greens (water/bunkers near greens = approach more critical)
  if (course.hazardCounts) {
    const hazardPressure = Math.min(20, ((course.hazardCounts.water || 0) + (course.hazardCounts.sand || 0)) / 5)
    score += hazardPressure
    dataPoints.push(`Hazards around greens: ${(course.hazardCounts.water || 0) + (course.hazardCounts.sand || 0)}`)
  }

  // Green difficulty (variance in yardage to different green sections)
  const handicapVariance = course.holes.filter((h) => h.handicap > 0).length === course.holes.length ? 20 : 10
  score += handicapVariance
  dataPoints.push(`Handicap variance indicates: ${handicapVariance === 20 ? "High" : "Moderate"} green difficulty`)

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 80,
    explanation: `Approach shots are ${["not emphasized", "minimally important", "moderately important", "very important", "critical"][stars - 1]} at this course.`,
    dataPoints,
  }
}

/**
 * Calculate Short Game Importance
 * How critical chipping, pitching, and recovery shots are
 */
export function calculateShortGameImportance(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Number of Par 3s (short game emphasis)
  const par3s = course.holes.filter((h) => h.par === 3)
  const par3Percentage = (par3s.length / course.holes.length) * 100
  const par3Score = Math.min(30, (par3Percentage / 30) * 30) // 30% Par 3s = high
  score += par3Score
  dataPoints.push(`${par3s.length} Par 3 holes (${par3Percentage.toFixed(0)}%)`)

  // Small greens favor short game
  if (course.characteristicFlags?.smallGreens) {
    score += 25
    dataPoints.push("Small greens favor short game precision")
  }

  // Bunkers around greens
  if (course.hazardCounts?.sand) {
    const bunkerScore = Math.min(25, (course.hazardCounts.sand / 8) * 25) // 8 bunkers = moderate
    score += bunkerScore
    dataPoints.push(`${course.hazardCounts.sand} bunkers (short game risk)`)
  }

  // Course routing (tight, winding holes favor short game)
  const par3And4Holes = course.holes.filter((h) => h.par <= 4).length
  const shortGameEmphasis = (par3And4Holes / course.holes.length) > 0.7 ? 15 : 5
  score += shortGameEmphasis
  dataPoints.push(`${par3And4Holes} Par 3/4 holes (${((par3And4Holes / course.holes.length) * 100).toFixed(0)}%)`)

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 80,
    explanation: `Short game is ${["not emphasized", "minimally important", "moderately important", "very important", "critical"][stars - 1]} at this course.`,
    dataPoints,
  }
}

/**
 * Calculate Putting Importance
 * How critical putting accuracy is to scoring
 */
export function calculatePuttingImportance(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 0

  // Large greens = putting more important
  if (course.characteristicFlags?.largeGreens) {
    score += 30
    dataPoints.push("Large greens require precise putting")
  } else {
    score += 15
    dataPoints.push("Standard green sizes")
  }

  // Fast greens = putting more important
  if (course.characteristicFlags?.fastGreens) {
    score += 25
    dataPoints.push("Fast greens increase putting importance")
  }

  // Par distribution (more Par 3s/4s = putting emphasis)
  const shortHoles = course.holes.filter((h) => h.par <= 3).length
  const shortHolePercentage = (shortHoles / course.holes.length) * 100
  const puttingScore = Math.min(20, (shortHolePercentage / 50) * 20) // 50% = high
  score += puttingScore
  dataPoints.push(`${shortHoles} Par 3 holes (${shortHolePercentage.toFixed(0)}%)`)

  // Hazards penalize misses (putting more critical to avoid penalty)
  if (course.hazardCounts?.water || course.hazardCounts?.sand) {
    const hazardCount = (course.hazardCounts?.water || 0) + (course.hazardCounts?.sand || 0)
    const hazardPenalty = Math.min(15, (hazardCount / 10) * 15)
    score += hazardPenalty
    dataPoints.push(`${hazardCount} hazards increase putting pressure`)
  }

  const finalScore = Math.round(Math.min(100, score))
  const stars = Math.ceil((finalScore / 100) * 5)

  return {
    score: finalScore,
    stars,
    confidence: 75,
    explanation: `Putting is ${["not emphasized", "minimally important", "moderately important", "very important", "critical"][stars - 1]} at this course.`,
    dataPoints,
  }
}
