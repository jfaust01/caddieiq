"use workflow"

import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { calculateConfidenceScore, formatConfidenceReasons } from "@/lib/services/tournament-mapping-confidence-service"
import { prisma } from "@/lib/prisma"

export interface ConfidenceMigrationResult {
  totalMappings: number
  autoVerifiedCount: number
  manualReviewQueuedCount: number
  updatedAt: string
  averageConfidence: number
  distributionByConfidence: {
    veryHigh: number // 95-100
    high: number // 80-94
    medium: number // 60-79
    low: number // 40-59
    veryLow: number // 0-39
  }
}

/**
 * Durable workflow: Apply confidence scoring algorithm to all mappings.
 * 
 * For each mapping:
 * 1. Calculate confidence score (0-100)
 * 2. If score >= 95%, auto-verify (set verified=true + autoVerified=true)
 * 3. If score < 95%, queue for manual review (verified=false)
 * 4. Store reasons and score for admin review
 * 
 * This dramatically reduces manual review burden (typically >80% auto-verified).
 */
export async function runMappingConfidenceMigration(): Promise<ConfidenceMigrationResult> {
  "use workflow"

  console.log("[v0] Starting mapping confidence migration...")

  const startTime = Date.now()
  const repo = getTournamentCourseMappingRepository(prisma)

  try {
    // Step 1: Fetch all mappings
    const allMappingsResult = await prisma.tournamentCourseMapping.findMany({
      select: {
        id: true,
        tournamentId: true,
        tournamentCourseName: true,
        golfCourseCourseName: true,
        sportsDataIoCourseId: true,
        golfCourseApiCourseId: true,
        matchedBy: true,
        matchConfidence: true,
        verified: true,
      },
    })

    console.log(`[v0] Found ${allMappingsResult.length} total mappings`)

    let autoVerifiedCount = 0
    let manualReviewQueuedCount = 0
    let totalConfidence = 0
    const distribution = {
      veryHigh: 0, // 95-100
      high: 0, // 80-94
      medium: 0, // 60-79
      low: 0, // 40-59
      veryLow: 0, // 0-39
    }

    // Step 2: Process each mapping
    for (const mapping of allMappingsResult) {
      try {
        // Calculate confidence
        const confidenceResult = calculateConfidenceScore({
          tournamentCourseName: mapping.tournamentCourseName,
          golfCourseCourseName: mapping.golfCourseCourseName,
          sportsDataIoCourseId: mapping.sportsDataIoCourseId,
          golfCourseApiCourseId: mapping.golfCourseApiCourseId,
          matchedBy: mapping.matchedBy,
        })

        const confidenceReasonText = formatConfidenceReasons(confidenceResult.reasons)

        // Track distribution
        totalConfidence += confidenceResult.score
        if (confidenceResult.score >= 95) distribution.veryHigh++
        else if (confidenceResult.score >= 80) distribution.high++
        else if (confidenceResult.score >= 60) distribution.medium++
        else if (confidenceResult.score >= 40) distribution.low++
        else distribution.veryLow++

        // Update mapping with confidence score
        await prisma.tournamentCourseMapping.update({
          where: { id: mapping.id },
          data: {
            matchConfidence: confidenceResult.score,
            confidenceReason: confidenceReasonText,
            verified: confidenceResult.shouldAutoVerify,
            autoVerified: confidenceResult.shouldAutoVerify,
          },
        })

        if (confidenceResult.shouldAutoVerify) {
          autoVerifiedCount++
          console.log(
            `[v0] AUTO-VERIFIED: ${mapping.tournamentCourseName} → ${mapping.golfCourseCourseName} (${confidenceResult.score})`
          )
        } else {
          manualReviewQueuedCount++
          console.log(
            `[v0] QUEUED FOR REVIEW: ${mapping.tournamentCourseName} → ${mapping.golfCourseCourseName} (${confidenceResult.score})`
          )
        }
      } catch (error) {
        console.error(
          `[v0] Error processing mapping ${mapping.tournamentId}:`,
          error instanceof Error ? error.message : error
        )
        // Continue with next mapping (resumable workflow)
      }
    }

    const totalDurationMs = Date.now() - startTime
    const averageConfidence =
      allMappingsResult.length > 0 ? Math.round(totalConfidence / allMappingsResult.length) : 0

    const result: ConfidenceMigrationResult = {
      totalMappings: allMappingsResult.length,
      autoVerifiedCount,
      manualReviewQueuedCount,
      updatedAt: new Date().toISOString(),
      averageConfidence,
      distributionByConfidence: distribution,
    }

    console.log(`[v0] Confidence migration completed in ${totalDurationMs}ms`)
    console.log(`[v0] Auto-verified: ${autoVerifiedCount} (${Math.round((autoVerifiedCount / allMappingsResult.length) * 100)}%)`)
    console.log(`[v0] Queued for review: ${manualReviewQueuedCount}`)
    console.log(`[v0] Average confidence: ${averageConfidence}%`)
    console.log(
      `[v0] Distribution: Very High(95-100): ${distribution.veryHigh}, High(80-94): ${distribution.high}, Medium(60-79): ${distribution.medium}, Low(40-59): ${distribution.low}, Very Low(0-39): ${distribution.veryLow}`
    )

    return result
  } catch (error) {
    console.error("[v0] Confidence migration failed:", error instanceof Error ? error.message : error)
    throw error
  }
}
