import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { PrismaClient } from "@prisma/client"
import { TournamentCourseMappingRepository } from "../tournament-course-mapping-repository"

const prisma = new PrismaClient()
const repo = new TournamentCourseMappingRepository(prisma)

describe("TournamentCourseMappingRepository - Validation Tests", () => {
  const testTournamentId = "test-tournament-id-validation"

  afterEach(async () => {
    // Clean up test data
    await prisma.tournamentCourseMapping.deleteMany({
      where: { tournamentId: { startsWith: testTournamentId } },
    })
  })

  describe("Verification Eligibility Validation", () => {
    describe("Should PREVENT invalid states when creating", () => {
      it("should reject create with verified=true and golfCourseApiCourseId=null", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-1`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: null,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 50,
          matchedBy: "manual",
          verified: true, // ✗ Invalid: ID is null
          autoVerified: false,
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("golfCourseApiCourseId must be > 0")
      })

      it("should reject create with verified=true and golfCourseApiCourseId=0", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-2`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: 0,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 50,
          matchedBy: "manual",
          verified: true, // ✗ Invalid: ID is 0
          autoVerified: false,
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("golfCourseApiCourseId must be > 0")
      })

      it("should reject create with verified=true and matchConfidence=0", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-3`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: 12345,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 0, // ✗ Invalid: confidence is 0
          matchedBy: "manual",
          verified: true,
          autoVerified: false,
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("matchConfidence must be > 0")
      })

      it("should reject create with verified=true and matchConfidence=-1", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-4`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: 12345,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: -1, // ✗ Invalid: negative confidence
          matchedBy: "manual",
          verified: true,
          autoVerified: false,
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("matchConfidence must be > 0")
      })
    })

    describe("Should ALLOW valid states when creating", () => {
      it("should allow create with verified=false (any ID/confidence)", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-5`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: null,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 0, // OK for unverified
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(result.outcome).toBe("updated")
        expect(result.record).toBeDefined()
        expect(result.record?.verified).toBe(false)
      })

      it("should allow create with verified=true and valid ID and confidence", async () => {
        const result = await repo.create({
          tournamentId: `${testTournamentId}-6`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: 58761,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 95,
          matchedBy: "manual",
          verified: true, // ✓ Valid: ID > 0, confidence > 0
          autoVerified: false,
        })

        expect(result.outcome).toBe("updated")
        expect(result.record?.verified).toBe(true)
        expect(result.record?.golfCourseApiCourseId).toBe(58761)
        expect(result.record?.matchConfidence).toBe(95)
      })
    })

    describe("Should PREVENT invalid states when updating", () => {
      it("should reject update to verified=true with ID=null", async () => {
        // Create unverified mapping first
        const created = await repo.create({
          tournamentId: `${testTournamentId}-7`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: null,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 0,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(created.outcome).toBe("updated")

        // Try to mark as verified without providing valid ID
        const result = await repo.update(`${testTournamentId}-7`, {
          verified: true, // ✗ Invalid: ID still null
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("golfCourseApiCourseId must be > 0")
      })

      it("should reject update to verified=true with confidence=0", async () => {
        // Create mapping with valid ID but no confidence
        const created = await repo.create({
          tournamentId: `${testTournamentId}-8`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: 58761,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 0, // Low confidence
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(created.outcome).toBe("updated")

        // Try to mark as verified without valid confidence
        const result = await repo.update(`${testTournamentId}-8`, {
          verified: true, // ✗ Invalid: confidence is 0
        })

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("matchConfidence must be > 0")
      })

      it("should allow update to verified=true with valid ID and confidence", async () => {
        // Create unverified mapping
        const created = await repo.create({
          tournamentId: `${testTournamentId}-9`,
          sportsDataIoCourseId: "sr:course:123",
          golfCourseApiCourseId: null,
          tournamentCourseName: "Test Tournament",
          golfCourseCourseName: "Test Course",
          matchConfidence: 0,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(created.outcome).toBe("updated")

        // Update with valid ID and confidence
        const result = await repo.update(`${testTournamentId}-9`, {
          golfCourseApiCourseId: 58761,
          matchConfidence: 90,
          verified: true, // ✓ Valid: ID > 0, confidence > 0
        })

        expect(result.outcome).toBe("updated")
        expect(result.record?.verified).toBe(true)
        expect(result.record?.golfCourseApiCourseId).toBe(58761)
        expect(result.record?.matchConfidence).toBe(90)
      })
    })

    describe("Bulk Verify Validation", () => {
      it("should reject bulkVerify with ANY invalid mapping", async () => {
        // Create two valid mappings and one invalid
        const valid1 = await repo.create({
          tournamentId: `${testTournamentId}-10`,
          sportsDataIoCourseId: "sr:course:1",
          golfCourseApiCourseId: 58761,
          tournamentCourseName: "Course 1",
          golfCourseCourseName: "Course 1",
          matchConfidence: 90,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        const valid2 = await repo.create({
          tournamentId: `${testTournamentId}-11`,
          sportsDataIoCourseId: "sr:course:2",
          golfCourseApiCourseId: 12345,
          tournamentCourseName: "Course 2",
          golfCourseCourseName: "Course 2",
          matchConfidence: 85,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        const invalid = await repo.create({
          tournamentId: `${testTournamentId}-12`,
          sportsDataIoCourseId: "sr:course:3",
          golfCourseApiCourseId: 0, // Invalid ID
          tournamentCourseName: "Course 3",
          golfCourseCourseName: "Course 3",
          matchConfidence: 0,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(valid1.outcome).toBe("updated")
        expect(valid2.outcome).toBe("updated")
        expect(invalid.outcome).toBe("updated")

        // Try to bulk verify all three (should fail on the invalid one)
        const result = await repo.bulkVerify([
          `${testTournamentId}-10`,
          `${testTournamentId}-11`,
          `${testTournamentId}-12`, // ✗ This one is invalid
        ])

        expect(result.outcome).toBe("failed")
        expect(result.error?.message).toContain("invalid golfCourseApiCourseId")
      })

      it("should allow bulkVerify with all valid mappings", async () => {
        // Create two valid mappings
        const valid1 = await repo.create({
          tournamentId: `${testTournamentId}-13`,
          sportsDataIoCourseId: "sr:course:1",
          golfCourseApiCourseId: 58761,
          tournamentCourseName: "Course 1",
          golfCourseCourseName: "Course 1",
          matchConfidence: 90,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        const valid2 = await repo.create({
          tournamentId: `${testTournamentId}-14`,
          sportsDataIoCourseId: "sr:course:2",
          golfCourseApiCourseId: 12345,
          tournamentCourseName: "Course 2",
          golfCourseCourseName: "Course 2",
          matchConfidence: 85,
          matchedBy: "manual",
          verified: false,
          autoVerified: false,
        })

        expect(valid1.outcome).toBe("updated")
        expect(valid2.outcome).toBe("updated")

        // Bulk verify both (should succeed)
        const result = await repo.bulkVerify([
          `${testTournamentId}-13`,
          `${testTournamentId}-14`,
        ])

        expect(result.outcome).toBe("updated")
        expect(result.record).toBe(2)
      })
    })
  })

  describe("Regression: Prevent Phase 13.3 Bug Recurrence", () => {
    it("should never allow golfCourseApiCourseId to default to 0 in verified mapping", async () => {
      // This test prevents the exact scenario that caused 41 invalid mappings
      const result = await repo.create({
        tournamentId: `${testTournamentId}-regression-1`,
        sportsDataIoCourseId: "sr:course:999",
        golfCourseApiCourseId: 0, // ✗ This is the BUG: defaulted to 0
        tournamentCourseName: "Test",
        golfCourseCourseName: "Test",
        matchConfidence: 0, // ✗ AND this: no confidence
        matchedBy: "manual",
        verified: true, // ✗ AND marking as verified: THE COMPLETE BUG
        autoVerified: false,
      })

      expect(result.outcome).toBe("failed")
      expect(result.error?.code).toBe("INVALID_STATE")
    })

    it("should prevent bulkVerify from marking unmapped courses as verified", async () => {
      // Create an unmapped course (golfCourseApiCourseId = null)
      const created = await repo.create({
        tournamentId: `${testTournamentId}-regression-2`,
        sportsDataIoCourseId: "sr:course:999",
        golfCourseApiCourseId: null, // Unmapped
        tournamentCourseName: "Unmapped Tournament",
        golfCourseCourseName: "Unknown Course",
        matchConfidence: 0, // No confidence
        matchedBy: "manual",
        verified: false,
        autoVerified: false,
      })

      expect(created.outcome).toBe("updated")

      // Try to bulkVerify the unmapped course
      const result = await repo.bulkVerify([`${testTournamentId}-regression-2`])

      expect(result.outcome).toBe("failed")
      expect(result.error?.message).toContain("invalid golfCourseApiCourseId")
    })
  })
})
