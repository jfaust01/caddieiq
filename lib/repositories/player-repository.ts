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
// `Prisma` is imported as a value (not type-only): the directory search below
// uses `Prisma.sql`/`Prisma.join` to compose a safe, parameterized raw query.
import { Prisma } from "@/lib/generated/prisma/client"
import type { Player as PlayerRecord, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import type { RepositoryLogSink } from "./logger"
import type { BulkRepositoryResult, RepositoryResult } from "./repository-result"

/**
 * Relations the read/directory surfaces need alongside the base player row:
 * the resolved nationality, the active tour membership (with its tour), and the
 * player's ranking history (newest first) so callers can derive the current
 * world ranking without a second query.
 */
const playerReadInclude = {
  nationality: true,
  tourHistory: {
    where: { active: true },
    include: { tour: true },
    orderBy: { joinedAt: "desc" },
  },
  rankings: {
    orderBy: { effectiveDate: "desc" },
  },
  // Season-level statistics, newest season first, so the detail mapper can show
  // the latest season prominently and prior seasons as history.
  seasonStatistics: {
    orderBy: { season: "desc" },
  },
} satisfies Prisma.PlayerInclude

/** A player row joined with the relations required by the read surfaces. */
export type PlayerWithRelations = Prisma.PlayerGetPayload<{ include: typeof playerReadInclude }>

/**
 * Fully-resolved, database-ready parameters for {@link PlayerRepository.search}.
 * The feature service translates UI filter state (with its `"ALL"` sentinels)
 * into this shape; every field here is an active constraint. `skip`/`take` are
 * the pagination window; all other fields are optional filters.
 */
export interface PlayerSearchParams {
  /** Case-insensitive substring match against the player's full name. */
  search?: string
  /** Database `Tour` enum value (e.g. `"PGA"`); matches the active membership. */
  tourType?: string
  /** ISO-3 nationality code or denormalized country code. */
  nationality?: string
  /** Database `Handedness` value (`"RIGHT"` | `"LEFT"`). */
  handedness?: string
  /** Database `PlayerStatus` values to include (already band-expanded). */
  statuses?: string[]
  /** Inclusive upper bound on current OWGR rank (top-N band). */
  rankingLimit?: number
  /** Rows to skip (pagination offset). */
  skip: number
  /** Rows to return (page size). */
  take: number
}

export class PlayerRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "player", sink)
  }

  /**
   * Server-side directory search: filter, sort, and paginate players *in the
   * database* and return only the requested page (plus the total match count).
   *
   * This is deliberately not a "load everything and slice in JS" method — the
   * table holds thousands of players, so every filter, the ranking sort, and
   * pagination must execute as SQL. Ordering by "current OWGR rank, unranked
   * last, then name" depends on the latest ranking row per player, which the
   * Prisma query builder can't express as an `orderBy`; a small parameterized
   * raw query resolves the ordered, paginated ids, which are then hydrated with
   * the standard read relations. All user input is bound (never interpolated),
   * so the raw query is injection-safe. Read-only — never mutates.
   */
  async search(params: PlayerSearchParams): Promise<{ items: PlayerWithRelations[]; total: number }> {
    const conditions: Prisma.Sql[] = [Prisma.sql`p."deletedAt" IS NULL`]

    if (params.search) {
      conditions.push(Prisma.sql`p."fullName" ILIKE ${`%${params.search}%`}`)
    }
    if (params.handedness) {
      conditions.push(Prisma.sql`p.handedness::text = ${params.handedness}`)
    }
    if (params.statuses && params.statuses.length > 0) {
      conditions.push(Prisma.sql`p.status::text IN (${Prisma.join(params.statuses)})`)
    }
    if (params.nationality) {
      conditions.push(
        Prisma.sql`(EXISTS (
          SELECT 1 FROM nationalities n
          WHERE n.id = p."nationalityId" AND n.iso3 = ${params.nationality}
        ) OR p."countryCode" = ${params.nationality})`,
      )
    }
    if (params.tourType) {
      conditions.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM player_tour_histories th
          JOIN tours t ON t.id = th."tourId"
          WHERE th."playerId" = p.id AND th.active = true AND t.type::text = ${params.tourType}
        )`,
      )
    }
    if (typeof params.rankingLimit === "number") {
      conditions.push(Prisma.sql`owgr.rank <= ${params.rankingLimit}`)
    }

    const where = Prisma.join(conditions, " AND ")
    // Latest OWGR rank per player, joined once and reused for both the ranking
    // filter (WHERE) and the ranking sort (ORDER BY).
    const from = Prisma.sql`
      FROM players p
      LEFT JOIN LATERAL (
        SELECT pr.rank FROM player_rankings pr
        WHERE pr."playerId" = p.id AND pr."rankingSystem" = 'OWGR'
        ORDER BY pr."effectiveDate" DESC
        LIMIT 1
      ) owgr ON true
    `

    const totalRows = await this.prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT count(*)::int AS total ${from} WHERE ${where}`,
    )
    const total = totalRows[0]?.total ?? 0
    if (total === 0 || params.take <= 0) return { items: [], total }

    // Clamp the offset to the last populated page so an over-shooting request
    // (e.g. the active page after filters shrink the result set) returns real
    // rows instead of an empty page.
    const lastPageSkip = Math.max(0, (Math.ceil(total / params.take) - 1) * params.take)
    const skip = Math.min(Math.max(0, params.skip), lastPageSkip)

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT p.id ${from}
        WHERE ${where}
        ORDER BY owgr.rank ASC NULLS LAST, p."fullName" ASC
        LIMIT ${params.take} OFFSET ${skip}
      `,
    )
    const ids = idRows.map((row) => row.id)
    if (ids.length === 0) return { items: [], total }

    // Hydrate the page's ids with the read relations, then restore the SQL order
    // (a `WHERE id IN (…)` query does not preserve ordering).
    const records = await this.prisma.player.findMany({
      where: { id: { in: ids } },
      include: playerReadInclude,
    })
    const byId = new Map(records.map((record) => [record.id, record]))
    const items = ids
      .map((id) => byId.get(id))
      .filter((record): record is PlayerWithRelations => record !== undefined)
    return { items, total }
  }

  /**
   * Distinct nationalities/countries that are actually referenced by at least
   * one non-deleted player — the source for the directory's nationality filter.
   * Unions linked `nationalities` (by ISO-3) with the denormalized `countryCode`
   * of players that have no linked nationality record, mirroring how the mapper
   * resolves a player's nationality. Read-only.
   */
  async listReferencedNationalities(): Promise<Array<{ code: string; name: string }>> {
    return this.prisma.$queryRaw<Array<{ code: string; name: string }>>(Prisma.sql`
      SELECT code, name FROM (
        SELECT DISTINCT n.iso3 AS code, n.name AS name
        FROM nationalities n
        JOIN players p ON p."nationalityId" = n.id
        WHERE p."deletedAt" IS NULL AND n."deletedAt" IS NULL
        UNION
        SELECT DISTINCT p."countryCode" AS code, p."countryCode" AS name
        FROM players p
        WHERE p."deletedAt" IS NULL
          AND p."nationalityId" IS NULL
          AND p."countryCode" IS NOT NULL
      ) options
      ORDER BY name ASC
    `)
  }

  /**
   * How many non-deleted players carry an active tour membership, versus the
   * total. Tour classification lives only in `player_tour_histories` (there is
   * no tour column on `players`), and the current player import does not
   * populate it — so this reports how meaningfully the tour filter can partition
   * the directory. The feature layer uses it to decide whether to offer the
   * tour filter at all. Read-only.
   */
  async getActiveTourCoverage(): Promise<{ withTour: number; total: number }> {
    const rows = await this.prisma.$queryRaw<Array<{ with_tour: number; total: number }>>(Prisma.sql`
      SELECT
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM player_tour_histories th
            WHERE th."playerId" = p.id AND th.active = true
          )
        )::int AS with_tour,
        count(*)::int AS total
      FROM players p
      WHERE p."deletedAt" IS NULL
    `)
    return { withTour: rows[0]?.with_tour ?? 0, total: rows[0]?.total ?? 0 }
  }

  /**
   * Compact display metadata for a set of player ids — full name, country code,
   * and active tour type — for surfaces (like the rankings directory) that get
   * their ordering from the derived engines but still need to label each player.
   *
   * Batched into a single query and returned unordered; the caller restores the
   * engine's ordering. Ids that are missing or soft-deleted are simply absent
   * from the result rather than fabricated. Read-only.
   */
  async findDirectoryMetadataByIds(
    ids: readonly string[],
  ): Promise<Array<{ id: string; fullName: string; countryCode: string | null; tourType: string | null }>> {
    if (ids.length === 0) return []
    return this.prisma.$queryRaw<
      Array<{ id: string; fullName: string; countryCode: string | null; tourType: string | null }>
    >(Prisma.sql`
      SELECT
        p.id,
        p."fullName",
        COALESCE(n.iso3, p."countryCode") AS "countryCode",
        (
          SELECT t.type::text
          FROM player_tour_histories th
          JOIN tours t ON t.id = th."tourId"
          WHERE th."playerId" = p.id AND th.active = true
          ORDER BY th."joinedAt" DESC
          LIMIT 1
        ) AS "tourType"
      FROM players p
      LEFT JOIN nationalities n ON n.id = p."nationalityId"
      WHERE p."deletedAt" IS NULL AND p.id IN (${Prisma.join([...ids])})
    `)
  }

  /** Find a player by internal id, with read relations. Excludes soft-deleted rows. */
  async findDetailById(id: string): Promise<PlayerWithRelations | null> {
    const record = await this.prisma.player.findFirst({
      where: { id, deletedAt: null },
      include: playerReadInclude,
    })
    return record
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
