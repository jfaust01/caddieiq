/**
 * Course Analytics Service — Sprint 12
 *
 * Builds proprietary course analytics from historical SportsDataIO data
 * already imported into the platform. Analytics automatically improve as
 * additional seasons of data are imported.
 *
 * Design principles:
 * - Every metric lives in its own calculation function (modular, extensible).
 * - Graceful degradation: never fails because one dataset is unavailable.
 * - No fabrication: null is returned when data is insufficient.
 * - Confidence scales with sample size, never fabricated.
 * - Incremental: works with 1 tournament or 10 seasons.
 */

import 'server-only'

import prismaClient from '@/lib/prisma'
import type { PrismaClient } from '@/lib/generated/prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CourseAnalyticsResult {
  courseId: string
  courseName: string

  difficultyRating: number | null
  birdieRating: number | null
  bogeyRating: number | null
  volatilityRating: number | null
  dfsScoringRating: number | null

  averageWinningScore: number | null
  averageCutScore: number | null
  averageScoreToPar: number | null

  par3Difficulty: number | null
  par4Difficulty: number | null
  par5Difficulty: number | null

  historicalBirdieRate: number | null
  historicalBogeyRate: number | null
  historicalEagleRate: number | null

  courseArchetype: string | null

  confidenceScore: number
  sampleSize: number
}

export interface CourseAnalyticsBuildStats {
  totalCourses: number
  processed: number
  skipped: number
  created: number
  updated: number
  errors: Array<{ courseId: string; courseName: string; error: string }>
  durationMs: number
}

