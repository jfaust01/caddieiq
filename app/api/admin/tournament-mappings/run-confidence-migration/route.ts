import { NextResponse } from "next/server"
import { runMappingConfidenceMigration } from "@/lib/workflows/mapping-confidence-migration-workflow"

/**
 * POST /api/admin/tournament-mappings/run-confidence-migration
 * 
 * Trigger the confidence scoring algorithm to run against all mappings.
 * 
 * This endpoint:
 * 1. Calculates confidence scores for all mappings
 * 2. Auto-verifies high-confidence mappings (≥95%)
 * 3. Queues low-confidence mappings for admin review
 * 4. Returns migration statistics
 * 
 * Note: This is a durable workflow that can be safely retried if interrupted.
 */
export async function POST() {
  try {
    console.log("[v0] Starting confidence migration via API...")

    const result = await runMappingConfidenceMigration()

    return NextResponse.json({
      success: true,
      migration: {
        totalMappings: result.totalMappings,
        autoVerifiedCount: result.autoVerifiedCount,
        manualReviewQueuedCount: result.manualReviewQueuedCount,
        averageConfidence: result.averageConfidence,
        distributionByConfidence: result.distributionByConfidence,
        completedAt: result.updatedAt,
      },
    })
  } catch (error) {
    console.error("[v0] Error running confidence migration:", error)
    return NextResponse.json(
      {
        error: "Failed to run confidence migration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
