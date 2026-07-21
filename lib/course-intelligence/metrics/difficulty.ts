import { CourseData, MetricResult } from "./types"

/**
 * Calculate Overall Course Difficulty
 * Considers par, yardage distribution, and variance
 */
export function calculateDifficulty(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []
  let totalScore = 0
  let factors = 0

  // 1. Par Distribution (higher par = harder)
  const avgPar = course.holes.reduce((sum, h) => sum + h.par, 0) / course.holes.length
  const parScore = Math.min(100, (avgPar / 5) * 100) // Par 5 = max difficulty
  totalScore += parScore
  factors++
  dataPoints.push(`Average Par: ${avgPar.toFixed(1)} (Score: ${parScore.toFixed(0)})`)

  // 2. Length Variance (more variance = harder)
  const avgYardage = course.holes.reduce((sum, h) => sum + h.yardage, 0) / course.holes.length
  const variance = course.holes.reduce((sum, h) => sum + Math.pow(h.yardage - avgYardage, 2), 0) / course.holes.length
  const stdDev = Math.sqrt(variance)
  const varianceScore = Math.min(100, (stdDev / 100) * 50) // Cap at 50% contribution
  totalScore += varianceScore
  factors++
  dataPoints.push(`Yardage Std Dev: ${stdDev.toFixed(0)} (Score: ${varianceScore.toFixed(0)})`)

  // 3. Longest Hole (harder if very long)
  const longestHole = Math.max(...course.holes.map((h) => h.yardage))
  const longestScore = Math.min(100, (longestHole / 700) * 100)
  totalScore += longestScore * 0.3 // 30% weight
  factors += 0.3
  dataPoints.push(`Longest Hole: ${longestHole} yards (Score: ${longestScore.toFixed(0)})`)

  // 4. Shortest Hole (easier if very short)
  const shortestHole = Math.min(...course.holes.map((h) => h.yardage))
  const shortestScore = Math.max(0, 100 - (shortestHole / 250) * 100)
  totalScore += shortestScore * 0.2 // 20% weight
  factors += 0.2
  dataPoints.push(`Shortest Hole: ${shortestHole} yards (Score: ${shortestScore.toFixed(0)})`)

  // 5. Overall Yardage (longer courses = harder)
  const totalYardage = course.holes.reduce((sum, h) => sum + h.yardage, 0)
  const yardageScore = Math.min(100, (totalYardage / 7000) * 100)
  totalScore += yardageScore * 0.2 // 20% weight
  factors += 0.2
  dataPoints.push(`Total Yardage: ${totalYardage} (Score: ${yardageScore.toFixed(0)})`)

  const score = Math.round(totalScore / factors)
  const stars = Math.ceil((score / 100) * 5)
  const confidence = Math.min(100, course.holes.length * 5) // Higher confidence with more holes

  return {
    score,
    stars,
    confidence,
    explanation: `Course difficulty is ${["very easy", "easy", "moderate", "hard", "very hard"][stars - 1]} based on par distribution, length variance, and overall yardage.`,
    dataPoints,
  }
}

/**
 * Calculate Scoring Difficulty
 * How much harder it is to score well compared to standard par
 */
