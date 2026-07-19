import { PrismaClient } from "@prisma/client"
import { getTournamentRepository } from "../lib/repositories/tournament-repository"
import { getTournamentCourseMappingRepository } from "../lib/repositories/tournament-course-mapping-repository"
import { runTournamentCourseMappingOrchestration } from "../lib/imports/tournament-course-mapping-orchestration"
import { CourseIntelligenceService } from "../lib/services/course-intelligence-service"

const prisma = new PrismaClient()

async function main() {
  console.log("[v0] === Phase 13.4 Step 1: Re-run Tournament Course Mapping Workflow ===")
  console.log("[v0] Starting at:", new Date().toISOString())

  try {
    // Get all tournaments
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true, sourceType: true, sourceTournamentId: true },
    })

    console.log(`[v0] Found ${tournaments.length} tournaments to process`)

    if (tournaments.length === 0) {
      console.log("[v0] No tournaments found. Exiting.")
      return
    }

    // Initialize repositories
    const tournamentRepo = getTournamentRepository(prisma)
    const mappingRepo = getTournamentCourseMappingRepository(prisma)
    const courseService = new CourseIntelligenceService()

    // Run orchestration
    console.log("[v0] Running Tournament Course Mapping orchestration...")
    const stats = await runTournamentCourseMappingOrchestration(
      tournaments,
      tournamentRepo,
      mappingRepo,
      courseService,
    )

    console.log("[v0] Orchestration complete!")
    console.log("[v0] Statistics:", JSON.stringify(stats, null, 2))

    // Get updated statistics
    const mappings = await prisma.tournamentCourseMapping.findMany({
      select: {
        tournamentId: true,
        golfCourseApiCourseId: true,
        matchConfidence: true,
        verified: true,
        verificationStatus: true,
      },
    })

    console.log(`[v0] Updated mapping count: ${mappings.length}`)

    // Analyze results
    const verified = mappings.filter((m) => m.verified).length
    const unverified = mappings.filter((m) => !m.verified).length
    const withValidId = mappings.filter((m) => m.golfCourseApiCourseId && m.golfCourseApiCourseId > 0).length
    const avgConfidence =
      mappings.length > 0
        ? (mappings.reduce((sum, m) => sum + (m.matchConfidence || 0), 0) / mappings.length).toFixed(2)
        : 0
    const maxConfidence = Math.max(...mappings.map((m) => m.matchConfidence || 0))
    const minConfidence = Math.min(...mappings.map((m) => m.matchConfidence || 0))

    console.log("[v0]")
    console.log("[v0] === Mapping Results ===")
    console.log(`[v0] Total Mappings: ${mappings.length}`)
    console.log(`[v0] Verified: ${verified}`)
    console.log(`[v0] Unverified: ${unverified}`)
    console.log(`[v0] Pending Review: ${mappings.filter((m) => m.verificationStatus === "PENDING_REVIEW").length}`)
    console.log(`[v0] Rejected: ${mappings.filter((m) => m.verificationStatus === "REJECTED").length}`)
    console.log(`[v0] With Valid GolfCourse API ID: ${withValidId}`)
    console.log(`[v0] Average Confidence: ${avgConfidence}`)
    console.log(`[v0] Max Confidence: ${maxConfidence}`)
    console.log(`[v0] Min Confidence: ${minConfidence}`)

    // Check for violations
    const violations = mappings.filter(
      (m) => m.verified && (!m.golfCourseApiCourseId || m.golfCourseApiCourseId <= 0),
    )
    if (violations.length > 0) {
      console.log(`[v0] ⚠️ WARNING: ${violations.length} verified mappings have invalid IDs!`)
    } else {
      console.log("[v0] ✓ All verified mappings have valid IDs")
    }

    const confidenceViolations = mappings.filter((m) => m.verified && (!m.matchConfidence || m.matchConfidence <= 0))
    if (confidenceViolations.length > 0) {
      console.log(`[v0] ⚠️ WARNING: ${confidenceViolations.length} verified mappings have invalid confidence!`)
    } else {
      console.log("[v0] ✓ All verified mappings have positive confidence")
    }

    console.log("[v0] Done at:", new Date().toISOString())
  } catch (error) {
    console.error("[v0] Error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
