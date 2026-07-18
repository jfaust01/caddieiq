/**
 * Tournament Mapping Confidence Scoring Service
 * 
 * Assigns confidence scores (0-100) to tournament-course mappings based on
 * multiple signals (name similarity, geographic match, API data consistency).
 * 
 * High confidence (≥95%) mappings are automatically verified without manual review.
 * Lower confidence mappings are queued for admin review.
 */

import type { TournamentCourseMapping } from "@/lib/generated/prisma/client"

// Levenshtein distance for string similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[b.length][a.length]
}

// Normalize string for comparison (lowercase, trim whitespace)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
}

// Calculate string similarity as percentage (0-100)
function calculateStringSimilarity(a: string, b: string): number {
  const normA = normalizeString(a)
  const normB = normalizeString(b)

  if (normA === normB) return 100

  const distance = levenshteinDistance(normA, normB)
  const maxLength = Math.max(normA.length, normB.length)

  if (maxLength === 0) return 100

  return Math.max(0, 100 - (distance / maxLength) * 100)
}

export interface ConfidenceScoreResult {
  score: number // 0-100
  reasons: string[]
  shouldAutoVerify: boolean // true if score >= 95
}

/**
 * Calculate confidence score for a tournament-course mapping.
 * 
 * Signals evaluated:
 * - Exact course name match (high confidence)
 * - Close string similarity (Levenshtein distance)
 * - Matching identifiers (SportsDataIO vs GolfCourseAPI)
 * - Previous successful imports (if available)
 */
export function calculateConfidenceScore(mapping: {
  tournamentCourseName?: string | null
  golfCourseCourseName?: string | null
  sportsDataIoCourseId?: string | null
  golfCourseApiCourseId?: number | null
  matchedBy?: string | null
}): ConfidenceScoreResult {
  const reasons: string[] = []
  let score = 0

  // Signal 1: Exact name match (40 points)
  if (
    mapping.tournamentCourseName &&
    mapping.golfCourseCourseName &&
    mapping.tournamentCourseName.toLowerCase() === mapping.golfCourseCourseName.toLowerCase()
  ) {
    score += 40
    reasons.push("Exact course name match")
  } else if (mapping.tournamentCourseName && mapping.golfCourseCourseName) {
    // Partial name similarity (0-40 points based on Levenshtein)
    const similarity = calculateStringSimilarity(
      mapping.tournamentCourseName,
      mapping.golfCourseCourseName
    )
    const partialPoints = Math.round((similarity / 100) * 40)
    if (partialPoints > 0) {
      score += partialPoints
      reasons.push(`Course name similarity: ${Math.round(similarity)}%`)
    }
  }

  // Signal 2: ID matching (20 points)
  if (mapping.sportsDataIoCourseId && mapping.golfCourseApiCourseId) {
    score += 20
    reasons.push("Both SportsDataIO and GolfCourseAPI IDs present")
  }

  // Signal 3: Match method (15 points)
  if (mapping.matchedBy === "auto-matched") {
    score += 15
    reasons.push("Auto-matched via search algorithm")
  } else if (mapping.matchedBy === "manual") {
    score += 10
    reasons.push("Manually verified match")
  }

  // Signal 4: Bonus for high-quality data (25 points)
  // If course names are both well-populated, add consistency bonus
  if (
    mapping.tournamentCourseName &&
    mapping.tournamentCourseName.length > 3 &&
    mapping.golfCourseCourseName &&
    mapping.golfCourseCourseName.length > 3
  ) {
    score += 25
    reasons.push("Both names well-populated (high data quality)")
  }

  // Cap at 100
  score = Math.min(100, score)

  // Determine if auto-verify (confidence >= 95%)
  const shouldAutoVerify = score >= 95

  if (shouldAutoVerify) {
    reasons.push("AUTO-VERIFIED: High confidence match (≥95%)")
  }

  return {
    score,
    reasons,
    shouldAutoVerify,
  }
}

/**
 * Format confidence score reasons into a single string
 */
export function formatConfidenceReasons(reasons: string[]): string {
  return reasons.join(" • ")
}
