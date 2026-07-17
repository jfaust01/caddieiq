/**
 * Course matching algorithm.
 *
 * Compares SportsDataIO course data with GolfCourse API courses
 * and returns confidence scores for the best matches.
 */

interface CourseData {
  name?: string
  clubName?: string
  city?: string
  state?: string
  country?: string
}

interface MatchResult {
  courseId: number
  confidence: number
  matchedBy: string
}

/**
 * Normalize a string for comparison: lowercase, trim, remove extra spaces.
 */
function normalize(str?: string): string {
  if (!str) return ""
  return str.toLowerCase().trim().replace(/\s+/g, " ")
}

/**
 * Calculate similarity between two strings using a simple algorithm.
 * Returns 0-100 score.
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 100

  const minLen = Math.min(a.length, b.length)
  const maxLen = Math.max(a.length, b.length)

  // Count matching characters in order
  let matches = 0
  let ai = 0
  let bi = 0

  while (ai < a.length && bi < b.length) {
    if (a[ai] === b[bi]) {
      matches++
      ai++
      bi++
    } else {
      ai++
    }
  }

  // Score based on match ratio
  const matchRatio = matches / maxLen
  return Math.round(matchRatio * 100)
}

/**
 * Compare course name with various transformations.
 * Handles common patterns like removing "GC", "CC", etc.
 */
function matchCourseName(sportsdataioName: string, golfcourseapiName: string): number {
  const sdName = normalize(sportsdataioName)
  const gcName = normalize(golfcourseapiName)

  // Exact match
  if (sdName === gcName) return 100

  // One contains the other
  if (sdName.includes(gcName) || gcName.includes(sdName)) return 95

  // Try removing common suffixes
  const cleanSdName = sdName
    .replace(/\s*(golf\s*club|gc|country\s*club|cc)$/i, "")
    .trim()
  const cleanGcName = gcName
    .replace(/\s*(golf\s*club|gc|country\s*club|cc)$/i, "")
    .trim()

  if (cleanSdName === cleanGcName) return 92
  if (cleanSdName.includes(cleanGcName) || cleanGcName.includes(cleanSdName)) return 90

  // Similarity score
  return calculateStringSimilarity(sdName, gcName)
}

/**
 * Match location (city + state/country).
 * Returns 0-100 score.
 */
function matchLocation(sdCity?: string, sdState?: string, sdCountry?: string, gcCity?: string, gcState?: string, gcCountry?: string): number {
  let score = 0

  // Country match is most important
  if (sdCountry && gcCountry) {
    const sdCountryNorm = normalize(sdCountry)
    const gcCountryNorm = normalize(gcCountry)
    if (sdCountryNorm === gcCountryNorm) {
      score += 40
    } else if (sdCountryNorm.includes(gcCountryNorm) || gcCountryNorm.includes(sdCountryNorm)) {
      score += 20
    }
  }

  // State/Province match
  if (sdState && gcState) {
    const sdStateNorm = normalize(sdState)
    const gcStateNorm = normalize(gcState)
    if (sdStateNorm === gcStateNorm) {
      score += 35
    } else if (sdStateNorm.includes(gcStateNorm) || gcStateNorm.includes(sdStateNorm)) {
      score += 15
    }
  }

  // City match
  if (sdCity && gcCity) {
    const sdCityNorm = normalize(sdCity)
    const gcCityNorm = normalize(gcCity)
    if (sdCityNorm === gcCityNorm) {
      score += 25
    }
  }

  return Math.min(score, 100)
}

/**
 * Find the best matching GolfCourse API course for a SportsDataIO course.
 *
 * Compares course name, club name, and location to determine confidence.
 * Returns the best match with confidence score (0-100).
 */
export function findBestMatch(sdCourse: CourseData, gcCourses: Array<CourseData & { id: number }>): MatchResult | null {
  if (!gcCourses.length) return null

  const scores = gcCourses.map((gcCourse) => {
    let totalScore = 0
    let weights = 0

    // Course name: 60% weight (most important)
    const nameScore = matchCourseName(sdCourse.name || "", gcCourse.name || "")
    totalScore += nameScore * 0.6
    weights += 0.6

    // Location: 40% weight
    const locationScore = matchLocation(sdCourse.city, sdCourse.state, sdCourse.country, gcCourse.city, gcCourse.state, gcCourse.country)
    totalScore += locationScore * 0.4
    weights += 0.4

    const confidence = weights > 0 ? Math.round(totalScore / weights) : 0

    return {
      courseId: gcCourse.id,
      confidence,
      matchedBy: "auto-matched",
    }
  })

  // Find the best match
  const bestMatch = scores.reduce((best, current) => (current.confidence > best.confidence ? current : best))

  // Only return if confidence is reasonable (> 50)
  return bestMatch.confidence > 50 ? bestMatch : null
}

/**
 * Compare two GolfCourse API courses for similarity.
 * Used to detect if they're the same course under different names.
 */
export function compareCourses(course1: CourseData, course2: CourseData): number {
  let score = 0

  // Course name similarity
  const nameScore = matchCourseName(course1.name || "", course2.name || "")
  score += nameScore * 0.5

  // Location match
  const locationScore = matchLocation(course1.city, course1.state, course1.country, course2.city, course2.state, course2.country)
  score += locationScore * 0.5

  return Math.round(score)
}
