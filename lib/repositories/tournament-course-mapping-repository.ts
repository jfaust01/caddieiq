/**
 * Repository for tournament-to-course mappings.
 *
 * Manages the persistent relationship between SportsDataIO tournaments
 * and GolfCourse API courses, serving as the single source of truth for
 * course enrichment and preventing duplicate searches.
 */

import type { PrismaClient, TournamentCourseMapping } from "@/lib/generated/prisma/client"

import { BaseRepository, type RepositoryLogSink } from "./base-repository"
import { fail, ok, type Result } from "@/lib/domain/result"
import { toRepositoryError } from "@/lib/errors"

interface MappingInput {
  tournamentId: string
  sportsDataIoCourseId?: string
  golfCourseApiCourseId: number
  tournamentCourseName?: string
  golfCourseCourseName?: string
  matchConfidence?: number
  matchedBy?: string
  verified?: boolean
  lastSyncedAt?: Date
}

const globalForRepository = globalThis as unknown as {
  tournamentCourseMappingRepository: TournamentCourseMappingRepository | undefined
}

export class TournamentCourseMappingRepository extends BaseRepository {
  constructor(prisma: PrismaClient, logger?: RepositoryLogSink) {
    super("TournamentCourseMappingRepository", prisma, logger)
  }

  /**
   * Find a mapping by tournament ID.
   */
  async findByTournamentId(tournamentId: string): Promise<Result<TournamentCourseMapping | null>> {
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
  async findByGolfCourseApiId(golfCourseApiCourseId: number): Promise<Result<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { golfCourseApiCourseId },
        orderBy: { createdAt: "desc" },
      })
      return ok(mappings)
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
  async findBySportsDataIoCourseId(sportsDataIoCourseId: string): Promise<Result<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { sportsDataIoCourseId },
        orderBy: { createdAt: "desc" },
      })
      return ok(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`sportsdataio-${sportsDataIoCourseId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Create a new mapping.
   */
  async create(input: MappingInput): Promise<Result<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.create({
        data: {
          tournamentId: input.tournamentId,
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence ?? 0,
          matchedBy: input.matchedBy ?? "manual",
          verified: input.verified ?? false,
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
  async update(tournamentId: string, input: Partial<MappingInput>): Promise<Result<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.update({
        where: { tournamentId },
        data: {
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence,
          matchedBy: input.matchedBy,
          verified: input.verified,
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
  async upsert(input: MappingInput): Promise<Result<TournamentCourseMapping>> {
    try {
      const mapping = await this.prisma.tournamentCourseMapping.upsert({
        where: { tournamentId: input.tournamentId },
        update: {
          sportsDataIoCourseId: input.sportsDataIoCourseId,
          golfCourseApiCourseId: input.golfCourseApiCourseId,
          tournamentCourseName: input.tournamentCourseName,
          golfCourseCourseName: input.golfCourseCourseName,
          matchConfidence: input.matchConfidence ?? 0,
          matchedBy: input.matchedBy ?? "auto-matched",
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
          matchedBy: input.matchedBy ?? "auto-matched",
          verified: input.verified ?? false,
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
  async verify(tournamentId: string): Promise<Result<TournamentCourseMapping>> {
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
  async delete(tournamentId: string): Promise<Result<void>> {
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
  async findUnverified(limit = 100): Promise<Result<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { verified: false },
        orderBy: { createdAt: "asc" },
        take: limit,
      })
      return ok(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("unverified-mappings", repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Find all verified mappings (ready for import).
   */
  async findVerified(): Promise<Result<TournamentCourseMapping[]>> {
    try {
      const mappings = await this.prisma.tournamentCourseMapping.findMany({
        where: { verified: true },
        orderBy: { createdAt: "asc" },
      })
      return ok(mappings)
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure("verified-mappings", repoError.message, { code: repoError.code })
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
