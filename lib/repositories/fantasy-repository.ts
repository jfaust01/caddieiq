/**
 * Fantasy & DFS repository.
 *
 * The only layer permitted to persist fantasy projections (`fantasy_projections`)
 * and DFS salaries (`dfs_salaries`). It accepts already-mapped domain rows whose
 * tournament and player associations were resolved by the importer — it never
 * maps, validates, or fetches.
 *
 * Idempotency: each row is reconciled on its unique composite provider
 * `externalId`. Projection VALUES are gated upstream by the scramble detector
 * (null + `available:false` when scrambled); DFS salaries are real and ungated.
 */

import type {
  DomainDfsSalary,
  DomainFantasyProjection,
} from "@/lib/domain/fantasy/types"
import type {
  DfsSalary as DfsSalaryRecord,
  FantasyProjection as FantasyProjectionRecord,
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

/** A mapped projection whose tournament + player ids are resolved by the importer. */
export interface ResolvedFantasyProjection {
  tournamentId: string | null
  playerId: string | null
  projection: DomainFantasyProjection
}

/** A mapped DFS salary whose tournament + player ids are resolved by the importer. */
export interface ResolvedDfsSalary {
  tournamentId: string | null
  playerId: string | null
  salary: DomainDfsSalary
}

/** A projection flattened for UI rendering (available rows only). */
export interface FantasyProjectionView {
  id: string
  fantasyPointsDraftKings: number | null
  fantasyPointsFanDuel: number | null
  playerId: string | null
}

/** A DFS salary flattened for the DFS Value Model (real, ungated data). */
export interface DfsSalaryRow {
  playerId: string
  tournamentId: string | null
  operator: string
  salary: number | null
  operatorPlayerName: string | null
  capturedAt: Date
}

/** Platform-wide DFS salary coverage counters for the admin dashboard. */
export interface DfsSalaryCoverageCounts {
  /** Total salary rows held. */
  totalRows: number
  /** Rows carrying a real (non-null) salary. */
  pricedRows: number
  /** Distinct players with at least one priced salary. */
  pricedPlayers: number
  /** Distinct tournaments with at least one priced salary. */
  tournamentsWithSalaries: number
  /** Distinct DFS operators represented (e.g. DraftKings). */
  operators: number
  /** Most recent salary capture, or null when none. */
  latestCapturedAt: Date | null
}

export class FantasyRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "fantasy", sink)
  }

  /** Idempotently persist one resolved projection, reconciled on its externalId. */
  async upsertProjection(
    resolved: ResolvedFantasyProjection,
  ): Promise<RepositoryResult<FantasyProjectionRecord>> {
    const { tournamentId, playerId, projection } = resolved
    const reference = projection.externalId
    const data = {
      tournamentId,
      playerId,
      fantasyPointsDraftKings: projection.fantasyPointsDraftKings,
      fantasyPointsFanDuel: projection.fantasyPointsFanDuel,
      available: projection.available,
    }
    try {
      const existing = await this.prisma.fantasyProjection.findUnique({
        where: { externalId: reference },
        select: { id: true },
      })
      const record = await this.prisma.fantasyProjection.upsert({
        where: { externalId: reference },
        create: { externalId: reference, ...data },
        update: data,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "fantasyProjection",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<FantasyProjectionRecord>(repoError)
    }
  }

  /** Idempotently persist one resolved DFS salary, reconciled on its externalId. */
  async upsertSalary(
    resolved: ResolvedDfsSalary,
  ): Promise<RepositoryResult<DfsSalaryRecord>> {
    const { tournamentId, playerId, salary } = resolved
    const reference = salary.externalId
    const data = {
      tournamentId,
      playerId,
      operator: salary.operator,
      slateId: salary.slateId,
      operatorPlayerName: salary.operatorPlayerName,
      salary: salary.salary,
    }
    try {
      const existing = await this.prisma.dfsSalary.findUnique({
        where: { externalId: reference },
        select: { id: true },
      })
      const record = await this.prisma.dfsSalary.upsert({
        where: { externalId: reference },
        create: { externalId: reference, ...data },
        update: data,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "dfsSalary",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<DfsSalaryRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved projections. Never throws per item. */
  async bulkUpsertProjections(
    rows: readonly ResolvedFantasyProjection[],
  ): Promise<BulkRepositoryResult<FantasyProjectionRecord>> {
    return this.runBulk(
      rows,
      (r) => r.projection.externalId,
      (r) => this.upsertProjection(r),
    )
  }

  /** Idempotently persist a batch of resolved DFS salaries. Never throws per item. */
  async bulkUpsertSalaries(
    rows: readonly ResolvedDfsSalary[],
  ): Promise<BulkRepositoryResult<DfsSalaryRecord>> {
    return this.runBulk(
      rows,
      (r) => r.salary.externalId,
      (r) => this.upsertSalary(r),
    )
  }

  /* ---------------------------------------------------------------- */
  /* Reads (for the DFS Value Model)                                  */
  /* ---------------------------------------------------------------- */

  /**
   * DFS salaries for a tournament's field, keyed by playerId. When a player has
   * multiple slate rows the preferred operator (DraftKings) and freshest capture
   * win, so the DFS Value Model reads a single canonical price per player.
   * Rows with a null `playerId` (unresolved) are skipped.
   */
  async findSalariesByTournamentId(tournamentId: string): Promise<Map<string, DfsSalaryRow>> {
    const rows = await this.prisma.dfsSalary.findMany({
      where: { tournamentId, playerId: { not: null } },
      select: {
        playerId: true,
        tournamentId: true,
        operator: true,
        salary: true,
        operatorPlayerName: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    return this.reduceToCanonical(rows)
  }

  /**
   * The single most relevant DFS salary for one player: preferred operator
   * (DraftKings) and freshest capture. Returns null when the player is unpriced.
   */
  async findLatestSalaryByPlayerId(playerId: string): Promise<DfsSalaryRow | null> {
    const rows = await this.prisma.dfsSalary.findMany({
      where: { playerId },
      select: {
        playerId: true,
        tournamentId: true,
        operator: true,
        salary: true,
        operatorPlayerName: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    const byPlayer = this.reduceToCanonical(rows)
    return byPlayer.get(playerId) ?? null
  }

  /** Platform-wide DFS salary coverage counters for the admin dashboard. */
  async getSalaryCoverageCounts(): Promise<DfsSalaryCoverageCounts> {
    const [totalRows, priced, players, tournaments, operators, latest] = await Promise.all([
      this.prisma.dfsSalary.count(),
      this.prisma.dfsSalary.count({ where: { salary: { not: null } } }),
      this.prisma.dfsSalary.findMany({
        where: { salary: { not: null }, playerId: { not: null } },
        distinct: ["playerId"],
        select: { playerId: true },
      }),
      this.prisma.dfsSalary.findMany({
        where: { salary: { not: null }, tournamentId: { not: null } },
        distinct: ["tournamentId"],
        select: { tournamentId: true },
      }),
      this.prisma.dfsSalary.findMany({ distinct: ["operator"], select: { operator: true } }),
      this.prisma.dfsSalary.aggregate({ _max: { updatedAt: true } }),
    ])
    return {
      totalRows,
      pricedRows: priced,
      pricedPlayers: players.length,
      tournamentsWithSalaries: tournaments.length,
      operators: operators.length,
      latestCapturedAt: latest._max.updatedAt ?? null,
    }
  }

  /**
   * Collapse many rows (already ordered freshest-first) to one canonical row per
   * player: DraftKings is preferred over other operators; within an operator the
   * freshest capture wins (guaranteed by the query's `orderBy`).
   */
  private reduceToCanonical(
    rows: readonly {
      playerId: string | null
      tournamentId: string | null
      operator: string
      salary: number | null
      operatorPlayerName: string | null
      updatedAt: Date
    }[],
  ): Map<string, DfsSalaryRow> {
    const out = new Map<string, DfsSalaryRow>()
    const preferredRank = (operator: string): number =>
      operator.toLowerCase() === "draftkings" ? 0 : 1
    for (const row of rows) {
      if (!row.playerId) continue
      const candidate: DfsSalaryRow = {
        playerId: row.playerId,
        tournamentId: row.tournamentId,
        operator: row.operator,
        salary: row.salary,
        operatorPlayerName: row.operatorPlayerName,
        capturedAt: row.updatedAt,
      }
      const held = out.get(row.playerId)
      if (!held) {
        out.set(row.playerId, candidate)
        continue
      }
      // Prefer DraftKings; otherwise keep the already-held (fresher) row.
      if (preferredRank(candidate.operator) < preferredRank(held.operator)) {
        out.set(row.playerId, candidate)
      }
    }
    return out
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _fantasyRepository: FantasyRepository | undefined
export function getFantasyRepository(): FantasyRepository {
  return (_fantasyRepository ??= new FantasyRepository())
}
