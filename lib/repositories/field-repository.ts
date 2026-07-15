/**
 * Tournament field repository.
 *
 * The only layer permitted to persist tournament fields (the roster of players
 * entered in / competing at an event, stored in `tournament_fields`). It
 * accepts already-validated {@link TournamentFieldEntry} domain objects whose
 * `tournamentId`/`playerId` have already been resolved to CaddieIQ ids by the
 * field linker — it never maps, validates, or fetches.
 *
 * Idempotency: reconciliation is keyed by the composite unique
 * `(tournamentId, playerId)`, so re-importing a field updates each entry in
 * place (e.g. a withdrawal or a finish position) rather than duplicating it.
 * This differs from the slug-keyed repositories, so it upserts directly rather
 * than via `upsertBySlug`.
 */

import type { TournamentFieldEntry } from "@/lib/domain/field/types"
import { Prisma } from "@/lib/generated/prisma/client"
import type {
  TournamentField as TournamentFieldRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import {
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * A validated field entry whose reconciliation keys have already been resolved
 * to CaddieIQ ids by the field importer. The domain {@link TournamentFieldEntry}
 * intentionally carries no ids (it emits slugs + provenance only); resolving
 * those to a real `Tournament.id`/`Player.id` is a persistence-time concern, so
 * the linker pairs each entry with its resolved ids before calling the
 * repository. This keeps the "entries only ever link to players that already
 * exist" invariant enforced upstream of any write.
 */
export interface ResolvedFieldEntry {
  tournamentId: string
  playerId: string
  entry: TournamentFieldEntry
}

/** One entrant in a tournament field, flattened for UI rendering. */
export interface FieldEntryRow {
  id: string
  playerId: string
  playerName: string
  countryCode: string | null
  status: string
  isAlternate: boolean
  withdrawn: boolean
  cutMade: boolean | null
  /**
   * The player's most recent season World Golf Ranking, or null when no season
   * statistics have been imported for them. Sourced from the live season-stats
   * import — never fabricated. Treated as indicative given the provider tier's
   * known rank obfuscation.
   */
  worldRanking: number | null
}

/** Compact entrant used for the tournament hub's field preview. */
export interface FieldPreviewRow {
  playerId: string
  playerName: string
  countryCode: string | null
  status: string
}

export class FieldRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "field", sink)
  }

  /**
   * Idempotently persist one resolved field entry, reconciled on the composite
   * `(tournamentId, playerId)` key.
   */
  async upsert(resolved: ResolvedFieldEntry): Promise<RepositoryResult<TournamentFieldRecord>> {
    const { tournamentId, playerId, entry } = resolved
    const reference = `${tournamentId}:${playerId}`
    const data = {
      status: entry.status,
      isAlternate: entry.isAlternate,
      withdrawn: entry.withdrawn,
      disqualified: entry.disqualified,
      cutMade: entry.cutMade,
      finalPosition: entry.finalPosition,
      teeTime: entry.teeTime,
      earnings: entry.earnings == null ? null : new Prisma.Decimal(entry.earnings),
    }
    try {
      const existing = await this.prisma.tournamentField.findUnique({
        where: { tournamentId_playerId: { tournamentId, playerId } },
      })
      const record = await this.prisma.tournamentField.upsert({
        where: { tournamentId_playerId: { tournamentId, playerId } },
        create: { tournamentId, playerId, ...data },
        update: data,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "tournamentField",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<TournamentFieldRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved field entries. Never throws per item. */
  async bulkUpsert(
    entries: readonly ResolvedFieldEntry[],
  ): Promise<BulkRepositoryResult<TournamentFieldRecord>> {
    return this.runBulk(
      entries,
      (e) => `${e.tournamentId}:${e.playerId}`,
      (e) => this.upsert(e),
    )
  }

  /** Count the field size for a tournament (all entries, alternates included). */
  async countByTournament(tournamentId: string): Promise<number> {
    return this.prisma.tournamentField.count({ where: { tournamentId } })
  }

  /**
   * A small preview of a tournament's field for the hub, ordered alphabetically
   * by player name.
   *
   * Ordering is by name — NOT by finishing position — on purpose: the current
   * SportsDataIO tier obfuscates rank/result fields, so any "leaderboard"
   * ordering would be fabricated. An alphabetical roster is the honest,
   * stable presentation.
   */
  async previewByTournament(tournamentId: string, limit = 6): Promise<FieldPreviewRow[]> {
    return this.prisma.$queryRaw<FieldPreviewRow[]>(Prisma.sql`
      SELECT
        p.id AS "playerId",
        p."fullName" AS "playerName",
        p."countryCode" AS "countryCode",
        tf.status::text AS "status"
      FROM tournament_fields tf
      JOIN players p ON p.id = tf."playerId" AND p."deletedAt" IS NULL
      WHERE tf."tournamentId" = ${tournamentId}
      ORDER BY p."fullName" ASC
      LIMIT ${limit}
    `)
  }

  /**
   * The full field for a tournament, flattened with player identity for the
   * Field tab, ordered alphabetically by player name.
   *
   * As with {@link previewByTournament}, the ordering intentionally avoids
   * finishing position because the provider tier obfuscates it. Callers get a
   * clean roster and can re-sort client-side on the reliable dimensions (name,
   * participation status). Read-only.
   */
  async listByTournament(tournamentId: string): Promise<FieldEntryRow[]> {
    return this.prisma.$queryRaw<FieldEntryRow[]>(Prisma.sql`
      SELECT
        tf.id AS "id",
        p.id AS "playerId",
        p."fullName" AS "playerName",
        p."countryCode" AS "countryCode",
        tf.status::text AS "status",
        tf."isAlternate" AS "isAlternate",
        tf.withdrawn AS "withdrawn",
        tf."cutMade" AS "cutMade",
        stat."worldRanking" AS "worldRanking"
      FROM tournament_fields tf
      JOIN players p ON p.id = tf."playerId" AND p."deletedAt" IS NULL
      -- The player's most recent season ranking, if any has been imported.
      -- LEFT JOIN LATERAL keeps entrants without stats in the roster (rank null).
      LEFT JOIN LATERAL (
        SELECT s."worldRanking"
        FROM player_season_statistics s
        WHERE s."playerId" = p.id
        ORDER BY s.season DESC
        LIMIT 1
      ) stat ON true
      WHERE tf."tournamentId" = ${tournamentId}
      ORDER BY p."fullName" ASC
    `)
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _fieldRepository: FieldRepository | undefined
export function getFieldRepository(): FieldRepository {
  return (_fieldRepository ??= new FieldRepository())
}
