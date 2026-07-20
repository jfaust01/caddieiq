/**
 * MatchVersionRepository — Data access layer for match model versions.
 *
 * Manages semantic versioning (MAJOR.MINOR.PATCH) and algorithm type tracking.
 * Every version is immutable; only new versions can be created.
 *
 * Reference: docs/MATCH_VERSION_ARCHITECTURE.md
 * Reference: docs/BUILD_REPRODUCIBILITY.md
 */

import { prisma } from "@/lib/prisma";
import type { MatchVersion, MatchAlgorithmType } from "@prisma/client";

export interface CreateVersionInput {
  versionString: string; // "MAJOR.MINOR.PATCH" format
  major: number;
  minor: number;
  patch: number;
  releaseType?: "ALPHA" | "BETA" | "RC" | "STABLE";
  description?: string;
  algorithmType: MatchAlgorithmType;
  calibrationDate?: Date;
}

/**
 * Repository for MatchVersion operations.
 * Enforces semantic versioning and immutability.
 */
export class MatchVersionRepository {
  /**
   * Create a new model version. Version string is immutable after creation.
   *
   * @param data Version data
   * @returns Created version
   */
  async create(data: CreateVersionInput): Promise<MatchVersion> {
    // Validate semantic versioning format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(data.versionString)) {
      throw new Error(
        `Invalid version format: ${data.versionString}. Must be MAJOR.MINOR.PATCH`
      );
    }

    // Check major.minor.patch uniqueness
    const existing = await prisma.matchVersion.findFirst({
      where: {
        major: data.major,
        minor: data.minor,
        patch: data.patch,
      },
    });

    if (existing) {
      throw new Error(
        `Version ${data.versionString} already exists. Versions are immutable.`
      );
    }

    // Check versionString uniqueness
    const existingByString = await prisma.matchVersion.findUnique({
      where: { versionString: data.versionString },
    });

    if (existingByString) {
      throw new Error(`Version string ${data.versionString} already exists.`);
    }

