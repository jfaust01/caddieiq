/**
 * Repository for tournament-to-course mappings.
 *
 * Manages the persistent relationship between SportsDataIO tournaments
 * and GolfCourse API courses, serving as the single source of truth for
 * course enrichment and preventing duplicate searches.
 */

import type { PrismaClient, TournamentCourseMapping } from "@/lib/generated/prisma/client"

import { BaseRepository, type RepositoryLogSink } from "./base-repository"
import { fail, ok, okRead, type RepositoryResult } from "./repository-result"
import { toRepositoryError } from "./errors"

interface MappingInput {
  tournamentId: string
  sportsDataIoCourseId?: string
  golfCourseApiCourseId: number
  tournamentCourseName?: string
  golfCourseCourseName?: string
  matchConfidence?: number
  confidenceReason?: string
  matchedBy?: string
  verified?: boolean
  autoVerified?: boolean
  verificationStatus?: "PENDING_REVIEW" | "VERIFIED" | "REJECTED"
  rejectionReason?: string
  lastSyncedAt?: Date
}

const globalForRepository = globalThis as unknown as {
  tournamentCourseMappingRepository: TournamentCourseMappingRepository | undefined
}

export class TournamentCourseMappingRepository extends BaseRepository {
  constructor(prisma: PrismaClient, logger?: RepositoryLogSink) {
    super(prisma, "TournamentCourseMappingRepository", logger)
  }

  /**
   * Validate that a mapping can be marked as verified.
   * Mappings must have a valid golfCourseApiCourseId and positive matchConfidence to be verified.
   */
  private validateVerificationEligibility(input: Partial<MappingInput>): string | null {
    // Only validate if explicitly setting verified to true
    if (input.verified !== true) {
      return null
    }

    // Must have a valid golfCourseApiCourseId (> 0, not null)
    if (!input.golfCourseApiCourseId || input.golfCourseApiCourseId <= 0) {
      return `Cannot verify mapping: golfCourseApiCourseId must be > 0, got ${input.golfCourseApiCourseId}`
    }

    // Must have positive matchConfidence
    const confidence = input.matchConfidence ?? 0
    if (confidence <= 0) {
      return `Cannot verify mapping: matchConfidence must be > 0, got ${confidence}`
    }

    return null
  }

