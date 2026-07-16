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
// `Prisma` is imported as a value (not type-only): the directory search below
// uses `Prisma.sql`/`Prisma.join` to compose a safe, parameterized raw query.
import { Prisma } from "@/lib/generated/prisma/client"
import type {
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

/**
 * Fully-resolved, database-ready parameters for {@link TournamentRepository.search}.
 * The feature service translates UI filter state (with its `"ALL"` sentinels)
 * into this shape; every field here is an active constraint. `skip`/`take` are
 * the pagination window; all other fields are optional filters.
 */
export interface TournamentSearchParams {
  /** Case-insensitive substring match against the tournament name. */
  search?: string
  /** Database `TournamentStatus` value (e.g. `"SCHEDULED"`). */
  status?: string
  /** Database `TourType` value (e.g. `"PGA"`); matches the owning tour. */
  tourType?: string
  /** Season year (e.g. `2025`); matches the linked season. */
  seasonYear?: number
  /** Rows to skip (pagination offset). */
  skip: number
  /** Rows to return (page size). */
  take: number
}

/**
 * A single flattened directory row: the tournament plus the joined tour,
 * season, host-course, and (when derivable) prior-edition champion. Produced by
 * {@link TournamentRepository.search} and mapped to the UI shape by the feature
 * layer. Optional relations resolve to `null` when absent.
 */
export interface TournamentSearchRow {
  id: string
  name: string
  officialName: string | null
  slug: string
  status: string
  startDate: Date | null
  endDate: Date | null
  purse: number | null
  seasonYear: number | null
  tourType: string | null
  tourName: string | null
  tourCode: string | null
  /** Host course id, enabling a link to the course detail page. */
  courseId: string | null
  courseName: string | null
  /** Host course par, when known. */
  coursePar: number | null
  /** Host course yardage, when known. */
  courseYardage: number | null
  city: string | null
  stateProvince: string | null
  country: string | null
  defendingChampion: string | null
}

/**
 * A single tournament for the detail page: everything in {@link TournamentSearchRow}
 * plus the record lifecycle timestamps. Kept separate so the list query stays
 * lean (it never selects the timestamps) while the detail page can surface
 * created/updated metadata.
 */
export interface TournamentDetailRow extends TournamentSearchRow {
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * The raw facts for a tournament's Tournament Context: identity, status, dates,
 * its linked host course (nullable), and whether a field has been imported.
 * Consumed by the Tournament Context Engine (`lib/tournament-context`), which
 * normalizes it into a confidence-graded context shared by every event-specific
 * model. Returned by {@link TournamentRepository.findContextById}.
 */
export interface TournamentContextRow {
  tournamentId: string
  tournamentName: string
  tournamentSlug: string
  tournamentStatus: string
  startDate: Date | null
  endDate: Date | null
  courseId: string | null
  courseName: string | null
  /** Number of (non-withdrawn) entrants imported for the event. */
  fieldCount: number
}

/**
 * Field-sync timestamps for a single event: when the roster was first imported
 * and most recently updated, plus the current entrant count. Powers the
 * Tournament Page's "Official Field Confirmed" panel (confirmation + last-sync
 * times). Returned by {@link TournamentRepository.getFieldSyncStats}.
 */
export interface FieldSyncStatsRow {
  playerCount: number
  /** ISO timestamp the field was first imported, or `null` when never imported. */
  firstImportedAt: Date | null
  /** ISO timestamp of the most recent field row write, or `null`. */
  lastUpdatedAt: Date | null
}

/**
 * One row of the admin Tournament Field Intelligence panel: an upcoming or live
 * event with its imported roster size, the prior edition's field size (the
 * honest "expected" baseline), and its most recent field sync. Returned by
 * {@link TournamentRepository.listFieldIntelligence}.
 */
export interface FieldIntelligenceRow {
  id: string
  name: string
  slug: string
  status: string
  startDate: Date | null
  endDate: Date | null
  /** Imported (non-withdrawn) entrants for this edition. */
  playersImported: number
  /** Non-withdrawn field size of the most recent prior edition, or `null`. */
  expectedPlayers: number | null
  /** Most recent field-row write for this edition, or `null`. */
  lastSync: Date | null
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
   * Server-side directory search: filter, sort, and paginate tournaments *in
   * the database* and return only the requested page (plus the total match
   * count).
   *
   * This is deliberately not a "load everything and slice in JS" method — every
   * filter, the join to tour/season/host-course, the chronological sort, and
   * pagination all execute as SQL, so the client only ever receives one page.
   * A small parameterized raw query composes the filters (all user input is
   * bound, never interpolated, so it is injection-safe). Host course is the
   * `hostCourse` row when flagged, else the first linked course. The
   * defending-champion column resolves the winner (`finalPosition = 1`) of the
   * most recent *prior* edition of the same event, and is `null` whenever no
   * such edition or result exists. Read-only — never mutates.
   */
  async search(
    params: TournamentSearchParams,
  ): Promise<{ items: TournamentSearchRow[]; total: number }> {
    const conditions: Prisma.Sql[] = [Prisma.sql`t."deletedAt" IS NULL`]

    if (params.search) {
      conditions.push(Prisma.sql`t.name ILIKE ${`%${params.search}%`}`)
    }
    if (params.status) {
      conditions.push(Prisma.sql`t.status::text = ${params.status}`)
    }
    if (params.tourType) {
      conditions.push(Prisma.sql`tr.type::text = ${params.tourType}`)
    }
    if (typeof params.seasonYear === "number") {
      conditions.push(Prisma.sql`s.year = ${params.seasonYear}`)
    }

    const where = Prisma.join(conditions, " AND ")
    const fromCore = Prisma.sql`
      FROM tournaments t
      JOIN tours tr ON tr.id = t."tourId"
      LEFT JOIN seasons s ON s.id = t."seasonId"
    `

    const totalRows = await this.prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT count(*)::int AS total ${fromCore} WHERE ${where}`,
    )
    const total = totalRows[0]?.total ?? 0
    if (total === 0 || params.take <= 0) return { items: [], total }

    // Clamp the offset to the last populated page so an over-shooting request
    // (e.g. the active page after filters shrink the result set) returns real
    // rows instead of an empty page.
    const lastPageSkip = Math.max(0, (Math.ceil(total / params.take) - 1) * params.take)
    const skip = Math.min(Math.max(0, params.skip), lastPageSkip)

    const items = await this.prisma.$queryRaw<TournamentSearchRow[]>(Prisma.sql`
      SELECT
        t.id AS "id",
        t.name AS "name",
        t."officialName" AS "officialName",
        t.slug AS "slug",
        t.status::text AS "status",
        t."startDate" AS "startDate",
        t."endDate" AS "endDate",
        t.purse::float8 AS "purse",
        s.year AS "seasonYear",
        tr.type::text AS "tourType",
        tr.name AS "tourName",
        tr.code AS "tourCode",
        course.id AS "courseId",
        course.name AS "courseName",
        course.par AS "coursePar",
        course.yardage AS "courseYardage",
        course.city AS "city",
        course."stateProvince" AS "stateProvince",
        course.country AS "country",
        champ."fullName" AS "defendingChampion"
      ${fromCore}
      LEFT JOIN LATERAL (
        SELECT c.id, c.name, c.par, c.yardage, c.city, c."stateProvince", c.country
        FROM tournament_courses tc
        JOIN courses c ON c.id = tc."courseId"
        WHERE tc."tournamentId" = t.id
        ORDER BY tc."hostCourse" DESC, c.name ASC
        LIMIT 1
      ) course ON true
      LEFT JOIN LATERAL (
        SELECT prev.id
        FROM tournaments prev
        WHERE prev.name = t.name
          AND prev."deletedAt" IS NULL
          AND prev."startDate" IS NOT NULL
          AND t."startDate" IS NOT NULL
          AND prev."startDate" < t."startDate"
        ORDER BY prev."startDate" DESC
        LIMIT 1
      ) prev_edition ON true
      LEFT JOIN LATERAL (
        SELECT pl."fullName"
        FROM tournament_fields tf
        JOIN players pl ON pl.id = tf."playerId"
        WHERE tf."tournamentId" = prev_edition.id AND tf."finalPosition" = 1
        LIMIT 1
      ) champ ON true
      WHERE ${where}
      ORDER BY t."startDate" DESC NULLS LAST, t.name ASC
      LIMIT ${params.take} OFFSET ${skip}
    `)

    return { items, total }
  }

  /**
   * Load a single tournament for the detail page: the same flattened, joined
   * shape as {@link search} (tour, season, host course, prior-edition champion)
   * but for one id. Returns `null` when the id does not exist or the row is
   * soft-deleted, so the caller can render a proper 404. The id is bound, never
   * interpolated (injection-safe). Read-only.
   */
  async findDetailById(id: string): Promise<TournamentDetailRow | null> {
    const rows = await this.prisma.$queryRaw<TournamentDetailRow[]>(Prisma.sql`
      SELECT
        t.id AS "id",
        t.name AS "name",
        t."officialName" AS "officialName",
        t.slug AS "slug",
        t.status::text AS "status",
        t."startDate" AS "startDate",
        t."endDate" AS "endDate",
        t.purse::float8 AS "purse",
        t."createdAt" AS "createdAt",
        t."updatedAt" AS "updatedAt",
        s.year AS "seasonYear",
        tr.type::text AS "tourType",
        tr.name AS "tourName",
        tr.code AS "tourCode",
        course.id AS "courseId",
        course.name AS "courseName",
        course.par AS "coursePar",
        course.yardage AS "courseYardage",
        course.city AS "city",
        course."stateProvince" AS "stateProvince",
        course.country AS "country",
        champ."fullName" AS "defendingChampion"
      FROM tournaments t
      JOIN tours tr ON tr.id = t."tourId"
      LEFT JOIN seasons s ON s.id = t."seasonId"
      LEFT JOIN LATERAL (
        SELECT c.id, c.name, c.par, c.yardage, c.city, c."stateProvince", c.country
        FROM tournament_courses tc
        JOIN courses c ON c.id = tc."courseId"
        WHERE tc."tournamentId" = t.id
        ORDER BY tc."hostCourse" DESC, c.name ASC
        LIMIT 1
      ) course ON true
      LEFT JOIN LATERAL (
        SELECT prev.id
        FROM tournaments prev
        WHERE prev.name = t.name
          AND prev."deletedAt" IS NULL
          AND prev."startDate" IS NOT NULL
          AND t."startDate" IS NOT NULL
          AND prev."startDate" < t."startDate"
        ORDER BY prev."startDate" DESC
        LIMIT 1
      ) prev_edition ON true
      LEFT JOIN LATERAL (
        SELECT pl."fullName"
        FROM tournament_fields tf
        JOIN players pl ON pl.id = tf."playerId"
        WHERE tf."tournamentId" = prev_edition.id AND tf."finalPosition" = 1
        LIMIT 1
      ) champ ON true
      WHERE t.id = ${id} AND t."deletedAt" IS NULL
      LIMIT 1
    `)
    return rows[0] ?? null
  }

  /**
   * Resolve the raw facts for a tournament's Tournament Context: identity,
   * status, dates, its linked host course (nullable), and its imported field
   * size. The host course is a LEFT JOIN, so an event with no linked venue still
   * resolves (the Tournament Context Engine grades that as `partial`). Returns
   * `null` for a missing or soft-deleted id, so the engine reports an honest
   * `unavailable` context. The id is bound, never interpolated. Read-only.
   */
  async findContextById(id: string): Promise<TournamentContextRow | null> {
    const rows = await this.prisma.$queryRaw<TournamentContextRow[]>(Prisma.sql`
      SELECT
        t.id            AS "tournamentId",
        t.name          AS "tournamentName",
        t.slug          AS "tournamentSlug",
        t.status::text  AS "tournamentStatus",
        t."startDate"   AS "startDate",
        t."endDate"     AS "endDate",
        course.id       AS "courseId",
        course.name     AS "courseName",
        COALESCE(field.count, 0)::int AS "fieldCount"
      FROM tournaments t
      LEFT JOIN LATERAL (
        SELECT c.id, c.name
        FROM tournament_courses tc
        JOIN courses c ON c.id = tc."courseId" AND c."deletedAt" IS NULL
        WHERE tc."tournamentId" = t.id
        ORDER BY tc."hostCourse" DESC, c.name ASC
        LIMIT 1
      ) course ON true
      LEFT JOIN LATERAL (
        SELECT count(*) AS count
        FROM tournament_fields tf
        WHERE tf."tournamentId" = t.id AND tf.withdrawn = false
      ) field ON true
      WHERE t.id = ${id} AND t."deletedAt" IS NULL
      LIMIT 1
    `)
    return rows[0] ?? null
  }

  /**
   * Field-sync timestamps for one event: current non-withdrawn entrant count,
   * plus the earliest `createdAt` (first import → "confirmed at") and latest
   * `updatedAt` ("last synced") across its field rows. Both timestamps are
   * `null` when no field has been imported. The id is bound, never interpolated.
   * Read-only.
   */
  async getFieldSyncStats(id: string): Promise<FieldSyncStatsRow> {
    const rows = await this.prisma.$queryRaw<
      Array<{ playerCount: number; firstImportedAt: Date | null; lastUpdatedAt: Date | null }>
    >(Prisma.sql`
      SELECT
        count(*)::int      AS "playerCount",
        min(tf."createdAt") AS "firstImportedAt",
        max(tf."updatedAt") AS "lastUpdatedAt"
      FROM tournament_fields tf
      WHERE tf."tournamentId" = ${id} AND tf.withdrawn = false
    `)
    return rows[0] ?? { playerCount: 0, firstImportedAt: null, lastUpdatedAt: null }
  }

  /**
   * Upcoming and live (non-completed, non-deleted) events for the admin
   * Tournament Field Intelligence panel, soonest first. Each row carries its
   * imported roster size, its most recent field sync, and the non-withdrawn
   * field size of the most recent *prior* edition of the same event — the
   * honest "expected players" baseline (`null` when no prior edition exists,
   * never a fabricated number). Read-only.
   */
  async listFieldIntelligence(limit = 25): Promise<FieldIntelligenceRow[]> {
    return this.prisma.$queryRaw<FieldIntelligenceRow[]>(Prisma.sql`
      SELECT
        t.id            AS "id",
        t.name          AS "name",
        t.slug          AS "slug",
        t.status::text  AS "status",
        t."startDate"   AS "startDate",
        t."endDate"     AS "endDate",
        COALESCE(field.count, 0)::int AS "playersImported",
        prior.count                   AS "expectedPlayers",
        field."lastSync"              AS "lastSync"
      FROM tournaments t
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS count, max(tf."updatedAt") AS "lastSync"
        FROM tournament_fields tf
        WHERE tf."tournamentId" = t.id AND tf.withdrawn = false
      ) field ON true
      LEFT JOIN LATERAL (
        SELECT (
          SELECT count(*)::int
          FROM tournament_fields tf
          WHERE tf."tournamentId" = prev.id AND tf.withdrawn = false
        ) AS count
        FROM tournaments prev
        WHERE prev.name = t.name
          AND prev."deletedAt" IS NULL
          AND prev."startDate" IS NOT NULL
          AND t."startDate" IS NOT NULL
          AND prev."startDate" < t."startDate"
        ORDER BY prev."startDate" DESC
        LIMIT 1
      ) prior ON true
      WHERE t."deletedAt" IS NULL
        AND t.status::text <> 'COMPLETED'
      ORDER BY t."startDate" ASC NULLS LAST, t.name ASC
      LIMIT ${limit}
    `)
  }

  /**
   * Distinct tours that actually own at least one non-deleted tournament — the
   * source for the directory's tour filter. Returns `null` results empty so the
   * feature layer can offer only "All" until an import populates events.
   * Read-only.
   */
  async listReferencedTours(): Promise<Array<{ type: string; name: string; code: string }>> {
    return this.prisma.$queryRaw<Array<{ type: string; name: string; code: string }>>(Prisma.sql`
      SELECT DISTINCT tr.type::text AS "type", tr.name AS "name", tr.code AS "code"
      FROM tours tr
      JOIN tournaments t ON t."tourId" = tr.id
      WHERE t."deletedAt" IS NULL
      ORDER BY tr.name ASC
    `)
  }

  /**
   * Distinct season years referenced by at least one non-deleted tournament —
   * the source for the directory's season filter, newest first. Read-only.
   */
  async listReferencedSeasons(): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<Array<{ year: number }>>(Prisma.sql`
      SELECT DISTINCT s.year AS "year"
      FROM seasons s
      JOIN tournaments t ON t."seasonId" = s.id
      WHERE t."deletedAt" IS NULL
      ORDER BY s.year DESC
    `)
    return rows.map((row) => row.year)
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

  /**
   * Idempotently link a tournament to the course it is played on for a given
   * year. Reconciled on the `(tournamentId, year)` unique key, so re-running the
   * link step updates the existing row (e.g. corrects the course) rather than
   * duplicating it. Both ids must already exist; this only writes the join.
   */
  async linkCourseByYear(params: {
    tournamentId: string
    courseId: string
    year: number
    hostCourse?: boolean
  }): Promise<RepositoryResult<{ id: string; created: boolean }>> {
    const { tournamentId, courseId, year, hostCourse = true } = params
    const reference = `${tournamentId}:${year}`
    try {
      const existing = await this.prisma.tournamentCourse.findUnique({
        where: { tournamentId_year: { tournamentId, year } },
      })
      const record = await this.prisma.tournamentCourse.upsert({
        where: { tournamentId_year: { tournamentId, year } },
        create: { tournamentId, courseId, year, hostCourse },
        update: { courseId, hostCourse },
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok({ id: record.id, created }, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "tournamentCourse",
        operation: "linkCourseByYear",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<{ id: string; created: boolean }>(repoError)
    }
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