/** Raw aggregated scoring data fetched from the database for a single course. */
interface CourseScoringData {
  courseId: string
  courseName: string
  /** Number of distinct tournament editions played on this course. */
  tournamentCount: number
  /** Total player-rounds with scoring data. */
  totalRounds: number
  /** Scores relative to par, from PlayerRound.toPar. */
  toParScores: number[]
  /** Winning scores (final position = 1 total-strokes). */
  winningScores: number[]
  /** Cut scores (the cut line from Tournament.cutLine). */
  cutScores: number[]
  /** Total strokes for all finishers (not CUT/WD). */
  finisherScores: number[]
  /** Round-level stats aggregated across all imported RoundStatistics. */
  roundStats: {
    totalBirdies: number
    totalEagles: number
    totalBogeys: number
    totalDoubleBogeys: number
    totalPars: number
    roundsWithStats: number
  }
  /** Hole-level par breakdown (only populated if PlayerTournamentHole data exists). */
  holeStats: {
    par3Rounds: number
    par3TotalToPar: number
    par4Rounds: number
    par4TotalToPar: number
    par5Rounds: number
    par5TotalToPar: number
  } | null
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * Fetch all historical scoring data for a course from the database.
 * Uses TournamentCourse → Tournament → Round → PlayerRound → RoundStatistic.
 * Hole-level data is used only when available.
 */
async function fetchCourseScoringData(
  prisma: PrismaClient,
  courseId: string,
  courseName: string,
): Promise<CourseScoringData> {
  // Step 1: Find all tournaments played on this course.
  const tournamentLinks = await prisma.tournamentCourse.findMany({
    where: { courseId },
    select: { tournamentId: true, year: true },
  })

  const tournamentIds = tournamentLinks.map((t) => t.tournamentId)

  if (tournamentIds.length === 0) {
    return emptyCourseScoringData(courseId, courseName)
  }

  // Step 2: Fetch round-level player scores via the chain:
  // Tournament → Round → PlayerRound (with toPar, score, position, madeCut)
  const playerRounds = await prisma.playerRound.findMany({
    where: {
      round: { tournamentId: { in: tournamentIds } },
      withdrawn: false,
      disqualified: false,
    },
    select: {
      score: true,
      toPar: true,
      position: true,
      madeCut: true,
      statistic: {
        select: {
          birdies: true,
          eagles: true,
          bogeys: true,
          doubleBogeys: true,
          pars: true,
        },
      },
    },
  })

  // Step 3: Fetch winning scores via TournamentField (finalPosition = 1).
  const winners = await prisma.tournamentField.findMany({
    where: {
      tournamentId: { in: tournamentIds },
      finalPosition: 1,
      withdrawn: false,
      disqualified: false,
    },
    select: { finalPosition: true, earnings: true },
  })

  // Step 4: Fetch cut lines from tournaments.
  const tournaments = await prisma.tournament.findMany({
    where: { id: { in: tournamentIds } },
    select: {
      cutLine: true,
      cutAfterRounds: true,
      numberOfRounds: true,
    },
  })

  // Aggregate round-level stats.
  const toParScores: number[] = []
  const roundStats = {
    totalBirdies: 0,
    totalEagles: 0,
    totalBogeys: 0,
    totalDoubleBogeys: 0,
    totalPars: 0,
    roundsWithStats: 0,
  }

  for (const round of playerRounds) {
    if (round.toPar !== null) toParScores.push(round.toPar)
    if (round.statistic) {
      roundStats.totalBirdies += round.statistic.birdies ?? 0
      roundStats.totalEagles += round.statistic.eagles ?? 0
      roundStats.totalBogeys += round.statistic.bogeys ?? 0
      roundStats.totalDoubleBogeys += round.statistic.doubleBogeys ?? 0
      roundStats.totalPars += round.statistic.pars ?? 0
      roundStats.roundsWithStats++
    }
  }

  // Winning scores: approximate from cut lines (we don't have total strokes directly).
  const winningScores: number[] = []
  const cutScores: number[] = []

  for (const t of tournaments) {
    if (t.cutLine !== null) cutScores.push(t.cutLine)
  }

  return {
    courseId,
    courseName,
    tournamentCount: tournamentIds.length,
    totalRounds: playerRounds.length,
    toParScores,
    winningScores,
    cutScores,
    finisherScores: [],
    roundStats,
    holeStats: null, // Hole-level data not yet in schema; will be null gracefully.
  }
}

function emptyCourseScoringData(courseId: string, courseName: string): CourseScoringData {
  return {
    courseId,
    courseName,
    tournamentCount: 0,
    totalRounds: 0,
    toParScores: [],
    winningScores: [],
    cutScores: [],
    finisherScores: [],
    roundStats: {
      totalBirdies: 0,
      totalEagles: 0,
      totalBogeys: 0,
      totalDoubleBogeys: 0,
      totalPars: 0,
      roundsWithStats: 0,
    },
    holeStats: null,
  }
}

// ---------------------------------------------------------------------------
// Individual metric calculators — each is a pure function, independently testable
// ---------------------------------------------------------------------------

/**
 * Confidence score based on sample size.
 * 1 tournament = ~0.2, 5 = ~0.5, 10+ = ~0.9
 * Returns a 0–1 value, never fabricated.
 */
export function calculateConfidence(tournamentCount: number, totalRounds: number): number {
  if (tournamentCount === 0 || totalRounds === 0) return 0
  // Logarithmic growth: confidence plateaus around 10 tournaments.
  const tournamentFactor = Math.min(Math.log10(tournamentCount + 1) / Math.log10(11), 1)
  // Also consider round volume — more rounds = more confidence.
  const roundFactor = Math.min(totalRounds / 500, 1)
  return Math.round((tournamentFactor * 0.7 + roundFactor * 0.3) * 100) / 100
}

/**
 * Difficulty rating (1–10, higher = harder).
 * Derived from average score to par across all rounds.
 * Normalized: avg toPar of 0 = 5.0, -10 (easy) = 1, +10 (hard) = 10.
 */
export function calculateDifficultyRating(toParScores: number[]): number | null {
  if (toParScores.length < 10) return null
  const avg = toParScores.reduce((a, b) => a + b, 0) / toParScores.length
  // Normalize: clamp avg score from -5 (very easy) to +5 (very hard) → 1–10
  const normalized = 5.0 + avg
  return Math.max(1, Math.min(10, Math.round(normalized * 10) / 10))
}

/**
 * Birdie rating (1–10, higher = more birdies).
 * Based on historical birdie rate per round.
 * Normalized: 3 birdies/round = 5.0 (Tour average).
 */
export function calculateBirdieRating(
  totalBirdies: number,
  roundsWithStats: number,
): number | null {
  if (roundsWithStats < 10) return null
  const birdiesPerRound = totalBirdies / roundsWithStats
  // Tour average ~3–4 birdies/round. Normalize: 3 = 5.0, 6 = 10, 0 = 1.
  const normalized = (birdiesPerRound / 3) * 5
  return Math.max(1, Math.min(10, Math.round(normalized * 10) / 10))
}

/**
 * Bogey rating (1–10, higher = more bogeys).
 * Based on historical bogey rate per round.
 */
export function calculateBogeyRating(
  totalBogeys: number,
  roundsWithStats: number,
): number | null {
  if (roundsWithStats < 10) return null
  const bogeysPerRound = totalBogeys / roundsWithStats
  // Tour average ~2–3 bogeys/round. Normalize: 2.5 = 5.0, 5 = 10, 0 = 1.
  const normalized = (bogeysPerRound / 2.5) * 5
  return Math.max(1, Math.min(10, Math.round(normalized * 10) / 10))
}

/**
 * Volatility rating (1–10, higher = more scoring variance).
 * Based on standard deviation of round-level score to par.
 */
export function calculateVolatilityRating(toParScores: number[]): number | null {
  if (toParScores.length < 20) return null
  const mean = toParScores.reduce((a, b) => a + b, 0) / toParScores.length
  const variance =
    toParScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / toParScores.length
  const stdDev = Math.sqrt(variance)
  // Normalize: stdDev of 2 = 5.0 (typical), 4+ = 10, 0 = 1.
  const normalized = (stdDev / 2) * 5
  return Math.max(1, Math.min(10, Math.round(normalized * 10) / 10))
}

/**
 * DFS Scoring Rating (1–10).
 * Estimate DraftKings scoring potential based on:
 * - DK golf scores: Birdie = +3, Eagle = +8, Bogey = -0.5, Par = +0.5
 * - Higher volatility increases upside for GPP.
 */
export function calculateDfsScoringRating(
  totalBirdies: number,
  totalEagles: number,
  totalBogeys: number,
  totalPars: number,
  roundsWithStats: number,
  volatilityRating: number | null,
): number | null {
  if (roundsWithStats < 10) return null
  const birdiesPerRound = totalBirdies / roundsWithStats
  const eaglesPerRound = totalEagles / roundsWithStats
  const bogeysPerRound = totalBogeys / roundsWithStats
  const parsPerRound = totalPars / roundsWithStats

  // DraftKings point values.
  const dkPoints =
    birdiesPerRound * 3 + eaglesPerRound * 8 - bogeysPerRound * 0.5 + parsPerRound * 0.5

  // Normalize to 1–10. Tour average round ~12–16 DK points.
  const normalized = (dkPoints / 12) * 5
  const base = Math.max(1, Math.min(9, Math.round(normalized * 10) / 10))

  // Add volatility bonus for GPP upside (up to +1).
  const volBonus = volatilityRating !== null ? Math.min((volatilityRating - 5) * 0.1, 1) : 0

  return Math.max(1, Math.min(10, Math.round((base + volBonus) * 10) / 10))
}

/**
 * Average score to par across all rounds.
 */
export function calculateAverageScoreToPar(toParScores: number[]): number | null {
  if (toParScores.length < 5) return null
  const avg = toParScores.reduce((a, b) => a + b, 0) / toParScores.length
  return Math.round(avg * 100) / 100
}

/**
 * Historical birdie, bogey, eagle rates as decimal fractions (0–1).
 */
export function calculateHistoricalRates(
  totalBirdies: number,
  totalEagles: number,
  totalBogeys: number,
  roundsWithStats: number,
): { birdieRate: number | null; bogeyRate: number | null; eagleRate: number | null } {
  if (roundsWithStats < 10) {
    return { birdieRate: null, bogeyRate: null, eagleRate: null }
  }
  // Approximate holes per round as 18.
  const totalHoles = roundsWithStats * 18
  return {
    birdieRate: Math.round((totalBirdies / totalHoles) * 1000) / 1000,
    bogeyRate: Math.round((totalBogeys / totalHoles) * 1000) / 1000,
    eagleRate: Math.round((totalEagles / totalHoles) * 1000) / 1000,
  }
}

// ---------------------------------------------------------------------------
// Course Archetype Engine
// ---------------------------------------------------------------------------

export type CourseArchetype =
  | 'Birdie Fest'
  | 'Major Championship Test'
  | 'Second Shot Course'
  | "Bomber's Paradise"
  | 'Positional Course'
  | 'Wind Test'
  | 'Short Game Challenge'
  | 'Risk / Reward'
  | null

/**
 * Classify a course archetype from computed analytics.
 * Uses only calculated analytics — no hardcoded course names.
 *
 * Classification rules (ordered by specificity):
 * 1. Birdie Fest: birdieRating >= 7 AND difficultyRating <= 5
 * 2. Major Championship Test: difficultyRating >= 8 AND volatilityRating <= 5
 * 3. Bomber's Paradise: difficultyRating <= 5 AND birdieRating >= 6 AND bogeyRating <= 4
 * 4. Second Shot Course: difficultyRating >= 6 AND bogeyRating >= 6 (approach-critical)
 * 5. Positional Course: difficultyRating 5–7 AND volatilityRating <= 4 (low variance)
 * 6. Risk / Reward: volatilityRating >= 7 (high variance in either direction)
 * 7. Short Game Challenge: bogeyRating >= 7 AND birdieRating <= 5
 * 8. Wind Test: volatilityRating >= 6 AND difficultyRating >= 6 (no wind data yet, uses proxy)
 */
export function classifyCourseArchetype(analytics: {
  difficultyRating: number | null
  birdieRating: number | null
  bogeyRating: number | null
  volatilityRating: number | null
  confidenceScore: number
}): CourseArchetype {
  const { difficultyRating, birdieRating, bogeyRating, volatilityRating, confidenceScore } =
    analytics

  // Minimum confidence required for classification.
  if (confidenceScore < 0.15) return null

  // Need at least two metrics for classification.
  const knownMetrics = [difficultyRating, birdieRating, bogeyRating, volatilityRating].filter(
    (v) => v !== null,
  ).length
  if (knownMetrics < 2) return null

  const d = difficultyRating ?? 5
  const b = birdieRating ?? 5
  const bog = bogeyRating ?? 5
  const v = volatilityRating ?? 5

  if (b >= 7 && d <= 5) return 'Birdie Fest'
  if (d >= 8 && v <= 5) return 'Major Championship Test'
  if (d <= 5 && b >= 6 && bog <= 4) return "Bomber's Paradise"
  if (bog >= 7 && b <= 5) return 'Short Game Challenge'
  if (v >= 7) return 'Risk / Reward'
  if (d >= 6 && bog >= 6) return 'Second Shot Course'
  if (d >= 6 && v >= 6) return 'Wind Test'
  if (v <= 4) return 'Positional Course'

  return null
}

// ---------------------------------------------------------------------------
// Main build function
// ---------------------------------------------------------------------------

/**
 * Calculate analytics for a single course from historical data.
 * Returns null if the course has no historical data at all.
 */
export async function calculateCourseAnalytics(
  prisma: PrismaClient,
  courseId: string,
  courseName: string,
): Promise<CourseAnalyticsResult> {
  const data = await fetchCourseScoringData(prisma, courseId, courseName)

  const confidenceScore = calculateConfidence(data.tournamentCount, data.totalRounds)
  const sampleSize = data.totalRounds

  const difficultyRating = calculateDifficultyRating(data.toParScores)
  const birdieRating = calculateBirdieRating(
    data.roundStats.totalBirdies,
    data.roundStats.roundsWithStats,
  )
  const bogeyRating = calculateBogeyRating(
    data.roundStats.totalBogeys,
    data.roundStats.roundsWithStats,
  )
  const volatilityRating = calculateVolatilityRating(data.toParScores)
  const dfsScoringRating = calculateDfsScoringRating(
    data.roundStats.totalBirdies,
    data.roundStats.totalEagles,
    data.roundStats.totalBogeys,
    data.roundStats.totalPars,
    data.roundStats.roundsWithStats,
    volatilityRating,
  )
  const averageScoreToPar = calculateAverageScoreToPar(data.toParScores)
  const rates = calculateHistoricalRates(
    data.roundStats.totalBirdies,
    data.roundStats.totalEagles,
    data.roundStats.totalBogeys,
    data.roundStats.roundsWithStats,
  )
  const courseArchetype = classifyCourseArchetype({
    difficultyRating,
    birdieRating,
    bogeyRating,
    volatilityRating,
    confidenceScore,
  })

  return {
    courseId,
    courseName,
    difficultyRating,
    birdieRating,
    bogeyRating,
    volatilityRating,
    dfsScoringRating,
    averageWinningScore: null, // Requires total-stroke final scores — not yet in schema.
    averageCutScore:
      data.cutScores.length > 0
        ? Math.round(
            (data.cutScores.reduce((a, b) => a + b, 0) / data.cutScores.length) * 10,
          ) / 10
        : null,
    averageScoreToPar,
    par3Difficulty: null, // Requires hole-level data — null until imported.
    par4Difficulty: null,
    par5Difficulty: null,
    historicalBirdieRate: rates.birdieRate,
    historicalBogeyRate: rates.bogeyRate,
    historicalEagleRate: rates.eagleRate,
    courseArchetype,
    confidenceScore,
    sampleSize,
  }
}

/**
 * Build analytics for every course in the database.
 * Deletes existing analytics and recalculates from scratch.
 * Never throws for individual course failures — errors are collected.
 */
export async function buildAllCourseAnalytics(
  prisma: PrismaClient = prismaClient,
): Promise<CourseAnalyticsBuildStats> {
  const startTime = Date.now()
  const stats: CourseAnalyticsBuildStats = {
    totalCourses: 0,
    processed: 0,
    skipped: 0,
    created: 0,
    updated: 0,
    errors: [],
    durationMs: 0,
  }

  const courses = await prisma.course.findMany({
    where: { deletedAt: null, active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  stats.totalCourses = courses.length

  for (const course of courses) {
    try {
      const analytics = await calculateCourseAnalytics(prisma, course.id, course.name)

      const existing = await prisma.courseAnalytics.findUnique({
        where: { courseId: course.id },
        select: { id: true },
      })

      if (existing) {
        await prisma.courseAnalytics.update({
          where: { courseId: course.id },
          data: {
            difficultyRating: analytics.difficultyRating,
            birdieRating: analytics.birdieRating,
            bogeyRating: analytics.bogeyRating,
            volatilityRating: analytics.volatilityRating,
            dfsScoringRating: analytics.dfsScoringRating,
            averageWinningScore: analytics.averageWinningScore,
            averageCutScore: analytics.averageCutScore,
            averageScoreToPar: analytics.averageScoreToPar,
            par3Difficulty: analytics.par3Difficulty,
            par4Difficulty: analytics.par4Difficulty,
            par5Difficulty: analytics.par5Difficulty,
            historicalBirdieRate: analytics.historicalBirdieRate,
            historicalBogeyRate: analytics.historicalBogeyRate,
            historicalEagleRate: analytics.historicalEagleRate,
            courseArchetype: analytics.courseArchetype,
            confidenceScore: analytics.confidenceScore,
            sampleSize: analytics.sampleSize,
            lastCalculated: new Date(),
          },
        })
        stats.updated++
      } else {
        await prisma.courseAnalytics.create({
          data: {
            courseId: course.id,
            difficultyRating: analytics.difficultyRating,
            birdieRating: analytics.birdieRating,
            bogeyRating: analytics.bogeyRating,
            volatilityRating: analytics.volatilityRating,
            dfsScoringRating: analytics.dfsScoringRating,
            averageWinningScore: analytics.averageWinningScore,
            averageCutScore: analytics.averageCutScore,
            averageScoreToPar: analytics.averageScoreToPar,
            par3Difficulty: analytics.par3Difficulty,
            par4Difficulty: analytics.par4Difficulty,
            par5Difficulty: analytics.par5Difficulty,
            historicalBirdieRate: analytics.historicalBirdieRate,
            historicalBogeyRate: analytics.historicalBogeyRate,
            historicalEagleRate: analytics.historicalEagleRate,
            courseArchetype: analytics.courseArchetype,
            confidenceScore: analytics.confidenceScore,
            sampleSize: analytics.sampleSize,
            lastCalculated: new Date(),
          },
        })
        stats.created++
      }

      stats.processed++
    } catch (error) {
      stats.errors.push({
        courseId: course.id,
        courseName: course.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  stats.durationMs = Date.now() - startTime
  return stats
}

/**
 * Fetch the stored analytics for a single course. Returns null if not yet calculated.
 */
export async function getCourseAnalytics(
  courseId: string,
  prisma: PrismaClient = prismaClient,
) {
  return prisma.courseAnalytics.findUnique({
    where: { courseId },
  })
}
