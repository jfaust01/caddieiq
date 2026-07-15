/**
 * Player repository.
 *
 * The only layer permitted to persist players. It accepts already-validated
 * `Player` domain objects and translates them into Prisma writes. It does not
 * map from providers, validate, or fetch external data.
 *
 * Idempotency: the unique `slug` (a deterministic, source-derived value on the
 * domain object) is the reconciliation key, so re-importing the same player
 * updates the existing row instead of creating a duplicate.
 */

import type { Player } from "@/lib/domain/player/types"
import type { ExternalReference } from "@/lib/domain/shared/types"
import type { Player as PlayerRecord, Prisma, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import type { RepositoryLogSink } from "./logger"
import type { BulkRepositoryResult, RepositoryResult } from "./repository-result"

export class PlayerRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "player", sink)
  }

  /** Find a player by internal id. Excludes soft-deleted rows. */
  async findById(id: string): Promise<PlayerRecord | null> {
    const record = await this.prisma.player.findUnique({ where: { id } })
    return record && record.deletedAt === null ? record : null
  }

  /** Find a player by unique slug. Excludes soft-deleted rows. */
  async findBySlug(slug: string): Promise<PlayerRecord | null> {
    const record = await this.prisma.player.findUnique({ where: { slug } })
    return record && record.deletedAt === null ? record : null
  }

  /**
   * Find a player by an external provider reference.
   *
   * NOTE: the current `players` schema has no provider/external-id column, so
   * external identity cannot be resolved directly. Reconciliation is therefore
   * handled via the deterministic `slug` on the domain object at upsert time.
   * This method is part of the repository contract; it returns `null` and logs
   * a skip until a provenance column (e.g. `externalRefs`) is added to the
   * schema. TODO(schema): persist `ExternalReference` and query it here.
   */
  async findByExternalId(ref: ExternalReference): Promise<PlayerRecord | null> {
    this.logger.skip(`${ref.source}:${ref.externalId}`, {
      reason: "external-id lookup not supported by current schema; reconcile by slug",
    })
    return null
  }

  /** Idempotently persist a single validated player domain object. */
  async upsert(player: Player): Promise<RepositoryResult<PlayerRecord>> {
    return this.upsertBySlug(this.prisma.player, toUpsertPlan(player), "player")
  }

  /** Idempotently persist a batch of validated players. Never throws per item. */
  async bulkUpsert(players: readonly Player[]): Promise<BulkRepositoryResult<PlayerRecord>> {
    return this.runBulk(
      players,
      (p) => p.slug,
      (p) => this.upsert(p),
    )
  }

  /**
   * Soft-delete a player by id (sets `deletedAt`). Returns `skipped` when the
   * player does not exist or is already deleted, `updated` when it was deleted.
   */
  async delete(id: string): Promise<RepositoryResult<PlayerRecord>> {
    try {
      const existing = await this.prisma.player.findUnique({ where: { id } })
      if (!existing || existing.deletedAt !== null) {
        this.logger.skip(id, { reason: "not found or already deleted" })
        return { outcome: "skipped" }
      }
      const record = await this.prisma.player.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      this.logger.update(existing.slug, { operation: "soft-delete" })
      return { outcome: "updated", record }
    } catch (error) {
      const { toRepositoryError } = await import("./errors")
      const repoError = toRepositoryError(error, { entity: "player", operation: "delete", reference: id })
      this.logger.failure(id, repoError.message, { code: repoError.code })
      return { outcome: "failed", error: repoError }
    }
  }
}

/** Translate a validated `Player` into a Prisma upsert plan keyed by slug. */
function toUpsertPlan(player: Player): UpsertPlan<Prisma.PlayerCreateInput, Prisma.PlayerUpdateInput> {
  const common = {
    firstName: player.firstName,
    lastName: player.lastName,
    fullName: player.fullName,
    slug: player.slug,
    birthDate: player.birthDate,
    heightCm: player.heightCm,
    weightKg: player.weightKg,
    turnedProYear: player.turnedProYear,
    handedness: player.handedness,
    status: player.status,
    headshotUrl: player.headshotUrl,
    countryCode: player.countryCode,
  }
  return { slug: player.slug, create: common, update: common }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * merely importing this module never forces a database connection (e.g. in
 * unit tests that use the class directly with a fake client).
 */
let _playerRepository: PlayerRepository | undefined
export function getPlayerRepository(): PlayerRepository {
  return (_playerRepository ??= new PlayerRepository())
}