  /**
   * Find mapping by tournament ID.
   */
  async findByTournamentId(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping | null>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.findUnique({
        where: { tournamentId },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find mappings by GolfCourse API course ID.
   * Useful for finding all tournaments that map to a specific course.
   */
  async findByGolfCourseApiId(golfCourseApiCourseId: number): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { golfCourseApiCourseId },
        orderBy: { createdAt: "desc" },
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`golfcourse-${golfCourseApiCourseId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find mappings by SportsDataIO course ID.
   * Useful for finding the mapped GolfCourse API course for a SportsDataIO course.
   */
  async findBySportsDataIoCourseId(sportsDataIoCourseId: string): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { sportsDataIoCourseId },
        orderBy: { createdAt: "desc" },
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`sportsdataio-${sportsDataIoCourseId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Create a new mapping.
   */
  async create(input: MappingInput): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      // Validate state before persisting
      const validationError = this.validateVerificationEligibility(input)
      if (validationError) {
        return fail({
          code: "INVALID_STATE",
          message: validationError,
        })
      }

      const mapping = await this.prisma.tournamentCourseMapping.create({
        data: {
          tournamentId: input.tournamentId,
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence ?? 0,
          confidenceReason: input.confidenceReason,
          matchedBy: input.matchedBy ?? "manual",
          verified: input.verified ?? false,
          autoVerified: input.autoVerified ?? false,
          lastSyncedAt: input.lastSyncedAt,
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${input.tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Update an existing mapping.
   */
  async update(tournamentId: string, input: Partial<MappingInput>): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      // If updating verified state, validate eligibility
      if (input.verified === true) {
        // Need to fetch current mapping to validate with current values
        const currentMapping = await this.prisma.tournamentCourseMapping.findUnique({
          where: { tournamentId },
        })
        if (!currentMapping) {
          return fail({
            code: "NOT_FOUND",
            message: `Mapping not found for tournament ${tournamentId}`,
          })
        }

        // Validate with merged current + input values
        const mergedInput = {
          golfCourseApiCourseId: input.golfCourseApiCourseId ?? currentMapping.golfCourseApiCourseId,
          matchConfidence: input.matchConfidence ?? currentMapping.matchConfidence,
          verified: input.verified,
        }
        const validationError = this.validateVerificationEligibility(mergedInput)
        if (validationError) {
          return fail({
            code: "INVALID_STATE",
            message: validationError,
          })
        }
      }

      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: {
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence,
          confidenceReason: input.confidenceReason,
          matchedBy: input.matchedBy,
          verified: input.verified,
          autoVerified: input.autoVerified,
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: new Date(),
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Upsert (create or update) a mapping.
   * Defaults to unverified if creating.
   */
  async upsert(input: MappingInput): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.upsert({
        where: { tournamentId: input.tournamentId },
        update: {
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence ?? 0,
          confidenceReason: input.confidenceReason,
          matchedBy: input.matchedBy ?? "auto-matched",
          autoVerified: input.autoVerified ?? false,
          lastSyncedAt: input.lastSyncedAt ?? new Date(),
          updatedAt: new Date(),
        },
        create: {
          tournamentId: input.tournamentId,
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence ?? 0,
          confidenceReason: input.confidenceReason,
          matchedBy: input.matchedBy ?? "auto-matched",
          verified: input.verified ?? false,
          autoVerified: input.autoVerified ?? false,
          lastSyncedAt: input.lastSyncedAt ?? new Date(),
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${input.tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Mark a mapping as verified by an admin.
   */
  async verify(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: { verified: true, updatedAt: new Date() },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Delete a mapping.
   */
  async delete(tournamentId: string): Promise<RepositoryResult<void>> {
    try {
      await this.prisma.tournamentCourseMapping.delete({
        where: { tournamentId },
      })
      return ok(undefined)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all unverified mappings (pending admin review).
   */
  async findUnverified(limit = 100): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { verified: false },
        orderBy: { createdAt: "asc" },
        take: limit,
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("unverified-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all verified mappings (ready for import).
   * Checks both legacy verified boolean and new verificationStatus enum for compatibility.
   */
  async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: {
          OR: [
            { verified: true }, // Legacy field for backwards compatibility
            { verificationStatus: "VERIFIED" }, // New status enum
          ],
        },
        orderBy: { createdAt: "asc" },
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("verified-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all low-confidence unverified mappings (pending admin review).
   * Returns mappings with confidence < 95 that need manual verification.
   */
  async findLowConfidenceForReview(limit = 50): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: {
          verified: false,
          autoVerified: false,
          matchConfidence: { lt: 95 },
        },
        orderBy: [{ matchConfidence: "asc" }, { createdAt: "asc" }],
        take: limit,
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("low-confidence-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find high-confidence auto-verified mappings (confidence >= 95).
   */
  async findAutoVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { autoVerified: true },
        orderBy: { matchConfidence: "desc" },
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("auto-verified-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Get confidence statistics for all mappings.
   */
  async getConfidenceStatistics(): Promise<
    RepositoryResult<{
      totalMappings: number
      averageConfidence: number
      autoVerifiedCount: number
      manualVerifiedCount: number
      pendingReviewCount: number
      confidenceDistribution: {
        veryHigh: number // 95-100
        high: number // 80-94
        medium: number // 60-79
        low: number // 40-59
        veryLow: number // 0-39
      }
    }>
  > {
    try {
      const [stats] = await this.prisma.$queryRaw<
        Array<{
          total: number
          avg_confidence: number
          auto_verified: number
          manual_verified: number
          pending: number
        }>
      >`
        SELECT
          COUNT(*) as total,
          ROUND(AVG(CAST("matchConfidence" AS FLOAT)), 2) as avg_confidence,
          SUM(CASE WHEN "autoVerified" = true THEN 1 ELSE 0 END) as auto_verified,
          SUM(CASE WHEN "verified" = true AND "autoVerified" = false THEN 1 ELSE 0 END) as manual_verified,
          SUM(CASE WHEN "verified" = false THEN 1 ELSE 0 END) as pending
        FROM "tournament_course_mappings"
      `

      const distribution = await this.prisma.$queryRaw<
        Array<{
          range: string
          count: number
        }>
      >`
        SELECT
          CASE
            WHEN "matchConfidence" >= 95 THEN 'veryHigh'
            WHEN "matchConfidence" >= 80 THEN 'high'
            WHEN "matchConfidence" >= 60 THEN 'medium'
            WHEN "matchConfidence" >= 40 THEN 'low'
            ELSE 'veryLow'
          END as range,
          COUNT(*) as count
        FROM "tournament_course_mappings"
        GROUP BY range
      `

      const dist = {
        veryHigh: 0,
        high: 0,
        medium: 0,
        low: 0,
        veryLow: 0,
      }

      for (const d of distribution) {
        dist[d.range as keyof typeof dist] = d.count
      }

      return ok({
        totalMappings: stats.total || 0,
        averageConfidence: stats.avg_confidence || 0,
        autoVerifiedCount: stats.auto_verified || 0,
        manualVerifiedCount: stats.manual_verified || 0,
        pendingReviewCount: stats.pending || 0,
        confidenceDistribution: dist,
      })
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("confidence-statistics", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all mappings pending manual review.
   * Returns confidence < 95 that have not been verified or rejected.
   */
  async findPendingReview(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: {
          verificationStatus: "PENDING_REVIEW",
        },
        orderBy: [{ matchConfidence: "asc" }, { createdAt: "asc" }],
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("pending-review-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all rejected mappings.
   */
  async findRejected(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: {
          verificationStatus: "REJECTED",
        },
        orderBy: { createdAt: "desc" },
      })
      return okRead(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("rejected-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Verify a single mapping by setting status to VERIFIED.
   */
  async verifyMapping(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: {
          verificationStatus: "VERIFIED",
          verified: true, // Legacy field for importer compatibility
          rejectionReason: null, // Clear any previous rejection reason
          updatedAt: new Date(),
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`verify-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Reject a mapping by setting status to REJECTED with optional reason.
   */
  async rejectMapping(
    tournamentId: string,
    reason?: string,
  ): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: {
          verificationStatus: "REJECTED",
          verified: false, // Prevent importer from processing
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`reject-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Mark a mapping for re-searching.
   * Returns it to PENDING_REVIEW status and clears verification data.
   */
  async markForReSearch(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: {
          verificationStatus: "PENDING_REVIEW",
          verified: false,
          autoVerified: false,
          rejectionReason: "Marked for re-search",
          matchConfidence: 0,
          confidenceReason: "Awaiting re-search",
          updatedAt: new Date(),
        },
      })
      return ok(mapping)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`research-${tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Bulk verify multiple mappings.
   */
  async bulkVerify(tournamentIds: string[]): Promise<RepositoryResult<number>> {
    try {
      // NEW: Validate all mappings are eligible for verification
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { tournamentId: { in: tournamentIds } },
        select: { tournamentId, golfCourseApiCourseId, matchConfidence, verified },
      })

      // Check each mapping has valid state for verification
      for (const mapping of mappings) {
        if (!mapping.golfCourseApiCourseId || mapping.golfCourseApiCourseId <= 0) {
          return fail({
            code: "INVALID_STATE",
            message: `Cannot verify: mapping ${mapping.tournamentId} has invalid golfCourseApiCourseId (${mapping.golfCourseApiCourseId})`,
          })
        }
        if (mapping.matchConfidence <= 0) {
          return fail({
            code: "INVALID_CONFIDENCE",
            message: `Cannot verify: mapping ${mapping.tournamentId} has insufficient confidence score (${mapping.matchConfidence})`,
          })
        }
      }

      const result = await this.prisma.tournamentCourseMapping.updateMany({
        where: { tournamentId: { in: tournamentIds } },
        data: {
          verificationStatus: "VERIFIED",
          verified: true,
          rejectionReason: null,
          updatedAt: new Date(),
        },
      })
      return ok(result.count)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("bulk-verify", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Bulk reject multiple mappings.
   */
  async bulkReject(
    tournamentIds: string[],
    reason?: string,
  ): Promise<RepositoryResult<number>> {
    try {
      const result = await this.prisma.tournamentCourseMapping.updateMany({
        where: { tournamentId: { in: tournamentIds } },
        data: {
          verificationStatus: "REJECTED",
          verified: false,
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      })
      return ok(result.count)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("bulk-reject", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Get comprehensive verification statistics.
   */
  async getVerificationStatistics(): Promise<
    RepositoryResult<{
      totalMappings: number
      verifiedCount: number
      pendingReviewCount: number
      rejectedCount: number
      averageConfidence: number
      confidenceDistribution: {
        veryHigh: number // 95-100
        high: number // 80-94
        medium: number // 60-79
        low: number // 40-59
        veryLow: number // 0-39
      }
    }>
  > {
    try {
      const stats = await this.prisma.$queryRaw<
        Array<{
          total: number
          verified: number
          pending: number
          rejected: number
          avg_confidence: number
        }>
      >`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN "verificationStatus" = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN "verificationStatus" = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN "verificationStatus" = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
          ROUND(AVG(CAST("matchConfidence" AS FLOAT)), 2) as avg_confidence
        FROM "tournament_course_mappings"
      `

      const distribution = await this.prisma.$queryRaw<
        Array<{
          range: string
          count: number
        }>
      >`
        SELECT
          CASE
            WHEN "matchConfidence" >= 95 THEN 'veryHigh'
            WHEN "matchConfidence" >= 80 THEN 'high'
            WHEN "matchConfidence" >= 60 THEN 'medium'
            WHEN "matchConfidence" >= 40 THEN 'low'
            ELSE 'veryLow'
          END as range,
          COUNT(*) as count
        FROM "tournament_course_mappings"
        GROUP BY range
      `

      const [statRow] = stats
      const dist = {
        veryHigh: 0,
        high: 0,
        medium: 0,
        low: 0,
        veryLow: 0,
      }

      for (const d of distribution) {
        dist[d.range as keyof typeof dist] = d.count
      }

      return ok({
        totalMappings: statRow.total || 0,
        verifiedCount: statRow.verified || 0,
        pendingReviewCount: statRow.pending || 0,
        rejectedCount: statRow.rejected || 0,
        averageConfidence: statRow.avg_confidence || 0,
        confidenceDistribution: dist,
      })
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("verification-statistics", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }
}

export function getTournamentCourseMappingRepository(
  prisma?: PrismaClient,
  logger?: RepositoryLogSink,
): TournamentCourseMappingRepository {
  if (!globalForRepository.tournamentCourseMappingRepository) {
    const { prisma: defaultPrisma } = require("@/lib/prisma")
    globalForRepository.tournamentCourseMappingRepository = new TournamentCourseMappingRepository(
      prisma || defaultPrisma,
      logger,
    )
  }
  return globalForRepository.tournamentCourseMappingRepository
}