    return prisma.matchVersion.create({
      data: {
        versionString: data.versionString,
        major: data.major,
        minor: data.minor,
        patch: data.patch,
        releaseType: data.releaseType || "STABLE",
        description: data.description,
        algorithmType: data.algorithmType,
        calibrationDate: data.calibrationDate,
      },
    });
  }

  /**
   * Retrieve a version by ID.
   *
   * @param id Version ID
   * @returns Version or null if not found
   */
  async findById(id: string): Promise<MatchVersion | null> {
    return prisma.matchVersion.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieve a version by its version string (e.g., "1.0.0").
   *
   * @param versionString Semantic version string
   * @returns Version or null if not found
   */
  async findByVersionString(versionString: string): Promise<MatchVersion | null> {
    return prisma.matchVersion.findUnique({
      where: { versionString },
    });
  }

  /**
   * Get all versions in ascending order (oldest first).
   *
   * @returns All versions
   */
  async findAllAscending(): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      orderBy: [{ major: "asc" }, { minor: "asc" }, { patch: "asc" }],
    });
  }

  /**
   * Get all versions in descending order (newest first).
   *
   * @returns All versions
   */
  async findAllDescending(): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      orderBy: [
        { major: "desc" },
        { minor: "desc" },
        { patch: "desc" },
      ],
    });
  }

  /**
   * Get the latest version (highest MAJOR.MINOR.PATCH).
   *
   * @returns Latest version or null if none exist
   */
  async findLatest(): Promise<MatchVersion | null> {
    const versions = await this.findAllDescending();
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Get the latest version of a specific major.minor.
   *
   * @param major Major version number
   * @param minor Minor version number
   * @returns Latest patch version or null
   */
  async findLatestPatch(major: number, minor: number): Promise<MatchVersion | null> {
    return prisma.matchVersion.findFirst({
      where: { major, minor },
      orderBy: { patch: "desc" },
    });
  }

  /**
   * Get all versions of a specific major release.
   *
   * @param major Major version number
   * @returns All versions with this major number
   */
  async findByMajor(major: number): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      where: { major },
      orderBy: [{ minor: "asc" }, { patch: "asc" }],
    });
  }

  /**
   * Get all versions of a specific major.minor series.
   *
   * @param major Major version number
   * @param minor Minor version number
   * @returns All patch versions in this series
   */
  async findByMajorMinor(major: number, minor: number): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      where: { major, minor },
      orderBy: { patch: "asc" },
    });
  }

  /**
   * Get all versions with a specific release type.
   *
   * @param releaseType Release type (ALPHA, BETA, RC, STABLE)
   * @returns Versions with this release type
   */
  async findByReleaseType(
    releaseType: "ALPHA" | "BETA" | "RC" | "STABLE"
  ): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      where: { releaseType },
      orderBy: [{ major: "desc" }, { minor: "desc" }, { patch: "desc" }],
    });
  }

  /**
   * Get all versions trained with a specific algorithm.
   *
   * @param algorithmType Algorithm type
   * @returns Versions using this algorithm
   */
  async findByAlgorithmType(algorithmType: string): Promise<MatchVersion[]> {
    return prisma.matchVersion.findMany({
      where: { algorithmType: algorithmType as any },
      orderBy: [{ major: "desc" }, { minor: "desc" }, { patch: "desc" }],
    });
  }

  /**
   * Count all builds for a version.
   *
   * @param versionId Version ID
   * @returns Number of builds
   */
  async countBuilds(versionId: string): Promise<number> {
    return prisma.matchScoreBuild.count({
      where: { versionId },
    });
  }

  /**
   * Count all scores generated by a version across all its builds.
   *
   * @param versionId Version ID
   * @returns Number of scores
   */
  async countScores(versionId: string): Promise<number> {
    const builds = await prisma.matchScoreBuild.findMany({
      where: { versionId },
      select: { id: true },
    });

    if (builds.length === 0) return 0;

    return prisma.matchScore.count({
      where: {
        buildId: { in: builds.map((b) => b.id) },
      },
    });
  }

  /**
   * Get comprehensive version statistics.
   *
   * @param versionId Version ID
   * @returns Statistics including builds, scores, and coverage
   */
  async getStatistics(versionId: string): Promise<{
    version: MatchVersion | null;
    buildCount: number;
    scoreCount: number;
    activeBuilds: number;
    candidateBuilds: number;
  }> {
    const version = await this.findById(versionId);
    const buildCount = await this.countBuilds(versionId);
    const scoreCount = await this.countScores(versionId);

    const builds = await prisma.matchScoreBuild.findMany({
      where: { versionId },
      select: { status: true },
    });

    const activeBuilds = builds.filter((b) => b.status === "ACTIVE").length;
    const candidateBuilds = builds.filter((b) => b.status === "CANDIDATE").length;

    return {
      version,
      buildCount,
      scoreCount,
      activeBuilds,
      candidateBuilds,
    };
  }

  /**
   * Get version history (for UI/documentation).
   *
   * @returns All versions with creation dates, ordered newest first
   */
  async getHistory(): Promise<Array<MatchVersion & { buildCount: number }>> {
    const versions = await this.findAllDescending();

    const withCounts = await Promise.all(
      versions.map(async (v) => ({
        ...v,
        buildCount: await this.countBuilds(v.id),
      }))
    );

    return withCounts;
  }

  /**
   * Validate version compatibility (e.g., can v2.0.0 be promoted after v1.5.2?).
   * Simple rule: next version must be MAJOR+1 (with MINOR.PATCH = 0)
   * or MINOR+1 (with PATCH = 0), or PATCH+1.
   *
   * @param currentVersion Current version in production
   * @param nextVersion Proposed next version
   * @returns true if valid progression, false otherwise
   */
  validateProgression(currentVersion: MatchVersion, nextVersion: MatchVersion): boolean {
    // Cannot go backwards
    if (nextVersion.major < currentVersion.major) return false;
    if (
      nextVersion.major === currentVersion.major &&
      nextVersion.minor < currentVersion.minor
    )
      return false;
    if (
      nextVersion.major === currentVersion.major &&
      nextVersion.minor === currentVersion.minor &&
      nextVersion.patch <= currentVersion.patch
    )
      return false;

    // Valid progressions:
    // 1.0.0 -> 1.0.1 (patch bump)
    // 1.0.0 -> 1.1.0 (minor bump, patch reset)
    // 1.0.0 -> 2.0.0 (major bump, minor and patch reset)

    if (nextVersion.major > currentVersion.major) {
      // Major bump: minor and patch must be 0
      return nextVersion.minor === 0 && nextVersion.patch === 0;
    }

    if (nextVersion.minor > currentVersion.minor) {
      // Minor bump: patch must be 0
      return nextVersion.patch === 0;
    }

    // Patch bump is always valid (if > current patch)
    return true;
  }

  // NOTE: No update() method — versions are immutable after creation
}

/**
 * Export singleton instance
 */
export const matchVersionRepository = new MatchVersionRepository();
