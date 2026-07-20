/**
 * MatchScoreRepository Tests
 *
 * Tests immutability, auditability, referential integrity, and version tracking.
 * Reference: docs/ARCHITECTURE_MASTER_INDEX.md (Section 14)
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { matchScoreRepository } from "@/lib/repositories/MatchScoreRepository";
import type {
  Player,
  Course,
  MatchVersion,
  MatchScoreBuild,
  Tournament,
} from "@prisma/client";

describe("MatchScoreRepository", () => {
  let testPlayer: Player;
  let testCourse: Course;
  let testVersion: MatchVersion;
  let testBuild: MatchScoreBuild;
  let testTournament: Tournament;

  beforeAll(async () => {
    // Create test fixtures
    testPlayer = await prisma.player.create({
      data: {
        firstName: "Test",
        lastName: "Player",
        fullName: "Test Player",
        slug: `test-player-${Date.now()}`,
      },
    });

    testCourse = await prisma.course.create({
      data: {
        name: "Test Course",
        slug: `test-course-${Date.now()}`,
      },
    });

    testVersion = await prisma.matchVersion.create({
      data: {
        versionString: "1.0.0",
        major: 1,
        minor: 0,
        patch: 0,
        algorithmType: "HAND_TUNED",
      },
    });

    testBuild = await prisma.matchScoreBuild.create({
      data: {
        versionId: testVersion.id,
        buildHash: `hash-${Date.now()}`,
        buildManifestJson: {
          features: 47,
          scoreFormula: "skill_fit + form + venue",
        },
        createdBy: "test@example.com",
      },
    });

    testTournament = await prisma.tournament.create({
      data: {
        tourId: (
          await prisma.tour.findFirst({
            select: { id: true },
          })
        )?.id || "",
        name: "Test Tournament",
        slug: `test-tournament-${Date.now()}`,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.matchScore.deleteMany({
      where: {
        playerId: testPlayer.id,
      },
    });

    await prisma.player.delete({
      where: { id: testPlayer.id },
    });

    await prisma.course.delete({
      where: { id: testCourse.id },
    });

    await prisma.matchScoreBuild.delete({
      where: { id: testBuild.id },
    });

    await prisma.matchVersion.delete({
      where: { id: testVersion.id },
    });

    if (testTournament) {
      await prisma.tournament.delete({
        where: { id: testTournament.id },
      });
    }
  });

  describe("create()", () => {
    it("should create a new match score with all fields", async () => {
      const score = await matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        tournamentId: testTournament.id,
        version: testVersion.versionString,
        overallScore: 75.5,
        skillFitScore: 78,
        formBonus: 5,
        venueHistoryBonus: 3,
        confidenceMultiplier: 0.9,
        confidenceScore: 82,
        ceilingScore: 85,
        floorScore: 68,
        explanation: "Good structural fit for this course type",
        explanationComponents: {
          skillFit: "Strong driving, adequate short game",
          formBonus: "Recent performance +5%",
        },
        metadata: {
          weather: "partly cloudy",
          fieldStrength: "medium",
        },
      });

      expect(score).toBeDefined();
      expect(score.id).toBeDefined();
      expect(score.overallScore).toBe(75.5);
      expect(score.createdAt).toBeDefined();
      expect(score.updatedAt).toBeDefined();
    });

    it("should reject score with invalid ranges", async () => {
      const invalidScore = matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 150, // Invalid: > 100
        skillFitScore: 78,
        formBonus: 5,
        venueHistoryBonus: 3,
        confidenceMultiplier: 0.9,
        confidenceScore: 82,
        ceilingScore: 85,
        floorScore: 68,
      });

      await expect(invalidScore).rejects.toThrow("between 0-100");
    });

    it("should reject score with invalid confidence multiplier", async () => {
      const invalidMultiplier = matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 75,
        skillFitScore: 78,
        formBonus: 5,
        venueHistoryBonus: 3,
        confidenceMultiplier: 1.5, // Invalid: > 1.0
        confidenceScore: 82,
        ceilingScore: 85,
        floorScore: 68,
      });

      await expect(invalidMultiplier).rejects.toThrow("0.3-1.0");
    });

    it("should track creation in audit trail", async () => {
      const score = await matchScoreRepository.create(
        {
          playerId: testPlayer.id,
          courseId: testCourse.id,
          buildId: testBuild.id,
          version: testVersion.versionString,
          overallScore: 72,
          skillFitScore: 75,
          formBonus: 2,
          venueHistoryBonus: 1,
          confidenceMultiplier: 0.85,
          confidenceScore: 78,
          ceilingScore: 80,
          floorScore: 65,
        },
        "test-actor@example.com"
      );

      const auditTrail = await matchScoreRepository.getAuditTrail(score.id);
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].action).toBe("CREATED");
      expect(auditTrail[0].actor).toBe("test-actor@example.com");
    });
  });

  describe("findById()", () => {
    it("should retrieve score by ID with all relations", async () => {
      const created = await matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 70,
        skillFitScore: 72,
        formBonus: 1,
        venueHistoryBonus: 0,
        confidenceMultiplier: 0.8,
        confidenceScore: 75,
        ceilingScore: 78,
        floorScore: 62,
      });

      const retrieved = await matchScoreRepository.findById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.overallScore).toBe(70);
      expect(retrieved?.auditTrail).toBeDefined();
    });

    it("should return null for non-existent score", async () => {
      const retrieved = await matchScoreRepository.findById("non-existent-id");
      expect(retrieved).toBeNull();
    });
  });

  describe("findByPlayerAndCourse()", () => {
    it("should retrieve all scores for player-course pair", async () => {
      await matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 71,
        skillFitScore: 73,
        formBonus: 2,
        venueHistoryBonus: 0,
        confidenceMultiplier: 0.82,
        confidenceScore: 77,
        ceilingScore: 80,
        floorScore: 64,
      });

      const scores = await matchScoreRepository.findByPlayerAndCourse(
        testPlayer.id,
        testCourse.id
      );

      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0].playerId).toBe(testPlayer.id);
      expect(scores[0].courseId).toBe(testCourse.id);
    });
  });

  describe("immutability", () => {
    it("should only allow metadata updates", async () => {
      const created = await matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 74,
        skillFitScore: 76,
        formBonus: 2,
        venueHistoryBonus: 1,
        confidenceMultiplier: 0.88,
        confidenceScore: 80,
        ceilingScore: 83,
        floorScore: 67,
        metadata: { originalField: "original" },
      });

      const updated = await matchScoreRepository.updateMetadata(
        created.id,
        {
          metadata: { newField: "updated" },
        },
        "updater@example.com"
      );

      // Score values remain unchanged
      expect(updated.overallScore).toBe(74);
      expect(updated.skillFitScore).toBe(76);

      // Metadata is updated
      expect(updated.metadata).toEqual({ newField: "updated" });
    });
  });

  describe("audit trail", () => {
    it("should record access events", async () => {
      const created = await matchScoreRepository.create({
        playerId: testPlayer.id,
        courseId: testCourse.id,
        buildId: testBuild.id,
        version: testVersion.versionString,
        overallScore: 73,
        skillFitScore: 75,
        formBonus: 1,
        venueHistoryBonus: 1,
        confidenceMultiplier: 0.87,
        confidenceScore: 79,
        ceilingScore: 82,
        floorScore: 66,
      });

      await matchScoreRepository.recordAuditEvent(
        created.id,
        "EXPLANATION_GENERATED",
        "system",
        { explanationLength: 245 }
      );

      const audit = await matchScoreRepository.getAuditTrail(created.id);
      const explanationEvent = audit.find(
        (a) => a.action === "EXPLANATION_GENERATED"
      );

      expect(explanationEvent).toBeDefined();
      expect(explanationEvent?.context).toEqual({ explanationLength: 245 });
    });
  });

  describe("statistics", () => {
    it("should calculate build statistics", async () => {
      const stats = await matchScoreRepository.getBuildStatistics(testBuild.id);

      expect(stats.totalScores).toBeGreaterThanOrEqual(0);
      expect(stats.uniquePlayers).toBeGreaterThanOrEqual(0);
      expect(stats.uniqueCourses).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeLessThanOrEqual(100);
    });
  });
});
