import { CourseData, MetricResult } from "./types"

/**
 * Calculate Elevation Impact
 * How much elevation changes affect play
 */
export function calculateElevationImpact(course: CourseData): MetricResult {
  const dataPoints: string[] = []

  // Elevation is hard to assess from GolfCourseAPI data
  // We estimate based on course location and geography
  let score = 50
  let confidence = 30

  if (course.address?.elevation !== undefined && course.address.elevation !== null) {
    // Higher elevation = thinner air = longer drives but less predictable
    if (course.address.elevation > 6000) {
      score = 75
      dataPoints.push(`High elevation (${course.address.elevation} ft): Thin air affects all shots`)
      confidence = 85
    } else if (course.address.elevation > 3000) {
      score = 55
      dataPoints.push(`Moderate elevation (${course.address.elevation} ft): Some elevation effects`)
      confidence = 75
    } else if (course.address.elevation < 100) {
      score = 35
      dataPoints.push(`Sea level (${course.address.elevation} ft): Standard atmospheric conditions`)
      confidence = 80
    }
  } else {
    // Estimate based on state/country
    if (course.address?.state) {
      const highElevationStates = ["CO", "UT", "WY", "NM", "AZ"]
      if (highElevationStates.includes(course.address.state)) {
        score = 70
        dataPoints.push(`Located in high elevation state (${course.address.state}): Likely elevation effects`)
        confidence = 45
      }
    }
  }

  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Elevation impact is ${["negligible", "low", "moderate", "significant", "very significant"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Weather/Climate Factor
 * How much weather typically affects play at this location
 */
export function calculateWeatherFactor(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 50
  let confidence = 40

  if (course.address?.state || course.address?.country) {
    // Courses in windy areas or extreme weather zones score higher
    const windyRegions = ["HI", "TX", "OK", "CO", "WY", "CA"]
    const extremeWeatherStates = ["FL", "TX", "OK", "HI"]

    if (windyRegions.includes(course.address?.state || "")) {
      score += 20
      dataPoints.push(`Located in typically windy region (${course.address?.state})`)
      confidence = 55
    }

    if (extremeWeatherStates.includes(course.address?.state || "")) {
      score += 15
      dataPoints.push(`Subject to extreme weather conditions`)
      confidence = 50
    }

    // Latitude affects seasonal play and weather variability
    if (course.coordinates) {
      if (Math.abs(course.coordinates.latitude) > 45) {
        score += 10
        dataPoints.push(`Northern latitude (${course.coordinates.latitude}°): Longer seasons, weather variability`)
        confidence = 60
      } else if (Math.abs(course.coordinates.latitude) < 25) {
        score += 5
        dataPoints.push(`Tropical latitude (${course.coordinates.latitude}°): Consistent warm weather`)
        confidence = 60
      }
    }
  }

  score = Math.min(100, score)
  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Weather/climate impact is ${["minimal", "low", "moderate", "significant", "extreme"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Playability
 * Overall ease of play (course management, walkability, condition consistency)
 */
export function calculatePlayability(course: CourseData): MetricResult {
  const dataPoints: string[] = []

  // Playability factors:
  // 1. Hole count (18-hole courses easier to manage than 9/27)
  // 2. Par consistency (easier if similar pars)
  // 3. Yardage progression (easier if consistent progression)

  let score = 50

  // Par 3s are generally easier to play than par 4s/5s
  const par3Pct = (course.holes.filter((h) => h.par === 3).length / course.holes.length) * 100
  if (par3Pct > 25) {
    score -= 10
    dataPoints.push(`${par3Pct.toFixed(0)}% par 3s - more pace-of-play concerns`)
  }

  // Consistency in par distribution
  const parDistribution = [
    course.holes.filter((h) => h.par === 3).length,
    course.holes.filter((h) => h.par === 4).length,
    course.holes.filter((h) => h.par === 5).length,
  ]
  const parVariance = Math.max(...parDistribution) - Math.min(...parDistribution)
  if (parVariance > 10) {
    score += 15
    dataPoints.push("Uneven par distribution - varied play experience")
  } else {
    score -= 5
    dataPoints.push("Balanced par distribution - consistent play experience")
  }

  // Front/back 9 consistency
  const front9Pars = course.holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)
  const back9Pars = course.holes.slice(9).reduce((sum, h) => sum + h.par, 0)
  if (Math.abs(front9Pars - back9Pars) > 3) {
    score -= 10
    dataPoints.push("Uneven nines - front/back imbalance")
  } else {
    score += 10
    dataPoints.push("Balanced nines - good round management")
  }

  score = Math.max(0, Math.min(100, score))
  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence: 85,
    explanation: `Overall playability is ${["poor", "fair", "good", "very good", "excellent"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Uniqueness/Character
 * How distinctive or memorable is this course
 */
export function calculateUniqueness(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  let score = 50

  // Factors that make courses unique:
  // 1. Extreme hole characteristics
  // 2. Unusual par distribution
  // 3. High variance in design
  // 4. Specialty holes (island greens, elevated, etc.)

  const holes = course.holes
  const yardages = holes.map((h) => h.yardage)
  const pars = holes.map((h) => h.par)

  // Find extreme holes
  const longestHole = Math.max(...yardages)
  const shortestHole = Math.min(...yardages)
  const holeRange = longestHole - shortestHole

  if (holeRange > 400) {
    score += 20
    dataPoints.push(`Wide yardage range (${shortestHole}-${longestHole} yds) - unique design variety`)
  }

  // Par distribution uniqueness
  const par3Count = holes.filter((h) => h.par === 3).length
  const par5Count = holes.filter((h) => h.par === 5).length

  if (par3Count > 5 || par5Count > 3) {
    score += 15
    dataPoints.push(`Unusual par distribution (${par3Count} par 3s, ${par5Count} par 5s)`)
  }

  // Handicap distribution shows design character
  const handicaps = holes.map((h) => h.handicap)
  const avgHcp = handicaps.reduce((a, b) => a + b) / handicaps.length
  const hcpVariance = handicaps.reduce((sum, h) => sum + Math.pow(h - avgHcp, 2), 0) / handicaps.length
  const hcpStdDev = Math.sqrt(hcpVariance)

  if (hcpStdDev > 4) {
    score += 10
    dataPoints.push(`High difficulty variance (StdDev: ${hcpStdDev.toFixed(1)}) - distinctive layout`)
  }

  score = Math.min(100, score)
  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence: 75,
    explanation: `Course uniqueness is ${["generic", "fairly typical", "somewhat unique", "quite unique", "very distinctive"][stars - 1]}.`,
    dataPoints,
  }
}
