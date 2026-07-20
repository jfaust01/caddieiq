/**
 * MatchScoreBuildRepository — Data access layer for match score builds.
 *
 * Manages build lifecycle: development → candidate → active → retired
 * Every build is immutable once created; only status can change.
 *
 * Reference: docs/MODEL_PROMOTION_POLICY.md
 * Reference: docs/BUILD_REPRODUCIBILITY.md
 */

import { prisma } from "@/lib/prisma";
import type {
  MatchScoreBuild,
  MatchScoreBuildStatus,
  MatchVersion,
} from "@prisma/client";

export interface CreateBuildInput {
  versionId: string;
  buildHash: string;
  buildManifestJson: Record<string, unknown>;
  createdBy?: string;
}

export interface BuildWithVersion extends MatchScoreBuild {
  version: MatchVersion;
}

/**
 * Repository for MatchScoreBuild operations.
 * Enforces lifecycle progression and immutability.
 */
export class MatchScoreBuildRepository {
  /**
   * Create a new build in DEVELOPMENT status.
   * Build manifest is immutable once created.
   *
   * @param data Build data
   * @returns Created build
   */
  async create(data: CreateBuildInput): Promise<BuildWithVersion> {
    // Verify version exists
    const version = await prisma.matchVersion.findUnique({
      where: { id: data.versionId },
    });

    if (!version) {
      throw new Error(`Version not found: ${data.versionId}`);
    }

    // Check for duplicate buildHash (reproducibility requirement)
    const existing = await prisma.matchScoreBuild.findUnique({
      where: { buildHash: data.buildHash },
    });

    if (existing) {
      throw new Error(
        `Build with this hash already exists (reproducibility requirement). Hash: ${data.buildHash}`
      );
    }

    return prisma.matchScoreBuild.create({
      data: {
        versionId: data.versionId,
        buildHash: data.buildHash,
        buildManifestJson: data.buildManifestJson,
        status: "DEVELOPMENT",
        createdBy: data.createdBy,
      },
      include: {
        version: true,
      },
    });
  }

  /**
   * Retrieve a build by ID.
   *
   * @param id Build ID
   * @returns Build with version, or null if not found
   */
  async findById(id: string): Promise<BuildWithVersion | null> {
    return prisma.matchScoreBuild.findUnique({
      where: { id },
      include: {
        version: true,
      },
    });
  }

  /**
   * Retrieve a build by its reproducibility hash.
   *
   * @param buildHash Build hash (SHA256)
   * @returns Build with version, or null if not found
   */
  async findByHash(buildHash: string): Promise<BuildWithVersion | null> {
    return prisma.matchScoreBuild.findUnique({
      where: { buildHash },
      include: {
        version: true,
      },
    });
  }

