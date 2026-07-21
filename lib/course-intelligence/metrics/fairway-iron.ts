import { CourseData, MetricResult } from "./types"

/**
 * Calculate Fairway Width Difficulty
 * Estimated from course design patterns and hole characteristics
 */
export function calculateFairwayWidth(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Estimate fairway width based on par and handicap patterns
  const par4Holes = course.holes.filter((h) => h.par === 4)
  const par3Holes = course.holes.filter((h) => h.par === 3)
  const par5Holes = course.holes.filter((h) => h.par === 5)

  let score = 50 // Default middle ground

  if (par4Holes.length > 0) {
    // Par 4 holes indicate fairway difficulty
    // Longer par 4s typically have narrower fairways for difficulty balance
    const avgPar4Yards = par4Holes.reduce((sum, h) => sum + h.yardage, 0) / par4Holes.length
    // Above 420 yards likely has narrow fairway
    if (avgPar4Yards > 420) {
      score += 30
      dataPoints.push(`Long par 4s (avg ${avgPar4Yards.toFixed(0)} yds) suggest narrow fairways`)
    } else {
      score -= 10
      dataPoints.push(`Short par 4s (avg ${avgPar4Yards.toFixed(0)} yds) suggest wider fairways`)
    }
  }

  if (par5Holes.length > 0) {
    const avgPar5Yards = par5Holes.reduce((sum, h) => sum + h.yardage, 0) / par5Holes.length
    if (avgPar5Yards > 550) {
      score += 20
      dataPoints.push(`Very long par 5s (avg ${avgPar5Yards.toFixed(0)} yds) suggest challenging accuracy`)
    }
  }

  // Check handicap distribution on driving holes (par 4s and par 5s)
  const drivingHoles = course.holes.filter((h) => h.par >= 4)
  if (drivingHoles.length > 0) {
    const avgHandicap = drivingHoles.reduce((sum, h) => sum + h.handicap, 0) / drivingHoles.length
    if (avgHandicap < 9) {
      score += 15
      dataPoints.push(`Driving holes are rated difficult (avg HCP ${avgHandicap.toFixed(1)}), suggesting tight fairways`)
    }
  }

  score = Math.max(0, Math.min(100, score))
  const stars = Math.ceil((score / 100) * 5)
  const confidence = 70 // Estimated from hole data, not actual measurements

  return {
    score,
    stars,
    confidence,
    explanation: `Fairway width is estimated as ${["very wide", "wide", "moderate", "narrow", "very narrow"][stars - 1]} based on hole length and handicap distribution.`,
    dataPoints,
  }
}

/**
 * Calculate Iron Difficulty
 * How challenging it is to hit approach shots accurately
 */
export function calculateIronDifficulty(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Iron difficulty is related to:
  // 1. Hole variety (different distances = different clubs needed)
  // 2. Par distribution (par 3s and par 4s require precise irons)
  // 3. Handicap ratings on approach holes

  const yardages = course.holes.map((h) => h.yardage)
  const avgYardage = yardages.reduce((a, b) => a + b) / yardages.length

  // Estimate approach distance (approx 1/3 to 1/2 of total for par 4/5)
  const shortApproachHoles = course.holes.filter((h) => h.par === 3 || h.yardage < 380)
  const mediumApproachHoles = course.holes.filter((h) => h.par === 4 && h.yardage >= 380 && h.yardage < 440)
  const longApproachHoles = course.holes.filter((h) => h.par === 4 && h.yardage >= 440) || course.holes.filter((h) => h.par === 5)

  // More variety = harder
  const varietyScore =
    Math.abs(shortApproachHoles.length - mediumApproachHoles.length) +
    Math.abs(mediumApproachHoles.length - longApproachHoles.length)
  const varietyFactor = Math.min(100, varietyScore * 5)

  // Par 3s are typically hardest iron shots
  const par3Count = course.holes.filter((h) => h.par === 3).length
  const par3Factor = (par3Count / course.holes.length) * 40

  // Average handicap for par 3s
  const par3Holes = course.holes.filter((h) => h.par === 3)
  const par3AvgHcp = par3Holes.length > 0 ? par3Holes.reduce((sum, h) => sum + h.handicap, 0) / par3Holes.length : 9

  let score = varietyFactor * 0.3 + par3Factor * 0.4 + Math.min(100, (par3AvgHcp / 18) * 100) * 0.3

  score = Math.round(Math.min(100, score))
  const stars = Math.ceil((score / 100) * 5)

  dataPoints.push(`Short approach holes: ${shortApproachHoles.length}`)
  dataPoints.push(`Medium approach holes: ${mediumApproachHoles.length}`)
  dataPoints.push(`Long approach holes: ${longApproachHoles.length}`)
  dataPoints.push(`Par 3 average handicap: ${par3AvgHcp.toFixed(1)}`)

  return {
    score,
    stars,
    confidence: 75,
    explanation: `Iron difficulty is ${["minimal", "low", "moderate", "high", "very high"][stars - 1]} with ${par3Count} par 3s requiring precise shot-making.`,
    dataPoints,
  }
}

/**
 * Calculate Putting Difficulty
 * Estimated from green complexity patterns
 */
export function calculatePuttingDifficulty(course: CourseData): MetricResult {
  if (course.holes.length === 0) {
    return { score: 0, stars: 0, confidence: 0, explanation: "No hole data", dataPoints: [] }
  }

  const dataPoints: string[] = []

  // Putting difficulty correlates with:
  // 1. Number of par 3s and par 4s (more greens to hit)
  // 2. Course overall difficulty (harder courses often have undulating greens)
  // 3. Spread of handicap values (more spread = more green complexity)

  const putterHoles = course.holes.filter((h) => h.par <= 4)
  const putterCount = putterHoles.length

  // Handicap variance on putter holes indicates green complexity
  if (putterHoles.length > 0) {
    const handicaps = putterHoles.map((h) => h.handicap)
    const avgHcp = handicaps.reduce((a, b) => a + b) / handicaps.length
    const variance = handicaps.reduce((sum, h) => sum + Math.pow(h - avgHcp, 2), 0) / handicaps.length
    const stdDev = Math.sqrt(variance)

    // Higher variance = more complex green layouts
    const greenComplexity = Math.min(100, stdDev * 10)

    // Par 3s are also putting-centric
    const par3Count = course.holes.filter((h) => h.par === 3).length
    const par3Factor = (par3Count / course.holes.length) * 30

    const score = greenComplexity * 0.6 + par3Factor * 0.4
    const stars = Math.ceil((score / 100) * 5)

    dataPoints.push(`Putter holes: ${putterCount}`)
    dataPoints.push(`Handicap std dev on putter holes: ${stdDev.toFixed(2)}`)
    dataPoints.push(`Par 3 count: ${par3Count}`)

    return {
      score: Math.round(score),
      stars,
      confidence: 80,
      explanation: `Putting difficulty is ${["very easy", "easy", "moderate", "hard", "very hard"][stars - 1]} based on green complexity variance.`,
      dataPoints,
    }
  }

  return {
    score: 50,
    stars: 3,
    confidence: 40,
    explanation: "Insufficient putter hole data for putting difficulty assessment.",
    dataPoints,
  }
}
