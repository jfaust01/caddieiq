/**
 * MatchScoreRepository — Data access layer for match scores.
 *
 * Implements immutability pattern:
 * - Scores are created once and never updated
 * - Only metadata can be updated
 * - No deletion allowed (logical archival only)
 * - All operations tracked in audit trail
 *
 * Reference: docs/ARCHITECTURE_MASTER_INDEX.md (Section 14: Phase 16B Implementation Contract)
 * Reference: docs/MODEL_GOVERNANCE.md
 */

import { prisma } from "@/lib/prisma";
import type {
  MatchScore,
  MatchScoreBuild,
  MatchScoreComponent,
  MatchScoreAuditTrail,
  Prisma,
} from "@prisma/client";

export interface CreateMatchScoreInput {
  playerId: string;
  courseId: string;
  buildId: string;
  tournamentId?: string | null;
  version: string;
  overallScore: number;
  skillFitScore: number;
  formBonus: number;
  venueHistoryBonus: number;
  confidenceMultiplier: number;
  confidenceScore: number;
  ceilingScore: number;
  floorScore: number;
  explanation?: string | null;
  explanationComponents?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  isHistorical?: boolean;
  recreatedFromBuildId?: string | null;
}

export interface UpdateMatchScoreMetadataInput {
  metadata?: Record<string, unknown> | null;
}

export interface MatchScoreWithRelations extends MatchScore {
  components: MatchScoreComponent[];
  auditTrail: MatchScoreAuditTrail[];
}

/**
 * Repository for MatchScore operations.
 * Enforces immutability and auditability per architecture requirements.
 */