export function calculateScoringDifficulty(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Use rating/slope from best tee for scoring difficulty
  const blueTee = course.tees.find((t) => t.teeName.toLowerCase().includes("blue"))
  const whiteTee = course.tees.find((t) => t.teeName.toLowerCase().includes("white"))
  const representativeTee = blueTee || whiteTee || course.tees[0]

  let score = 0

  if (representativeTee) {
    // Slope Rating is the primary indicator of scoring difficulty
    // Standard slope is 113, higher = harder to score
    score = Math.min(100, (representativeTee.slope / 150) * 100)
    dataPoints.push(`Slope Rating: ${representativeTee.slope} (from ${representativeTee.teeName})`)
    dataPoints.push(`Course Rating: ${representativeTee.rating.toFixed(1)}`)
  } else {
    // Fallback: use par difficulty
    const avgPar = course.holes.reduce((sum, h) => sum + h.par, 0) / course.holes.length
    score = Math.min(100, (avgPar / 5) * 80)
    dataPoints.push(`Fallback: Using average par ${avgPar.toFixed(1)}`)
  }

  const stars = Math.ceil((score / 100) * 5)
  const confidence = representativeTee ? 95 : 60

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Scoring difficulty is ${["very low", "low", "moderate", "high", "very high"][stars - 1]} (${representativeTee?.slope || "unknown"} slope rating).`,
    dataPoints,
  }
}

/**
 * Calculate Bogey Risk
 * Likelihood of scoring a bogey or worse on average hole
 */
export function calculateBogeyRisk(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Bogey score = par + 1
  // Analyze hole handicaps to estimate bogey difficulty
  const handicapStats = {
    easy: course.holes.filter((h) => h.handicap <= 6).length, // HCP 1-6 easiest
    medium: course.holes.filter((h) => h.handicap > 6 && h.handicap <= 12).length,
    hard: course.holes.filter((h) => h.handicap > 12).length,
  }

  // More hard holes = higher bogey risk
  const hardHolePercentage = (handicapStats.hard / course.holes.length) * 100
  const score = Math.min(100, hardHolePercentage * 1.5)
  const stars = Math.ceil((score / 100) * 5)

  dataPoints.push(`Easy holes (HCP 1-6): ${handicapStats.easy}`)
  dataPoints.push(`Medium holes (HCP 7-12): ${handicapStats.medium}`)
  dataPoints.push(`Hard holes (HCP 13-18): ${handicapStats.hard}`)

  return {
    score: Math.round(score),
    stars,
    confidence: 85,
    explanation: `${hardHolePercentage.toFixed(0)}% of holes are in the hardest handicap tiers, indicating ${["low", "low-medium", "medium", "high", "very high"][stars - 1]} bogey risk.`,
    dataPoints,
  }
}

/**
 * Calculate Variance (how inconsistent is the course difficulty hole-to-hole)
 */
export function calculateVariance(course: CourseData): MetricResult {
  if (course.holes.length < 2) {
    return { score: 0, stars: 0, confidence: 0, explanation: "Insufficient hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Calculate variance in par distribution
  const pars = course.holes.map((h) => h.par)
  const avgPar = pars.reduce((a, b) => a + b) / pars.length
  const parVariance = pars.reduce((sum, p) => sum + Math.pow(p - avgPar, 2), 0) / pars.length
  const parStdDev = Math.sqrt(parVariance)

  // Calculate variance in handicap distribution
  const handicaps = course.holes.map((h) => h.handicap)
  const avgHcp = handicaps.reduce((a, b) => a + b) / handicaps.length
  const hcpVariance = handicaps.reduce((sum, h) => sum + Math.pow(h - avgHcp, 2), 0) / handicaps.length
  const hcpStdDev = Math.sqrt(hcpVariance)

  // Higher variance = harder to adjust strategy
  const varianceScore = Math.min(100, (parStdDev + hcpStdDev * 2) * 20)
  const stars = Math.ceil((varianceScore / 100) * 5)

  dataPoints.push(`Par Std Dev: ${parStdDev.toFixed(2)}`)
  dataPoints.push(`Handicap Std Dev: ${hcpStdDev.toFixed(2)}`)
  dataPoints.push(`Par Distribution: ${Math.min(...pars)}-${Math.max(...pars)}`)

  return {
    score: Math.round(varianceScore),
    stars,
    confidence: 90,
    explanation: `Course has ${stars > 3 ? "high" : stars > 2 ? "moderate" : "low"} difficulty variance, ${stars > 3 ? "requiring" : "not requiring"} significant strategy adjustments.`,
    dataPoints,
  }
}
