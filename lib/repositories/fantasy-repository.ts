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
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _fantasyRepository: FantasyRepository | undefined
export function getFantasyRepository(): FantasyRepository {
  return (_fantasyRepository ??= new FantasyRepository())
}