export class MatchScoreRepository {
  /**
   * Create a new match score. This is the ONLY write operation.
   *
   * INVARIANTS:
   * - Every score must have a buildId (reproducibility)
   * - Every score must have version (traceability)
   * - All scoring dimensions must be provided
   *
   * @param data Score data
   * @param actor User/system creating the score (for audit trail)
   * @returns Created score with components
   */
  async create(
    data: CreateMatchScoreInput,
    actor: string = "system"
  ): Promise<MatchScoreWithRelations> {
    // Validation: ensure build exists
    const build = await prisma.matchScoreBuild.findUnique({
      where: { id: data.buildId },
    });

    if (!build) {
      throw new Error(`Build not found: ${data.buildId}`);
    }

    // Validation: ensure player exists
    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
    });

    if (!player) {
      throw new Error(`Player not found: ${data.playerId}`);
    }

    // Validation: ensure course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new Error(`Course not found: ${data.courseId}`);
    }

    // Validation: ensure tournament exists if provided
    if (data.tournamentId) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: data.tournamentId },
      });

      if (!tournament) {
        throw new Error(`Tournament not found: ${data.tournamentId}`);
      }
    }

    // Validation: score ranges
    if (
      data.overallScore < 0 ||
      data.overallScore > 100 ||
      data.skillFitScore < 0 ||
      data.skillFitScore > 100 ||
      data.confidenceScore < 0 ||
      data.confidenceScore > 100
    ) {
      throw new Error("Score values must be between 0-100");
    }

    if (data.confidenceMultiplier < 0.3 || data.confidenceMultiplier > 1.0) {
      throw new Error("Confidence multiplier must be between 0.3-1.0");
    }

    // Check for duplicate (player + course + build + tournament uniqueness)
    const existing = await prisma.matchScore.findUnique({
      where: {
        playerId_courseId_buildId_tournamentId: {
          playerId: data.playerId,
          courseId: data.courseId,
          buildId: data.buildId,
          tournamentId: data.tournamentId || "",
        },
      },
    });

    if (existing) {
      throw new Error(
        `Match score already exists for this player-course-build-tournament combination`
      );
    }

    // Create score with components and audit trail in transaction
    const score = await prisma.$transaction(async (tx) => {
      // Create main score record
      const newScore = await tx.matchScore.create({
        data: {
          playerId: data.playerId,
          courseId: data.courseId,
          buildId: data.buildId,
          tournamentId: data.tournamentId,
          version: data.version,
          overallScore: data.overallScore,
          skillFitScore: data.skillFitScore,
          formBonus: data.formBonus,
          venueHistoryBonus: data.venueHistoryBonus,
          confidenceMultiplier: data.confidenceMultiplier,
          confidenceScore: data.confidenceScore,
          ceilingScore: data.ceilingScore,
          floorScore: data.floorScore,
          explanation: data.explanation,
          explanationComponents: data.explanationComponents,
          metadata: data.metadata,
          isHistorical: data.isHistorical || false,
          recreatedFromBuildId: data.recreatedFromBuildId,
        },
        include: {
          components: true,
          auditTrail: true,
        },
      });

      // Create audit trail entry
      await tx.matchScoreAuditTrail.create({
        data: {
          scoreId: newScore.id,
          action: "CREATED",
          actor: actor,
          context: {
            buildId: data.buildId,
            version: data.version,
            isHistorical: data.isHistorical,
          },
        },
      });

      return newScore;
    });

    return score;
  }

  /**
   * Retrieve a score by ID. Loads all components and audit trail.
   *
   * @param id Score ID
   * @returns Score with all relations, or null if not found
   */
  async findById(id: string): Promise<MatchScoreWithRelations | null> {
    return prisma.matchScore.findUnique({
      where: { id },
      include: {
        components: true,
        auditTrail: true,
      },
    });
  }

  /**
   * Find all scores for a player-course combination across all builds.
   *
   * @param playerId Player ID
   * @param courseId Course ID
   * @returns Array of scores
   */
  async findByPlayerAndCourse(
    playerId: string,
    courseId: string
  ): Promise<MatchScoreWithRelations[]> {
    return prisma.matchScore.findMany({
      where: {
        playerId,
        courseId,
      },
      include: {
        components: true,
        auditTrail: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all scores generated by a specific build.
   *
   * @param buildId Build ID
   * @returns Array of scores
   */
  async findByBuildId(buildId: string): Promise<MatchScoreWithRelations[]> {
    return prisma.matchScore.findMany({
      where: { buildId },
      include: {
        components: true,
        auditTrail: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all scores for a tournament.
   *
   * @param tournamentId Tournament ID
   * @returns Array of scores
   */
  async findByTournamentId(
    tournamentId: string
  ): Promise<MatchScoreWithRelations[]> {
    return prisma.matchScore.findMany({
      where: { tournamentId },
      include: {
        components: true,
        auditTrail: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find the latest score for a player-course combination for a specific version.
   *
   * @param playerId Player ID
   * @param courseId Course ID
   * @param version Version string (e.g., "1.0.0")
   * @returns Latest score for that version, or null
   */
  async findLatestByPlayerCourseVersion(
    playerId: string,
    courseId: string,
    version: string
  ): Promise<MatchScoreWithRelations | null> {
    return prisma.matchScore.findFirst({
      where: {
        playerId,
        courseId,
        version,
      },
      include: {
        components: true,
        auditTrail: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
  }

  /**
   * Update score metadata only (the ONLY allowed update operation).
   * All score values remain immutable.
   *
   * @param id Score ID
   * @param data Metadata update
   * @param actor User/system performing update
   * @returns Updated score
   */
  async updateMetadata(
    id: string,
    data: UpdateMatchScoreMetadataInput,
    actor: string = "system"
  ): Promise<MatchScoreWithRelations> {
    // Verify score exists
    const score = await prisma.matchScore.findUnique({ where: { id } });
    if (!score) {
      throw new Error(`Score not found: ${id}`);
    }

    // Update in transaction with audit trail
    const updated = await prisma.$transaction(async (tx) => {
      const updatedScore = await tx.matchScore.update({
        where: { id },
        data: {
          metadata: data.metadata,
        },
        include: {
          components: true,
          auditTrail: true,
        },
      });

      // Log metadata update
      await tx.matchScoreAuditTrail.create({
        data: {
          scoreId: id,
          action: "REQUESTED", // Treat metadata update as access event
          actor: actor,
          context: {
            updateType: "metadata",
          },
        },
      });

      return updatedScore;
    });

    return updated;
  }

  /**
   * Record audit trail event (access, explanation generation, etc.)
   *
   * @param scoreId Score ID
   * @param action Action taken
   * @param actor User/system performing action
   * @param context Optional context data
   */
  async recordAuditEvent(
    scoreId: string,
    action:
      | "CREATED"
      | "REQUESTED"
      | "EXPLANATION_GENERATED"
      | "RECREATED_FROM_BUILD"
      | "ARCHIVED",
    actor: string = "system",
    context?: Record<string, unknown>
  ): Promise<MatchScoreAuditTrail> {
    // Verify score exists
    const score = await prisma.matchScore.findUnique({ where: { id: scoreId } });
    if (!score) {
      throw new Error(`Score not found: ${scoreId}`);
    }

    return prisma.matchScoreAuditTrail.create({
      data: {
        scoreId,
        action,
        actor,
        context,
      },
    });
  }

  /**
   * Get complete audit trail for a score.
   *
   * @param scoreId Score ID
   * @returns Array of audit trail entries
   */
  async getAuditTrail(scoreId: string): Promise<MatchScoreAuditTrail[]> {
    return prisma.matchScoreAuditTrail.findMany({
      where: { scoreId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Count scores for a player-course combination.
   *
   * @param playerId Player ID
   * @param courseId Course ID
   * @returns Number of scores
   */
  async countByPlayerAndCourse(
    playerId: string,
    courseId: string
  ): Promise<number> {
    return prisma.matchScore.count({
      where: {
        playerId,
        courseId,
      },
    });
  }

  /**
   * Get statistics for a build (how many scores generated, coverage, etc.)
   *
   * @param buildId Build ID
   * @returns Statistics object
   */
  async getBuildStatistics(buildId: string): Promise<{
    totalScores: number;
    uniquePlayers: number;
    uniqueCourses: number;
    averageScore: number;
    earliestScore: Date | null;
    latestScore: Date | null;
  }> {
    const scores = await prisma.matchScore.findMany({
      where: { buildId },
      select: {
        id: true,
        playerId: true,
        courseId: true,
        overallScore: true,
        createdAt: true,
      },
    });

    const uniquePlayers = new Set(scores.map((s) => s.playerId)).size;
    const uniqueCourses = new Set(scores.map((s) => s.courseId)).size;
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length
        : 0;

    return {
      totalScores: scores.length,
      uniquePlayers,
      uniqueCourses,
      averageScore: avgScore,
      earliestScore:
        scores.length > 0
          ? new Date(Math.min(...scores.map((s) => s.createdAt.getTime())))
          : null,
      latestScore:
        scores.length > 0
          ? new Date(Math.max(...scores.map((s) => s.createdAt.getTime())))
          : null,
    };
  }

  // NOTE: No update() or delete() methods by design (immutability requirement)
  // Only updateMetadata() is allowed per architecture contract
}

/**
 * Export singleton instance for use throughout application
 */
export const matchScoreRepository = new MatchScoreRepository();
