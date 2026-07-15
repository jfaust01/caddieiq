/**
 * Tournament repository.
 *
 * The only layer permitted to persist tournaments. It accepts already-validated
 * `Tournament` domain objects and translates them into Prisma writes — no
 * mapping, validation, or external fetching.
 *
 * Relationships: `Tournament.tourId` is a required foreign key, but the base
 * `Tournament` domain object does not carry it (tour/season linkage is resolved
 * upstream on persist). Callers therefore supply the already-resolved `tourId`
 * (and optional `seasonId`) alongside the domain object. Inserting without a
 * resolved `tourId` is a genuine {@link RelationshipError}; updates to an
 * existing row do not require it.
 *
 * Idempotency: reconciliation is keyed by the unique, source-derived `slug`.
 */

import type { Tournament } from "@/lib/domain/tournament/types"
import type { ExternalReference } from "@/lib/domain/shared/types"
import type {
  Prisma,
  PrismaClient,
  Tournament as TournamentRecord,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { RelationshipError, toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

/**
 * A validated tournament plus the relationship keys resolved for it upstream.
 * `tourId` is required to create a new tournament (FK); both are optional for
 * updates.
 */
export interface TournamentPersistInput {
  tournament: Tournament
  /** Resolved tour foreign key. Required to insert a new tournament. */
  tourId?: string
  /** Resolved season foreign key, when applicable. */
  seasonId?: string | null
}

export class TournamentRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "tournament", sink)
  }

  /** Find a tournament by internal id. Excludes soft-deleted rows. */
  async findById(id: string): Promise<TournamentRecord | null> {
    const record = await this.prisma.tournament.findUnique({ where: { id } })
    return record && record.deletedAt === null ? record : null
  }

  /**
   * Find a tournament by an external provider reference.
   *
   * The current `tournaments` schema has no external-id column, so external
   * identity is reconciled via the deterministic `slug` at upsert time. Returns
   * `null` and logs a skip until a provenance column is added to the schema.
   * TODO(schema): persist `ExternalReference` and query it here.
   */
  async findByExternalId(ref: ExternalReference): Promise<TournamentRecord | null> {
    this.logger.skip(`${ref.source}:${ref.externalId}`, {
      reason: "external-id lookup not supported by current schema; reconcile by slug",
    })
    return null
  }

  /**
   * Idempotently persist a single validated tournament.
   *
   * Updates the existing row (by `slug`) when present; otherwise inserts, which
   * requires a resolved `tourId`. Missing that key on insert yields a
   * {@link RelationshipError} rather than a raw database failure.
   */
  async upsert(input: TournamentPersistInput): Promise<RepositoryResult<TournamentRecord>> {
    const { tournament, tourId, seasonId } = input
    const slug = tournament.slug

    try {
      const existing = await this.prisma.tournament.findUnique({ where: { slug } })

      if (existing) {
        const record = await this.prisma.tournament.update({
          where: { slug },
          data: toUpdateData(tournament, tourId, seasonId),
        })
        this.logger.update(slug)
        return ok(record, "updated")
      }

      if (!tourId) {
        const error = new RelationshipError("Cannot create tournament without a resolved tourId", {
          context: { entity: "tournament", operation: "upsert", reference: slug },
          relation: "tourId",
        })
        this.logger.failure(slug, error.message, { code: error.code, relation: "tourId" })
        return fail<TournamentRecord>(error)
      }

      const record = await this.prisma.tournament.create({
        data: toCreateData(tournament, tourId, seasonId),
      })
      this.logger.insert(slug)
      return ok(record, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "tournament", operation: "upsert", reference: slug })
      this.logger.failure(slug, repoError.message, { code: repoError.code })
      return fail<TournamentRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of tournaments. Never throws per item. */
  async bulkUpsert(
    inputs: readonly TournamentPersistInput[],
  ): Promise<BulkRepositoryResult<TournamentRecord>> {
    return this.runBulk(
      inputs,
      (input) => input.tournament.slug,
      (input) => this.upsert(input),
    )
  }
}

/** Build the Prisma `create` payload, connecting required/optional relations. */
function toCreateData(
  tournament: Tournament,
  tourId: string,
  seasonId?: string | null,
): Prisma.TournamentCreateInput {
  return {
    ...scalarFields(tournament),
    tour: { connect: { id: tourId } },
    ...(seasonId ? { season: { connect: { id: seasonId } } } : {}),
  }
}

/** Build the Prisma `update` payload, reconnecting relations when provided. */
function toUpdateData(
  tournament: Tournament,
  tourId?: string,
  seasonId?: string | null,
): Prisma.TournamentUpdateInput {
  return {
    ...scalarFields(tournament),
    ...(tourId ? { tour: { connect: { id: tourId } } } : {}),
    ...(seasonId === undefined ? {} : seasonId === null ? { season: { disconnect: true } } : { season: { connect: { id: seasonId } } }),
  }
}

/** Scalar (non-relation) columns shared by create/update. */
function scalarFields(tournament: Tournament) {
  return {
    name: tournament.name,
    officialName: tournament.officialName,
    slug: tournament.slug,
    status: tournament.status,
    format: tournament.format,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    // `purse` is `Decimal?` in the schema; Prisma accepts number | string | null.
    purse: tournament.purse,
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _tournamentRepository: TournamentRepository | undefined
export function getTournamentRepository(): TournamentRepository {
  return (_tournamentRepository ??= new TournamentRepository())
}