  /**
   * Get all builds for a version.
   *
   * @param versionId Version ID
   * @returns Array of builds
   */
  async findByVersionId(versionId: string): Promise<BuildWithVersion[]> {
    return prisma.matchScoreBuild.findMany({
      where: { versionId },
      include: {
        version: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get builds for a specific version string (e.g., "1.0.0").
   *
   * @param versionString Semantic version string
   * @returns Array of builds
   */
  async findByVersionString(versionString: string): Promise<BuildWithVersion[]> {
    const version = await prisma.matchVersion.findUnique({
      where: { versionString },
    });

    if (!version) {
      return [];
    }

    return this.findByVersionId(version.id);
  }

  /**
   * Get all active builds (currently in production).
   *
   * @returns Array of active builds
   */
  async findActive(): Promise<BuildWithVersion[]> {
    return prisma.matchScoreBuild.findMany({
      where: { status: "ACTIVE" },
      include: {
        version: true,
      },
      orderBy: { activatedAt: "desc" },
    });
  }

  /**
   * Get the most recent active build (current production build).
   *
   * @returns Latest active build, or null if none
   */
  async findLatestActive(): Promise<BuildWithVersion | null> {
    return prisma.matchScoreBuild.findFirst({
      where: { status: "ACTIVE" },
      include: {
        version: true,
      },
      orderBy: { activatedAt: "desc" },
    });
  }

  /**
   * Get all builds in CANDIDATE status (ready for testing).
   *
   * @returns Array of candidate builds
   */
  async findCandidates(): Promise<BuildWithVersion[]> {
    return prisma.matchScoreBuild.findMany({
      where: { status: "CANDIDATE" },
      include: {
        version: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Promote build from DEVELOPMENT to CANDIDATE status.
   * Pre-promotion validation should be done by caller.
   *
   * @param id Build ID
   * @returns Updated build
   */
  async promoteToCandidate(id: string): Promise<BuildWithVersion> {
    const build = await prisma.matchScoreBuild.findUnique({
      where: { id },
    });

    if (!build) {
      throw new Error(`Build not found: ${id}`);
    }

    if (build.status !== "DEVELOPMENT") {
      throw new Error(
        `Can only promote DEVELOPMENT builds to CANDIDATE. Current status: ${build.status}`
      );
    }

    return prisma.matchScoreBuild.update({
      where: { id },
      data: {
        status: "CANDIDATE",
      },
      include: {
        version: true,
      },
    });
  }

  /**
   * Promote build from CANDIDATE to ACTIVE status.
   * Deactivates any currently active build for this version.
   * Pre-promotion validation should be done by caller.
   *
   * @param id Build ID
   * @returns Updated build
   */
  async promoteToActive(id: string): Promise<BuildWithVersion> {
    const build = await prisma.matchScoreBuild.findUnique({
      where: { id },
      include: {
        version: true,
      },
    });

    if (!build) {
      throw new Error(`Build not found: ${id}`);
    }

    if (build.status !== "CANDIDATE") {
      throw new Error(
        `Can only promote CANDIDATE builds to ACTIVE. Current status: ${build.status}`
      );
    }

    // Retire any currently active builds for this version
    await prisma.matchScoreBuild.updateMany({
      where: {
        versionId: build.versionId,
        status: "ACTIVE",
      },
      data: {
        status: "RETIRED",
        retiredAt: new Date(),
      },
    });

    // Promote this build to active
    return prisma.matchScoreBuild.update({
      where: { id },
      data: {
        status: "ACTIVE",
        activatedAt: new Date(),
      },
      include: {
        version: true,
      },
    });
  }

  /**
   * Retire a build (remove from production).
   * Typically used for emergency rollback or when demoting from active.
   *
   * @param id Build ID
   * @returns Updated build
   */
  async retire(id: string): Promise<BuildWithVersion> {
    const build = await prisma.matchScoreBuild.findUnique({
      where: { id },
    });

    if (!build) {
      throw new Error(`Build not found: ${id}`);
    }

    if (build.status === "RETIRED") {
      throw new Error("Build is already retired");
    }

    return prisma.matchScoreBuild.update({
      where: { id },
      data: {
        status: "RETIRED",
        retiredAt: new Date(),
      },
      include: {
        version: true,
      },
    });
  }

  /**
   * Count scores generated by a build.
   *
   * @param id Build ID
   * @returns Number of scores
   */
  async countScores(id: string): Promise<number> {
    return prisma.matchScore.count({
      where: { buildId: id },
    });
  }

  /**
   * Get builds ordered by creation (for lifecycle review).
   *
   * @returns Array of all builds
   */
  async findAllOrdered(): Promise<BuildWithVersion[]> {
    return prisma.matchScoreBuild.findMany({
      include: {
        version: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get build lifecycle statistics for a version.
   *
   * @param versionId Version ID
   * @returns Statistics including build count by status
   */
  async getVersionStatistics(versionId: string): Promise<{
    totalBuilds: number;
    developmentBuilds: number;
    candidateBuilds: number;
    activeBuilds: number;
    retiredBuilds: number;
    oldestBuild: Date | null;
    newestBuild: Date | null;
  }> {
    const builds = await prisma.matchScoreBuild.findMany({
      where: { versionId },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    const stats = {
      totalBuilds: builds.length,
      developmentBuilds: builds.filter((b) => b.status === "DEVELOPMENT").length,
      candidateBuilds: builds.filter((b) => b.status === "CANDIDATE").length,
      activeBuilds: builds.filter((b) => b.status === "ACTIVE").length,
      retiredBuilds: builds.filter((b) => b.status === "RETIRED").length,
      oldestBuild:
        builds.length > 0
          ? new Date(Math.min(...builds.map((b) => b.createdAt.getTime())))
          : null,
      newestBuild:
        builds.length > 0
          ? new Date(Math.max(...builds.map((b) => b.createdAt.getTime())))
          : null,
    };

    return stats;
  }

  // NOTE: Manifest is immutable — no update() method provided
  // Status can be changed via promotion methods only
}

/**
 * Export singleton instance
 */
export const matchScoreBuildRepository = new MatchScoreBuildRepository();
