"use workflow"

import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"

export interface MigrationReport {
  timestamp: string
  totalMappings: number
  confidenceBreakdown: {
    veryHigh: number // 95-100 - Recommended for auto-verify
    high: number // 80-94 - Needs manual review
    medium: number // 60-79 - Low confidence, consider re-search
    low: number // 40-59 - Should be rejected or re-searched
    veryLow: number // 0-39 - Recommend reject
  }
  recommendations: {
    estimatedAutoVerifyCount: number
    estimatedManualReviewCount: number
    estimatedRejectionCount: number
  }
  workloadEstimate: {
    estimatedManualReviewHours: number
    timePerMappingMinutes: number
  }
}

/**
 * Generate a comprehensive migration report showing confidence distribution
 * and estimated workload for manual verification.
 */
export async function generateConfidenceMigrationReport(): Promise<MigrationReport> {
  "use workflow"

  const repo = getTournamentCourseMappingRepository(prisma)

  // Get statistics
  const statsResult = await repo.getVerificationStatistics()

  if (statsResult.outcome !== "ok" || !statsResult.records) {
    throw new Error("Failed to fetch verification statistics")
  }

  const stats = statsResult.records
  const dist = stats.confidenceDistribution

  console.log("[v0] Generating confidence migration report...")
  console.log(`[v0] Total mappings: ${stats.totalMappings}`)
  console.log(`[v0] Distribution:`)
  console.log(`[v0]   Very High (95-100): ${dist.veryHigh}`)
  console.log(`[v0]   High (80-94): ${dist.high}`)
  console.log(`[v0]   Medium (60-79): ${dist.medium}`)
  console.log(`[v0]   Low (40-59): ${dist.low}`)
  console.log(`[v0]   Very Low (0-39): ${dist.veryLow}`)

  // Calculate recommendations
  const autoVerifyCount = dist.veryHigh // 95-100 confidence
  const manualReviewCount = dist.high + dist.medium // 60-94 confidence
  const rejectionCount = dist.low + dist.veryLow // 0-59 confidence

  // Estimate workload
  const timePerMappingMinutes = 5 // Average 5 minutes per manual review
  const estimatedHours = (manualReviewCount * timePerMappingMinutes) / 60

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    totalMappings: stats.totalMappings,
    confidenceBreakdown: {
      veryHigh: dist.veryHigh,
      high: dist.high,
      medium: dist.medium,
      low: dist.low,
      veryLow: dist.veryLow,
    },
    recommendations: {
      estimatedAutoVerifyCount: autoVerifyCount,
      estimatedManualReviewCount: manualReviewCount,
      estimatedRejectionCount: rejectionCount,
    },
    workloadEstimate: {
      estimatedManualReviewHours: Math.round(estimatedHours * 10) / 10,
      timePerMappingMinutes,
    },
  }

  console.log(`[v0] Report generated:`)
  console.log(`[v0] Auto-verify recommended: ${autoVerifyCount} (${Math.round((autoVerifyCount / stats.totalMappings) * 100)}%)`)
  console.log(`[v0] Manual review needed: ${manualReviewCount} (${Math.round((manualReviewCount / stats.totalMappings) * 100)}%)`)
  console.log(`[v0] Rejection recommended: ${rejectionCount} (${Math.round((rejectionCount / stats.totalMappings) * 100)}%)`)
  console.log(`[v0] Estimated workload: ${report.workloadEstimate.estimatedManualReviewHours} hours`)

  return report
}
